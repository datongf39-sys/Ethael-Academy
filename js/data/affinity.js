/**
 * affinity.js — 魔法亲和换算系统 v1.1
 * 对应设计文档 S1.2 / S1.3 / S2.1
 *
 * 依赖：races.js（RACES）、experience.js（addExp / pushEvt）
 */

import { RACES } from '../data/races.js';

// ─────────────────────────────────────────────
// S1.2  魔法亲和百分比 → 学习效率 / 施法效验
// ─────────────────────────────────────────────

/**
 * 计算某角色对某魔法系的学习效率乘数。
 * 公式：× (1 + affinityRate)
 * affinityRate 为正值时加成，为负值时衰减（排斥）。
 *
 * @param {string} raceKey    - 种族键，如 'elf'、'halfblood'
 * @param {string} magicType  - 魔法系键，如 'nature'、'dark'
 * @param {string[]|null} parents - 混血裔双亲，如 ['elf','human']
 * @returns {number} 乘数，如 1.30 / 0.85
 */
export function getLearningMultiplier(raceKey, magicType, parents = null) {
  const rate = resolveAffinityRate(raceKey, magicType, parents);
  return 1 + rate;
}

/**
 * 计算某角色对某魔法系的施法效验乘数。
 * 公式：× (1 + affinityRate × 0.5)
 * 亲和加成对效验的影响是学习效率的一半。
 *
 * @param {string} raceKey
 * @param {string} magicType
 * @param {string[]|null} parents
 * @returns {number} 乘数，如 1.15 / 0.925
 */
export function getCastingMultiplier(raceKey, magicType, parents = null) {
  const rate = resolveAffinityRate(raceKey, magicType, parents);
  return 1 + rate * 0.5;
}

/**
 * 将学习效率乘数应用于一次经验获取，返回实际获得的经验量。
 * 小数部分累积到 G.affinityFrac[type] 中，满 1 后进位。
 *
 * @param {object} G          - 游戏全局状态
 * @param {string} raceKey
 * @param {string[]|null} parents
 * @param {string} statType   - 属性键，如 'mag'
 * @param {string} magicType  - 魔法系键
 * @param {number} baseAmount - 基础经验值
 * @returns {number} 本次实际进入 addExp 的整数经验
 */
export function applyAffinityExp(G, raceKey, parents, statType, magicType, baseAmount) {
  const multiplier = getLearningMultiplier(raceKey, magicType, parents);
  const raw = baseAmount * multiplier;
  const floor = Math.floor(raw);
  const frac  = raw - floor;

  // 初始化小数累积桶
  if (!G.affinityFrac) G.affinityFrac = {};
  if (!G.affinityFrac[statType]) G.affinityFrac[statType] = 0;

  G.affinityFrac[statType] += frac;

  let bonus = 0;
  if (G.affinityFrac[statType] >= 1) {
    bonus = Math.floor(G.affinityFrac[statType]);
    G.affinityFrac[statType] -= bonus;
  }

  return floor + bonus;
}

/**
 * 将施法效验乘数应用于一次技能效果值，返回最终效果量。
 *
 * @param {string} raceKey
 * @param {string[]|null} parents
 * @param {string} magicType
 * @param {number} baseEffect
 * @returns {number} 向下取整后的实际效果值
 */
export function applyCastingEffect(raceKey, parents, magicType, baseEffect) {
  const multiplier = getCastingMultiplier(raceKey, magicType, parents);
  return Math.floor(baseEffect * multiplier);
}

// ─────────────────────────────────────────────
// S1.3  叙事天赋 → 数值机制
// ─────────────────────────────────────────────

/**
 * 所有种族天赋的数值映射表。
 * 各 handler 接受 (G, context) 并就地修改或返回修正值。
 *
 * G        : 全局游戏状态
 * context  : 当前判定上下文，结构视具体调用点而定
 */
export const TALENT_EFFECTS = {

  /** 精灵：施法精准度最高 → 魔法实操失控判定阈值 -15% */
  elf_precision: {
    desc: '施法精准度最高',
    apply(G, context) {
      if (context.type === 'magic_practical_exam') {
        context.failureThreshold = (context.failureThreshold ?? 1.0) * (1 - 0.15);
      }
    }
  },

  /** 兽人：体魄魔法无需咒文 → 体魄系实操判定改用 phy，且豁免失控 */
  orc_body_magic: {
    desc: '体魄魔法无需咒文',
    apply(G, context) {
      if (context.type === 'physical_magic_practical') {
        context.judgeStat    = 'phy';   // 判定属性改为体魄
        context.skipRunaway  = true;    // 豁免失控判定
      }
    }
  },

  /** 吸血鬼：魔力凝炼与蓄积超群 → 单次效果系数 ×1.15 */
  vampire_condense: {
    desc: '魔力凝炼与蓄积超群',
    apply(G, context) {
      if (context.type === 'cast_effect') {
        context.effectMultiplier = (context.effectMultiplier ?? 1.0) * 1.15;
      }
    }
  },

  /** 矮人：器物刻录造诣天下第一 → 符文/锻铸类实操 +3 等级修正 */
  dwarf_runic: {
    desc: '器物刻录造诣天下第一',
    apply(G, context) {
      if (context.type === 'rune_or_forge_exam') {
        context.levelBonus = (context.levelBonus ?? 0) + 3;
      }
    }
  },

  /** 半身人：幸运魔法 → 任意判定失败时 8% 概率重骰取优 */
  halfling_luck: {
    desc: '幸运魔法',
    /**
     * @returns {boolean} 是否触发幸运重骰
     */
    tryTrigger(G, context) {
      if (context.failed && Math.random() < 0.08) {
        context.reroll     = true;
        context.takeHigher = true;
        return true;
      }
      return false;
    }
  },

  /** 暗精灵：无声施法 → 翘课被发现基础概率 7% */
  darkelf_silent: {
    desc: '无声施法',
    baseSkipDetectChance: 0.07,
    apply(G, context) {
      if (context.type === 'skip_detect') {
        context.detectChance = this.baseSkipDetectChance;
      }
    }
  },

  /** 吸血鬼：摄魄之眼 → 被发现翘课时 20% 概率转为「被忽视」 */
  vampire_mesmerize: {
    desc: '摄魄之眼',
    tryTrigger(G, context) {
      if (context.type === 'skip_caught' && Math.random() < 0.20) {
        context.result = 'ignored';
        return true;
      }
      return false;
    }
  },

  /** 魅魔：面容模糊感 → 翘课被发现基础概率 9% */
  fey_blur: {
    desc: '面容模糊感',
    baseSkipDetectChance: 0.09,
    apply(G, context) {
      if (context.type === 'skip_detect') {
        context.detectChance = this.baseSkipDetectChance;
      }
    }
  },

  /** 混血裔：双系共鸣 → 同回合双亲两系魔法 15% 触发共鸣 */
  halfblood_resonance: {
    desc: '双系共鸣',
    /**
     * 在回合结束时检查是否同时使用了双亲两系魔法。
     * @param {string[]} usedMagics - 本回合已使用的魔法系列表
     * @param {string[]} parents    - 双亲种族键
     * @returns {'boost'|'alter'|'control'|null} 共鸣类型，null 表示未触发
     */
    tryTrigger(G, usedMagics, parents) {
      const p1Magic = RACES[parents[0]]?.primaryMagic;
      const p2Magic = RACES[parents[1]]?.primaryMagic;
      if (!p1Magic || !p2Magic) return null;
      if (usedMagics.includes(p1Magic) && usedMagics.includes(p2Magic)) {
        if (Math.random() < 0.15) {
          const roll = Math.random();
          if (roll < 0.60) return 'boost';   // 60% 增益共鸣
          if (roll < 0.90) return 'alter';   // 30% 异变共鸣
          return 'control';                  // 10% 控制共鸣
        }
      }
      return null;
    }
  },

  /** 龙裔：龙息 → 独占技能，失控率 +10%，每学期 -2% */
  dragonborn_breath: {
    desc: '龙息',
    baseRunawayBonus: 0.10,
    semesterReduction: 0.02,
    /**
     * 计算当前学期的龙息失控率附加值。
     * @param {number} semestersPassed - 已过学期数（0 起算）
     * @returns {number} 失控率附加（最低降至 0）
     */
    getRunawayBonus(semestersPassed) {
      return Math.max(0, this.baseRunawayBonus - semestersPassed * this.semesterReduction);
    },
    apply(G, context) {
      if (context.type === 'dragonbreath_cast') {
        const bonus = this.getRunawayBonus(G.semestersPassed ?? 0);
        context.runawayChance = (context.runawayChance ?? 0) + bonus;
      }
    }
  },

  /** 龙裔：魔力容量名列前茅 → MP 上限 × 1.25 */
  dragonborn_mp: {
    desc: '魔力容量名列前茅',
    apply(G, context) {
      if (context.type === 'calc_mp_max') {
        context.mpMax = Math.floor((context.mpMax ?? G.mpMax) * 1.25);
      }
    }
  },
};

/**
 * 根据种族（含混血裔）获取适用的天赋效果键列表。
 *
 * @param {string}      raceKey
 * @param {string[]|null} parents
 * @returns {string[]} TALENT_EFFECTS 中的键名数组
 */
export function getRaceTalents(raceKey, parents = null) {
  const MAP = {
    elf:        ['elf_precision'],
    orc:        ['orc_body_magic'],
    vampire:    ['vampire_condense', 'vampire_mesmerize'],
    dwarf:      ['dwarf_runic'],
    halfling:   ['halfling_luck'],
    darkelf:    ['darkelf_silent'],
    fey:        ['fey_blur'],
    dragonborn: ['dragonborn_breath', 'dragonborn_mp'],
    halfblood:  ['halfblood_resonance'],
    human:      [],
    merfolk:    [],
  };
  return MAP[raceKey] ?? [];
}

/**
 * 将指定种族的所有天赋效果应用到 context 上。
 * 遍历 getRaceTalents 列表，依次调用各天赋的 apply（如果存在）。
 *
 * @param {string}      raceKey
 * @param {string[]|null} parents
 * @param {object}      G
 * @param {object}      context
 */
export function applyRaceTalents(raceKey, parents, G, context) {
  for (const key of getRaceTalents(raceKey, parents)) {
    const talent = TALENT_EFFECTS[key];
    if (talent?.apply) talent.apply(G, context);
  }
}

// ─────────────────────────────────────────────
// S2.1  角色创建魔法亲和规则
// ─────────────────────────────────────────────

/**
 * 全部可选魔法大类（用于角色创建自选亲和的候选池）。
 * 键名与 races.js affinity 字段保持一致。
 */
export const MAGIC_TYPES = {
  nature:   '自然魔法',
  dark:     '暗魔法',
  body:     '体魄魔法',
  rune:     '符文魔法',
  illusion: '幻术',
  charm:    '魅惑魔法',
  arcane:   '奥术',
  dragon:   '龙系魔法',
};

/**
 * 「固有亲和」：从种族的 affinity 字段中提取正值亲和项。
 * 排斥（负值）不列入固有亲和展示，但仍在计算时生效。
 *
 * 混血裔特殊处理：取双亲各自正值亲和最高的1项，各降低10%（-0.10）后继承。
 * 若双亲最高亲和同属一系，则仅保留该系，另取次高补足。
 *
 * @param {string}        raceKey
 * @param {string[]|null} parents
 * @returns {{ magicType: string, label: string, rate: number }[]}
 *   最多3项（混血裔固定2项）
 */
export function getInnateAffinities(raceKey, parents = null) {
  if (raceKey === 'halfblood' && parents?.length === 2) {
    return _halfbloodInnate(parents);
  }

  const affinity = RACES[raceKey]?.affinity ?? {};
  // 仅取正值，按亲和率降序，最多3项
  return Object.entries(affinity)
    .filter(([, rate]) => rate > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([magicType, rate]) => ({
      magicType,
      label: MAGIC_TYPES[magicType] ?? magicType,
      rate,
    }));
}

/**
 * 「自选亲和」效果值的计算规则：
 * 自选亲和率 = 该种族固有亲和中最高率 × 0.5
 * 人类无固有亲和，固定为 0.15。
 *
 * @param {string}        raceKey
 * @param {string[]|null} parents
 * @returns {number} 自选亲和率（如 0.15）
 */
export function getElectiveAffinityRate(raceKey, parents = null) {
  if (raceKey === 'human') return 0.15;
  if (raceKey === 'halfblood') return 0; // 混血裔无自选名额

  const innate = getInnateAffinities(raceKey, parents);
  if (!innate.length) return 0.15; // 无固有亲和时默认

  const maxRate = innate[0].rate;
  return maxRate * 0.5;
}

/**
 * 「自选亲和」名额数量：
 * 人类 → 2 项（可从全部魔法大类选取）
 * 混血裔 → 0 项
 * 其他种族 → 1 项（限本学部魔法大类）
 *
 * @param {string} raceKey
 * @returns {number}
 */
export function getElectiveSlotCount(raceKey) {
  if (raceKey === 'human') return 2;
  if (raceKey === 'halfblood') return 0;
  return 1;
}

/**
 * 「自选亲和」候选魔法大类：
 * 人类 → 全部 MAGIC_TYPES
 * 其他 → 传入本学部支持的魔法大类列表（由调用方提供）
 *
 * @param {string}   raceKey
 * @param {string[]} deptMagicTypes - 本学部允许的魔法系键列表
 * @returns {string[]} 可供选择的魔法系键数组
 */
export function getElectiveCandidates(raceKey, deptMagicTypes = []) {
  if (raceKey === 'human') return Object.keys(MAGIC_TYPES);
  return deptMagicTypes;
}

/**
 * 构建一个角色完整的亲和配置（固有 + 自选），供运行时计算使用。
 * 结果挂载到角色对象或游戏状态的 affinityConfig 字段上。
 *
 * @param {string}        raceKey
 * @param {string[]|null} parents
 * @param {string[]}      electiveChoices - 玩家选定的自选魔法系键（已验证合法性）
 * @returns {{
 *   innate:   { magicType: string, label: string, rate: number }[],
 *   elective: { magicType: string, label: string, rate: number }[],
 * }}
 */
export function buildAffinityConfig(raceKey, parents, electiveChoices = []) {
  const innate   = getInnateAffinities(raceKey, parents);
  const slotCount = getElectiveSlotCount(raceKey);
  const electiveRate = getElectiveAffinityRate(raceKey, parents);

  // 截断超额选择，确保不超过名额
  const validChoices = electiveChoices.slice(0, slotCount);

  const elective = validChoices.map(magicType => ({
    magicType,
    label: MAGIC_TYPES[magicType] ?? magicType,
    rate:  electiveRate,
  }));

  return { innate, elective };
}

/**
 * 合并固有亲和与自选亲和，返回某魔法系的最终总亲和率。
 * 两层亲和直接叠加（不互相影响）。
 *
 * 注意：此函数替代运行时的 resolveAffinityRate，需传入 affinityConfig。
 * 若 affinityConfig 不可用，回退至 resolveAffinityRate（仅固有亲和）。
 *
 * @param {string}   magicType
 * @param {object}   affinityConfig - buildAffinityConfig 的返回值
 * @param {string}   raceKey        - 用于查询排斥率（负值）
 * @param {string[]|null} parents
 * @returns {number} 最终亲和率
 */
export function resolveTotalAffinityRate(magicType, affinityConfig, raceKey, parents = null) {
  // 基础固有亲和率（含排斥负值，来自 races.js）
  const baseRate = resolveAffinityRate(raceKey, magicType, parents);

  // 自选亲和叠加（只有正值，不影响排斥）
  const electiveBonus = affinityConfig?.elective
    ?.filter(e => e.magicType === magicType)
    ?.reduce((sum, e) => sum + e.rate, 0) ?? 0;

  return baseRate + electiveBonus;
}

/**
 * 验证玩家的自选亲和选择是否合法。
 * 返回验证结果与错误信息（供 UI 层提示）。
 *
 * @param {string}   raceKey
 * @param {string[]|null} parents
 * @param {string[]} deptMagicTypes  - 本学部魔法大类
 * @param {string[]} electiveChoices - 玩家的选择
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateElectiveAffinities(raceKey, parents, deptMagicTypes, electiveChoices) {
  const errors = [];
  const slotCount  = getElectiveSlotCount(raceKey);
  const candidates = getElectiveCandidates(raceKey, deptMagicTypes);

  if (electiveChoices.length > slotCount) {
    errors.push(`该种族自选亲和名额为 ${slotCount} 项，实际选择了 ${electiveChoices.length} 项。`);
  }

  // 检查重复
  const unique = new Set(electiveChoices);
  if (unique.size !== electiveChoices.length) {
    errors.push('自选亲和不可重复选择同一魔法系。');
  }

  // 检查是否在候选范围内
  for (const choice of electiveChoices) {
    if (!candidates.includes(choice)) {
      const label = MAGIC_TYPES[choice] ?? choice;
      errors.push(`「${label}」不在本学部的可选魔法大类中。`);
    }
  }

  // 混血裔不可有任何自选
  if (raceKey === 'halfblood' && electiveChoices.length > 0) {
    errors.push('混血裔继承双重固有亲和，无自选亲和名额。');
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
// 内部工具：解析亲和率 / 混血裔固有亲和
// ─────────────────────────────────────────────

/**
 * 解析角色对某魔法系的固有亲和率（含排斥负值）。
 * 混血裔取双亲亲和率的平均值。
 *
 * @param {string}        raceKey
 * @param {string}        magicType
 * @param {string[]|null} parents
 * @returns {number}
 */
function resolveAffinityRate(raceKey, magicType, parents) {
  if (raceKey === 'halfblood' && parents?.length === 2) {
    const r1 = RACES[parents[0]]?.affinity?.[magicType] ?? 0;
    const r2 = RACES[parents[1]]?.affinity?.[magicType] ?? 0;
    return (r1 + r2) / 2;
  }
  return RACES[raceKey]?.affinity?.[magicType] ?? 0;
}

/**
 * 混血裔固有亲和：
 * 从双亲各取正值亲和率最高的1项，各降低 0.10 后继承。
 * 若两亲本最高项魔法系相同，则该亲取次高项补足（避免重叠）。
 *
 * @param {string[]} parents - 双亲种族键，长度固定为2
 * @returns {{ magicType: string, label: string, rate: number }[]} 长度为2
 */
function _halfbloodInnate(parents) {
  const result = [];
  const usedTypes = new Set();

  for (const parentKey of parents) {
    const affinity = RACES[parentKey]?.affinity ?? {};
    const sorted = Object.entries(affinity)
      .filter(([, rate]) => rate > 0)
      .sort(([, a], [, b]) => b - a);

    // 取未被另一亲本占用的最高项
    const chosen = sorted.find(([mt]) => !usedTypes.has(mt));
    if (chosen) {
      const [magicType, rate] = chosen;
      usedTypes.add(magicType);
      result.push({
        magicType,
        label: MAGIC_TYPES[magicType] ?? magicType,
        rate: Math.max(0, rate - 0.10),   // 继承时各降低 10%
      });
    }
  }

  return result;
}
