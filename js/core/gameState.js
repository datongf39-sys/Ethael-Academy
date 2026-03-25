import { CHAR } from './character.js';
import { DEPTS } from '../data/departments.js';
import { COMMON_COURSES } from '../data/departments.js';
import { buildInitialRepute } from './achievements.js';

// 时间相关常量
export const PERIODS  = ['清晨','上午','下午','傍晚','夜间'];
export const DAYS     = ['星期一','星期二','星期三','星期四','星期五'];
export const SEMS     = ['秋季学期','冬季学期','春季学期','夏季学期'];
export const SHORTDAY = ['一','二','三','四','五'];

// 构建课程表
export function buildSchedule(deptKey) {
  // 每天每时段的课程 schedule[day][period] = {name, type} | null
  const schedule = Array.from({length:5}, () => Array(5).fill(null));
  const dept = DEPTS[deptKey];

  // 填入主修课
  for (const c of dept.courses) {
    for (const day of c.days) {
      for (const period of c.periods) {
        if (!schedule[day][period]) {
          schedule[day][period] = { name: c.name, type: c.type };
        }
      }
    }
  }

  // 填入通选课（随机选2门）
  const chosen = COMMON_COURSES.slice(0, 2);
  for (const c of chosen) {
    for (const day of c.days.slice(0,2)) {
      for (const period of c.periods) {
        if (!schedule[day][period]) {
          schedule[day][period] = { name: c.name, type: c.type };
        }
      }
    }
  }

  return schedule;
}

// 游戏全局状态
export const G = {
  sem:0, week:1, day:0, period:0,
  hp: CHAR.hp, hpMax: CHAR.hpMax,
  mp: CHAR.mp, mpMax: CHAR.mpMax,
  sp: CHAR.sp, spMax: CHAR.spMax,
  gold:80, crystal:2, viol:0,
  loc: DEPTS[CHAR.dept].dorm,
  locKey: CHAR.dept + '_d',
  stats: { ...CHAR.stats },
  exp: { int: 0, mag: 0, phy: 0, cha: 0, sen: 0 }, // 属性经验值

  // ── 声望 ────────────────────────────────────────────────────────────
  // 多学部声望，由 buildInitialRepute 根据角色所属学部自动生成初始值
  // 结构：{ deptKey: number(-100~100) }
  repute: buildInitialRepute(CHAR.dept),

  // ── 课程 ────────────────────────────────────────────────────────────
  attendance: {},               // 课程出勤率（兼容旧存档）
  courseProgress: {},           // {courseName: {attended,total,regular,examScore,finalScore,grade,makeupScore,makeupDone}}
  examsDone: { midterm: false, final: false },

  // ── 风险 ────────────────────────────────────────────────────────────
  riskLevel: 0,                 // 失控风险等级 0-100
  _riskSurvived: false,         // 高风险存活标记（隐藏成就用）

  // ── 社交 ────────────────────────────────────────────────────────────
  relations: {},                // NPC好感度 { npcId: number(-100~100) }
  dialogueFlags: {},            // 对话/状态触发标记 { flagKey: true }
  clubs: [],                    // 本学期已加入的社团 id 列表（上限2）
  clubRank: {},                 // 社团等级 { clubId: 0~3 } 0=新成员 1=正式 2=骨干 3=社长候选

  // ── 探索 ────────────────────────────────────────────────────────────
  visitedLocs: [],              // 已访问地点键列表（探索成就用）
  nightOutCount: 0,             // 夜间外出次数（夜枭成就用）

  // ── 成就 ────────────────────────────────────────────────────────────
  achievements: {},             // { achId: true } 已解锁成就集合
  achTitles: [],                // 已解锁称号列表
  activeTitle: null,            // 当前使用的称号
  achItems: [],                 // 通过成就获得的道具键列表
  _reputeStarted: null,         // 声望初始快照（化敌为友成就用，由 initAchievements 填充）

  // ── 魔法 ────────────────────────────────────────────────────────────
  learnedSpells: {},            // { spellId: profExp }  已习得魔法及其熟练度经验

  // ── 道具 & 背包 ─────────────────────────────────────────────────────
  bag: {},                      // { itemId: qty }  背包内容，上限30格（BAG_CAP）

  // ── 经济追踪 ─────────────────────────────────────────────────────────
  ecoTrack: {},                 // 经济系统追踪数据，如水晶本学期已获量
                                // key 格式：crystal_earned_sem_{semIndex}_0
};

// 课程表
export const SCHEDULE = buildSchedule(CHAR.dept);

// 获取今天的课程
export function todayCourse() {
  return SCHEDULE[G.day][G.period] || null;
}

// 获取当前日程描述
export function schedDesc() {
  const c = todayCourse();
  if (c) return `课程：${c.name}（${c.type}）`;
  if (G.period === 4) return '就寝时间';
  return '自由时间';
}
