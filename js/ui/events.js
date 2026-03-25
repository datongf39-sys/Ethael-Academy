// 事件处理逻辑
import { G, PERIODS, DAYS, SEMS } from '../core/gameState.js';
import { LOCATIONS } from '../data/locations.js';
import { addExp } from '../core/experience.js';
import { checkRisk } from '../core/risk.js';
import { renderAll, renderMapModal, renderCalendar } from './render.js';
import { openNpcList } from './dialogue.js';

// 快捷动作
function qa(id) {
  switch(id) {
    case 'map':
      openMap();
      break;
    case 'npc':
      openNpcList();
      break;
    case 'bag':
      pushNarr(['你打开背包，检查里面的物品。']);
      break;
  }
}

// 打开地图模态框
export function openMap() {
  const mo = document.getElementById('map-mo');
  if (mo) { mo.classList.add('open'); renderMapModal(); }
}

// 关闭地图模态框
export function closeMap(e, force) {
  if (force || (e && e.target.id === 'map-mo'))
    document.getElementById('map-mo').classList.remove('open');
}

// 前往地点
export function travelTo(locKey) {
  const loc = LOCATIONS[locKey];
  if (!loc) return;
  G.locKey = locKey;
  G.loc = loc.name;
  closeMap(null, true);
  addDiv();
  pushNarr([`你前往${loc.name}。${loc.desc}`]);
  renderAll();
  setBtns('free');
  // 更新侧边栏地点显示
  const lel = document.getElementById('lp-loc');
  if (lel) lel.textContent = loc.name;
  const lsub = document.getElementById('lp-loc-sub');
  if (lsub) lsub.textContent = loc.sub;
}

// 打开日历
export function openCal() {
  const mo = document.getElementById('cal-mo');
  if (mo) { mo.classList.add('open'); renderCalendar(); }
}

// 关闭日历
export function closeCal(e, force) {
  if (force || (e && e.target.id === 'cal-mo'))
    document.getElementById('cal-mo').classList.remove('open');
}

// 打开存档模态框
export function openSaveMo() {
  const mo = document.getElementById('save-mo');
  if (mo) mo.classList.add('open');
}

// 关闭存档模态框
export function closeSaveMo(e, force) {
  if (force || (e && e.target.id === 'save-mo'))
    document.getElementById('save-mo').classList.remove('open');
}

// 切换通知面板
export function toggleNfp() {
  const nfp = document.getElementById('nfp');
  if (nfp) nfp.classList.toggle('open');
}

// 切换主题
export function setTheme(theme, btn) {
  document.body.setAttribute('data-theme', theme);
  if (btn) {
    document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

// 切换面板收缩
export function colPanel(panelId, btnId, text1, text2) {
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(btnId);
  if (panel && btn) {
    panel.classList.toggle('col');
    btn.textContent = panel.classList.contains('col') ? text2 : text1;
  }
}

// 打开移动设备标签
export function openMTab(tab) {
  // 关闭所有模态框
  document.querySelectorAll('.mm').forEach(mm => mm.classList.remove('open'));
  // 打开指定模态框
  const mm = document.getElementById('mm-' + tab);
  if (mm) mm.classList.add('open');
  // 更新按钮状态
  document.querySelectorAll('.mnav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('mn-' + tab);
  if (btn) btn.classList.add('active');
}

// 关闭移动设备模态框
export function closeMM(id) {
  const mm = document.getElementById(id);
  if (mm) mm.classList.remove('open');
}

// 初始化课程进度
function initCourseProgress(courseName) {
  if (!G.courseProgress[courseName]) {
    G.courseProgress[courseName] = {
      attended: 0,
      total: 16,
      regular: 0,
      examScore: 0,
      finalScore: 0,
      grade: '',
      makeupScore: 0,
      makeupDone: false
    };
  }
}

// 行动银行
const A = {
  take_notes: {
    get n() { return [`你专心听讲，笔尖快速划过笔记本。感知值${G.stats.sen}让你精准捕捉到教授的每一个重点。`]; },
    e:['认真听讲！','智力经验 +0.3，法力经验 +0.2，出勤 +1，MP -5。'], nx:'class', mp:5,
    exec() {
      addExp('int', 0.3, G);
      addExp('mag', 0.2, G);
      const cc = todayCourse();
      if (cc) {
        initCourseProgress(cc.name);
        G.courseProgress[cc.name].attended++;
        G.courseProgress[cc.name].regular += 0.5;
      }
      G.mp -= 5;
    }
  },
  ask_question: {
    get n() {
      const c = todayCourse();
      return [`「教授，关于${c ? c.name : '这节课'}的内容我有一个疑问——」`,`教授停顿了一下，给出了详细的解答。`];
    },
    e:['主动提问！','好感度 +3，平时分 +0.5，智力 +0.1。'], nx:'class', mp:3,
    exec() {
      addExp('int', 0.1, G);
      const cc = todayCourse();
      if (cc) {
        initCourseProgress(cc.name);
        G.courseProgress[cc.name].regular += 0.5;
      }
      G.mp -= 3;
    }
  },
  chat_classmate: {
    n:['你悄悄凑近旁边的同学，低声交流了一下笔记。','教授的目光扫过来，你们同时低下头。'],
    e:['与同学互动。','好感度 +2，被注意但忽视。'], nx:'class', mp:1,
    exec() {
      addExp('cha', 0.1, G);
      G.mp -= 1;
    }
  },
  rest: {
    get n() { return [`你在${G.loc}找了处安静的地方坐下，闭目休息片刻。银叶大道的风声让人心神安定。`]; },
    e:['小憩完成。','SP +10，消耗约30分钟。'], nx:'free', sp:10,
    exec() {
      G.sp = Math.min(G.sp + 10, G.spMax);
    }
  },
  skip_class: { custom: true }
};

A.skip_class.exec = function() {
  addDiv();
  const chance = 0.15; // 基础概率
  const caught = Math.random() < chance;
  if (caught) {
    // 不同种族有不同的被发现方式
    let caught_text = '你被发现了。';
    pushNarr([`你悄悄向后门移动……`, caught_text]);
    G.viol++;
    // 被抓回座位：计入出勤但扣平时分
    const cc = todayCourse();
    if (cc) {
      initCourseProgress(cc.name);
      G.courseProgress[cc.name].attended++;
      // 不加 regular points（被抓惩罚）
    }
    pushEvt(`被发现！（基础概率${Math.round(chance*100)}%）`,`违纪记录 +1，强制返回。出勤 ${cc ? G.courseProgress[cc.name].attended+'/'+G.courseProgress[cc.name].total : '—'}`);
    renderAll();
    autoSave();
    setTimeout(() => setBtns('class'), 200);
  } else {
    pushNarr([`走廊里空无一人。你成功溜出来了——${G.loc}的风吹散了课堂的紧张感。`]);
    pushEvt('翘课成功。','上午可自由活动，出勤 -1（影响平时分）。');
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);
  }
};

// 执行动作
export function act(id) {
  const a = A[id];
  if (!a) return;
  if (a.custom) { if(a.exec) a.exec(); return; }

  addDiv();
  const narr = typeof a.n === 'function' ? a.n() : (Array.isArray(a.n) ? a.n : [a.n]);
  pushNarr(narr);
  pushEvt(a.e[0], a.e[1]);
  
  // 执行动作的逻辑
  if (a.exec) {
    a.exec();
  }
  
  // 检查失控风险
  checkRisk(G);
  
  renderAll();
  autoSave();
  setTimeout(() => setBtns(a.nx || 'class'), 200);
}

// 设置按钮
export function setBtns(type) {
  const ctx = document.getElementById('actx'), btns = document.getElementById('abtns');
  const c = todayCourse();
  if (type === 'class' && c) {
    ctx.textContent = `当前情境：${PERIODS[G.period]} · ${c.name} · 课程进行中`;
    btns.innerHTML = `
      <button class="abtn pri" onclick="act('take_notes')">认真听课做笔记<span class="hk">1</span></button>
      <button class="abtn" onclick="act('ask_question')">向教授提问<span class="hk">2</span></button>
      <button class="abtn" onclick="act('chat_classmate')">与同学低声聊天<span class="hk">3</span></button>
      <button class="abtn dng" onclick="act('skip_class')">偷偷离开教室<span class="hk">4</span></button>`;
  } else {
    ctx.textContent = `当前情境：${PERIODS[G.period]} · ${G.loc} · 自由时间`;
    btns.innerHTML = `
      <button class="abtn pri" onclick="advTime()">推进到下一时间段<span class="hk">↵</span></button>
      <button class="abtn" onclick="act('rest')">小憩 (SP+10)<span class="hk">2</span></button>
      <button class="abtn" onclick="openMap()">查看地图<span class="hk">3</span></button>
      <button class="abtn" onclick="qa('npc')">寻找附近学生<span class="hk">4</span></button>`;
  }
}

// 推进时间
export function advTime() {
  G.period++;
  if (G.period >= 5) {
    G.period = 0; G.day++;
    if (G.day >= 5) { G.day = 0; G.week++; }
    if (G.week > 16) { G.week = 1; G.sem = (G.sem+1)%4; }
    G.sp = G.spMax; G.mp = G.mpMax; G.hp = G.hpMax;
    // 回到宿舍
    G.locKey = 'mentis_d';
    G.loc = '梦蝶楼';
  }
  renderAll();
  autoSave();
  renderCalendar();
  addDiv();
  pushBanner();
  const c = todayCourse();
  setBtns(c ? 'class' : 'free');
}

// 推送横幅
function pushBanner() {
  const area = document.getElementById('narrative');
  if (!area) return;
  
  const banner = document.createElement('div');
  banner.className = 'tbanner';
  const ps = PERIODS[G.period];
  const ds = `${SEMS[G.sem]} 第${G.week}周 ${DAYS[G.day]}`;
  banner.innerHTML = `
    <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="#C9A84C" stroke-width="1.1"/><path d="M9 5.5v4l2.5 1.5" stroke="#C9A84C" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><div class="bt">${ps} · ${ds}</div><div class="bs">${schedDesc()}</div></div>
  `;
  area.appendChild(banner);
  area.scrollTop = area.scrollHeight;
}

// 推送叙述
function pushNarr(ps) {
  const area = document.getElementById('narrative');
  if (!area) return;
  
  const b = document.createElement('div');
  b.className = 'nb';
  b.innerHTML = ps.map(p => `<p>${p}</p>`).join('');
  area.appendChild(b);
  area.scrollTop = area.scrollHeight;
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

// 添加分隔符
function addDiv() {
  const area = document.getElementById('narrative');
  if (!area) return;
  
  const d = document.createElement('div');
  d.className = 'ndiv'; d.innerHTML = '<span>· · ·</span>';
  area.appendChild(d);
}

// 自动保存
function autoSave() {
  // 这里可以添加自动保存逻辑
}

// 获取今天的课程
function todayCourse() {
  return G.SCHEDULE ? G.SCHEDULE[G.day][G.period] : null;
}

// 获取当前日程描述
function schedDesc() {
  const c = todayCourse();
  if (c) return `课程：${c.name}（${c.type}）`;
  if (G.period === 4) return '就寝时间';
  return '自由时间';
}