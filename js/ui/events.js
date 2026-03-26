// 事件处理逻辑
import { G, PERIODS, DAYS, SEMS } from '../core/gameState.js';
import { LOCATIONS } from '../data/locations.js';
import { addExp } from '../core/experience.js';
import { checkRisk, setSpellContext } from '../core/risk.js';
import { resolveSkipClass, onSemesterEndSkip } from '../core/skipClass.js';
import { renderAll, renderMapModal, renderCalendar } from './render.js';
import { openNpcList } from './dialogue.js';
import { CLUBS, CLUB_RANK_LABELS, canJoinClub, joinClub, leaveClub, getClubRankLabel } from '../data/clubs.js';
import { CHAR } from '../core/character.js';
import { tryTriggerEvent, openChoiceModal } from '../data/randomEvents.js';
import { changeRel } from '../core/relationship.js';
import { generateNarrative, buildSnapshot } from '../core/llm.js';

// LLM 指令处理器（传给 generateNarrative）
const LLM_HANDLERS = { changeRel, addExp };

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

// ── 社团 Modal ────────────────────────────────────────────────

function ensureClubModal() {
  if (document.getElementById('club-mo')) return;
  const mo = document.createElement('div');
  mo.id = 'club-mo';
  mo.className = 'mo';
  mo.innerHTML = `
    <div class="mb" style="max-width:460px;">
      <button class="mc-btn" id="club-close-btn">✕</button>
      <div class="mt-m">社团</div>
      <div class="ms-m" id="club-mo-sub"></div>
      <div id="club-mo-body" style="max-height:58vh;overflow-y:auto;padding-right:4px;"></div>
    </div>`;
  document.body.appendChild(mo);
  document.getElementById('club-close-btn').addEventListener('click', closeClubMo);
  mo.addEventListener('click', e => { if (e.target === mo) closeClubMo(); });
}

export function openClubMo() {
  ensureClubModal();
  renderClubMo();
  document.getElementById('club-mo').classList.add('open');
}

export function closeClubMo() {
  const mo = document.getElementById('club-mo');
  if (mo) mo.classList.remove('open');
}

function renderClubMo() {
  if (!G.clubs) G.clubs = [];
  if (!G.clubRank) G.clubRank = {};
  const joined = G.clubs;
  const sub = document.getElementById('club-mo-sub');
  const body = document.getElementById('club-mo-body');
  if (sub) sub.textContent = `本学期已加入 ${joined.length}/2 个社团`;

  const statLabel = { int:'智力', mag:'法力', phy:'体魄', cha:'魅力', sen:'感知' };

  body.innerHTML = Object.values(CLUBS).map(club => {
    const isJoined = joined.includes(club.id);
    const eligible = canJoinClub(club.id, G, CHAR);
    const full     = !isJoined && joined.length >= 2;
    const rank     = isJoined ? CLUB_RANK_LABELS[Math.min(G.clubRank[club.id] ?? 0, 3)] : null;

    // 条件文字
    const reqParts = [];
    if (club.joinReq.race) reqParts.push(`种族：混血裔`);
    for (const [k, v] of Object.entries(club.joinReq)) {
      if (k === 'race') continue;
      const cur = G.stats[k] ?? 0;
      reqParts.push(`${statLabel[k] || k} ≥ ${v}（当前 ${cur}）`);
    }
    if (!reqParts.length) reqParts.push('无门槛');

    const btnDisabled = !isJoined && (!eligible || full);
    const btnText = isJoined ? '退出社团' : (full ? '已满' : (!eligible ? '条件不足' : '加入'));
    const btnCls  = isJoined ? 'abtn dng' : (btnDisabled ? 'abtn' : 'abtn pri');

    return `
      <div style="border:1px solid var(--bd);border-radius:6px;padding:10px 12px;margin-bottom:8px;background:var(--bg);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:11px;font-weight:600;color:var(--tx);">${club.name}
              ${isJoined ? `<span style="font-size:9px;color:var(--gold);margin-left:4px;">${rank}</span>` : ''}
            </div>
            <div style="font-size:8px;color:var(--tx3);margin:2px 0;">${club.sub}</div>
            <div style="font-size:9px;color:var(--tx2);margin:4px 0 2px;">${club.desc}</div>
            <div style="font-size:8px;color:var(--tx3);">
              加入条件：${reqParts.join('，')}
            </div>
            ${club.perk ? `<div style="font-size:8px;color:var(--gold);margin-top:2px;">✦ ${club.perk}</div>` : ''}
            <div style="font-size:8px;color:var(--tx3);margin-top:2px;">
              提升属性：${club.statGain.map(k => statLabel[k] || k).join('、')}
            </div>
          </div>
          <button class="${btnCls}" style="flex-shrink:0;min-width:56px;padding:5px 8px;font-size:9px;"
            ${btnDisabled ? 'disabled' : ''}
            onclick="${isJoined ? `doLeaveClub('${club.id}')` : `doJoinClub('${club.id}')`}">
            ${btnText}
          </button>
        </div>
      </div>`;
  }).join('');
}

export function doJoinClub(clubId) {
  const result = joinClub(clubId, G, CHAR);
  if (result.ok) {
    const club = CLUBS[clubId];
    pushEvt(`加入社团：${club.name}`, `当前社团 ${G.clubs.length}/2`);
    // LLM 叙述：加入社团
    const snapshot = buildSnapshot(G, CHAR, `递交申请，加入${club.name}`, '社团系统');
    generateNarrative(
      snapshot, pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
      [`你向${club.name}递交了申请，正式成为新成员。`]   // 降级文本
    );
  } else {
    pushEvt('无法加入', result.reason);
  }
  renderClubMo();
  setBtns('free');
}

export function doLeaveClub(clubId) {
  const name = CLUBS[clubId]?.name || clubId;
  leaveClub(clubId, G);
  pushEvt(`退出社团：${name}`, `当前社团 ${G.clubs.length}/2`);
  // LLM 叙述：退出社团
  const snapshot = buildSnapshot(G, CHAR, `离开${name}`, '社团系统');
  generateNarrative(
    snapshot, pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
    [`你离开了${name}。`]
  );
  renderClubMo();
  setBtns('free');
}

// 前往地点
export function travelTo(locKey) {
  const loc = LOCATIONS[locKey];
  if (!loc) return;
  G.locKey = locKey;
  G.loc = loc.name;
  closeMap(null, true);
  addDiv();
  renderAll();
  setBtns('free');

  // 更新侧边栏地点显示
  const lel = document.getElementById('lp-loc');
  if (lel) lel.textContent = loc.name;
  const lsub = document.getElementById('lp-loc-sub');
  if (lsub) lsub.textContent = loc.sub;

  // LLM 叙述：移动到新地点
  const snapshot = buildSnapshot(G, CHAR, `前往${loc.name}`, '移动');
  generateNarrative(
    snapshot, pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
    [`你前往${loc.name}。${loc.desc}`]   // 降级文本
  );
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
  document.querySelectorAll('.mm').forEach(mm => mm.classList.remove('open'));
  const mm = document.getElementById('mm-' + tab);
  if (mm) mm.classList.add('open');
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

// ── 行动银行 ─────────────────────────────────────────────────
//
// 每个行动保留 n（静态文本）作为 LLM 不可用时的降级兜底。
// LLM 可用时，generateNarrative 会接管叙述，静态文本不会显示。

const A = {
  take_notes: {
    get n() {
      return [`你专心听讲，笔尖快速划过笔记本。感知值${G.stats.sen}让你精准捕捉到教授的每一个重点。`];
    },
    e: ['认真听讲！', '智力经验 +0.3，法力经验 +0.2，出勤 +1，MP -5。'],
    nx: 'class', mp: 5,
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
      return [
        `「教授，关于${c ? c.name : '这节课'}的内容我有一个疑问——」`,
        `教授停顿了一下，给出了详细的解答。`
      ];
    },
    e: ['主动提问！', '好感度 +3，平时分 +0.5，智力 +0.1。'],
    nx: 'class', mp: 3,
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
    n: ['你悄悄凑近旁边的同学，低声交流了一下笔记。', '教授的目光扫过来，你们同时低下头。'],
    e: ['与同学互动。', '好感度 +2，被注意但忽视。'],
    nx: 'class', mp: 1,
    exec() {
      addExp('cha', 0.1, G);
      G.mp -= 1;
    }
  },

  rest: {
    get n() {
      return [`你在${G.loc}找了处安静的地方坐下，闭目休息片刻。银叶大道的风声让人心神安定。`];
    },
    e: ['小憩完成。', 'SP +10，消耗约30分钟。'],
    nx: 'free', sp: 10,
    exec() {
      G.sp = Math.min(G.sp + 10, G.spMax);
    }
  },

  skip_class: { custom: true }
};

// ── 翘课逻辑 ─────────────────────────────────────────────────

A.skip_class.exec = function() {
  addDiv();
  const cc = todayCourse();

  const OUTDOOR_LOCS = ['horti', 'campus', 'ambul', 'via'];
  const ctx = resolveSkipClass(G, {
    raceKey     : CHAR.race,
    personality : cc?.professor?.personality ?? 'normal',
    isNight     : G.period >= 3,
    isOutdoor   : OUTDOOR_LOCS.includes(G.locKey),
  });

  if (ctx.detected && ctx.result === 'caught') {
    // 被抓
    const punishNote = ctx.punishDowngrade ? '（龙息威慑：惩罚降一级）' : '';
    if (!ctx.punishDowngrade) G.viol++;
    if (cc) {
      initCourseProgress(cc.name);
      G.courseProgress[cc.name].attended++;
    }
    pushEvt(
      `被发现！（概率 ${Math.round(ctx.finalChance * 100)}%）`,
      `违纪记录 ${ctx.punishDowngrade ? '不计入' : '+1'}，强制返回。出勤 ${cc ? G.courseProgress[cc.name].attended + '/' + G.courseProgress[cc.name].total : '—'}`
    );
    // LLM 叙述：被抓
    const narrativeTag = ctx.narrativeTag;
    const fallbackCaught = [
      '你悄悄向后门移动……',
      getNarrativeDesc(narrativeTag, 'caught') || `你被发现了。${punishNote}`
    ];
    generateNarrative(
      buildSnapshot(G, CHAR, `翘课被抓${punishNote}`, `${PERIODS[G.period]} · ${cc?.name ?? G.loc}`),
      pushNarr, pushEvt, G, LLM_HANDLERS, CHAR, fallbackCaught
    );
    renderAll(); autoSave();
    setTimeout(() => setBtns('class'), 200);

  } else if (ctx.detected && ctx.result === 'ignored') {
    // 被发现但化解
    pushEvt('侥幸脱身', '被注意到了，但对方没有追究。');
    generateNarrative(
      buildSnapshot(G, CHAR, '翘课侥幸脱身', `${PERIODS[G.period]} · ${cc?.name ?? G.loc}`),
      pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
      ['你悄悄向后门移动……', getNarrativeDesc(ctx.narrativeTag, 'ignored')]
    );
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);

  } else if (ctx.detected && ctx.result === 'escaped') {
    // 兽人反制逃脱
    pushEvt('强行逃脱', '阻拦被你魔法反制，成功离开。出勤 -1。');
    generateNarrative(
      buildSnapshot(G, CHAR, '翘课强行反制逃脱', `${PERIODS[G.period]} · ${cc?.name ?? G.loc}`),
      pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
      ['你悄悄向后门移动……', getNarrativeDesc(ctx.narrativeTag, 'escaped')]
    );
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);

  } else {
    // 成功翘课
    pushEvt('翘课成功。', `上午可自由活动，出勤 -1（影响平时分）。概率 ${Math.round(ctx.finalChance * 100)}%`);
    generateNarrative(
      buildSnapshot(G, CHAR, '翘课成功，溜出教室', `${PERIODS[G.period]} · ${cc?.name ?? G.loc}`),
      pushNarr, pushEvt, G, LLM_HANDLERS, CHAR,
      [`走廊里空无一人。你成功溜出来了——${G.loc}的风吹散了课堂的紧张感。`]
    );
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);
  }

  // 矮人沉石礼
  if (ctx.triggerStoneRite) {
    pushEvt('沉石礼触发', '连续三次翘课，古礼启动，消耗了一段时间。');
    G.period = Math.min(G.period + 1, 4);
  }

  // 混血裔身份暴露
  if (ctx.triggerIdentityExpose) {
    pushEvt('身份暴露', '族裔特征在紧张时刻显现，引起了注意。');
    G.viol++;
  }

  renderAll(); autoSave();
};

// 翘课叙事描述映射（降级文本用）
function getNarrativeDesc(tag, outcome) {
  const MAP = {
    elf_glow:          { caught:   '紧张之下，你的皮肤泛起淡淡光晕，暴露了你的行踪。' },
    vampire_mesmerize: { ignored:  '你的眼神与教授短暂交汇——对方若有所思，随即移开视线。' },
    dwarf_stone_rite:  { caught:   '第三次翘课，族中古礼「沉石礼」悄然启动。' },
    merfolk_scale_day: { caught:   '日光下，你颈侧的鳞光折射引来了不必要的目光。' },
    orc_counter:       { escaped:  '你施展魔法反制，强行打断了阻拦，扬长而去。' },
    halfling_luck:     { ignored:  '幸运女神眷顾，对方恰好被别的事情分散了注意力。' },
    dragonborn_deter:  { caught:   '你低沉地吐出一口带有龙威的气息，对方下意识退后，惩罚降了一级。' },
    halfblood_expose:  { caught:   '族裔特征在紧张时刻不受控制地显现，引起了注意。' },
  };
  return MAP[tag]?.[outcome] ?? '';
}

// ── 执行动作 ──────────────────────────────────────────────────

export function act(id) {
  const a = A[id];
  if (!a) return;

  // 自定义行动（翘课等）走自己的逻辑
  if (a.custom) { if (a.exec) a.exec(); return; }

  addDiv();

  // 推送事件卡
  pushEvt(a.e[0], a.e[1]);

  // 执行数值逻辑
  if (a.exec) a.exec();

  // 检查失控风险
  checkRisk(G);

  renderAll();
  autoSave();

  // LLM 叙述（异步，不阻塞主流程）
  const c = todayCourse();
  const context     = c ? `${PERIODS[G.period]} · ${c.name}` : `${PERIODS[G.period]} · ${G.loc}`;
  const actionLabel = {
    take_notes    : '认真听课做笔记',
    ask_question  : '向教授提问',
    chat_classmate: '与同学低声聊天',
    rest          : '在当前地点小憩',
  }[id] || id;

  // 静态文本作为降级兜底
  const fallback = typeof a.n === 'function' ? a.n() : (Array.isArray(a.n) ? a.n : [a.n]);

  generateNarrative(
    buildSnapshot(G, CHAR, actionLabel, context),
    pushNarr, pushEvt, G, LLM_HANDLERS, CHAR, fallback
  );

  setTimeout(() => {
    setBtns(a.nx || 'class');
    if ((a.nx || 'class') === 'free') {
      tryTriggerEvent('action', pushNarr, pushEvt,
        (evt) => openChoiceModal(evt, pushNarr, pushEvt, () => { renderAll(); setBtns('free'); })
      );
    }
  }, 200);
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
    const clubCount = (G.clubs || []).length;
    btns.innerHTML = `
      <button class="abtn pri" onclick="advTime()">推进到下一时间段<span class="hk">↵</span></button>
      <button class="abtn" onclick="act('rest')">小憩 (SP+10)<span class="hk">2</span></button>
      <button class="abtn" onclick="openMap()">查看地图<span class="hk">3</span></button>
      <button class="abtn" onclick="qa('npc')">寻找附近学生<span class="hk">4</span></button>
      <button class="abtn" onclick="openClubMo()">社团（${clubCount}/2）<span class="hk">5</span></button>`;
  }
}

// ── 推进时间 ──────────────────────────────────────────────────

export function advTime() {
  G.period++;
  if (G.period >= 5) {
    G.period = 0; G.day++;
    if (G.day >= 5) { G.day = 0; G.week++; }
    if (G.week > 16) {
      G.week = 1;
      G.sem = (G.sem + 1) % 4;
      G.semestersPassed = (G.semestersPassed ?? 0) + 1;
      onSemesterEndSkip(G, CHAR.race);
    }
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

  // LLM 叙述：时间段过渡
  const context     = `推进时间 · ${PERIODS[G.period]}`;
  const actionLabel = c ? `进入${c.name}课堂` : `${G.loc}自由时间`;
  const fallback    = c
    ? [`${PERIODS[G.period]}的钟声响起，新的课程即将开始。`]
    : [`时光悄悄流逝，${G.loc}等待着你的下一步。`];

  generateNarrative(
    buildSnapshot(G, CHAR, actionLabel, context),
    pushNarr, pushEvt, G, LLM_HANDLERS, CHAR, fallback
  );

  setBtns(c ? 'class' : 'free');

  if (!c) {
    tryTriggerEvent('advance', pushNarr, pushEvt,
      (evt) => openChoiceModal(evt, pushNarr, pushEvt, () => { renderAll(); setBtns('free'); })
    );
  }
}

// ── 叙述区辅助函数 ────────────────────────────────────────────

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

// 推送叙述（静态文本 / 降级文本）
function pushNarr(ps) {
  const area = document.getElementById('narrative');
  if (!area) return;

  const b = document.createElement('div');
  b.className = 'nb';
  b.innerHTML = ps.map(p => `<p>${p}</p>`).join('');
  area.appendChild(b);
  area.scrollTop = area.scrollHeight;
}

// 推送事件卡
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
  // 自动保存逻辑（待实现）
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
