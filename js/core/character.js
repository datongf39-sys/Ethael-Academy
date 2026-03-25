import { RACES } from '../data/races.js';
import { DEPTS } from '../data/departments.js';
import {
  buildAffinityConfig,
  validateElectiveAffinities,
  getElectiveCandidates,
  getElectiveSlotCount,
} from './affinity.js';

// ─────────────────────────────────────────────
// buildCharacter
// ─────────────────────────────────────────────

/**
 * 构建角色对象。
 *
 * cfg 字段：
 *   name              {string}         角色名
 *   race              {string}         种族键
 *   parents           {string[]|null}  混血裔双亲，如 ['elf','human']
 *   dept              {string}         学部键
 *   electiveAffinities {string[]}      玩家自选亲和魔法系键（已通过 UI 校验）
 *                                      人类最多2项，混血裔传 []，其他最多1项
 */
export function buildCharacter(cfg) {
  const raceKey = cfg.race;
  const race    = RACES[raceKey];
  const dept    = DEPTS[cfg.dept];

  // ── 基础能力值 ──
  let stats;
  if (raceKey === 'halfblood' && cfg.parents) {
    stats = race.calcStats(cfg.parents[0], cfg.parents[1]);
    for (const k of Object.keys(stats)) stats[k] += 10;
  } else {
    stats = {};
    for (const [k, v] of Object.entries(race.stat)) stats[k] = 10 + v;
  }

  // ── HP / MP / SP 上限 ──
  const hpMax = race.hpBase + Math.floor((stats.phy - 10) * 2);
  const mpMax = race.mpBase + Math.floor((stats.mag - 10) * 2);
  const spMax = race.spBase + Math.floor((stats.phy - 10) * 1);

  // ── 魔法亲和配置（S2.1）──
  // 校验自选项；若外部已做过 UI 校验可省略，但保留作为最后防线
  const electiveChoices = cfg.electiveAffinities ?? [];
  const deptMagicTypes  = dept.magicTypes ?? [];         // 学部支持的魔法大类
  const validation = validateElectiveAffinities(
    raceKey, cfg.parents ?? null, deptMagicTypes, electiveChoices
  );
  if (!validation.valid) {
    // 校验失败时截断至合法范围，避免硬崩
    const candidates = getElectiveCandidates(raceKey, deptMagicTypes);
    const slotCount  = getElectiveSlotCount(raceKey);
    const safeChoices = electiveChoices
      .filter(c => candidates.includes(c))
      .slice(0, slotCount);
    console.warn('[buildCharacter] 自选亲和校验失败，已自动修正：', validation.errors);
    cfg = { ...cfg, electiveAffinities: safeChoices };
  }

  const affinityConfig = buildAffinityConfig(
    raceKey,
    cfg.parents ?? null,
    cfg.electiveAffinities ?? []
  );

  return {
    name:      cfg.name,
    race:      raceKey,
    raceName:  raceKey === 'halfblood' && cfg.parents
               ? `混血裔（${RACES[cfg.parents[0]].name}×${RACES[cfg.parents[1]].name}）`
               : race.name,
    dept:      cfg.dept,
    deptName:  dept.name,
    deptShort: dept.short,
    parents:   cfg.parents ?? null,
    stats,
    skipChance:    race.skipChance,
    passive:       race.passive,
    hpMax, mpMax, spMax,
    hp: hpMax, mp: mpMax, sp: spMax,
    // ── 新增：亲和配置 ──
    // affinityConfig.innate   → 固有亲和（只读，由种族决定）
    // affinityConfig.elective → 玩家自选亲和
    affinityConfig,
  };
}

// ─────────────────────────────────────────────
// 默认测试角色
// ─────────────────────────────────────────────

/**
 * 苏晚，混血裔（精灵×人类），幻澜学部。
 * 混血裔无自选亲和名额，electiveAffinities 传空数组。
 */
export const CHAR = buildCharacter({
  name:               '苏晚',
  race:               'halfblood',
  parents:            ['elf', 'human'],
  dept:               'mentis',
  electiveAffinities: [],
});
