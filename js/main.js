// 主入口文件
import { G, SCHEDULE } from './core/gameState.js';
import { renderAll, renderCalendar } from './ui/render.js';
import { act, setBtns, advTime, openMap, closeMap, openCal, closeCal, openSaveMo, closeSaveMo, toggleNfp, setTheme, colPanel, openMTab, closeMM, travelTo, openClubMo, closeClubMo, doJoinClub, doLeaveClub } from './ui/events.js';
import { openDialogue, closeDialogue, dlgChoose, openNpcList, closeNpcList, renderRelGraph } from './ui/dialogue.js';
import { saveGame, loadGame, deleteGame, autoSave, getSlotInfos, exportSave, importSave, loadSettings, saveSettings, SLOT_KEYS, AUTO_KEY } from './core/save.js';
import { initAchievements } from './core/achievements.js';

// ── 全局暴露：游戏核心 ──────────────────────────
globalThis.G        = G;
globalThis.SCHEDULE = SCHEDULE;

// ── 全局暴露：UI 动作 ───────────────────────────
globalThis.act        = act;
globalThis.setBtns    = setBtns;
globalThis.advTime    = advTime;
globalThis.openMap    = openMap;
globalThis.closeMap   = closeMap;
globalThis.openCal    = openCal;
globalThis.closeCal   = closeCal;
globalThis.openSaveMo = openSaveMo;
globalThis.closeSaveMo = closeSaveMo;
globalThis.toggleNfp  = toggleNfp;
globalThis.setTheme   = setTheme;
globalThis.colPanel   = colPanel;
globalThis.openMTab   = openMTab;
globalThis.closeMM    = closeMM;
globalThis.travelTo   = travelTo;
globalThis.openClubMo  = openClubMo;
globalThis.closeClubMo = closeClubMo;
globalThis.doJoinClub  = doJoinClub;
globalThis.doLeaveClub = doLeaveClub;

// ── 全局暴露：对话系统 ──────────────────────────
globalThis.openDialogue   = openDialogue;
globalThis.closeDialogue  = closeDialogue;
globalThis.dlgChoose      = dlgChoose;
globalThis.openNpcList    = openNpcList;
globalThis.closeNpcList   = closeNpcList;
globalThis.renderRelGraph = renderRelGraph;

// ── 全局暴露：存档系统 ──────────────────────────
globalThis.saveGame    = (slot) => saveGame(SLOT_KEYS[slot - 1] ?? SLOT_KEYS[0]);
globalThis.loadGame    = (slot) => loadGame(SLOT_KEYS[slot - 1] ?? SLOT_KEYS[0]);
globalThis.deleteGame  = (slot) => deleteGame(SLOT_KEYS[slot - 1] ?? SLOT_KEYS[0]);
globalThis.exportSave  = exportSave;
globalThis.importSave  = importSave;
globalThis.getSlotInfos = getSlotInfos;
globalThis.saveSettings = saveSettings;
globalThis.loadSettings = loadSettings;

// ── 存档 Modal 渲染 ─────────────────────────────

async function renderSaveMo() {
  const body = document.getElementById('save-mo-body');
  if (!body) return;

  const infos = await getSlotInfos();
  const SEMS  = ['秋季', '冬季', '春季', '夏季'];

  body.innerHTML = infos.map(info => {
    const label = info.empty
      ? '<span style="color:var(--tx3);font-size:9px;">空槽位</span>'
      : info.valid
        ? `<span style="font-size:10px;font-weight:500;">${info.charName}</span>
           <span style="font-size:8px;color:var(--tx3);margin-left:6px;">${SEMS[info.sem] ?? ''}学期 第${info.week}周</span>
           <span style="font-size:8px;color:var(--tx3);margin-left:6px;">${info.tsStr}</span>
           <span style="font-size:8px;color:var(--tx3);margin-left:4px;">${info.size}</span>`
        : '<span style="color:var(--ng);font-size:9px;">存档已损坏</span>';

    return `
      <div style="border:1px solid var(--bd);border-radius:6px;padding:9px 12px;margin-bottom:7px;
                  background:var(--bg);display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="font-size:9px;color:var(--tx3);margin-bottom:3px;">槽位 ${info.slot}</div>
          <div>${label}</div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;">
          <button class="abtn pri" style="font-size:9px;padding:4px 8px;"
            onclick="doSaveToSlot(${info.slot})">存档</button>
          ${!info.empty ? `
          <button class="abtn" style="font-size:9px;padding:4px 8px;"
            onclick="doLoadFromSlot(${info.slot})">读取</button>
          <button class="abtn" style="font-size:9px;padding:4px 8px;"
            onclick="doExportSlot(${info.slot})">导出</button>
          <button class="abtn dng" style="font-size:9px;padding:4px 8px;"
            onclick="doDeleteSlot(${info.slot})">删除</button>
          ` : ''}
        </div>
      </div>`;
  }).join('') + `
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bd);
                display:flex;gap:8px;align-items:center;">
      <button class="abtn" style="font-size:9px;" onclick="doImportSave()">从文件导入存档</button>
      <input type="file" id="import-file-input" accept=".isv" style="display:none"
        onchange="doImportFileSelected(this)">
      <span style="font-size:8px;color:var(--tx3);">支持 .isv 格式存档文件</span>
    </div>`;
}

// 存档 Modal 操作函数（供 HTML onclick 调用）
globalThis.renderSaveMo = renderSaveMo;

globalThis.doSaveToSlot = async (slot) => {
  const r = await saveGame(SLOT_KEYS[slot - 1]);
  _saveFeedback(r.msg);
  renderSaveMo();
};

globalThis.doLoadFromSlot = async (slot) => {
  const r = await loadGame(SLOT_KEYS[slot - 1]);
  if (r.ok) { renderAll(); renderCalendar(); setBtns('class'); }
  _saveFeedback(r.msg);
  closeSaveMo(null, true);
};

globalThis.doDeleteSlot = async (slot) => {
  if (!confirm(`确定要删除槽位 ${slot} 的存档吗？此操作不可撤销。`)) return;
  await deleteGame(SLOT_KEYS[slot - 1]);
  renderSaveMo();
};

globalThis.doExportSlot = async (slot) => {
  const r = await exportSave(SLOT_KEYS[slot - 1]);
  _saveFeedback(r.msg);
};

globalThis.doImportSave = () => {
  document.getElementById('import-file-input')?.click();
};

globalThis.doImportFileSelected = async (input) => {
  const file = input.files?.[0];
  if (!file) return;
  // 让用户选择写入哪个槽（默认槽1）
  const slot = Number(prompt('导入到哪个槽位？（1 / 2 / 3）', '1')) || 1;
  const r    = await importSave(file, SLOT_KEYS[slot - 1] ?? SLOT_KEYS[0]);
  _saveFeedback(r.msg);
  renderSaveMo();
  input.value = '';
};

function _saveFeedback(msg) {
  // 复用事件区域推送简短提示
  const area = document.getElementById('narrative');
  if (!area) return;
  const evc = document.createElement('div');
  evc.className = 'evc';
  evc.innerHTML = `
    <svg viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" stroke="#C9A84C" stroke-width=".9"/>
      <path d="M10 13l2 2 4-4" stroke="#C9A84C" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div><div class="et">存档</div><div class="ed">${msg}</div></div>`;
  area.appendChild(evc);
  area.scrollTop = area.scrollHeight;
}

// ── 应用设置 ────────────────────────────────────

function applySettings(settings) {
  // 主题
  if (settings.theme) {
    document.body.setAttribute('data-theme', settings.theme);
    document.querySelectorAll('.tbtn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === settings.theme);
    });
  }
  // 文字速度（供叙述系统读取）
  globalThis._textSpeed = settings.textSpeed ?? 'normal';
}

// ── 初始化 ──────────────────────────────────────

async function init() {
  // 1. 应用存储的设置
  const settings = loadSettings();
  applySettings(settings);

  // 2. 尝试载入自动存档（静默，失败则使用初始状态）
  const autoResult = await loadGame(AUTO_KEY);
  if (!autoResult.ok) {
    // 没有存档或损坏：初始化成就系统快照
    initAchievements();
  }

  // 3. 渲染
  renderAll();
  renderCalendar();
  setBtns('class');

  // 4. 存档 Modal 打开时自动刷新
  const saveMo = document.getElementById('save-mo');
  if (saveMo) {
    const observer = new MutationObserver(() => {
      if (saveMo.classList.contains('open')) renderSaveMo();
    });
    observer.observe(saveMo, { attributes: true, attributeFilter: ['class'] });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
