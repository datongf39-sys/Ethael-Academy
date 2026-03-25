/**
 * skipClass.js — 翘课系统种族修正 v1.0
 * 对应设计文档 S3.1 / S3.2
 *
 * 依赖：races.js（RACES）、affinity.js（TALENT_EFFECTS）
 */

import { TALENT_EFFECTS } from './affinity.js';

// ─────────────────────────────────────────────
// S3.1  种族基础被发现概率
// ─────────────────────────────────────────────

/**
 * 各种族的翘课基础配置。
 *
 * baseChance       : 标准基础被发现概率（0~1）
 * outdoorDayBonus  : 日间户外额外加值（暗精灵光敏暴露）
 * nightChance      : 夜间/傍晚覆盖概率，null 表示不区分时段
 * specialMechanic  : 特殊机制标识键（见 SKIP_MECHANICS）
 * compensations    : 翘课相关补偿机制（不影响被发现概率，但影响后续判定）
 */
export const RACE_SKIP_CONFIG = {
  human: {
    baseChance:      0.15,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: null,
    compensations:   [],
  },
  elf: {
    baseChance:      0.20,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'elf_glow',          // 情光暴露
    compensations:   ['elf_class_bonus'], // 课堂提问成功率+10%作为补偿
  },
  vampire: {
    baseChance:      0.15,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'vampire_mesmerize', // 被发现时20%摄魄之眼化解
    compensations:   [],
  },
  dwarf: {
    baseChance:      0.12,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'dwarf_stone_rite',  // 连续翘课3次触发「沉石礼」
    compensations:   [],
  },
  merfolk: {
    baseChance:      0.18,
    nightChance:     0.15,               // 傍晚/夜间恢复标准概率
    outdoorDayBonus: 0,
    specialMechanic: 'merfolk_scale',    // 日间鳞光引人注意
    compensations:   [],
  },
  orc: {
    baseChance:      0.20,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'orc_counter',      // 被阻拦时25%魔法反制逃脱
    compensations:   [],
  },
  darkelf: {
    baseChance:      0.07,
    nightChance:     null,
    outdoorDayBonus: 0.05,               // 日间户外+5%光敏暴露
    specialMechanic: null,
    compensations:   [],
  },
  halfling: {
    baseChance:      0.10,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'halfling_luck',    // 被发现时8%好运波动转为忽视
    compensations:   [],
  },
  dragonborn: {
    baseChance:      0.23,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'dragonborn_deter', // 1次/学期龙息威慑降低惩罚一级
    compensations:   [],
  },
  fey: {
    baseChance:      0.09,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: null,               // 面容模糊，无额外机制
    compensations:   [],
  },
  halfblood: {
    baseChance:      0.15,
    nightChance:     null,
    outdoorDayBonus: 0,
    specialMechanic: 'halfblood_expose', // 族裔特征不稳定可能触发身份暴露
    compensations:   [],
  },
};

// ─────────────────────────────────────────────
// S3.2  教授性格修正
// ─────────────────────────────────────────────

/**
 * 教授性格类型及其对翘课被发现概率的修正值。
 * random 类型在判定时实时生成，此处仅标记范围。
 */
export const PROF_PERSONALITY_MOD = {
  strict:  0.10,   // 严格型 +10%
  normal:  0.00,   // 标准型 无修正
  lenient: -0.08,  // 宽松型 -8%
  random:  null,   // 随机型 [-5%, +15%]，见 getProfMod()
};

/**
 * 获取教授修正值。随机型每次调用结果不同。
 *
 * @param {'strict'|'normal'|'lenient'|'random'} personality
 * @returns {number}
 */
export function getProfMod(personality) {
  if (personality === 'random') {
    // -0.05 ~ +0.15，均匀分布
    return -0.05 + Math.random() * 0.20;
  }
  return PROF_PERSONALITY_MOD[personality] ?? 0;
}

// ─────────────────────────────────────────────
// 核心：计算最终被发现概率
// ─────────────────────────────────────────────

/**
 * 计算角色翘课的最终被发现概率。
 * 公式：max(3%, min(50%, 种族基础 + 教授修正))
 *
 * @param {object} params
 * @param {string}  params.raceKey      - 种族键
 * @param {string}  params.personality  - 教授性格
 * @param {boolean} params.isNight      - 是否夜间/傍晚（影响人鱼等）
 * @param {boolean} params.isOutdoor    - 是否户外场景（影响暗精灵）
 * @returns {number} 最终概率（0~1）
 */
export function calcDetectChance(params) {
  const { raceKey, personality, isNight = false, isOutdoor = false } = params;
  const cfg = RACE_SKIP_CONFIG[raceKey] ?? RACE_SKIP_CONFIG.human;

  // 种族基础概率（区分时段）
  let base = (isNight && cfg.nightChance !== null)
    ? cfg.nightChance
    : cfg.baseChance;

  // 户外日间额外加值
  if (isOutdoor && !isNight) {
    base += cfg.outdoorDayBonus;
  }

  // 教授修正
  const profMod = getProfMod(personality);

  // 最终概率，上下限收束
  return Math.max(0.03, Math.min(0.50, base + profMod));
}

// ─────────────────────────────────────────────
// 特殊机制处理
// ─────────────────────────────────────────────

/**
 * 各种族特殊机制的处理函数。
 * 在翘课判定流程的不同阶段调用。
 *
 * 调用时机说明：
 *   beforeDetect  — 判定前（可修改 context.detectChance）
 *   onCaught      — 已判定为被发现时（可将 result 改为 'ignored' 或 'escaped'）
 *   onSkipCount   — 每次翘课记录后（处理累计触发类机制）
 *   onSemesterEnd — 学期结束时（重置限次机制）
 */
export const SKIP_MECHANICS = {

  /** 精灵情光：紧张时肤色发光，不修改概率（已在 baseChance 中体现） */
  elf_glow: {
    onCaught(G, context) {
      // 情光暴露时在叙事中注明，不改变结果
      context.narrativeTag = 'elf_glow';
    }
  },

  /** 吸血鬼摄魄之眼：被发现时 20% 转为「被忽视」 */
  vampire_mesmerize: {
    onCaught(G, context) {
      if (Math.random() < 0.20) {
        context.result       = 'ignored';
        context.narrativeTag = 'vampire_mesmerize';
      }
    }
  },

  /**
   * 矮人沉石礼：连续翘课第 3 次触发，消耗 1 时间段。
   * G.skipStreak 记录连续翘课次数，翘课成功（未被发现）时累加，
   * 被发现或正常上课时归零。
   */
  dwarf_stone_rite: {
    onSkipCount(G, context) {
      G.skipStreak = (G.skipStreak ?? 0) + 1;
      if (G.skipStreak >= 3) {
        context.triggerStoneRite = true;
        context.narrativeTag     = 'dwarf_stone_rite';
        G.skipStreak             = 0; // 触发后重置
      }
    },
    onCaught(G) {
      G.skipStreak = 0; // 被抓重置连击
    }
  },

  /** 人鱼鳞光：日间被发现概率已在 calcDetectChance 中处理，此处仅添加叙事标记 */
  merfolk_scale: {
    beforeDetect(G, context) {
      if (!context.isNight) context.narrativeTag = 'merfolk_scale_day';
    }
  },

  /** 兽人魔法反制：被阻拦时 25% 概率逃脱 */
  orc_counter: {
    onCaught(G, context) {
      if (Math.random() < 0.25) {
        context.result       = 'escaped';
        context.narrativeTag = 'orc_counter';
      }
    }
  },

  /** 半身人好运波动：被发现时 8% 触发，转为「被忽视」 */
  halfling_luck: {
    onCaught(G, context) {
      if (Math.random() < 0.08) {
        context.result       = 'ignored';
        context.narrativeTag = 'halfling_luck';
      }
    }
  },

  /**
   * 龙裔龙息威慑：1次/学期，惩罚降一级。
   * G.dragonDeterUsed 标记本学期是否已使用。
   */
  dragonborn_deter: {
    onCaught(G, context) {
      if (!G.dragonDeterUsed) {
        context.punishDowngrade = true;
        context.narrativeTag    = 'dragonborn_deter';
        G.dragonDeterUsed       = true;
      }
    },
    onSemesterEnd(G) {
      G.dragonDeterUsed = false; // 学期结束重置
    }
  },

  /**
   * 混血裔身份暴露：族裔特征不稳定，翘课时有小概率触发身份暴露事件。
   * 概率暂定 10%，与被发现判定独立（即使未被发现也可能触发）。
   */
  halfblood_expose: {
    beforeDetect(G, context) {
      if (Math.random() < 0.10) {
        context.triggerIdentityExpose = true;
        context.narrativeTag          = 'halfblood_expose';
      }
    }
  },
};

// ─────────────────────────────────────────────
// 翘课主流程
// ─────────────────────────────────────────────

/**
 * 执行一次翘课判定，返回结果 context。
 * 供 event.js 的翘课事件处理器调用。
 *
 * @param {object} G           - 游戏全局状态
 * @param {object} skipParams  - 翘课参数
 * @param {string}  skipParams.raceKey      - 角色种族键
 * @param {string}  skipParams.personality  - 当前课程教授性格
 * @param {boolean} skipParams.isNight      - 是否夜间
 * @param {boolean} skipParams.isOutdoor    - 是否户外
 *
 * @returns {{
 *   detected:             boolean,
 *   result:               'caught'|'ignored'|'escaped',
 *   finalChance:          number,
 *   punishDowngrade:      boolean,
 *   triggerStoneRite:     boolean,
 *   triggerIdentityExpose:boolean,
 *   narrativeTag:         string|null,
 * }}
 */
export function resolveSkipClass(G, skipParams) {
  const { raceKey } = skipParams;
  const cfg         = RACE_SKIP_CONFIG[raceKey] ?? RACE_SKIP_CONFIG.human;

  // 构建判定上下文
  const context = {
    type:                 'skip_detect',
    isNight:              skipParams.isNight    ?? false,
    isOutdoor:            skipParams.isOutdoor  ?? false,
    detected:             false,
    result:               'caught',             // caught / ignored / escaped
    finalChance:          0,
    punishDowngrade:      false,
    triggerStoneRite:     false,
    triggerIdentityExpose:false,
    narrativeTag:         null,
  };

  // 1. 前置机制（可修改检测概率或添加标记）
  const mechKey = cfg.specialMechanic;
  const mech    = mechKey ? SKIP_MECHANICS[mechKey] : null;
  if (mech?.beforeDetect) mech.beforeDetect(G, context);

  // 2. 计算最终被发现概率
  context.finalChance = calcDetectChance({
    raceKey:     raceKey,
    personality: skipParams.personality ?? 'normal',
    isNight:     context.isNight,
    isOutdoor:   context.isOutdoor,
  });

  // 3. 被发现判定
  context.detected = Math.random() < context.finalChance;

  if (context.detected) {
    // 4. 被发现后的特殊机制（可将结果改为 ignored / escaped）
    if (mech?.onCaught) mech.onCaught(G, context);
  } else {
    // 5. 翘课成功后的累计机制（矮人连续翘课等）
    if (mech?.onSkipCount) mech.onSkipCount(G, context);
  }

  return context;
}

/**
 * 学期结束时调用，重置所有有限次机制。
 *
 * @param {object} G - 游戏全局状态
 * @param {string} raceKey
 */
export function onSemesterEndSkip(G, raceKey) {
  const cfg     = RACE_SKIP_CONFIG[raceKey] ?? RACE_SKIP_CONFIG.human;
  const mechKey = cfg.specialMechanic;
  const mech    = mechKey ? SKIP_MECHANICS[mechKey] : null;
  if (mech?.onSemesterEnd) mech.onSemesterEnd(G);
  // 通用重置
  G.skipStreak = 0;
}
