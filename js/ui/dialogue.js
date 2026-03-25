// 对话系统 UI
// 对应策划书 §6.2 对话系统
// 文字选项形式，每次2~4选项
// 部分选项需属性门槛（stat.key >= stat.min）
// 对话后可能触发好感事件
// 特殊对话需好感等级+时间/地点前置条件（由 relationship.js pickEntryNode 处理）

import { G } from '../core/gameState.js';
import { NPCS, getNpcsAt } from '../data/npcs.js';
import { getRel, changeRel, getRelLevel, pickEntryNode, relLabel, RELATION_LEVELS } from '../core/relationship.js';

// ── 状态 ─────────────────────────────────────────────────────
let _activeNpc  = null;   // 当前对话NPC对象
let _activeNode = null;   // 当前对话节点key
let _pendingRel = 0;      // 本轮累计好感度变化（用于结算显示）

// ── 模态框挂载 ───────────────────────────────────────────────

function ensureModal() {
  if (document.getElementById('dlg-mo')) return;
  const mo = document.createElement('div');
  mo.id = 'dlg-mo';
  mo.className = 'mo dlg-mo';
  mo.innerHTML = `
    <div class="mb dlg-mb" id="dlg-mb">
      <button class="mc-btn" id="dlg-close-btn">✕</button>
      <div class="dlg-npc-hdr" id="dlg-npc-hdr"></div>
      <div class="dlg-speech" id="dlg-speech"></div>
      <div class="dlg-opts"  id="dlg-opts"></div>
      <div class="dlg-rel-toast" id="dlg-rel-toast"></div>
    </div>`;
  document.body.appendChild(mo);
  document.getElementById('dlg-close-btn').addEventListener('click', closeDialogue);
  // 点击遮罩关闭
  mo.addEventListener('click', e => { if (e.target === mo) closeDialogue(); });
}

function ensureNpcListModal() {
  if (document.getElementById('npclist-mo')) return;
  const mo = document.createElement('div');
  mo.id = 'npclist-mo';
  mo.className = 'mo';
  mo.innerHTML = `
    <div class="mb" style="max-width:420px;">
      <button class="mc-btn" id="npclist-close-btn">✕</button>
      <div class="mt-m">附近的人</div>
      <div class="ms-m" id="npclist-sub"></div>
      <div id="npclist-body" style="max-height:55vh;overflow-y:auto;padding-right:4px;"></div>
    </div>`;
  document.body.appendChild(mo);
  document.getElementById('npclist-close-btn').addEventListener('click', closeNpcList);
  mo.addEventListener('click', e => { if (e.target === mo) closeNpcList(); });
}

// ── NPC列表面板 ──────────────────────────────────────────────

/** 打开"附近的人"列表 */
export function openNpcList() {
  ensureNpcListModal();
  const npcs = getNpcsAt(G.locKey, G.period);
  const sub  = document.getElementById('npclist-sub');
  const body = document.getElementById('npclist-body');
  if (sub) sub.textContent = `${G.loc} · 共 ${npcs.length} 人`;

  if (!npcs.length) {
    body.innerHTML = `<div style="font-size:11px;color:var(--tx3);padding:18px 0;text-align:center;">这里目前没有人。</div>`;
  } else {
    body.innerHTML = npcs.map(npc => {
      const score = getRel(npc.id, G);
      const lv    = getRelLevel(score);
      const canTalk = lv.key !== 'enemy'; // 敌对时不可主动接近
      return `
        <div class="npc-card ${canTalk ? '' : 'npc-card--hostile'}">
          <div class="npc-card-avatar">${npc.gender === 'F' ? '♀' : '♂'}</div>
          <div class="npc-card-info">
            <div class="npc-card-name">${npc.name} <span class="npc-card-title">${npc.title}</span></div>
            <div class="npc-card-intro">${npc.intro}</div>
            <div class="npc-card-rel" style="color:${lv.color};">${lv.icon} ${lv.label}（${score > 0 ? '+' : ''}${score}）</div>
          </div>
          ${canTalk
            ? `<button class="npc-card-btn" onclick="openDialogue('${npc.id}')">对话</button>`
            : `<span class="npc-card-block">回避</span>`}
        </div>`;
    }).join('');
  }

  document.getElementById('npclist-mo').classList.add('open');
}

export function closeNpcList() {
  const mo = document.getElementById('npclist-mo');
  if (mo) mo.classList.remove('open');
}

// ── 对话系统核心 ─────────────────────────────────────────────

/** 打开与指定NPC的对话 */
export function openDialogue(npcId) {
  const npc = NPCS[npcId];
  if (!npc) return;
  closeNpcList();
  ensureModal();

  _activeNpc  = npc;
  _pendingRel = 0;

  const entry = pickEntryNode(npc, G);
  if (entry === null) {
    // 敌对且无hostile_default：NPC拒绝对话
    _showRefused();
    return;
  }

  _activeNode = entry;
  _renderNode(entry);
  document.getElementById('dlg-mo').classList.add('open');
}

/** 关闭对话模态框 */
export function closeDialogue() {
  const mo = document.getElementById('dlg-mo');
  if (mo) mo.classList.remove('open');
  _activeNpc  = null;
  _activeNode = null;
  _pendingRel = 0;
}

// ── 内部渲染 ─────────────────────────────────────────────────

function _renderNode(nodeKey) {
  if (!_activeNpc) return;
  const npc  = _activeNpc;
  const node = npc.dialogues[nodeKey];
  if (!node) { closeDialogue(); return; }

  // 若节点有 relBonus，先累加（叙事奖励，不来自玩家选择）
  if (node.relBonus) {
    changeRel(npc.id, node.relBonus, G);
    _pendingRel += node.relBonus;
  }

  _renderHeader(npc);
  _renderSpeech(node);
  _renderOptions(npc, node);
}

function _renderHeader(npc) {
  const el    = document.getElementById('dlg-npc-hdr');
  const score = getRel(npc.id, G);
  const lv    = getRelLevel(score);
  el.innerHTML = `
    <div class="dlg-npc-name">${npc.name} <span class="dlg-npc-title">${npc.title}</span></div>
    <div class="dlg-rel-badge" style="--rel-color:${lv.color};">
      <span>${lv.icon}</span>
      <span>${lv.label}</span>
      <span class="dlg-rel-score">${score > 0 ? '+' : ''}${score}</span>
    </div>`;
}

function _renderSpeech(node) {
  const el = document.getElementById('dlg-speech');
  el.innerHTML = `
    <div class="dlg-speaker">${node.speaker}</div>
    <div class="dlg-text">${node.text}</div>`;
}

function _renderOptions(npc, node) {
  const el = document.getElementById('dlg-opts');
  el.innerHTML = node.options.map((opt, i) => {
    const locked   = opt.stat && (G.stats[opt.stat.key] ?? 0) < opt.stat.min;
    const lockTip  = locked ? `（需要${_statLabel(opt.stat.key)} ≥ ${opt.stat.min}，当前 ${G.stats[opt.stat.key] ?? 0}）` : '';
    const deltaStr = opt.relDelta > 0 ? `<span class="opt-rel pos">▲${opt.relDelta}</span>`
                   : opt.relDelta < 0 ? `<span class="opt-rel neg">▼${Math.abs(opt.relDelta)}</span>` : '';
    return `
      <button class="dlg-opt ${locked ? 'dlg-opt--locked' : ''}"
              ${locked ? 'disabled title="属性不足"' : `onclick="dlgChoose(${i})"`}>
        <span class="opt-idx">${i + 1}</span>
        <span class="opt-text">${opt.text}${lockTip ? `<span class="opt-lock-tip">${lockTip}</span>` : ''}</span>
        ${deltaStr}
      </button>`;
  }).join('');
}

/** 玩家选择选项（全局暴露给 onclick） */
export function dlgChoose(optIndex) {
  if (!_activeNpc || !_activeNode) return;
  const node = _activeNpc.dialogues[_activeNode];
  if (!node) return;
  const opt = node.options[optIndex];
  if (!opt) return;

  // 属性门槛二次校验
  if (opt.stat && (G.stats[opt.stat.key] ?? 0) < opt.stat.min) return;

  // 修改好感度
  if (opt.relDelta !== 0) {
    changeRel(_activeNpc.id, opt.relDelta, G);
    _pendingRel += opt.relDelta;
  }

  // 显示好感度浮动提示
  _showRelToast(_pendingRel);

  if (opt.next === null) {
    // 对话结束
    _showEnding();
  } else {
    _activeNode = opt.next;
    _renderNode(opt.next);
  }
}

function _showEnding() {
  const npc   = _activeNpc;
  const score = getRel(npc.id, G);
  const lv    = getRelLevel(score);
  const change = _pendingRel;

  const speech = document.getElementById('dlg-speech');
  const opts   = document.getElementById('dlg-opts');

  speech.innerHTML = `
    <div class="dlg-speaker">${npc.name}</div>
    <div class="dlg-text dlg-ending-text">对话结束。</div>`;

  opts.innerHTML = `
    <div class="dlg-summary">
      <div class="dlg-summary-row">
        <span class="dlg-summary-label">好感度</span>
        <span class="dlg-summary-val" style="color:${lv.color};">${lv.icon} ${lv.label}（${score > 0 ? '+' : ''}${score}）</span>
      </div>
      ${change !== 0 ? `
      <div class="dlg-summary-row">
        <span class="dlg-summary-label">本次变化</span>
        <span class="dlg-summary-val" style="color:${change > 0 ? 'var(--ok)' : 'var(--ng)'};">${change > 0 ? '+' : ''}${change}</span>
      </div>` : ''}
    </div>
    <button class="dlg-opt dlg-opt--end" onclick="closeDialogue()">
      <span class="opt-idx">✓</span>
      <span class="opt-text">离开</span>
    </button>`;

  // 更新表头（可能等级已变化）
  _renderHeader(npc);
}

function _showRefused() {
  ensureModal();
  const npc = _activeNpc;
  const speech = document.getElementById('dlg-speech');
  const opts   = document.getElementById('dlg-opts');
  const hdr    = document.getElementById('dlg-npc-hdr');
  const score  = getRel(npc.id, G);
  const lv     = getRelLevel(score);

  if (hdr) hdr.innerHTML = `
    <div class="dlg-npc-name">${npc.name} <span class="dlg-npc-title">${npc.title}</span></div>
    <div class="dlg-rel-badge" style="--rel-color:${lv.color};"><span>${lv.icon}</span><span>${lv.label}</span></div>`;
  if (speech) speech.innerHTML = `
    <div class="dlg-text" style="font-style:italic;color:var(--tx3);">
      ${npc.name}看了你一眼，随即转身离开，不愿搭理你。
      <br><span style="font-size:9px;">（好感度过低，NPC拒绝对话）</span>
    </div>`;
  if (opts) opts.innerHTML = `
    <button class="dlg-opt dlg-opt--end" onclick="closeDialogue()">
      <span class="opt-idx">✓</span><span class="opt-text">离开</span>
    </button>`;

  document.getElementById('dlg-mo').classList.add('open');
}

function _showRelToast(total) {
  const toast = document.getElementById('dlg-rel-toast');
  if (!toast || total === 0) return;
  toast.textContent = total > 0 ? `好感度 +${total}` : `好感度 ${total}`;
  toast.className   = `dlg-rel-toast ${total > 0 ? 'pos' : 'neg'} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── 辅助 ─────────────────────────────────────────────────────

function _statLabel(key) {
  return { int: '智力', mag: '法力', phy: '体魄', cha: '魅力', sen: '感知' }[key] || key;
}

// ── 关系图谱面板（供右侧面板调用）────────────────────────────

/** 渲染所有NPC的关系卡片，插入 targetEl */
export function renderRelGraph(targetEl) {
  if (!targetEl) return;
  const npcs = Object.values(NPCS);
  if (!npcs.length) { targetEl.innerHTML = '<div style="font-size:9px;color:var(--tx3);">尚无已认识的NPC</div>'; return; }

  targetEl.innerHTML = npcs.map(npc => {
    const score = getRel(npc.id, G);
    const lv    = getRelLevel(score);
    const pct   = ((score + 100) / 200) * 100; // 映射到0~100%
    return `
      <div class="rel-card" onclick="openDialogue('${npc.id}')" title="点击与 ${npc.name} 对话">
        <div class="rel-card-top">
          <span class="rel-card-name">${npc.name}</span>
          <span class="rel-card-lv" style="color:${lv.color};">${lv.icon} ${lv.label}</span>
        </div>
        <div class="rel-bar-bg">
          <div class="rel-bar-fill" style="width:${pct}%;background:${lv.color};"></div>
          <div class="rel-bar-mid"></div>
        </div>
        <div class="rel-card-score" style="color:${lv.color};">${score > 0 ? '+' : ''}${score}</div>
      </div>`;
  }).join('');
}
