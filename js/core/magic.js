/**
 * magic.js
 * 10.1 — 魔法修炼系统
 *
 * 【设计概要】
 *   - 魔法分系：光 / 暗 / 自然 / 锻造 / 幻 / 战 / 渊 / 星
 *   - 每个技能有 5 级熟练度（生疏→入门→熟练→精通→臻境）
 *   - 主动修炼：消耗 MP + 时间（period），提升熟练度经验
 *   - 高熟练度解锁进阶用途（被动加成、剧情选项、特殊互动）
 *   - 属性深度绑定：修炼效率 & 解锁条件与 stats 挂钩
 *   - 稀有魔法：需特定前置条件（声望/成就/剧情flag/属性阈值）
 */

import { G }    from '../core/gameState.js';
import { CHAR } from '../core/character.js';
import { addExp } from '../core/experience.js';
import { checkAchievements } from './achievements.js';

// ─────────────────────────────────────────────
// 一、常量：熟练度等级
// ─────────────────────────────────────────────

export const PROF_LEVELS = [
  { rank: 0, label: '未习得', threshold: 0   },
  { rank: 1, label: '生疏',   threshold: 0   },  // 刚习得
  { rank: 2, label: '入门',   threshold: 100 },
  { rank: 3, label: '熟练',   threshold: 280 },
  { rank: 4, label: '精通',   threshold: 560 },
  { rank: 5, label: '臻境',   threshold: 1000},
];

/** 获取熟练度等级对象（rank 1-5） */
export function getProfLevel(exp) {
  let level = PROF_LEVELS[1]; // 生疏起步
  for (const lv of PROF_LEVELS) {
    if (exp >= lv.threshold) level = lv;
  }
  return level;
}

/** 获取当前等级到下一级所需总经验（用于进度条显示） */
export function getProfProgress(exp) {
  const cur  = getProfLevel(exp);
  const next = PROF_LEVELS[cur.rank + 1];
  if (!next) return { cur, next: null, progress: 1, need: 0, have: 0 };
  const have = exp - cur.threshold;
  const need = next.threshold - cur.threshold;
  return { cur, next, progress: have / need, need, have };
}

// ─────────────────────────────────────────────
// 二、魔法定义
// ─────────────────────────────────────────────

/**
 * 属性缩写映射（用于 desc）
 * int=智力 mag=法力 phy=体魄 cha=魅力 sen=感知
 */

export const SPELLS = {

  // ══ 光系 ══════════════════════════════════
  lucis_ward: {
    id: 'lucis_ward', school: 'lucis', name: '护光屏障',
    desc: '以光之意志凝结防护结界，强化抵御阴暗术法的能力。',
    mpCost: 12, timeCost: 1,           // 消耗 MP 和时段数
    primaryStat: 'mag', secondaryStat: 'int',
    baseGain: 20,                       // 基础熟练度经验增量
    rarity: 'common',
    unlockCond: null,                   // 无特殊解锁条件，习得即可修炼
    profEffects: {
      2: { desc: '护盾持续时间 +1 回合',       flag: 'lucis_ward_2' },
      3: { desc: '同时抵御物理与魔法伤害',      flag: 'lucis_ward_3' },
      4: { desc: '反弹部分伤害给施法者',        flag: 'lucis_ward_4' },
      5: { desc: '【臻境】护盾破碎时释放致盲光爆', flag: 'lucis_ward_5', statBonus: { int: 1 } },
    },
  },
  lucis_heal: {
    id: 'lucis_heal', school: 'lucis', name: '愈光',
    desc: '引导光之能量修复创伤，回复自身或他人 HP。',
    mpCost: 15, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'sen',
    baseGain: 18,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '治疗量提升 20%',             flag: 'lucis_heal_2' },
      3: { desc: '可对目标施放',               flag: 'lucis_heal_3' },
      4: { desc: '附加驱除负面状态效果',        flag: 'lucis_heal_4' },
      5: { desc: '【臻境】复活效果（战斗外）',  flag: 'lucis_heal_5', statBonus: { mag: 1 } },
    },
  },
  lucis_lance: {
    id: 'lucis_lance', school: 'lucis', name: '圣光矛',
    desc: '凝聚纯粹光能为锐利矛刺，对暗属性目标造成额外伤害。',
    mpCost: 20, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'int',
    baseGain: 16,
    rarity: 'uncommon',
    unlockCond: (g) => (g.stats.mag >= 14) && (g.repute?.lucis ?? 0) >= 30,
    profEffects: {
      2: { desc: '暗属性伤害加成 +15%',         flag: 'lucis_lance_2' },
      3: { desc: '穿透防御效果',               flag: 'lucis_lance_3' },
      4: { desc: '连击概率 +20%',              flag: 'lucis_lance_4' },
      5: { desc: '【臻境】触发神圣审判（额外全属性伤害）', flag: 'lucis_lance_5', statBonus: { mag: 1, int: 1 } },
    },
  },

  // ══ 暗系 ══════════════════════════════════
  umbrae_veil: {
    id: 'umbrae_veil', school: 'umbrae', name: '暗影幕',
    desc: '以暗影编织遮蔽，降低被感知的概率，利于潜行与隐匿。',
    mpCost: 10, timeCost: 1,
    primaryStat: 'sen', secondaryStat: 'mag',
    baseGain: 22,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '持续时间延长 2 个时段',       flag: 'umbrae_veil_2' },
      3: { desc: '掩盖气息，NPC 主动感知降低',  flag: 'umbrae_veil_3' },
      4: { desc: '移动时不破除遮蔽',            flag: 'umbrae_veil_4' },
      5: { desc: '【臻境】可隐匿魔法痕迹',      flag: 'umbrae_veil_5', statBonus: { sen: 1 } },
    },
  },
  umbrae_drain: {
    id: 'umbrae_drain', school: 'umbrae', name: '暗蚀汲取',
    desc: '窃取目标的生命力量转化为己用，造成伤害并回复 HP。',
    mpCost: 18, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'phy',
    baseGain: 15,
    rarity: 'uncommon',
    unlockCond: (g) => g.stats.mag >= 13 && (g.repute?.umbrae ?? 0) >= 20,
    profEffects: {
      2: { desc: '汲取量提升 25%',             flag: 'umbrae_drain_2' },
      3: { desc: '可同时汲取 MP',              flag: 'umbrae_drain_3' },
      4: { desc: '对中毒目标效果翻倍',          flag: 'umbrae_drain_4' },
      5: { desc: '【臻境】汲取时使目标陷入恐惧', flag: 'umbrae_drain_5', statBonus: { mag: 1, phy: 1 } },
    },
  },
  umbrae_curse: {
    id: 'umbrae_curse', school: 'umbrae', name: '蚀骨诅咒',
    desc: '施以深邃诅咒，持续削弱目标属性，难以解除。',
    mpCost: 25, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'int',
    baseGain: 12,
    rarity: 'rare',
    unlockCond: (g) =>
      g.stats.mag >= 16 &&
      g.stats.int >= 14 &&
      (g.repute?.umbrae ?? 0) >= 50 &&
      g.dialogueFlags?.['unlocked_umbrae_curse'],
    profEffects: {
      2: { desc: '诅咒持续回合 +2',            flag: 'umbrae_curse_2' },
      3: { desc: '可叠加 2 层',               flag: 'umbrae_curse_3' },
      4: { desc: '解除难度大幅提升',            flag: 'umbrae_curse_4' },
      5: { desc: '【臻境】诅咒触发时汲取对方 SP', flag: 'umbrae_curse_5', statBonus: { mag: 2 } },
    },
  },

  // ══ 自然系（silvae） ══════════════════════
  silvae_root: {
    id: 'silvae_root', school: 'silvae', name: '缚根术',
    desc: '以自然之力唤出根系束缚目标，限制其行动能力。',
    mpCost: 14, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'phy',
    baseGain: 20,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '束缚持续时间 +1',            flag: 'silvae_root_2' },
      3: { desc: '同时对周围范围生效',          flag: 'silvae_root_3' },
      4: { desc: '被束缚目标受到自然伤害',       flag: 'silvae_root_4' },
      5: { desc: '【臻境】召唤古树守卫协助战斗', flag: 'silvae_root_5', statBonus: { phy: 1, mag: 1 } },
    },
  },
  silvae_bloom: {
    id: 'silvae_bloom', school: 'silvae', name: '生息绽放',
    desc: '引导自然生命力为同伴持续回复 HP，并解除毒素。',
    mpCost: 16, timeCost: 1,
    primaryStat: 'sen', secondaryStat: 'mag',
    baseGain: 18,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '每回合额外回复量 +5',         flag: 'silvae_bloom_2' },
      3: { desc: '作用范围扩大至全体',          flag: 'silvae_bloom_3' },
      4: { desc: '解除混乱与睡眠状态',          flag: 'silvae_bloom_4' },
      5: { desc: '【臻境】激活后触发自然共鸣buff', flag: 'silvae_bloom_5', statBonus: { sen: 1 } },
    },
  },

  // ══ 锻造系（fornacis） ════════════════════
  fornacis_forge: {
    id: 'fornacis_forge', school: 'fornacis', name: '魔纹铸炼',
    desc: '以精密魔法在器物上刻印符文，赋予装备额外属性。',
    mpCost: 20, timeCost: 1,
    primaryStat: 'int', secondaryStat: 'mag',
    baseGain: 16,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '符文稳定性 +20%，失败率降低',  flag: 'fornacis_forge_2' },
      3: { desc: '可刻入双重符文',              flag: 'fornacis_forge_3' },
      4: { desc: '成品获得额外隐性属性',         flag: 'fornacis_forge_4' },
      5: { desc: '【臻境】解锁传说级符文配方',   flag: 'fornacis_forge_5', statBonus: { int: 1, mag: 1 } },
    },
  },

  // ══ 幻系（mentis） ════════════════════════
  mentis_illusion: {
    id: 'mentis_illusion', school: 'mentis', name: '幻影织造',
    desc: '以精神之力编织逼真幻象，迷惑目标的感知与判断。',
    mpCost: 18, timeCost: 1,
    primaryStat: 'int', secondaryStat: 'cha',
    baseGain: 17,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '幻象持续时间 +2 回合',        flag: 'mentis_illusion_2' },
      3: { desc: '可模拟指定人物外形',           flag: 'mentis_illusion_3' },
      4: { desc: '幻象被攻击时反弹混乱',         flag: 'mentis_illusion_4' },
      5: { desc: '【臻境】幻象拥有部分实体效果', flag: 'mentis_illusion_5', statBonus: { int: 1, cha: 1 } },
    },
  },
  mentis_read: {
    id: 'mentis_read', school: 'mentis', name: '心声聆读',
    desc: '短暂窥视目标的表层思维，获取隐藏信息或意图。',
    mpCost: 22, timeCost: 1,
    primaryStat: 'sen', secondaryStat: 'int',
    baseGain: 14,
    rarity: 'uncommon',
    unlockCond: (g) => g.stats.sen >= 13 && g.stats.int >= 12,
    profEffects: {
      2: { desc: '读取深度增加，可获取情绪记忆',  flag: 'mentis_read_2' },
      3: { desc: '不易被目标察觉',              flag: 'mentis_read_3' },
      4: { desc: '同时读取多个目标',             flag: 'mentis_read_4' },
      5: { desc: '【臻境】解锁对话隐藏分支选项', flag: 'mentis_read_5', statBonus: { sen: 2 } },
    },
  },

  // ══ 战系（belli） ═════════════════════════
  belli_surge: {
    id: 'belli_surge', school: 'belli', name: '战气冲涌',
    desc: '激发体内战斗潜能，短时间内大幅提升物理伤害与速度。',
    mpCost: 12, timeCost: 1,
    primaryStat: 'phy', secondaryStat: 'mag',
    baseGain: 22,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '持续时间 +1 回合',            flag: 'belli_surge_2' },
      3: { desc: '同时提升防御力',              flag: 'belli_surge_3' },
      4: { desc: '激活时驱散恐惧/虚弱状态',     flag: 'belli_surge_4' },
      5: { desc: '【臻境】进入战狂状态，属性全面爆发', flag: 'belli_surge_5', statBonus: { phy: 2 } },
    },
  },
  belli_strike: {
    id: 'belli_strike', school: 'belli', name: '裂魂斩',
    desc: '以高度凝聚的战气斩出，可同时伤害肉体与精神。',
    mpCost: 28, timeCost: 1,
    primaryStat: 'phy', secondaryStat: 'mag',
    baseGain: 12,
    rarity: 'rare',
    unlockCond: (g) =>
      g.stats.phy >= 16 &&
      g.stats.mag >= 13 &&
      (g.repute?.belli ?? 0) >= 40 &&
      g.dialogueFlags?.['unlocked_belli_strike'],
    profEffects: {
      2: { desc: '精神伤害比例提升至 40%',      flag: 'belli_strike_2' },
      3: { desc: '破甲效果，无视 30% 防御',     flag: 'belli_strike_3' },
      4: { desc: '命中时有概率触发眩晕',         flag: 'belli_strike_4' },
      5: { desc: '【臻境】斩击穿透所有护盾',     flag: 'belli_strike_5', statBonus: { phy: 1, mag: 1 } },
    },
  },

  // ══ 渊系（abyssi） ════════════════════════
  abyssi_call: {
    id: 'abyssi_call', school: 'abyssi', name: '深渊呼唤',
    desc: '与深渊存在建立感应链接，获取其赐予的力量碎片。',
    mpCost: 30, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'sen',
    baseGain: 10,
    rarity: 'rare',
    unlockCond: (g) =>
      g.stats.mag >= 15 &&
      g.stats.sen >= 13 &&
      g.riskLevel >= 20 &&
      g.dialogueFlags?.['unlocked_abyssi_call'],
    profEffects: {
      2: { desc: '链接稳定性提升，风险增幅降低', flag: 'abyssi_call_2' },
      3: { desc: '可向深渊存在索取特定力量',     flag: 'abyssi_call_3' },
      4: { desc: '链接时短暂窥见未来片段',       flag: 'abyssi_call_4' },
      5: { desc: '【臻境】深渊契约：永久性增益与隐患并存', flag: 'abyssi_call_5', statBonus: { mag: 2, sen: 1 }, riskDelta: 10 },
    },
  },

  // ══ 星系（stellae） ═══════════════════════
  stellae_map: {
    id: 'stellae_map', school: 'stellae', name: '星轨测绘',
    desc: '以感知延展至星空，解读天象规律，预判事件走势。',
    mpCost: 20, timeCost: 1,
    primaryStat: 'sen', secondaryStat: 'int',
    baseGain: 16,
    rarity: 'common',
    unlockCond: null,
    profEffects: {
      2: { desc: '预判窗口从 1 个时段扩展至 1 天',  flag: 'stellae_map_2' },
      3: { desc: '可锁定特定目标的行动预测',         flag: 'stellae_map_3' },
      4: { desc: '测绘结果附带成功概率数值',         flag: 'stellae_map_4' },
      5: { desc: '【臻境】解锁命运干涉选项',         flag: 'stellae_map_5', statBonus: { sen: 1, int: 1 } },
    },
  },
  stellae_pulse: {
    id: 'stellae_pulse', school: 'stellae', name: '星脉共鸣',
    desc: '与星脉能量产生共振，临时大幅提升魔法施放效率。',
    mpCost: 25, timeCost: 1,
    primaryStat: 'mag', secondaryStat: 'sen',
    baseGain: 13,
    rarity: 'uncommon',
    unlockCond: (g) => g.stats.mag >= 14 && g.stats.sen >= 14,
    profEffects: {
      2: { desc: '共鸣持续时间 +1 回合',        flag: 'stellae_pulse_2' },
      3: { desc: 'MP 消耗降低 20%',             flag: 'stellae_pulse_3' },
      4: { desc: '所有魔法基础增益 +15%',       flag: 'stellae_pulse_4' },
      5: { desc: '【臻境】星辰赐福：下次施法不消耗 MP', flag: 'stellae_pulse_5', statBonus: { mag: 1, sen: 1 } },
    },
  },

  // ══ 跨系稀有 ══════════════════════════════
  nexus_break: {
    id: 'nexus_break', school: 'all', name: '界限破碎',
    desc: '打破魔法系属的壁垒，短暂融合多系能量为一体释放。极度消耗精神与体力，存在失控风险。',
    mpCost: 50, timeCost: 2,
    primaryStat: 'mag', secondaryStat: 'int',
    baseGain: 8,
    rarity: 'legendary',
    unlockCond: (g) =>
      g.stats.mag >= 18 &&
      g.stats.int >= 16 &&
      g.stats.sen >= 15 &&
      g.dialogueFlags?.['unlocked_nexus_break'] &&
      Object.keys(g.learnedSpells ?? {}).length >= 6,
    profEffects: {
      2: { desc: '失控概率降低 30%',            flag: 'nexus_break_2' },
      3: { desc: '多系融合数量从 2 提升至 3',   flag: 'nexus_break_3' },
      4: { desc: '消耗 SP 代替部分 MP',         flag: 'nexus_break_4' },
      5: { desc: '【臻境】掌控界限，完全消除失控风险', flag: 'nexus_break_5', statBonus: { mag: 2, int: 1, sen: 1 } },
    },
  },
};

// ─────────────────────────────────────────────
// 三、修炼效率计算
// ─────────────────────────────────────────────

/**
 * 计算单次修炼获得的熟练度经验
 * 效率受主属性、副属性影响，有随机浮动
 *
 * 公式：gain = baseGain × (1 + primaryBonus × 0.06 + secondaryBonus × 0.03) × rand(0.9~1.1)
 *
 * @param {object} spell  - SPELLS 中的魔法定义
 * @param {object} stats  - G.stats
 * @returns {number} 整数经验值
 */
export function calcCultivationGain(spell, stats) {
  const primary   = stats[spell.primaryStat]   - 10; // 超过基础值10的部分
  const secondary = stats[spell.secondaryStat] - 10;
  const bonus = 1 + Math.max(0, primary) * 0.06 + Math.max(0, secondary) * 0.03;
  const rand  = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.round(spell.baseGain * bonus * rand));
}

// ─────────────────────────────────────────────
// 四、习得魔法
// ─────────────────────────────────────────────

/**
 * 尝试习得一个新魔法（检查解锁条件）
 * @param {string} spellId
 * @returns {{ ok: boolean, msg: string }}
 */
export function learnSpell(spellId) {
  const spell = SPELLS[spellId];
  if (!spell) return { ok: false, msg: '未知的魔法。' };

  if (!G.learnedSpells) G.learnedSpells = {};
  if (G.learnedSpells[spellId] !== undefined)
    return { ok: false, msg: `你已习得【${spell.name}】。` };

  // 检查解锁条件
  if (spell.unlockCond && !spell.unlockCond(G)) {
    return { ok: false, msg: `【${spell.name}】的习得条件尚未满足。` };
  }

  // 初始化熟练度经验为 0（rank=1 生疏）
  G.learnedSpells[spellId] = 0;
  pushMagicEvt(`习得魔法`, `【${spell.name}】已收录至你的术式记忆。`, spell.school);
  checkAchievements();
  return { ok: true, msg: `成功习得【${spell.name}】。` };
}

// ─────────────────────────────────────────────
// 五、主动修炼
// ─────────────────────────────────────────────

/**
 * 执行一次修炼
 * - 消耗 MP（spell.mpCost）
 * - 消耗时段（spell.timeCost，由外部 advance time 处理，此处仅做前置检查）
 * - 提升熟练度经验，检查升级
 * - 对主属性/副属性添加少量经验
 *
 * @param {string} spellId
 * @returns {{ ok: boolean, msg: string, profGained?: number, levelUp?: boolean, newRank?: object }}
 */
export function cultivate(spellId) {
  const spell = SPELLS[spellId];
  if (!spell) return { ok: false, msg: '未知的魔法。' };

  if (!G.learnedSpells) G.learnedSpells = {};
  if (G.learnedSpells[spellId] === undefined)
    return { ok: false, msg: `你尚未习得【${spell.name}】，无法修炼。` };

  // MP 检查
  if (G.mp < spell.mpCost) {
    return { ok: false, msg: `MP 不足（需要 ${spell.mpCost}，当前 ${G.mp}）。` };
  }

  // 夜间时段修炼 SP 额外消耗
  const nightPenalty = G.period === 4 ? 5 : 0;
  if (G.sp < nightPenalty) {
    return { ok: false, msg: '精力耗尽，无法在此时修炼。' };
  }

  // 扣除资源
  G.mp -= spell.mpCost;
  if (nightPenalty) G.sp = Math.max(0, G.sp - nightPenalty);

  // 深渊系魔法增加失控风险
  if (spell.school === 'abyssi' || spell.id === 'nexus_break') {
    G.riskLevel = Math.min(100, G.riskLevel + 3);
  }

  // 计算并增加熟练度经验
  const gained = calcCultivationGain(spell, G.stats);
  const before = G.learnedSpells[spellId];
  G.learnedSpells[spellId] += gained;

  // 检查熟练度是否升级
  const oldRank = getProfLevel(before);
  const newRank = getProfLevel(G.learnedSpells[spellId]);
  const levelUp = newRank.rank > oldRank.rank;

  if (levelUp) {
    // 解锁对应等级效果 flag
    const effect = spell.profEffects?.[newRank.rank];
    if (effect?.flag) {
      G.dialogueFlags[effect.flag] = true;
    }
    // 臻境属性加成
    if (newRank.rank === 5 && effect?.statBonus) {
      for (const [stat, val] of Object.entries(effect.statBonus)) {
        G.stats[stat] = (G.stats[stat] ?? 10) + val;
      }
    }
    // 臻境风险（nexus_break 5 级之类）
    if (newRank.rank === 5 && effect?.riskDelta) {
      G.riskLevel = Math.min(100, G.riskLevel + effect.riskDelta);
    }
    pushMagicEvt(
      `【${spell.name}】熟练度提升`,
      `已达到「${newRank.label}」— ${effect?.desc ?? '解锁新效果'}`,
      spell.school
    );
  }

  // 主属性/副属性获得少量经验
  addExp(spell.primaryStat,   Math.ceil(gained * 0.15), G);
  addExp(spell.secondaryStat, Math.ceil(gained * 0.08), G);

  checkAchievements();

  return {
    ok: true,
    msg: levelUp
      ? `修炼成功！熟练度 +${gained}，【${spell.name}】晋升至「${newRank.label}」。`
      : `修炼成功，熟练度 +${gained}。（${newRank.label} ${getProfProgress(G.learnedSpells[spellId]).have}/${getProfProgress(G.learnedSpells[spellId]).need}）`,
    profGained: gained,
    levelUp,
    newRank,
  };
}

// ─────────────────────────────────────────────
// 六、查询工具
// ─────────────────────────────────────────────

/**
 * 获取已习得魔法列表（含熟练度信息）
 * @param {string|null} [school] - 按学部筛选，null 返回全部
 * @returns {Array}
 */
export function getLearnedSpells(school = null) {
  if (!G.learnedSpells) return [];
  return Object.entries(G.learnedSpells)
    .filter(([id]) => !school || SPELLS[id]?.school === school)
    .map(([id, exp]) => {
      const spell = SPELLS[id];
      const profInfo = getProfProgress(exp);
      return {
        ...spell,
        profExp    : exp,
        profRank   : profInfo.cur.rank,
        profLabel  : profInfo.cur.label,
        progress   : profInfo.progress,
        nextLabel  : profInfo.next?.label ?? null,
        unlockedEffects: Object.entries(spell.profEffects ?? {})
          .filter(([rank]) => profInfo.cur.rank >= Number(rank))
          .map(([, eff]) => eff.desc),
      };
    });
}

/**
 * 获取可习得但尚未习得的魔法（满足解锁条件的）
 * @returns {Array}
 */
export function getAvailableSpells() {
  if (!G.learnedSpells) G.learnedSpells = {};
  return Object.values(SPELLS).filter(spell => {
    if (G.learnedSpells[spell.id] !== undefined) return false; // 已习得
    if (spell.unlockCond && !spell.unlockCond(G)) return false; // 条件未满足
    return true;
  });
}

/**
 * 获取单个魔法的完整状态信息（供 UI 详情面板使用）
 * @param {string} spellId
 * @returns {object|null}
 */
export function getSpellDetail(spellId) {
  const spell = SPELLS[spellId];
  if (!spell) return null;
  const learned = G.learnedSpells?.[spellId] !== undefined;
  const exp     = learned ? G.learnedSpells[spellId] : 0;
  const profInfo = getProfProgress(exp);

  return {
    ...spell,
    learned,
    profExp    : exp,
    profRank   : learned ? profInfo.cur.rank : 0,
    profLabel  : learned ? profInfo.cur.label : '未习得',
    progress   : learned ? profInfo.progress : 0,
    nextLabel  : profInfo.next?.label ?? null,
    canCultivate: learned && G.mp >= spell.mpCost,
    allEffects : Object.entries(spell.profEffects ?? {}).map(([rank, eff]) => ({
      rank   : Number(rank),
      desc   : eff.desc,
      unlocked: profInfo.cur.rank >= Number(rank),
    })),
    condMet    : !spell.unlockCond || spell.unlockCond(G),
  };
}

// ─────────────────────────────────────────────
// 七、修炼日志推送
// ─────────────────────────────────────────────

const SCHOOL_COLORS = {
  lucis:    '#C9A84C',
  umbrae:   '#9b72cf',
  silvae:   '#5aab6b',
  fornacis: '#e07b39',
  mentis:   '#5ab3e0',
  belli:    '#e05a5a',
  abyssi:   '#4a4a8a',
  stellae:  '#a0b8e8',
  all:      '#d4af37',
};

function pushMagicEvt(title, desc, school = 'all') {
  const area = document.getElementById('narrative');
  if (!area) return;
  const color = SCHOOL_COLORS[school] ?? '#C9A84C';
  const evc = document.createElement('div');
  evc.className = 'evc';
  evc.innerHTML = `
    <svg viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" stroke="${color}" stroke-width=".9"/>
      <path d="M13 8 L16 13 L13 18 L10 13 Z" stroke="${color}" stroke-width="1.1" fill="none" stroke-linejoin="round"/>
    </svg>
    <div>
      <div class="et" style="color:${color}">${title}</div>
      <div class="ed">${desc}</div>
    </div>
  `;
  area.appendChild(evc);
  area.scrollTop = area.scrollHeight;
}
