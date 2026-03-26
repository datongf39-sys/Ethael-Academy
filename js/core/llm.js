/**
 * llm.js — AI 叙述生成模块 v3
 *
 * 职责：
 *   1. 动态切片注入当前场景相关数据（地点、NPC、种族、节日）
 *   2. 支持多 API 后端（Claude / OpenAI 兼容 / 自定义接口）
 *   3. 调用 AI API 生成沉浸式叙述段落，打字机输出
 *   4. 解析返回文本中的 [指令] 标记并执行
 *
 * events.js 调用方式：
 *   import { generateNarrative, buildSnapshot } from '../core/llm.js';
 *   generateNarrative(snapshot, pushNarr, pushEvt, G, LLM_HANDLERS, CHAR);
 *
 * 支持的 AI 指令标记（附在生成文本末尾，换行，仅在剧情需要时出现）：
 *   [+关系:npcId:±数值]   → 修改 NPC 好感度（±1~10）
 *   [+属性:key:±数值]     → 修改属性经验（±0.1~0.5）
 *   [+风险:±数值]         → 修改失控风险值（±5~15）
 */

import { LOCATIONS }          from '../data/locations.js';
import { NPCS, getNpcsAt }    from '../data/npcs.js';
import { RACES }              from '../data/races.js';
import { DEPTS }              from '../data/departments.js';
import { getCurrentFestival } from '../data/festivals.js';

// ─── 多 API 配置 ───────────────────────────────────────────────
//
// profile 字段说明：
//   label       显示名（设置页用）
//   url         默认接口地址（null = 必须由用户填写）
//   model       默认模型名（null = 必须由用户填写）
//   authHeader  (apiKey) => 返回鉴权 header 对象
//   buildBody   (system, user, maxTokens, model) => 返回请求 body 对象
//   extractText (data) => 从响应 JSON 提取文本字符串

export const API_PROFILES = {

  claude: {
    label     : 'Claude (Anthropic)',
    url       : 'https://api.anthropic.com/v1/messages',
    model     : 'claude-sonnet-4-20250514',
    authHeader: (key) => ({
      'x-api-key'         : key,
      'anthropic-version' : '2023-06-01',
    }),
    buildBody: (system, user, maxTokens, model) => ({
      model,
      max_tokens : maxTokens,
      system,
      messages   : [{ role: 'user', content: user }],
    }),
    extractText: (data) => data.content?.find(c => c.type === 'text')?.text ?? '',
  },

  openai: {
    label     : 'OpenAI / 兼容接口',
    url       : null,   // 用户填写，例如 https://api.openai.com/v1/chat/completions
    model     : null,   // 用户填写，例如 gpt-4o
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    buildBody: (system, user, maxTokens, model) => ({
      model,
      max_tokens : maxTokens,
      messages   : [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
    }),
    extractText: (data) => data.choices?.[0]?.message?.content ?? '',
  },

  custom: {
    label     : '自定义接口',
    url       : null,
    model     : null,
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    buildBody: (system, user, maxTokens, model) => ({
      model,
      max_tokens : maxTokens,
      messages   : [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
    }),
    // 兜底三种常见格式
    extractText: (data) =>
      data.choices?.[0]?.message?.content   // OpenAI 格式
      ?? data.content?.[0]?.text            // Claude 格式
      ?? data.response                      // 其他简单格式
      ?? '',
  },
};

// ─── 配置读写（存入 localStorage，可在设置页更改）──────────────

/** 读取当前 LLM 配置 */
export function getLLMConfig() {
  try {
    const raw = localStorage.getItem('ither_llm_config');
    if (!raw) return _defaultConfig();
    return { ..._defaultConfig(), ...JSON.parse(raw) };
  } catch {
    return _defaultConfig();
  }
}

/** 保存 LLM 配置 */
export function saveLLMConfig(cfg) {
  try {
    localStorage.setItem('ither_llm_config', JSON.stringify(cfg));
  } catch (e) {
    console.warn('[LLM] 配置保存失败：', e);
  }
}

function _defaultConfig() {
  return {
    profile  : 'claude',  // API_PROFILES 的 key
    apiKey   : '',
    url      : '',        // 覆盖 profile.url（自定义接口时必填）
    model    : '',        // 覆盖 profile.model
    maxTokens: 800,       // 600~1500 可在设置页调整
    enabled  : true,      // 关闭后退化为静态文本
  };
}

// ─── Token 上限（对应字数约 600~1500 汉字）─────────────────────

const MIN_TOKENS = 600;
const MAX_TOKENS = 1500;

// ─── 固定 System Prompt 基底（世界观 + 叙述规范）──────────────

const WORLD_BASE = `你是《伊瑟尔学院》文字RPG的专职叙述者，负责将玩家的行动转化为沉浸式叙事段落。

【世界观】
伊瑟尔学院建于约三百五十年前，由人类学者阿尔德里克·韦恩与精灵族长老埃洛温·艾什维尔（Elowen Ashveil）联合创立。彼时大陆正处于被后世称为「魔乱纪」的动荡末期——各族各守秘术，知识高度封闭，跨族的魔法冲突时有爆发。韦恩与埃洛温相信，若能建立一座跨族的学术机构，以知识交流取代刀兵相向，或可改写大陆走向。

建院之初，学院仅有人类与精灵两族学子，矛盾频发。第二任院长米雷雅·霍尔特（Mireya Holt）推行「诸族平等修学令」，强制要求各学部接纳任何族裔的学生，此举在当时引发轩然大波，却也奠定了学院此后两百余年多元并存的根基。

时至今日，伊瑟尔学院已是大陆上首屈一指的综合性魔学机构，吸引来自各地、各族裔的年轻学子入学。然而历史积怨从未真正消散——族裔偏见以更隐蔽的方式流淌于学院的走廊与课堂之间，成为每一位学子都必须面对的无形课题。

【游戏定位】
网页端西幻魔法学院题材文字角色扮演游戏。玩家扮演刚入学的魔法学院新生，在现代西幻世界观下，通过上课、社交、参加活动、探索地图等方式推进故事。整体风格偏向跑团（TRPG），强调叙事自由度与角色成长。

【叙述规范】
- 第二人称（"你"），现在时态
- 每次叙述 600～1500 字，自然分为 2～4 段，段落之间有节奏起伏
- 感官优先：光线、气味、声音、温度、触感，用细节构建临场感
- 叙述节奏：行动即时反馈 → 场景/环境渲染 → 情绪或关系推进 → 留白（结尾不做总结）
- 体现角色的种族特质与当前情绪状态，让特质融入场景而非直接说明
- 若场景有在场 NPC，可让其有一两个自然动作或简短台词（不超过两人发言）
- 节日期间叙述需带节庆氛围色彩
- 不重复事件卡片已显示的数值信息（"智力+0.3"等提示不要写进叙述）
- 只输出叙述正文，不加任何前缀、标题或说明

【可选指令标记】
仅在剧情自然需要时，于叙述正文末尾另起一行附加，无需触发时不写：
[+关系:npcId:±数值]   修改 NPC 好感度（±1~10）
[+属性:key:±数值]     修改属性经验（±0.1~0.5）
[+风险:±数值]         修改失控风险值（±5~15）`;

// ─── 动态上下文构建 ────────────────────────────────────────────

function buildDynamicContext(G, CHAR) {
  const parts = [];

  // 地点
  const loc = LOCATIONS[G.locKey];
  if (loc) {
    parts.push(`【当前地点】${loc.name}（${loc.sub}）\n${loc.desc}`);
  }

  // 附近 NPC（最多 3 个，带好感度提示）
  const nearby = (typeof getNpcsAt === 'function')
    ? getNpcsAt(G.locKey, G.period).slice(0, 3)
    : [];
  if (nearby.length) {
    const lines = nearby.map(npc => {
      const score = G.relations?.[npc.id] ?? 0;
      const hint  = score >= 30 ? '（友好）' : score <= -30 ? '（冷淡）' : '';
      return `  · ${npc.name}｜${npc.title}｜${npc.intro}${hint}`;
    }).join('\n');
    parts.push(`【附近人物】\n${lines}`);
  }

  // 种族特质（混血裔特殊处理）
  const race = RACES[CHAR.race];
  if (race) {
    let raceDesc;
    if (CHAR.race === 'halfblood' && CHAR.halfbloodParents?.length === 2) {
      const [p1, p2] = CHAR.halfbloodParents;
      const pName1 = RACES[p1]?.name ?? p1;
      const pName2 = RACES[p2]?.name ?? p2;
      raceDesc = `混血裔（${pName1}×${pName2}）：${race.passive}`;
    } else {
      raceDesc = `${race.name}：${race.passive}`;
    }
    parts.push(`【种族特质】${raceDesc}`);
  }

  // 学部
  const dept = DEPTS[CHAR.dept];
  if (dept) {
    const hall = LOCATIONS[CHAR.dept + '_h'];
    const hallDesc = hall ? hall.desc.slice(0, 40) + '……' : '';
    parts.push(`【学部】${dept.name}，教学楼「${dept.hall}」：${hallDesc}`);
  }

  // 当前节日（如有）
  const festival = getCurrentFestival(G);
  if (festival) {
    parts.push(`【节日气氛】${festival.name}（${festival.sub}）进行中：${festival.desc}`);
  }

  return parts.join('\n\n');
}

// ─── 构建快照（供 events.js 调用）────────────────────────────

export function buildSnapshot(G, CHAR, action, context) {
  const SEMS    = ['秋季学期', '冬季学期', '春季学期', '夏季学期'];
  const PERIODS = ['清晨', '上午', '下午', '傍晚', '夜间'];
  const DAYS    = ['星期一', '星期二', '星期三', '星期四', '星期五'];

  return {
    sem      : SEMS[G.sem],
    week     : G.week,
    period   : PERIODS[G.period],
    day      : DAYS[G.day],
    locKey   : G.locKey,
    location : G.loc,
    charName : CHAR.name,
    raceName : CHAR.raceName ?? RACES[CHAR.race]?.name ?? CHAR.race,
    deptName : CHAR.deptName ?? DEPTS[CHAR.dept]?.name ?? CHAR.dept,
    raceKey  : CHAR.race,
    deptKey  : CHAR.dept,
    hp: G.hp, hpMax: G.hpMax,
    mp: G.mp, mpMax: G.mpMax,
    sp: G.sp, spMax: G.spMax,
    stats    : { ...G.stats },
    riskLevel: G.riskLevel ?? 0,
    action,
    context,
  };
}

// ─── 读取最近叙述文本 ─────────────────────────────────────────

export function getRecentNarrative(n = 3) {
  const area = document.getElementById('narrative');
  if (!area) return '';
  const blocks = area.querySelectorAll('.nb p');
  return Array.from(blocks).slice(-n).map(p => p.textContent.trim()).join('\n');
}

// ─── 组装完整 Prompt ──────────────────────────────────────────

function buildPrompt(snapshot, G, CHAR) {
  const system = WORLD_BASE + '\n\n' + buildDynamicContext(G, CHAR);

  const user = `【角色状态】
${snapshot.charName}｜${snapshot.raceName}｜${snapshot.deptName}
${snapshot.sem} 第${snapshot.week}周 ${snapshot.day} ${snapshot.period}
HP ${snapshot.hp}/${snapshot.hpMax}  MP ${snapshot.mp}/${snapshot.mpMax}  SP ${snapshot.sp}/${snapshot.spMax}
智力${snapshot.stats.int} 法力${snapshot.stats.mag} 体魄${snapshot.stats.phy} 魅力${snapshot.stats.cha} 感知${snapshot.stats.sen}
失控风险：${snapshot.riskLevel}/100

【最近叙述】
${getRecentNarrative(3) || '（游戏开始）'}

【当前行动】
${snapshot.context}：${snapshot.action}

请生成这次行动的叙述（600～1500字，2～4段，无需标题）。`;

  return { system, user };
}

// ─── 指令解析 ────────────────────────────────────────────────

function parseCommands(raw) {
  const commands = [];
  const text = raw.replace(/\[([^\]]+)\]/g, (_, inner) => {
    const parts = inner.split(':');
    commands.push({ type: parts[0], args: parts.slice(1) });
    return '';
  }).trim();
  return { text, commands };
}

// ─── 主函数 ───────────────────────────────────────────────────

/**
 * 调用 AI API 生成叙述，打字机效果输出到叙述区
 *
 * @param {object}   snapshot   由 buildSnapshot() 生成
 * @param {Function} pushNarr   events.js 的 pushNarr（降级兜底用）
 * @param {Function} pushEvt    events.js 的 pushEvt
 * @param {object}   G          游戏状态
 * @param {object}   handlers   { changeRel, addExp }
 * @param {object}   CHAR       角色数据
 * @param {string[]} [fallback] 静态降级文本数组（AI 不可用时显示）
 */
export async function generateNarrative(snapshot, pushNarr, pushEvt, G, handlers, CHAR, fallback) {
  const cfg = getLLMConfig();

  // LLM 关闭时直接用降级文本
  if (!cfg.enabled) {
    if (fallback?.length) pushNarr(fallback);
    return;
  }

  const profile = API_PROFILES[cfg.profile] ?? API_PROFILES.custom;
  const apiUrl  = cfg.url   || profile.url;
  const model   = cfg.model || profile.model;
  const tokens  = Math.min(Math.max(cfg.maxTokens ?? 800, MIN_TOKENS), MAX_TOKENS);

  // 无接口地址时降级
  if (!apiUrl) {
    console.warn('[LLM] 未配置 API 地址，已跳过叙述生成');
    if (fallback?.length) pushNarr(fallback);
    return;
  }

  const { system, user } = buildPrompt(snapshot, G, CHAR);

  const area = document.getElementById('narrative');
  if (!area) return;

  // 插入占位块
  const block = document.createElement('div');
  block.className = 'nb ai-narr';
  const p = document.createElement('p');
  p.className = 'ai-typing';
  p.textContent = '……';
  block.appendChild(p);
  area.appendChild(block);
  area.scrollTop = area.scrollHeight;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...profile.authHeader(cfg.apiKey),
    };

    const body = profile.buildBody(system, user, tokens, model);

    const resp = await fetch(apiUrl, {
      method : 'POST',
      headers,
      body   : JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }

    const data    = await resp.json();
    const rawText = profile.extractText(data);

    if (!rawText) throw new Error('API 返回内容为空');

    const { text, commands } = parseCommands(rawText);

    await typewriter(p, text);

    if (G && handlers && commands.length) {
      executeCommands(commands, G, handlers, pushEvt);
    }

  } catch (e) {
    console.warn('[LLM] 生成叙述失败，使用降级文本：', e.message);
    block.remove();
    if (fallback?.length) pushNarr(fallback);
  }
}

// ─── 打字机效果 ───────────────────────────────────────────────

async function typewriter(el, text, speed = 18) {
  el.textContent = '';
  el.classList.remove('ai-typing');
  for (const char of text) {
    el.textContent += char;
    await sleep(speed);
    const area = document.getElementById('narrative');
    if (area) area.scrollTop = area.scrollHeight;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 指令执行 ────────────────────────────────────────────────

function executeCommands(commands, G, handlers, pushEvt) {
  for (const { type, args } of commands) {
    try {
      if (type === '+关系' && handlers.changeRel) {
        const [npcId, val] = args;
        const delta = Number(val);
        if (npcId && !isNaN(delta)) {
          handlers.changeRel(npcId, delta, G);
          const npc = NPCS[npcId];
          pushEvt('关系变化', `${npc?.name ?? npcId} ${delta > 0 ? '+' : ''}${delta}`);
        }
      } else if (type === '+属性' && handlers.addExp) {
        const [key, val] = args;
        const delta = Number(val);
        if (key && !isNaN(delta)) handlers.addExp(key, delta, G);
      } else if (type === '+风险') {
        const delta = Number(args[0]);
        if (!isNaN(delta)) {
          G.riskLevel = Math.max(0, Math.min(100, (G.riskLevel ?? 0) + delta));
        }
      }
    } catch (e) {
      console.warn('[LLM] 指令执行失败：', type, args, e);
    }
  }
}
