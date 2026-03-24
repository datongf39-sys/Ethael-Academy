// 主入口文件
import { G, SCHEDULE } from './core/gameState.js';
import { renderAll, renderCalendar } from './ui/render.js';
import { act, setBtns, advTime, openMap, closeMap, openCal, closeCal, openSaveMo, closeSaveMo, toggleNfp, setTheme, colPanel, openMTab, closeMM, travelTo } from './ui/events.js';

// 全局变量
globalThis.G = G;
globalThis.SCHEDULE = SCHEDULE;
globalThis.act = act;
globalThis.setBtns = setBtns;
globalThis.advTime = advTime;
globalThis.openMap = openMap;
globalThis.closeMap = closeMap;
globalThis.openCal = openCal;
globalThis.closeCal = closeCal;
globalThis.openSaveMo = openSaveMo;
globalThis.closeSaveMo = closeSaveMo;
globalThis.toggleNfp = toggleNfp;
globalThis.setTheme = setTheme;
globalThis.colPanel = colPanel;
globalThis.openMTab = openMTab;
globalThis.closeMM = closeMM;
globalThis.travelTo = travelTo;

// 初始化
function init() {
  renderAll();
  renderCalendar();
  setBtns('class');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}