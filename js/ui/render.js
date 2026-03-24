// UI渲染逻辑
import { G, PERIODS, DAYS, SEMS, SHORTDAY, SCHEDULE } from '../core/gameState.js';
import { CHAR } from '../core/character.js';
import { LOCATIONS } from '../data/locations.js';

// 设置文本
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// 设置进度条
function setBar(type, current, max) {
  const vEl = document.getElementById(type + '-v');
  const fEl = document.getElementById(type + '-f');
  if (vEl) vEl.textContent = `${current}/${max}`;
  if (fEl) fEl.style.width = `${(current / max) * 100}%`;
}

// 渲染统计信息
export function renderStats() {
  // 顶部栏角色信息
  setText('tb-cname', CHAR.name);
  setText('tb-csub', `${CHAR.raceName} · ${CHAR.deptName}`);
  setText('mob-char-title', `${CHAR.name} · ${CHAR.raceName} · ${CHAR.deptName}`);

  // 右侧面板能力值
  const statMap = {int:'智力',mag:'法力',phy:'体魄',cha:'魅力',sen:'感知'};
  const ag = document.getElementById('stat-grid');
  if (ag) {
    ag.innerHTML = Object.entries(statMap).map(([k,label]) => {
      const base = 10;
      const v = G.stats[k];
      const cls = v > base ? 'up' : v < base ? 'dn' : '';
      return `<div class="ac"><div class="an">${label}</div><div class="av ${cls}">${v}</div></div>`;
    }).join('') + `<div class="ac"><div class="an">种族</div><div class="an" style="font-size:9px;margin:0;">${CHAR.raceName.replace('混血裔（','').replace('）','')}</div></div>`;
  }

  // 声望
  const rep = G.repute[CHAR.dept] || 0;
  const repDots = '●'.repeat(Math.max(0,Math.round((rep+100)/40))) + '○'.repeat(5-Math.max(0,Math.round((rep+100)/40)));
  setText('hs-rep', repDots.slice(0,5));
  setText('hs-rep-label', CHAR.deptShort + '声望');
}

// 渲染侧边栏课程表
export function renderScheduleSidebar() {
  const el = document.getElementById('sched-list');
  if (!el) return;
  const pnames = PERIODS;
  el.innerHTML = pnames.map((pn, pi) => {
    const c = SCHEDULE[G.day][pi];
    let cls = '';
    if (pi < G.period) cls = 'done';
    else if (pi === G.period) cls = 'curr';
    else if (pi === G.period + 1) cls = 'up';
    return `<div class="si ${cls}">
      <div class="si-bar"></div>
      <div class="si-bd">
        <div class="si-t">${pn}${pi === G.period ? ' · 进行中' : ''}</div>
        <div class="si-n">${c ? c.name : (pi === 4 ? '就寝' : '自由时间')}</div>
        ${c ? `<div class="si-d">${CHAR.deptShort} · ${c.type}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// 渲染日历
export function renderCalendar() {
  const hdr = document.getElementById('cal-hdr');
  const body = document.getElementById('cal-body');
  if (!hdr || !body) return;

  const dayNames = ['周一','周二','周三','周四','周五'];
  hdr.innerHTML = '<div></div>' + dayNames.map((d,i) =>
    `<div class="cal-dh">${d}${i===G.day?' ●':''}</div>`
  ).join('');

  body.innerHTML = PERIODS.map((pn, pi) =>
    `<div class="cal-r">
      <div class="cal-tl">${pn}</div>
      ${Array.from({length:5},(_,di)=>{
        const c = SCHEDULE[di][pi];
        let cls = 'cal-c';
        if (c) cls += ' has';
        else cls += (pi===4 ? ' free' : ' free');
        if (di===G.day && pi===G.period) cls += ' now';
        return `<div class="${cls}">${c
          ? `<div class="cn">${c.name}${di===G.day&&pi===G.period?' ▶':''}</div><div class="cd">${c.type}</div>`
          : `<span style="font-size:8px;color:var(--tx3)">${pi===4?'就寝':'自由'}</span>`
        }</div>`;
      }).join('')}
    </div>`
  ).join('');

  // 更新日历标题
  const t = document.getElementById('cal-title');
  const s = document.getElementById('cal-sub');
  if (t) t.textContent = `课程表 · ${SEMS[G.sem]} 第${G.week}周`;
  if (s) s.textContent = `第${G.week}周 / 共16周 · ${DAYS[G.day]} · ${PERIODS[G.period]}（当前）`;
}

// 渲染地图模态框
export function renderMapModal() {
  const el = document.getElementById('map-content');
  if (!el) return;

  const groups = [
    { label:'公共区域', keys:['via','forum','horti','campus','ambul','thermae','biblio','atrium'] },
    { label:'曦光学部', keys:['lucis_h','lucis_d'] },
    { label:'暮影学部', keys:['umbrae_h','umbrae_d'] },
    { label:'翠灵学部', keys:['silvae_h','silvae_d'] },
    { label:'炉铸学部', keys:['fornacis_h'] },
    { label:'幻澜学部', keys:['mentis_h','mentis_d'] },
    { label:'战阵学部', keys:['belli_h'] },
    { label:'渊潮学部', keys:['abyssi_h'] },
    { label:'星脉学部', keys:['stellae_h'] },
  ];

  el.innerHTML = groups.map(grp => `
    <div class="psl" style="margin-top:10px;">${grp.label}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:4px;">
      ${grp.keys.map(k => {
        const loc = LOCATIONS[k];
        const isCurr = G.locKey === k;
        return `<button onclick="travelTo('${k}')" style="
          padding:7px 9px;border-radius:5px;text-align:left;cursor:pointer;
          border:1px solid ${isCurr ? 'var(--gold)' : 'var(--bd)'};
          background:${isCurr ? 'var(--ac)' : 'var(--bg)'};
          transition:all .18s;
        ">
          <div style="font-size:10px;font-weight:500;color:${isCurr?'var(--gold)':'var(--tx)'};">${loc.name}${isCurr?' ●':''}</div>
          <div style="font-size:8px;color:var(--tx3);margin-top:1px;">${loc.desc}</div>
        </button>`;
      }).join('')}
    </div>
  `).join('');
}

// 渲染课程部分
export function renderCourseSection() {
  const el = document.getElementById('rp-course-list');
  if (!el) return;
  
  // 这里可以添加课程成绩的渲染逻辑
  el.innerHTML = '<div style="font-size:9px;color:var(--tx3);padding:2px 0;">尚未开始课程</div>';
}

// 渲染所有内容
export function renderAll() {
  const ds = `${SEMS[G.sem]} · 第${G.week}周 · ${DAYS[G.day]}`;
  const ps = PERIODS[G.period];
  setText('tb-date', ds);
  setText('tb-pname', ps);
  setText('tb-ptag', ps);
  setText('mtb-date', `${SEMS[G.sem].slice(0,2)}·第${G.week}周·周${SHORTDAY[G.day]}`);
  setText('mtb-per', ps);
  setText('bt', `${ps} · ${SEMS[G.sem]} 第${G.week}周 ${DAYS[G.day]}`);
  setText('bs', schedDesc());
  setText('tb-gold', G.gold);
  setText('tb-crystal', G.crystal);
  setText('mob-gold', G.gold);
  setBar('hp', G.hp, G.hpMax);
  setBar('mp', G.mp, G.mpMax);
  setBar('sp', G.sp, G.spMax);
  setText('hs-viol', `${G.viol} 次`);
  const vEl = document.getElementById('hs-viol');
  if (vEl) vEl.style.color = G.viol > 0 ? 'var(--ng)' : 'var(--ok)';
  
  // 失控风险显示
  const riskEl = document.querySelector('.hs:nth-child(3) .hs-v');
  if (riskEl) {
    let riskText, riskColor;
    if (G.riskLevel < 30) {
      riskText = '低';
      riskColor = 'var(--ok)';
    } else if (G.riskLevel < 70) {
      riskText = '中';
      riskColor = 'var(--gold)';
    } else {
      riskText = '高';
      riskColor = 'var(--ng)';
    }
    riskEl.textContent = riskText;
    riskEl.style.color = riskColor;
  }
  
  const pips = document.querySelectorAll('#tb-pips .pip');
  pips.forEach((p,i)=>{ p.className='pip '+(i<G.period?'done':i===G.period?'curr':'fut'); });
  renderStats();
  renderScheduleSidebar();
  // 地点显示
  const lel = document.getElementById('lp-loc'); if (lel) lel.textContent = G.loc;
  const lsub = document.getElementById('lp-loc-sub');
  if (lsub) lsub.textContent = LOCATIONS[G.locKey] ? LOCATIONS[G.locKey].sub : '';
  renderCourseSection();
}

// 获取当前日程描述
function schedDesc() {
  const c = SCHEDULE[G.day][G.period];
  if (c) return `课程：${c.name}（${c.type}）`;
  if (G.period === 4) return '就寝时间';
  return '自由时间';
}