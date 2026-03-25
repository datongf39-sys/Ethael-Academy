/**
 * risk.js — 失控风险系统 v1.1
 * 对应设计文档 S1.4
 *
 * 失控判定公式：
 *   runawayChance = max(0, 基础失控率 + 难度修正 - 智力修正 - 种族修正)
 */

import { CHAR } from './character.js';

// ─────────────────────────────────────────────
// S1.4  失控概率各项修正常量
// ─────────────────────────────────────────────

/** 基础失控率（按魔法阶级） */
export const BASE_RUNAWAY = {
  basic:    0.05,  // 初阶
  medium:   0.10,  // 中阶
  advanced: 0.18,  // 高阶
  extreme:  0.25,  // 极高阶
};

/** 难度附加修正 */
const DIFFICULTY_MOD = {
  cross_affinity: 0.05,  // 跨亲和施法 +5%
  repel:          0.10,  // 排斥系施法 +10%
};

// ─────────────────────────────────────────────
// S1.4  失控概率计算
// ─────────────────────────────────────────────

/**
 * 计算一次施法的失控概率。
 *
 * @param {object} params
 * @param {string}  params.spellLevel      - 魔法阶级键：'basic'|'medium'|'advanced'|'extreme'
 * @param {boolean} params.isCrossAffinity - 是否跨亲和施法
 * @param {boolean} params.isRepel         - 是否排斥系施法
 * @param {string}  params.magicType       - 魔法系键（矮人仅铸刻系生效）
 * @param {number}  params.intStat         - 当前智力属性值
 * @param {string}  params.raceKey         - 种族键
 * @param {number}  params.semestersPassed - 已过学期数（龙裔用）
 * @returns {number} 最终失控概率（>=0）
 */
export function calcRunawayChance(params) {
  const {
    spellLevel      = 'basic',
    isCrossAffinity = false,
    isRepel         = false,
    magicType       = '',
    intStat         = 10,
    raceKey         = 'human',
    semestersPassed = 0,
  } = params;

  // 1. 基础失控率
  let chance = BASE_RUNAWAY[spellLevel] ?? BASE_RUNAWAY.basic;

  // 2. 难度修正
  if (isCrossAffinity) chance += DIFFICULTY_MOD.cross_affinity;
  if (isRepel)         chance += DIFFICULTY_MOD.repel;

  // 3. 智力修正：每点超过12降低1%
  const intBonus = Math.max(0, intStat - 12) * 0.01;
  chance -= intBonus;

  // 4. 种族修正
  chance -= getRaceRunawayMod(raceKey, magicType, semestersPassed);

  return Math.max(0, chance);
}

/**
 * 获取种族失控修正值（正值=降低失控概率）。
 * 龙裔返回负值（增加失控概率）。
 */
function getRaceRunawayMod(raceKey, magicType, semestersPassed) {
  switch (raceKey) {
    case 'elf':
      return 0.15;
    case 'dwarf':
      return magicType === 'rune' ? 0.20 : 0;
    case 'dragonborn': {
      // +10% 逐学期 -2%，返回负值使 chance 增加
      const extra = Math.max(0, 0.10 - semestersPassed * 0.02);
      return -extra;
    }
    default:
      return 0;
  }
}

// ─────────────────────────────────────────────
// 原有风险系统（升级）
// ─────────────────────────────────────────────

export function checkRisk(G) {
  if (G.mp <= 0) {
    G.riskLevel = Math.min((G.riskLevel ?? 0) + 20, 100);
  }
  if ((G.riskLevel ?? 0) >= 70) {
    triggerRisk(G);
  }
}

export function triggerRisk(G) {
  const runawayChance = calcRunawayChance({
    spellLevel:      G.lastSpellLevel    ?? 'basic',
    isCrossAffinity: G.lastCrossAffinity ?? false,
    isRepel:         G.lastIsRepel       ?? false,
    magicType:       G.lastMagicType     ?? '',
    intStat:         G.stats?.int        ?? 10,
    raceKey:         CHAR.race,
    semestersPassed: G.semestersPassed   ?? 0,
  });

  if (Math.random() < runawayChance) {
    pushEvt('失控！', `魔法失去控制，造成了意外效果。（失控率 ${Math.round(runawayChance * 100)}%）`);
    const hpLoss = Math.floor(Math.random() * 15) + 5;
    const spLoss = Math.floor(Math.random() * 10) + 3;
    G.hp = Math.max(1, G.hp - hpLoss);
    G.sp = Math.max(0, G.sp - spLoss);
  } else {
    pushEvt('抵抗成功', `成功控制住了魔法，避免失控。（失控率 ${Math.round(runawayChance * 100)}%）`);
  }

  G.riskLevel = 0;
}

export function highIntensityCast(mpCost, G) {
  if (mpCost > 20) {
    G.riskLevel = Math.min((G.riskLevel ?? 0) + 15, 100);
    checkRisk(G);
  }
}

/**
 * 施法前调用，将本次施法参数写入 G 供 triggerRisk 读取。
 */
export function setSpellContext(G, spellCtx) {
  G.lastSpellLevel    = spellCtx.spellLevel      ?? 'basic';
  G.lastCrossAffinity = spellCtx.isCrossAffinity ?? false;
  G.lastIsRepel       = spellCtx.isRepel         ?? false;
  G.lastMagicType     = spellCtx.magicType       ?? '';
}

function pushEvt(title, desc) {
  const area = document.getElementById('narrative');
  if (!area) return;
  const evc = document.createElement('div');
  evc.className = 'evc';
  evc.innerHTML = `
    <svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="10" stroke="#C9A84C" stroke-width=".9"/><path d="M13 7v6l3.5 2" stroke="#C9A84C" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><div class="et">${title}</div><div class="ed">${desc}</div></div>
  `;
  area.appendChild(evc);
  area.scrollTop = area.scrollHeight;
}
