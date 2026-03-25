/**
 * achievements.js
 * P1 — 声望与成就系统
 *
 * 【声望系统】
 *   - 每学部独立声望值，范围 -100 ~ 100
 *   - 初始值由学部关系决定：本学部=100，友好=60，中立=30，对立=0，敌对=-20
 *   - 声望不直接显示数值，通过"声望等级"映射为文字/态度/环境描述
 *
 * 【成就系统】
 *   - 分类：学业 ACADEMIC / 社交 SOCIAL / 探索 EXPLORE / 隐藏 HIDDEN
 *   - 解锁奖励：称号 title / 道具 item / 剧情开关 flag
 */

import { CHAR } from '../core/character.js';
import { G }    from '../core/gameState.js';

// ─────────────────────────────────────────────
// 一、学部关系表（与本学部的初始关系类型）
// ─────────────────────────────────────────────

/** 学部关系类型及初始声望值 */
export const RELATION_TYPE = {
  SELF     : { label: '本学部', initRep: 100 },
  ALLY     : { label: '友好',   initRep:  60 },
  NEUTRAL  : { label: '中立',   initRep:  30 },
  RIVAL    : { label: '对立',   initRep:   0 },
  HOSTILE  : { label: '敌对',   initRep: -20 },
};

/**
 * 各学部之间的关系矩阵
 * key = 学部键，value = { 其他学部键: 关系类型键 }
 * 未列出的默认为 NEUTRAL
 */
export const DEPT_RELATIONS = {
  lucis:   { lucis:'SELF', silvae:'ALLY',  umbrae:'RIVAL',  belli:'NEUTRAL', mentis:'ALLY',   fornacis:'NEUTRAL', abyssi:'RIVAL',  stellae:'NEUTRAL' },
  umbrae:  { umbrae:'SELF', abyssi:'ALLY', lucis:'RIVAL',   belli:'ALLY',    mentis:'NEUTRAL', silvae:'NEUTRAL',  fornacis:'NEUTRAL', stellae:'RIVAL'  },
  silvae:  { silvae:'SELF', lucis:'ALLY',  fornacis:'ALLY', umbrae:'NEUTRAL', mentis:'NEUTRAL', belli:'NEUTRAL',  abyssi:'NEUTRAL', stellae:'ALLY'   },
  fornacis:{ fornacis:'SELF', silvae:'ALLY', stellae:'ALLY', lucis:'NEUTRAL', umbrae:'NEUTRAL', belli:'ALLY',     mentis:'NEUTRAL', abyssi:'NEUTRAL' },
  mentis:  { mentis:'SELF',  lucis:'ALLY',  stellae:'ALLY', umbrae:'NEUTRAL', silvae:'NEUTRAL', fornacis:'NEUTRAL', belli:'RIVAL',  abyssi:'NEUTRAL' },
  belli:   { belli:'SELF',   umbrae:'ALLY', fornacis:'ALLY', lucis:'NEUTRAL', mentis:'RIVAL',   silvae:'NEUTRAL',  abyssi:'ALLY',  stellae:'NEUTRAL' },
  abyssi:  { abyssi:'SELF',  umbrae:'ALLY', belli:'ALLY',   lucis:'RIVAL',   mentis:'NEUTRAL', silvae:'NEUTRAL',  fornacis:'NEUTRAL', stellae:'RIVAL' },
  stellae: { stellae:'SELF', silvae:'ALLY', fornacis:'ALLY', mentis:'ALLY',  lucis:'NEUTRAL',  umbrae:'RIVAL',    belli:'NEUTRAL', abyssi:'RIVAL'  },
};

/** 所有学部键列表 */
export const ALL_DEPTS = Object.keys(DEPT_RELATIONS);

/**
 * 根据角色学部生成初始声望对象
 * @param {string} charDept - 角色所属学部键
 * @returns {{ [deptKey: string]: number }}
 */
export function buildInitialRepute(charDept) {
  const repute = {};
  const relations = DEPT_RELATIONS[charDept] || {};
  for (const dept of ALL_DEPTS) {
    const relKey = relations[dept] ?? 'NEUTRAL';
    repute[dept] = RELATION_TYPE[relKey]?.initRep ?? 30;
  }
  return repute;
}

// ─────────────────────────────────────────────
// 二、声望等级描述（用于 NPC 态度 & 环境文本）
// ─────────────────────────────────────────────

export const REP_LEVELS = [
  { min:  80, max: 100, key: 'revered',   label: '崇敬',   npcAttr: '热忱尊敬',    envHint: '周围学生主动让路，轻声议论着你的名字。'   },
  { min:  50, max:  79, key: 'respected', label: '尊重',   npcAttr: '友好有礼',    envHint: '偶有学生向你点头致意。'                   },
  { min:  20, max:  49, key: 'neutral',   label: '普通',   npcAttr: '漠然',        envHint: '人群从你身边流过，无人特别在意。'           },
  { min:   0, max:  19, key: 'wary',      label: '警惕',   npcAttr: '保持距离',    envHint: '有人侧目，却刻意避免与你对视。'             },
  { min: -30, max:  -1, key: 'hostile',   label: '敌意',   npcAttr: '冷漠刁难',    envHint: '周围的窃窃私语不那么友好。'                 },
  { min:-100, max: -31, key: 'despised',  label: '厌恶',   npcAttr: '公然排斥',    envHint: '有人在你背后投来刻薄的目光，低声嘲讽。'     },
];

/**
 * 获取指定学部当前声望等级描述
 * @param {string} deptKey
 * @returns {{ key, label, npcAttr, envHint }}
 */
export function getRepLevel(deptKey) {
  const val = G.repute[deptKey] ?? 0;
  return REP_LEVELS.find(r => val >= r.min && val <= r.max) ?? REP_LEVELS[2];
}

/**
 * 修改声望值（带边界限制 -100~100），并触发成就检查
 * @param {string} deptKey
 * @param {number} delta  - 正数增加，负数减少
 * @param {string} [reason] - 可选：变化原因，用于日志
 */
export function changeRepute(deptKey, delta, reason = '') {
  if (!(deptKey in G.repute)) G.repute[deptKey] = 30;
  const before = G.repute[deptKey];
  G.repute[deptKey] = Math.max(-100, Math.min(100, before + delta));
  if (reason) console.log(`[声望] ${deptKey}: ${before} → ${G.repute[deptKey]}（${reason}）`);
  checkAchievements();
}

// ─────────────────────────────────────────────
// 三、成就定义
// ─────────────────────────────────────────────

/**
 * 成就分类枚举
 */
export const ACH_CAT = {
  ACADEMIC: 'academic',   // 学业
  SOCIAL  : 'social',     // 社交
  EXPLORE : 'explore',    // 探索
  HIDDEN  : 'hidden',     // 隐藏
};

/**
 * 成就定义列表
 *
 * 每条：
 *   id       唯一键
 *   cat      分类
 *   name     成就名
 *   desc     触发描述（玩家可见，隐藏成就解锁前不显示 desc）
 *   hint     未解锁时的提示（隐藏成就固定显示 '???'）
 *   cond(G)  解锁条件函数，返回 boolean
 *   reward   { title?, item?, flag? }
 */
export const ACHIEVEMENTS = [

  // ── 学业 ──────────────────────────────────
  {
    id: 'ach_firstAttend',
    cat: ACH_CAT.ACADEMIC,
    name: '初次听讲',
    desc: '完成第一次课程出勤。',
    hint: '上一堂课试试看。',
    cond: (g) => Object.values(g.courseProgress).some(cp => cp.attended >= 1),
    reward: { title: '求学者' },
  },
  {
    id: 'ach_perfectAttend',
    cat: ACH_CAT.ACADEMIC,
    name: '全勤学徒',
    desc: '在一门课程中保持 100% 出勤率。',
    hint: '一节课都不能缺席。',
    cond: (g) => Object.values(g.courseProgress).some(
      cp => cp.total > 0 && cp.attended >= cp.total
    ),
    reward: { title: '全勤学徒', item: 'scroll_focus' },
  },
  {
    id: 'ach_examAce',
    cat: ACH_CAT.ACADEMIC,
    name: '试炼无惧',
    desc: '在一门课程的期末考试中取得 S 评级。',
    hint: '期末考试全力以赴。',
    cond: (g) => Object.values(g.courseProgress).some(cp => cp.grade === 'S'),
    reward: { title: '荣耀学者', item: 'badge_honor', flag: 'unlocked_advanced_course' },
  },
  {
    id: 'ach_makeupSurvivor',
    cat: ACH_CAT.ACADEMIC,
    name: '绝处逢生',
    desc: '通过补考挽救了一门课程。',
    hint: '补考也能翻盘。',
    cond: (g) => Object.values(g.courseProgress).some(cp => cp.makeupDone && cp.makeupScore >= 60),
    reward: { title: '顽强求生者' },
  },
  {
    id: 'ach_allCoursePass',
    cat: ACH_CAT.ACADEMIC,
    name: '学期清',
    desc: '本学期所有课程均通过。',
    hint: '不让任何一门红灯。',
    cond: (g) => {
      const cps = Object.values(g.courseProgress);
      return cps.length > 0 && cps.every(cp => cp.finalScore >= 60 || cp.makeupScore >= 60);
    },
    reward: { title: '优等生', item: 'token_library', flag: 'unlocked_honor_roll' },
  },

  // ── 社交 ──────────────────────────────────
  {
    id: 'ach_firstFriend',
    cat: ACH_CAT.SOCIAL,
    name: '破冰',
    desc: '与任意 NPC 好感度首次达到 30。',
    hint: '试着多和人交谈。',
    cond: (g) => Object.values(g.relations).some(v => v >= 30),
    reward: { title: '交际新手' },
  },
  {
    id: 'ach_trustedAlly',
    cat: ACH_CAT.SOCIAL,
    name: '坚实后盾',
    desc: '与任意 NPC 好感度达到 80。',
    hint: '深化你们的关系。',
    cond: (g) => Object.values(g.relations).some(v => v >= 80),
    reward: { title: '挚友', item: 'gift_ally', flag: 'unlocked_ally_story' },
  },
  {
    id: 'ach_clubMember',
    cat: ACH_CAT.SOCIAL,
    name: '初入江湖',
    desc: '加入第一个社团。',
    hint: '社团招募期不要错过。',
    cond: (g) => g.clubs.length >= 1,
    reward: { title: '社团新人' },
  },
  {
    id: 'ach_clubCore',
    cat: ACH_CAT.SOCIAL,
    name: '中流砥柱',
    desc: '在任意社团晋升为骨干。',
    hint: '在社团中积累贡献。',
    cond: (g) => Object.values(g.clubRank).some(r => r >= 2),
    reward: { title: '社团骨干', item: 'item_club_badge' },
  },
  {
    id: 'ach_deptRevered',
    cat: ACH_CAT.SOCIAL,
    name: '本部之星',
    desc: '在本学部声望达到最高等级「崇敬」。',
    hint: '在本学部广结善缘，建立威望。',
    cond: (g) => (g.repute[CHAR.dept] ?? 0) >= 80,
    reward: { title: '本部之星', item: 'robe_dept', flag: 'unlocked_dept_event' },
  },
  {
    id: 'ach_crossDeptDiplomat',
    cat: ACH_CAT.SOCIAL,
    name: '跨部外交官',
    desc: '与三个不同学部的声望同时达到「尊重」以上。',
    hint: '不局限于本学部的人际圈。',
    cond: (g) => ALL_DEPTS.filter(d => (g.repute[d] ?? 0) >= 50).length >= 3,
    reward: { title: '外交官', flag: 'unlocked_crossdept_event' },
  },

  // ── 探索 ──────────────────────────────────
  {
    id: 'ach_firstExplore',
    cat: ACH_CAT.EXPLORE,
    name: '踏出第一步',
    desc: '离开本学部宿舍，前往其他地点。',
    hint: '门外的世界在等你。',
    cond: (g) => g.locKey !== CHAR.dept + '_d',
    reward: { title: '探路者' },
  },
  {
    id: 'ach_visitAllPublic',
    cat: ACH_CAT.EXPLORE,
    name: '校园漫游者',
    desc: '访问全部 8 处公共区域。',
    hint: '打卡校园的每个角落。',
    cond: (g) => {
      const PUBLIC_KEYS = ['via','forum','horti','campus','ambul','thermae','biblio','atrium'];
      return PUBLIC_KEYS.every(k => g.visitedLocs?.includes(k));
    },
    reward: { title: '校园漫游者', item: 'map_full', flag: 'unlocked_hidden_area' },
  },
  {
    id: 'ach_nightOwl',
    cat: ACH_CAT.EXPLORE,
    name: '夜枭',
    desc: '在夜间时段外出活动超过 5 次。',
    hint: '夜晚也有它的故事。',
    cond: (g) => (g.nightOutCount ?? 0) >= 5,
    reward: { title: '夜枭', item: 'lantern_night' },
  },
  {
    id: 'ach_seasonComplete',
    cat: ACH_CAT.EXPLORE,
    name: '学期终章',
    desc: '完整经历一个学期的全部 16 周。',
    hint: '坚持到最后。',
    cond: (g) => g.week >= 16 && g.examsDone.final,
    reward: { title: '学期生存者', item: 'medal_semester' },
  },

  // ── 隐藏 ──────────────────────────────────
  {
    id: 'ach_hidden_riskMaster',
    cat: ACH_CAT.HIDDEN,
    name: '边缘行者',
    desc: '在失控风险达到 90 的情况下成功度过一个时段。',
    hint: '???',
    cond: (g) => g.riskLevel >= 90 && (g._riskSurvived ?? false),
    reward: { title: '边缘行者', flag: 'unlocked_risk_story' },
  },
  {
    id: 'ach_hidden_enemyRepect',
    cat: ACH_CAT.HIDDEN,
    name: '化敌为友',
    desc: '将某学部声望从负值提升至 50 以上。',
    hint: '???',
    cond: (g) => ALL_DEPTS.some(d => (g._reputeStarted?.[d] ?? 30) < 0 && (g.repute[d] ?? 0) >= 50),
    reward: { title: '化敌为友', flag: 'unlocked_rival_event' },
  },
  {
    id: 'ach_hidden_violZero',
    cat: ACH_CAT.HIDDEN,
    name: '无瑕之人',
    desc: '整个学期零违规记录通关。',
    hint: '???',
    cond: (g) => g.week >= 16 && g.viol === 0 && g.examsDone.final,
    reward: { title: '无瑕之人', item: 'white_robe', flag: 'unlocked_pure_ending' },
  },
  {
    id: 'ach_hidden_goldHoarder',
    cat: ACH_CAT.HIDDEN,
    name: '积敛之主',
    desc: '同时持有 500 金币以上。',
    hint: '???',
    cond: (g) => g.gold >= 500,
    reward: { title: '积敛之主', item: 'purse_gold' },
  },
];

// ─────────────────────────────────────────────
// 四、成就引擎
// ─────────────────────────────────────────────

/**
 * 初始化成就状态（首次进入游戏时调用）
 * 在 G 中补充成就相关字段
 */
export function initAchievements() {
  if (!G.achievements) G.achievements  = {};   // { achId: true } 已解锁集合
  if (!G.achTitles)    G.achTitles     = [];    // 已解锁称号列表
  if (!G.achItems)     G.achItems      = [];    // 通过成就获得的道具
  if (!G.visitedLocs)  G.visitedLocs   = [];    // 已访问地点记录
  if (!G.nightOutCount) G.nightOutCount = 0;
  // 记录每个学部声望的"初始快照"（用于化敌为友判断）
  if (!G._reputeStarted) {
    G._reputeStarted = { ...G.repute };
  }
}

/**
 * 检查并解锁所有满足条件的成就
 * 每次状态变化后调用
 * @returns {Array} 本次新解锁的成就列表
 */
export function checkAchievements() {
  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (G.achievements[ach.id]) continue; // 已解锁
    try {
      if (ach.cond(G)) {
        unlockAchievement(ach);
        newlyUnlocked.push(ach);
      }
    } catch (e) {
      // 条件检查容错，避免单个错误中断全局
      console.warn(`[成就检查错误] ${ach.id}:`, e);
    }
  }
  return newlyUnlocked;
}

/**
 * 解锁单个成就并发放奖励
 * @param {object} ach - ACHIEVEMENTS 中的成就对象
 */
function unlockAchievement(ach) {
  G.achievements[ach.id] = true;
  console.log(`[成就解锁] ${ach.name} — ${ach.desc}`);

  const { reward } = ach;
  if (!reward) return;

  if (reward.title) {
    if (!G.achTitles.includes(reward.title)) {
      G.achTitles.push(reward.title);
    }
  }
  if (reward.item) {
    if (!G.achItems.includes(reward.item)) {
      G.achItems.push(reward.item);
    }
  }
  if (reward.flag) {
    G.dialogueFlags[reward.flag] = true;
  }
}

/**
 * 获取成就列表（按分类过滤）
 * 隐藏成就未解锁时遮蔽 name/desc
 * @param {string|null} [cat] - 分类过滤，null 返回全部
 * @returns {Array}
 */
export function getAchievementList(cat = null) {
  const list = cat ? ACHIEVEMENTS.filter(a => a.cat === cat) : ACHIEVEMENTS;
  return list.map(ach => {
    const unlocked = !!G.achievements[ach.id];
    if (ach.cat === ACH_CAT.HIDDEN && !unlocked) {
      return {
        id   : ach.id,
        cat  : ach.cat,
        name : '???',
        desc : '???',
        hint : '???',
        unlocked,
      };
    }
    return {
      id      : ach.id,
      cat     : ach.cat,
      name    : ach.name,
      desc    : ach.desc,
      hint    : unlocked ? null : ach.hint,
      unlocked,
      reward  : unlocked ? ach.reward : null,
    };
  });
}

/**
 * 获取当前激活称号（默认为最新解锁的称号）
 * @returns {string|null}
 */
export function getActiveTitle() {
  if (!G.achTitles || G.achTitles.length === 0) return null;
  return G.activeTitle ?? G.achTitles[G.achTitles.length - 1];
}

/**
 * 手动设置激活称号（必须是已解锁的称号）
 * @param {string} title
 */
export function setActiveTitle(title) {
  if (G.achTitles?.includes(title)) {
    G.activeTitle = title;
  }
}

// ─────────────────────────────────────────────
// 五、地点访问记录辅助（供 locations / travel 逻辑调用）
// ─────────────────────────────────────────────

/**
 * 记录访问地点，并触发成就检查
 * @param {string} locKey
 */
export function recordVisit(locKey) {
  if (!G.visitedLocs) G.visitedLocs = [];
  if (!G.visitedLocs.includes(locKey)) {
    G.visitedLocs.push(locKey);
  }
  // 记录夜间外出次数
  if (G.period === 4 && locKey !== CHAR.dept + '_d') {
    G.nightOutCount = (G.nightOutCount ?? 0) + 1;
  }
  checkAchievements();
}

// ─────────────────────────────────────────────
// 六、声望文本工具（供 NPC 对话 / 场景描述调用）
// ─────────────────────────────────────────────

/**
 * 获取某学部 NPC 对角色的默认态度描述
 * @param {string} deptKey
 * @returns {string}
 */
export function getNpcAttitude(deptKey) {
  return getRepLevel(deptKey).npcAttr;
}

/**
 * 获取在某学部区域的环境氛围提示文本
 * @param {string} deptKey
 * @returns {string}
 */
export function getEnvHint(deptKey) {
  return getRepLevel(deptKey).envHint;
}
