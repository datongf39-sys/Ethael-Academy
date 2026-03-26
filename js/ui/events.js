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
import { generateNarrative, buildSnapshot, getLLMConfig, saveLLMConfig, API_PROFILES } from '../core/llm.js';

// LLM 指令处理器
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

// ── AI 设置 Modal ─────────────────────────────────────────────

function ensureSettingsMo() {
  if (document.getElementById('ai-set-mo')) return;
  const mo = document.createElement('div');
  mo.id = 'ai-set-mo';
  mo.className = 'mo';
  mo.innerHTML = `
    <div class="mb" style="max-width:480px;">
      <button class="mc-btn" id="ai-set-close-btn">✕</button>
      <div class="mt-m">AI 叙述设置 · Narrative Engine</div>
      <div class="ms-m">配置 AI 接口以启用沉浸式叙述生成；不配置也可正常游玩。</div>
      <div style="max-height:65vh;overflow-y:auto;padding-right:4px;">

        <!-- 启用开关 -->
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:12px 0;border-bottom:1px solid var(--bd);">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--tx);">启用 AI 叙述</div>
            <div style="font-size:9px;color:var(--tx3);margin-top:2px;">关闭后使用内置静态文本，完全不依赖网络</div>
          </div>
          <label style="position:relative;display:inline-block;width:38px;height:20px;flex-shrink:0;">
            <input type="checkbox" id="ai-enabled-chk" style="opacity:0;width:0;height:0;">
            <span id="ai-toggle-track" style="
              position:absolute;inset:0;border-radius:10px;cursor:pointer;
              background:var(--bd2);transition:.2s;
            "></span>
            <span id="ai-toggle-thumb" style="
              position:absolute;left:3px;top:3px;width:14px;height:14px;
              border-radius:50%;background:#fff;transition:.2s;
            "></span>
          </label>
        </div>

        <!-- 折叠区：仅启用时可编辑 -->
        <div id="ai-set-fields" style="padding-top:14px;">

          <!-- API 类型 -->
          <div style="margin-bottom:14px;">
            <div style="font-size:9px;color:var(--tx3);margin-bottom:5px;letter-spacing:.04em;">API 类型</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
              <button class="ai-profile-btn" data-p="claude"
                style="padding:8px 4px;border-radius:5px;border:1px solid var(--bd);
                       background:var(--bg);font-size:9px;color:var(--tx2);cursor:pointer;">
                Claude
              </button>
              <button class="ai-profile-btn" data-p="openai"
                style="padding:8px 4px;border-radius:5px;border:1px solid var(--bd);
                       background:var(--bg);font-size:9px;color:var(--tx2);cursor:pointer;">
                OpenAI 兼容
              </button>
              <button class="ai-profile-btn" data-p="custom"
                style="padding:8px 4px;border-radius:5px;border:1px solid var(--bd);
                       background:var(--bg);font-size:9px;color:var(--tx2);cursor:pointer;">
                自定义接口
              </button>
            </div>
          </div>

          <!-- API Key -->
          <div style="margin-bottom:12px;">
            <div style="font-size:9px;color:var(--tx3);margin-bottom:5px;letter-spacing:.04em;">API Key</div>
            <input id="ai-key-input" type="password" placeholder="sk-ant-... 或其他密钥"
              style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:5px;
                     border:1px solid var(--bd);background:var(--bg2);color:var(--tx);
                     font-size:10px;outline:none;font-family:monospace;">
          </div>

          <!-- 接口地址（claude时隐藏） -->
          <div id="ai-url-row" style="margin-bottom:12px;">
            <div style="font-size:9px;color:var(--tx3);margin-bottom:5px;letter-spacing:.04em;">接口地址 (URL)</div>
            <input id="ai-url-input" type="text"
              placeholder="https://api.openai.com/v1/chat/completions"
              style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:5px;
                     border:1px solid var(--bd);background:var(--bg2);color:var(--tx);
                     font-size:10px;outline:none;font-family:monospace;">
          </div>

          <!-- 模型名 -->
          <div style="margin-bottom:12px;">
            <div style="font-size:9px;color:var(--tx3);margin-bottom:5px;letter-spacing:.04em;">模型名称</div>
            <input id="ai-model-input" type="text"
              placeholder="留空使用默认模型"
              style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:5px;
                     border:1px solid var(--bd);background:var(--bg2);color:var(--tx);
                     font-size:10px;outline:none;font-family:monospace;">
            <div id="ai-model-hint" style="font-size:8px;color:var(--tx3);margin-top:3px;"></div>
          </div>

          <!-- 字数滑块 -->
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <div style="font-size:9px;color:var(--tx3);letter-spacing:.04em;">每段叙述字数上限</div>
              <div id="ai-tokens-val" style="font-size:10px;font-weight:600;color:var(--gold);">800 tokens</div>
            </div>
            <input id="ai-tokens-slider" type="range" min="600" max="1500" step="100" value="800"
              style="width:100%;accent-color:var(--gold);">
            <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--tx3);margin-top:2px;">
              <span>短 600</span><span>长 1500</span>
            </div>
          </div>

          <!-- 测试按钮 -->
          <div style="margin-bottom:12px;">
            <button id="ai-test-btn" class="abtn pri" style="width:100%;font-size:10px;padding:9px;">
              ✦ 测试连接
            </button>
            <div id="ai-test-result" style="font-size:9px;margin-top:6px;text-align:center;min-height:14px;"></div>
          </div>

        </div><!-- /ai-set-fields -->

        <!-- 底部说明 -->
        <div style="font-size:8px;color:var(--tx3);padding:10px 0;border-top:1px solid var(--bd);line-height:1.6;">
          API Key 仅存于本设备浏览器 localStorage，不会上传至任何服务器。<br>
          不配置 AI 时，游戏使用内置静态叙述文本，功能完整。
        </div>

      </div><!-- /scroll area -->

      <!-- 保存按钮 -->
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="ai-set-cancel" class="abtn" style="flex:1;font-size:10px;">取消</button>
        <button id="ai-set-save"   class="abtn pri" style="flex:2;font-size:10px;">保存设置</button>
      </div>
    </div>`;

  document.body.appendChild(mo);

  // ── 关闭 ──
  const close = () => mo.classList.remove('open');
  document.getElementById('ai-set-close-btn').addEventListener('click', close);
  document.getElementById('ai-set-cancel').addEventListener('click', close);
  mo.addEventListener('click', e => { if (e.target === mo) close(); });

  // ── 开关联动 ──
  const chk   = document.getElementById('ai-enabled-chk');
  const track = document.getElementById('ai-toggle-track');
  const thumb = document.getElementById('ai-toggle-thumb');
  const fields = document.getElementById('ai-set-fields');

  function applyToggleStyle(on) {
    track.style.background = on ? 'var(--gold)' : 'var(--bd2)';
    thumb.style.left = on ? '21px' : '3px';
    fields.style.opacity = on ? '1' : '.4';
    fields.style.pointerEvents = on ? '' : 'none';
  }

  chk.addEventListener('change', () => applyToggleStyle(chk.checked));

  // ── profile 切换 ──
  const profileBtns = document.querySelectorAll('.ai-profile-btn');
  const urlRow   = document.getElementById('ai-url-row');
  const modelHint = document.getElementById('ai-model-hint');

  function selectProfile(p) {
    profileBtns.forEach(b => {
      const active = b.dataset.p === p;
      b.style.borderColor  = active ? 'var(--gold)' : 'var(--bd)';
      b.style.color        = active ? 'var(--gold)' : 'var(--tx2)';
      b.style.fontWeight   = active ? '600' : '';
    });
    urlRow.style.display = (p === 'claude') ? 'none' : '';
    const hints = {
      claude : '默认：claude-sonnet-4-20250514',
      openai : '例：gpt-4o / gpt-4-turbo',
      custom : '填写你的模型标识符',
    };
    modelHint.textContent = hints[p] ?? '';
  }

  profileBtns.forEach(b => b.addEventListener('click', () => {
    selectProfile(b.dataset.p);
    b.closest('.mb').dataset.profile = b.dataset.p;
  }));

  // ── 字数滑块 ──
  const slider    = document.getElementById('ai-tokens-slider');
  const tokensVal = document.getElementById('ai-tokens-val');
  slider.addEventListener('input', () => {
    tokensVal.textContent = `${slider.value} tokens`;
  });

  // ── 测试连接 ──
  document.getElementById('ai-test-btn').addEventListener('click', async () => {
    const resultEl = document.getElementById('ai-test-result');
    const testBtn  = document.getElementById('ai-test-btn');
    const profile  = document.querySelector('.mb[data-profile]')?.dataset.profile
                     ?? document.querySelector('.ai-profile-btn[style*="gold"]')?.dataset.p
                     ?? 'claude';
    const cfg = _readFormValues();

    testBtn.disabled = true;
    testBtn.textContent = '测试中……';
    resultEl.style.color = 'var(--tx3)';
    resultEl.textContent = '正在向接口发送测试请求……';

    try {
      const p    = API_PROFILES[cfg.profile] ?? API_PROFILES.custom;
      const url  = cfg.url   || p.url;
      const model = cfg.model || p.model;
      if (!url) throw new Error('请先填写接口地址');

      const resp = await fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', ...p.authHeader(cfg.apiKey) },
        body   : JSON.stringify(p.buildBody(
          '你是一个测试助手，只需简短回复。',
          '请用一句话介绍伊瑟尔学院。',
          60, model
        )),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const txt  = p.extractText(data);
      if (!txt) throw new Error('接口返回内容为空，请检查模型名称');
      resultEl.style.color = 'var(--ok)';
      resultEl.textContent = `✓ 连接成功：${txt.slice(0, 40)}……`;
    } catch (e) {
      resultEl.style.color = 'var(--ng, #d94f4f)';
      resultEl.textContent = `✗ ${e.message}`;
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '✦ 测试连接';
    }
  });

  // ── 保存 ──
  document.getElementById('ai-set-save').addEventListener('click', () => {
    const cfg = _readFormValues();
    saveLLMConfig(cfg);
    close();
    // 反馈
    const area = document.getElementById('narrative');
    if (area) {
      const evc = document.createElement('div');
      evc.className = 'evc';
      evc.innerHTML = `
        <svg viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="10" stroke="#C9A84C" stroke-width=".9"/>
          <path d="M9 13l3 3 5-5" stroke="#C9A84C" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div><div class="et">AI 设置已保存</div>
        <div class="ed">${cfg.enabled ? '已启用 AI 叙述（' + cfg.profile + '）' : '已关闭 AI 叙述，使用静态文本'}</div></div>`;
      area.appendChild(evc);
      area.scrollTop = area.scrollHeight;
    }
  });

  // 辅助：从表单读值
  function _readFormValues() {
    const p = Array.from(profileBtns).find(b => b.style.color.includes('gold') || b.style.borderColor.includes('gold'))?.dataset.p ?? 'claude';
    return {
      profile  : p,
      apiKey   : document.getElementById('ai-key-input').value.trim(),
      url      : document.getElementById('ai-url-input').value.trim(),
      model    : document.getElementById('ai-model-input').value.trim(),
      maxTokens: Number(document.getElementById('ai-tokens-slider').value),
      enabled  : document.getElementById('ai-enabled-chk').checked,
    };
  }
}

export function openSettingsMo() {
  ensureSettingsMo();
  // 从 localStorage 读取当前配置填入表单
  const cfg = getLLMConfig();
  const chk = document.getElementById('ai-enabled-chk');
  chk.checked = cfg.enabled ?? true;

  // 触发开关样式
  const track = document.getElementById('ai-toggle-track');
  const thumb = document.getElementById('ai-toggle-thumb');
  const fields = document.getElementById('ai-set-fields');
  const on = chk.checked;
  track.style.background = on ? 'var(--gold)' : 'var(--bd2)';
  thumb.style.left = on ? '21px' : '3px';
  fields.style.opacity = on ? '1' : '.4';
  fields.style.pointerEvents = on ? '' : 'none';

  // profile 按钮
  document.querySelectorAll('.ai-profile-btn').forEach(b => {
    const active = b.dataset.p === (cfg.profile ?? 'claude');
    b.style.borderColor = active ? 'var(--gold)' : 'var(--bd)';
    b.style.color = active ? 'var(--gold)' : 'var(--tx2)';
    b.style.fontWeight = active ? '600' : '';
  });
  document.getElementById('ai-url-row').style.display = cfg.profile === 'claude' ? 'none' : '';

  // 字段填值
  document.getElementById('ai-key-input').value    = cfg.apiKey   ?? '';
  document.getElementById('ai-url-input').value    = cfg.url      ?? '';
  document.getElementById('ai-model-input').value  = cfg.model    ?? '';
  document.getElementById('ai-tokens-slider').value = cfg.maxTokens ?? 800;
  document.getElementById('ai-tokens-val').textContent = `${cfg.maxTokens ?? 800} tokens`;
  document.getElementById('ai-test-result').textContent = '';

  document.getElementById('ai-set-mo').classList.add('open');
}

export function closeSettingsMo() {
  const mo = document.getElementById('ai-set-mo');
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
    pushNarr([`你向${CLUBS[clubId].name}递交了申请，正式成为新成员。`]);
    pushEvt(`加入社团：${CLUBS[clubId].name}`, `当前社团 ${G.clubs.length}/2`);
  } else {
    pushEvt('无法加入', result.reason);
  }
  renderClubMo();
  setBtns('free');
}

export function doLeaveClub(clubId) {
  const name = CLUBS[clubId]?.name || clubId;
  leaveClub(clubId, G);
  pushNarr([`你离开了${name}。`]);
  pushEvt(`退出社团：${name}`, `当前社团 ${G.clubs.length}/2`);
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
  const cc = todayCourse();

  // S3：种族修正翘课判定
  const OUTDOOR_LOCS = ['horti', 'campus', 'ambul', 'via'];
  const ctx = resolveSkipClass(G, {
    raceKey:     CHAR.race,
    personality: cc?.professor?.personality ?? 'normal',
    isNight:     G.period >= 3,
    isOutdoor:   OUTDOOR_LOCS.includes(G.locKey),
  });

  if (ctx.detected && ctx.result === 'caught') {
    // 正常被抓
    const punishNote = ctx.punishDowngrade ? '（龙息威慑：惩罚降一级）' : '';
    pushNarr([`你悄悄向后门移动……`, `你被发现了。${punishNote}`]);
    if (!ctx.punishDowngrade) G.viol++;  // 降级时不计违纪
    if (cc) {
      initCourseProgress(cc.name);
      G.courseProgress[cc.name].attended++;
    }
    pushEvt(
      `被发现！（概率 ${Math.round(ctx.finalChance * 100)}%）`,
      `违纪记录 ${ctx.punishDowngrade ? '不计入' : '+1'}，强制返回。出勤 ${cc ? G.courseProgress[cc.name].attended+'/'+G.courseProgress[cc.name].total : '—'}`
    );
    renderAll(); autoSave();
    setTimeout(() => setBtns('class'), 200);

  } else if (ctx.detected && ctx.result === 'ignored') {
    // 被发现但化解（吸血鬼摄魄之眼 / 半身人好运波动）
    pushNarr([`你悄悄向后门移动……`, getNarrativeDesc(ctx.narrativeTag, 'ignored')]);
    pushEvt('侥幸脱身', '被注意到了，但对方没有追究。');
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);

  } else if (ctx.detected && ctx.result === 'escaped') {
    // 兽人魔法反制逃脱
    pushNarr([`你悄悄向后门移动……`, getNarrativeDesc(ctx.narrativeTag, 'escaped')]);
    pushEvt('强行逃脱', '阻拦被你魔法反制，成功离开。出勤 -1。');
    travelTo('via');
    setTimeout(() => setBtns('free'), 200);

  } else {
    // 未被发现
    pushNarr([`走廊里空无一人。你成功溜出来了——${G.loc}的风吹散了课堂的紧张感。`]);
    pushEvt('翘课成功。', `上午可自由活动，出勤 -1（影响平时分）。概率 ${Math.round(ctx.finalChance * 100)}%`);
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

// 翘课叙事描述映射
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
  setTimeout(() => {
    setBtns(a.nx || 'class');
    // 随机事件检定（自由时间行动后）
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

// 推进时间
export function advTime() {
  G.period++;
  if (G.period >= 5) {
    G.period = 0; G.day++;
    if (G.day >= 5) { G.day = 0; G.week++; }
    if (G.week > 16) {
      G.week = 1;
      G.sem = (G.sem + 1) % 4;
      G.semestersPassed = (G.semestersPassed ?? 0) + 1;
      // S3：重置翘课系统限次机制（龙裔龙息威慑等）
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
  setBtns(c ? 'class' : 'free');
  // 随机事件检定（推进时）
  if (!c) {
    tryTriggerEvent('advance', pushNarr, pushEvt,
      (evt) => openChoiceModal(evt, pushNarr, pushEvt, () => { renderAll(); setBtns('free'); })
    );
  }
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
