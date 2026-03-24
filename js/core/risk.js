// 风险系统
import { CHAR } from './character.js';

// 检查失控风险
export function checkRisk(G) {
  // MP耗尽时增加风险
  if (G.mp <= 0) {
    G.riskLevel += 20;
    G.riskLevel = Math.min(G.riskLevel, 100);
  }
  
  // 高强度施法（MP消耗大于20）时增加风险
  // 这个逻辑会在具体的施法动作中调用
  
  // 检查是否触发失控
  if (G.riskLevel >= 70) {
    triggerRisk(G);
  }
}

// 触发失控
export function triggerRisk(G) {
  // 计算失控概率
  let baseChance = 0.3; // 基础30%概率
  
  // 种族天赋影响
  baseChance = applyRaceRiskModifier(baseChance);
  
  // 进行判定
  if (Math.random() < baseChance) {
    // 触发失控
    pushEvt('失控！', '你的魔法失去了控制，造成了意外的效果。');
    // 失控效果：随机减少HP和SP
    const hpLoss = Math.floor(Math.random() * 15) + 5;
    const spLoss = Math.floor(Math.random() * 10) + 3;
    G.hp = Math.max(1, G.hp - hpLoss);
    G.sp = Math.max(0, G.sp - spLoss);
  } else {
    // 成功抵抗失控
    pushEvt('抵抗成功', '你成功控制住了自己的魔法，避免了失控。');
  }
  
  // 重置风险等级
  G.riskLevel = 0;
}

// 应用种族风险修正
export function applyRaceRiskModifier(chance) {
  // 根据种族天赋调整失控概率
  switch(CHAR.race) {
    case 'dwarf':
      return chance * 0.5; // 矮人抗扰乱减半
    case 'orc':
      return chance * 0.6; // 兽人体魄强，降低失控概率
    case 'dragonborn':
      return chance * 0.7; // 龙裔魔力控制能力强
    default:
      return chance;
  }
}

// 高强度施法时调用
export function highIntensityCast(mpCost, G) {
  if (mpCost > 20) {
    G.riskLevel += 15;
    G.riskLevel = Math.min(G.riskLevel, 100);
    checkRisk(G);
  }
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