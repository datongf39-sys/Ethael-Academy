// 经验与升级系统
import { CHAR } from './character.js';

// 添加经验值
export function addExp(type, amount, G) {
  G.exp[type] += amount;
  // 升级阈值：基础值100，每级增加20%
  const level = G.stats[type] - 10; // 基础值10
  const threshold = 100 * Math.pow(1.2, level);
  
  if (G.exp[type] >= threshold) {
    G.stats[type] += 1;
    G.exp[type] -= threshold;
    pushEvt(`${type === 'int' ? '智力' : type === 'mag' ? '法力' : type === 'phy' ? '体魄' : type === 'cha' ? '魅力' : '感知'}升级！`, `当前等级：${G.stats[type]}`);
    // 更新HP/MP/SP最大值
    updateMaxStats(G);
  }
}

// 更新最大属性值
export function updateMaxStats(G) {
  // 重新计算HP/MP/SP最大值
  const race = CHAR.race === 'halfblood' && CHAR.parents ? 
    { ...CHAR, hpBase: 95, mpBase: 88, spBase: 58 } : 
    CHAR;
  G.hpMax = race.hpBase + Math.floor((G.stats.phy - 10) * 2);
  G.mpMax = race.mpBase + Math.floor((G.stats.mag - 10) * 2);
  G.spMax = race.spBase + Math.floor((G.stats.phy - 10) * 1);
  // 确保当前值不超过最大值
  G.hp = Math.min(G.hp, G.hpMax);
  G.mp = Math.min(G.mp, G.mpMax);
  G.sp = Math.min(G.sp, G.spMax);
}

// S1换算公式
export function calculateS1(G) {
  // S1 = (智力 + 法力 + 感知) × 0.6 + (体魄 + 魅力) × 0.4
  return Math.floor((G.stats.int + G.stats.mag + G.stats.sen) * 0.6 + (G.stats.phy + G.stats.cha) * 0.4);
}

// 推送事件
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