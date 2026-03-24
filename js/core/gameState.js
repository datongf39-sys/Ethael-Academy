import { CHAR } from './character.js';
import { DEPTS } from '../data/departments.js';
import { COMMON_COURSES } from '../data/departments.js';

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
  repute: { [CHAR.dept]: 0 },  // 各学部声望 -100~100
  attendance: {},               // 课程出勤率（兼容旧存档）
  courseProgress: {},           // {courseName: {attended,total,regular,examScore,finalScore,grade,makeupScore,makeupDone}}
  examsDone: { midterm: false, final: false },
  riskLevel: 0, // 失控风险等级 0-100
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