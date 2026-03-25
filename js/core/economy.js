/**
 * economy.js
 * S4 — 双货币体系与经济系统
 *
 * 【货币】
 *   Aurum    金币   ：流通层，日常消耗，获取容易
 *   Crystallum 水晶 ：储值层，稀有交易，获取困难，不可与金币互兑
 *
 * 【通胀控制】
 *   - 每学期末扣除「宿舍维护费」30金 + 社团年费10金/社团
 *   - 水晶每学期可获上限约 15~20 颗
 *   - 背包上限 30 格（见 items.js）
 *
 * 【金币上限】
 *   - 默认 500，持有「扩容钱袋」后扩展至 999
 */

import { G }    from '../core/gameState.js';
import { addItem } from './items.js';
import { checkAchievements } from './achievements.js';

// ─────────────────────────────────────────────
// 一、常量
// ─────────────────────────────────────────────

export const GOLD_CAP_DEFAULT  = 500;
export const GOLD_CAP_EXTENDED = 999;
export const CRYSTAL_CAP_PER_SEM = 20;   // 每学期水晶可获上限

/** 获取当前金币上限 */
export function goldCap() {
  return G.dialogueFlags?.['has_purse_gold'] ? GOLD_CAP_EXTENDED : GOLD_CAP_DEFAULT;
}

// ─────────────────────────────────────────────
// 二、核心货币操作
// ─────────────────────────────────────────────

/**
 * 获得金币
 * @param {number} amount
 * @param {string} [reason]
 * @returns {{ ok: boolean, actual: number, msg: string }}
 */
export function earnGold(amount, reason = '') {
  const cap    = goldCap();
  const before = G.gold;
  G.gold = Math.min(cap, G.gold + Math.max(0, amount));
  const actual = G.gold - before;
  if (reason) _ecoLog(`[金币+${actual}] ${reason}`);
  checkAchievements();
  return {
    ok    : actual > 0,
    actual,
    msg   : actual > 0
      ? `获得 ${actual} 金币${actual < amount ? `（已达上限 ${cap}）` : ''}。`
      : `金币已达上限（${cap}），无法再获得。`,
  };
}

/**
 * 消耗金币
 * @param {number} amount
 * @param {string} [reason]
 * @returns {{ ok: boolean, msg: string }}
 */
export function spendGold(amount, reason = '') {
  if (G.gold < amount)
    return { ok: false, msg: `金币不足（需要 ${amount}，当前 ${G.gold}）。` };
  G.gold -= amount;
  if (reason) _ecoLog(`[金币-${amount}] ${reason}`);
  return { ok: true, msg: `消耗 ${amount} 金币。（剩余 ${G.gold}）` };
}

/**
 * 获得水晶
 * @param {number} amount
 * @param {string} [reason]
 * @returns {{ ok: boolean, actual: number, msg: string }}
 */
export function earnCrystal(amount, reason = '') {
  // 检查本学期水晶已获上限
  const semKey = `crystal_earned_sem_${G.sem}_${G.week <= 16 ? 0 : 1}`;
  const earned = G.ecoTrack?.[semKey] ?? 0;
  const remaining = Math.max(0, CRYSTAL_CAP_PER_SEM - earned);
  const actual = Math.min(amount, remaining);

  if (actual <= 0)
    return { ok: false, actual: 0, msg: `本学期水晶获取已达上限（${CRYSTAL_CAP_PER_SEM} 颗）。` };

  G.crystal += actual;
  if (!G.ecoTrack) G.ecoTrack = {};
  G.ecoTrack[semKey] = earned + actual;
  if (reason) _ecoLog(`[水晶+${actual}] ${reason}`);
  checkAchievements();
  return {
    ok    : true,
    actual,
    msg   : `获得 ${actual} 水晶${actual < amount ? `（本学期上限剩余 ${remaining}）` : ''}。`,
  };
}

/**
 * 消耗水晶
 * @param {number} amount
 * @param {string} [reason]
 * @returns {{ ok: boolean, msg: string }}
 */
export function spendCrystal(amount, reason = '') {
  if (G.crystal < amount)
    return { ok: false, msg: `魔力水晶不足（需要 ${amount}，当前 ${G.crystal}）。` };
  G.crystal -= amount;
  if (reason) _ecoLog(`[水晶-${amount}] ${reason}`);
  return { ok: true, msg: `消耗 ${amount} 水晶。（剩余 ${G.crystal}）` };
}

// ─────────────────────────────────────────────
// 三、收入来源
// ─────────────────────────────────────────────

/**
 * S4.2 — 上课出勤奖励
 * 每课 3~5 金币，全勤周（5节全到）额外 +5
 * 由 events.js 中 take_notes / ask_question 行动触发
 */
export function rewardAttendance() {
  const base   = 3 + Math.floor(Math.random() * 3); // 3~5
  const result = earnGold(base, '课程出勤奖励');

  // 检测全勤周：当天所有时段均有出勤记录
  const allAttended = Object.values(G.courseProgress).every(
    cp => cp.total === 0 || cp.attended / cp.total >= 1
  );
  if (allAttended) {
    const bonus = earnGold(5, '全勤周额外奖励');
    return { gold: result.actual + bonus.actual, bonus: true };
  }
  return { gold: result.actual, bonus: false };
}

/**
 * S4.2 — 考试成绩奖励
 * @param {'S'|'A'|'B'|'C'|'F'} grade
 */
export function rewardExam(grade) {
  const log = [];
  if (grade === 'S' || grade === 'A') {
    log.push(earnGold(50, `考试奖励（${grade}）`));
    log.push(earnCrystal(3, `考试奖励（${grade}）`));
  } else if (grade === 'B' || grade === 'C') {
    log.push(earnGold(20, `考试奖励（${grade}）`));
  }
  // F 无奖励
  return log;
}

/**
 * S4.2 — 社团活动收入
 * 每次参与 5~15 金币，社团骨干徽标额外 +3
 */
export function rewardClubActivity(isSpecial = false) {
  const base   = isSpecial
    ? 10 + Math.floor(Math.random() * 11)   // 特殊活动 10~20
    : 5  + Math.floor(Math.random() * 11);  // 普通 5~15
  const bonus  = G.dialogueFlags?.['equipped_club_badge'] ? 3 : 0;
  return earnGold(base + bonus, `社团活动收入${bonus ? '（骨干加成）' : ''}`);
}

/**
 * S4.2 — 校内兼职收入（图书馆整理 / 温室维护 / 食堂帮厨）
 * 每时间段 8~12 金币
 * @param {'library'|'greenhouse'|'canteen'} jobType
 */
export function rewardPartTime(jobType) {
  const names = { library: '图书馆整理', greenhouse: '温室维护', canteen: '食堂帮厨' };
  const base  = 8 + Math.floor(Math.random() * 5); // 8~12
  G.sp = Math.max(0, G.sp - 8); // 兼职消耗体力
  return earnGold(base, `校内兼职：${names[jobType] ?? jobType}`);
}

/**
 * S4.2 — 节日活动收入
 * 不定金额，绿集交易可获利
 * @param {number} gold
 * @param {number} [crystal=0]
 */
export function rewardFestival(gold, crystal = 0) {
  const g = earnGold(gold, '节日活动收入');
  const c = crystal > 0 ? earnCrystal(crystal, '节日活动收入') : null;
  return { gold: g, crystal: c };
}

/**
 * S4.2 — 随机事件金币变动（可正可负）
 * @param {number} delta  正数=获得，负数=损失
 * @param {string} reason
 */
export function randomEventGold(delta, reason = '随机事件') {
  if (delta >= 0) return earnGold(delta, reason);
  return spendGold(Math.abs(delta), reason);
}

/**
 * S4.2 — NPC 赠送水晶（好感度触发，1~3颗）
 * @param {string} npcId
 */
export function npcGiftCrystal(npcId) {
  const rel = G.relations?.[npcId] ?? 0;
  if (rel < 80) return { ok: false, msg: '好感度未达到赠送阈值（需要 80 以上）。' };
  const amount = 1 + Math.floor(Math.random() * 3); // 1~3
  return earnCrystal(amount, `NPC赠送（${npcId}）`);
}

/**
 * S4.2 — 成就解锁水晶奖励
 * @param {number} amount
 * @param {boolean} isHidden  隐藏成就奖励更多
 */
export function rewardAchievement(amount, isHidden = false) {
  const actual = isHidden ? amount : Math.min(amount, 10);
  return earnCrystal(actual, `成就奖励${isHidden ? '（隐藏）' : ''}`);
}

// ─────────────────────────────────────────────
// 四、支出项目（商店购买）
// ─────────────────────────────────────────────

/**
 * 购买道具
 * @param {string} itemId
 * @param {number} [qty=1]
 * @returns {{ ok: boolean, msg: string }}
 */
export function buyItem(itemId, qty = 1) {
  const { ITEMS } = require('./items.js'); // 动态引入避免循环依赖
  const def = ITEMS[itemId];
  if (!def) return { ok: false, msg: '商店中没有这件道具。' };

  // 节日限定检查
  if (def.festivalSem && !def.festivalSem.includes(G.sem))
    return { ok: false, msg: `【${def.name}】仅在特定节日期间出售。` };

  // 货币扣除
  let payResult;
  if (def.priceC) {
    payResult = spendCrystal(def.priceC * qty, `购买【${def.name}】×${qty}`);
  } else if (def.price) {
    payResult = spendGold(def.price * qty, `购买【${def.name}】×${qty}`);
  } else {
    return { ok: false, msg: `【${def.name}】不在售。` };
  }
  if (!payResult.ok) return payResult;

  // 加入背包
  const addResult = addItem(itemId, qty);
  if (!addResult.ok) {
    // 背包满，退款
    if (def.priceC) G.crystal += def.priceC * qty;
    else G.gold += def.price * qty;
    return { ok: false, msg: `${addResult.msg}（已退款）` };
  }

  return { ok: true, msg: `购买【${def.name}】×${qty}。${addResult.msg}` };
}

// ─────────────────────────────────────────────
// 五、学期末结算
// ─────────────────────────────────────────────

/**
 * S4.4 — 学期末通胀控制结算
 * 收取宿舍维护费 30 金 + 社团年费 10 金/社团
 * @returns {{ ok: boolean, deducted: number, msg: string }}
 */
export function semesterEndSettle() {
  const clubFee  = (G.clubs?.length ?? 0) * 10;
  const dormFee  = 30;
  const total    = dormFee + clubFee;

  const lines = [`宿舍维护费：${dormFee} 金币`];
  if (clubFee > 0) lines.push(`社团年费（×${G.clubs.length}）：${clubFee} 金币`);

  if (G.gold < total) {
    // 金币不足：扣至0，标记欠费（可触发后续惩罚事件）
    const shortfall = total - G.gold;
    G.gold = 0;
    G.dialogueFlags['debt_dorm_fee'] = true;
    return {
      ok      : false,
      deducted: total - shortfall,
      msg     : `学期末结算：${lines.join('，')}。\n金币不足，欠费 ${shortfall} 金币，已标记欠费状态。`,
    };
  }

  G.gold -= total;
  // 重置水晶学期追踪（新学期开始）
  if (!G.ecoTrack) G.ecoTrack = {};
  G.ecoTrack[`crystal_earned_sem_${G.sem}_0`] = 0;

  return {
    ok      : true,
    deducted: total,
    msg     : `学期末结算完成。${lines.join('，')}。共扣除 ${total} 金币。（剩余 ${G.gold}）`,
  };
}

/**
 * 检查并给予学期末勋章奖励（配合 items.js 中的 medal_semester）
 */
export function semesterMedalReward() {
  return addItem('medal_semester', 1);
}

// ─────────────────────────────────────────────
// 六、经济状态查询
// ─────────────────────────────────────────────

/**
 * 获取当前经济摘要（供 UI 状态栏使用）
 */
export function getEconSummary() {
  const semKey  = `crystal_earned_sem_${G.sem}_0`;
  const crystalEarned = G.ecoTrack?.[semKey] ?? 0;
  return {
    gold          : G.gold,
    goldCap       : goldCap(),
    crystal       : G.crystal,
    crystalEarned,
    crystalCapLeft: Math.max(0, CRYSTAL_CAP_PER_SEM - crystalEarned),
    inDebt        : !!G.dialogueFlags?.['debt_dorm_fee'],
  };
}

// ─────────────────────────────────────────────
// 七、内部工具
// ─────────────────────────────────────────────

function _ecoLog(msg) {
  // 调试日志，生产环境可关闭
  if (typeof console !== 'undefined') console.log(`[经济] ${msg}`);
}
