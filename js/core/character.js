import { RACES } from '../data/races.js';
import { DEPTS } from '../data/departments.js';

// 构建角色
export function buildCharacter(cfg) {
  const raceKey = cfg.race;
  const race = RACES[raceKey];
  const dept = DEPTS[cfg.dept];

  // 计算基础能力值（10为人类基准）
  let stats;
  if (raceKey === 'halfblood' && cfg.parents) {
    stats = race.calcStats(cfg.parents[0], cfg.parents[1]);
    // 加上基准10
    for (const k of Object.keys(stats)) stats[k] += 10;
  } else {
    stats = {};
    for (const [k, v] of Object.entries(race.stat)) stats[k] = 10 + v;
  }

  // HP/MP/SP 最大值（基础 + 体魄/法力调整）
  const hpMax = race.hpBase + Math.floor((stats.phy - 10) * 2);
  const mpMax = race.mpBase + Math.floor((stats.mag - 10) * 2);
  const spMax = race.spBase + Math.floor((stats.phy - 10) * 1);

  return {
    name:     cfg.name,
    race:     raceKey,
    raceName: raceKey === 'halfblood' && cfg.parents
              ? `混血裔（${RACES[cfg.parents[0]].name}×${RACES[cfg.parents[1]].name}）`
              : race.name,
    dept:     cfg.dept,
    deptName: dept.name,
    deptShort:dept.short,
    parents:  cfg.parents || null,
    stats,
    skipChance: race.skipChance,
    passive:  race.passive,
    hpMax, mpMax, spMax,
    hp: hpMax, mp: mpMax, sp: spMax,
  };
}

// 默认测试角色：苏晚，混血裔（精灵×人类），幻澜学部
export const CHAR = buildCharacter({
  name: '苏晚',
  race: 'halfblood',
  parents: ['elf', 'human'],
  dept: 'mentis',
});