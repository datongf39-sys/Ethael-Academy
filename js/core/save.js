/**
 * save.js
 * S5 — 存档系统
 *
 * 【方案】LocalStorage 主方案 + IndexedDB 降级备选
 * 【存档槽】save_slot_1 / save_slot_2 / save_slot_3 + auto_save
 * 【安全】CRC32 校验和，损坏时回退自动存档
 * 【迁移】导出 Base64 JSON 文件 / 导入还原
 */

import { G, SCHEDULE } from '../core/gameState.js';
import { CHAR }        from '../core/character.js';
import { initAchievements } from './achievements.js';

// ─────────────────────────────────────────────
// 一、常量
// ─────────────────────────────────────────────

export const SLOT_KEYS   = ['save_slot_1', 'save_slot_2', 'save_slot_3'];
export const AUTO_KEY    = 'auto_save';
export const SETTINGS_KEY = 'game_settings';
export const SAVE_VERSION = 2;          // 存档版本号，升级时迁移用

// ─────────────────────────────────────────────
// 二、CRC32 校验
// ─────────────────────────────────────────────

/** 生成 CRC32 表 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

/**
 * 计算字符串的 CRC32 校验值
 * @param {string} str
 * @returns {number}
 */
function crc32(str) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─────────────────────────────────────────────
// 三、事件标记位掩码压缩
// ─────────────────────────────────────────────

/**
 * 将 dialogueFlags 对象压缩为位域数组（每个 32 位整数存 32 个布尔值）
 * 同时保留一份 key→index 映射表，存入存档
 *
 * @param {object} flags  { flagKey: true }
 * @returns {{ bitfield: number[], indexMap: string[] }}
 */
function compressFlags(flags) {
  const keys = Object.keys(flags).filter(k => flags[k] === true);
  const indexMap = keys; // 顺序即为位域索引
  const bitfield = [];
  for (let i = 0; i < keys.length; i++) {
    const word = Math.floor(i / 32);
    const bit  = i % 32;
    if (!bitfield[word]) bitfield[word] = 0;
    bitfield[word] |= (1 << bit);
  }
  return { bitfield, indexMap };
}

/**
 * 从位域数组还原 dialogueFlags
 * @param {number[]} bitfield
 * @param {string[]} indexMap
 * @returns {object}
 */
function decompressFlags(bitfield, indexMap) {
  const flags = {};
  for (let i = 0; i < indexMap.length; i++) {
    const word = Math.floor(i / 32);
    const bit  = i % 32;
    if (bitfield[word] & (1 << bit)) {
      flags[indexMap[i]] = true;
    }
  }
  return flags;
}

// ─────────────────────────────────────────────
// 四、存档数据序列化 / 反序列化
// ─────────────────────────────────────────────

/**
 * 将当前 G 状态序列化为存档对象（扁平化）
 * @returns {object} saveData
 */
function serialize() {
  const { bitfield, indexMap } = compressFlags(G.dialogueFlags ?? {});

  return {
    _version : SAVE_VERSION,
    _ts      : Date.now(),            // 存档时间戳

    // 角色基础
    charName : CHAR.name,
    charRace : CHAR.race,
    charDept : CHAR.dept,

    // 时间与进度
    sem      : G.sem,
    week     : G.week,
    day      : G.day,
    period   : G.period,

    // 属性
    hp: G.hp, hpMax: G.hpMax,
    mp: G.mp, mpMax: G.mpMax,
    sp: G.sp, spMax: G.spMax,
    stats    : { ...G.stats },
    exp      : { ...G.exp },

    // 货币
    gold     : G.gold,
    crystal  : G.crystal,
    viol     : G.viol,

    // 位置
    loc      : G.loc,
    locKey   : G.locKey,

    // 课程
    attendance    : { ...G.attendance },
    courseProgress: JSON.parse(JSON.stringify(G.courseProgress)),
    examsDone     : { ...G.examsDone },

    // 风险
    riskLevel    : G.riskLevel,
    _riskSurvived: G._riskSurvived,

    // 社交
    relations : { ...G.relations },
    clubs     : [...(G.clubs ?? [])],
    clubRank  : { ...G.clubRank },

    // 剧情标记（压缩）
    flagBitfield : bitfield,
    flagIndexMap : indexMap,

    // 声望与成就
    repute        : { ...G.repute },
    achievements  : { ...G.achievements },
    achTitles     : [...(G.achTitles ?? [])],
    activeTitle   : G.activeTitle ?? null,
    achItems      : [...(G.achItems ?? [])],
    _reputeStarted: G._reputeStarted ? { ...G._reputeStarted } : null,

    // 探索
    visitedLocs   : [...(G.visitedLocs ?? [])],
    nightOutCount : G.nightOutCount ?? 0,

    // 魔法
    learnedSpells : { ...G.learnedSpells },

    // 道具背包
    bag           : { ...G.bag },

    // 经济追踪
    ecoTrack      : { ...G.ecoTrack },
  };
}

/**
 * 将存档对象反序列化并写回 G
 * @param {object} data - 存档对象（已通过校验）
 */
function deserialize(data) {
  // 版本迁移
  const migrated = migrate(data);

  // 时间与进度
  G.sem    = migrated.sem;
  G.week   = migrated.week;
  G.day    = migrated.day;
  G.period = migrated.period;

  // 属性
  G.hp = migrated.hp; G.hpMax = migrated.hpMax;
  G.mp = migrated.mp; G.mpMax = migrated.mpMax;
  G.sp = migrated.sp; G.spMax = migrated.spMax;
  Object.assign(G.stats, migrated.stats ?? {});
  Object.assign(G.exp,   migrated.exp   ?? {});

  // 货币
  G.gold    = migrated.gold    ?? G.gold;
  G.crystal = migrated.crystal ?? G.crystal;
  G.viol    = migrated.viol    ?? 0;

  // 位置
  G.loc    = migrated.loc    ?? G.loc;
  G.locKey = migrated.locKey ?? G.locKey;

  // 课程
  G.attendance     = migrated.attendance     ?? {};
  G.courseProgress = migrated.courseProgress ?? {};
  G.examsDone      = migrated.examsDone      ?? { midterm: false, final: false };

  // 风险
  G.riskLevel     = migrated.riskLevel     ?? 0;
  G._riskSurvived = migrated._riskSurvived ?? false;

  // 社交
  G.relations = migrated.relations ?? {};
  G.clubs     = migrated.clubs     ?? [];
  G.clubRank  = migrated.clubRank  ?? {};

  // 剧情标记（解压）
  G.dialogueFlags = decompressFlags(
    migrated.flagBitfield ?? [],
    migrated.flagIndexMap ?? []
  );

  // 声望与成就
  G.repute         = migrated.repute         ?? G.repute;
  G.achievements   = migrated.achievements   ?? {};
  G.achTitles      = migrated.achTitles      ?? [];
  G.activeTitle    = migrated.activeTitle    ?? null;
  G.achItems       = migrated.achItems       ?? [];
  G._reputeStarted = migrated._reputeStarted ?? null;

  // 探索
  G.visitedLocs  = migrated.visitedLocs  ?? [];
  G.nightOutCount = migrated.nightOutCount ?? 0;

  // 魔法
  G.learnedSpells = migrated.learnedSpells ?? {};

  // 道具
  G.bag = migrated.bag ?? {};

  // 经济
  G.ecoTrack = migrated.ecoTrack ?? {};

  // 补全成就系统初始化
  initAchievements();
}

// ─────────────────────────────────────────────
// 五、版本迁移
// ─────────────────────────────────────────────

/**
 * 存档版本迁移（向后兼容）
 * @param {object} data
 * @returns {object} 迁移后的数据
 */
function migrate(data) {
  let d = { ...data };
  const v = d._version ?? 1;

  // v1 → v2：添加 learnedSpells / bag / ecoTrack 字段
  if (v < 2) {
    d.learnedSpells  = d.learnedSpells  ?? {};
    d.bag            = d.bag            ?? {};
    d.ecoTrack       = d.ecoTrack       ?? {};
    d.visitedLocs    = d.visitedLocs    ?? [];
    d.nightOutCount  = d.nightOutCount  ?? 0;
    d._riskSurvived  = d._riskSurvived  ?? false;
    // 旧存档 dialogueFlags 可能未压缩（对象格式），兼容处理
    if (d.dialogueFlags && !d.flagBitfield) {
      const comp = compressFlags(d.dialogueFlags);
      d.flagBitfield = comp.bitfield;
      d.flagIndexMap = comp.indexMap;
      delete d.dialogueFlags;
    }
    d._version = 2;
  }

  return d;
}

// ─────────────────────────────────────────────
// 六、存储后端（LocalStorage + IndexedDB 降级）
// ─────────────────────────────────────────────

/** 检测 LocalStorage 是否可用 */
function lsAvailable() {
  try {
    const t = '__ls_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

const USE_LS = lsAvailable();

/** 写入存储 */
async function storageSet(key, value) {
  if (USE_LS) {
    localStorage.setItem(key, value);
  } else {
    await idbSet(key, value);
  }
}

/** 读取存储 */
async function storageGet(key) {
  if (USE_LS) {
    return localStorage.getItem(key);
  }
  return idbGet(key);
}

/** 删除存储 */
async function storageRemove(key) {
  if (USE_LS) {
    localStorage.removeItem(key);
  } else {
    await idbRemove(key);
  }
}

// ── IndexedDB 实现 ────────────────────────────

const IDB_NAME  = 'isarel_rpg';
const IDB_STORE = 'saves';
let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = e => { _idb = e.target.result; res(_idb); };
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbSet(key, value) {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbGet(key) {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = e => res(e.target.result ?? null);
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbRemove(key) {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).delete(key);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

// ─────────────────────────────────────────────
// 七、核心存档 API
// ─────────────────────────────────────────────

/**
 * 写入存档
 * @param {string} key   - 存档 key（SLOT_KEYS 之一或 AUTO_KEY）
 * @returns {Promise<{ ok: boolean, msg: string }>}
 */
export async function saveGame(key) {
  try {
    const data    = serialize();
    const payload = JSON.stringify(data);
    const checksum = crc32(payload);
    const wrapped  = JSON.stringify({ checksum, payload });
    await storageSet(key, wrapped);
    return { ok: true, msg: `存档成功。（${_sizeStr(wrapped.length)}）` };
  } catch (e) {
    console.error('[存档] 写入失败:', e);
    return { ok: false, msg: `存档失败：${e.message}` };
  }
}

/**
 * 读取并载入存档
 * @param {string} key
 * @returns {Promise<{ ok: boolean, msg: string }>}
 */
export async function loadGame(key) {
  try {
    const raw = await storageGet(key);
    if (!raw) return { ok: false, msg: '存档槽为空。' };

    const { checksum, payload } = JSON.parse(raw);

    // 校验和验证
    if (crc32(payload) !== checksum) {
      console.warn('[存档] 校验失败，尝试从自动存档恢复…');
      if (key !== AUTO_KEY) {
        const fallback = await loadGame(AUTO_KEY);
        return {
          ok : fallback.ok,
          msg: `存档校验失败（可能已损坏）。${fallback.ok ? '已从自动存档恢复。' : '自动存档亦损坏，无法恢复。'}`,
        };
      }
      return { ok: false, msg: '存档已损坏，无法读取。' };
    }

    const data = JSON.parse(payload);
    deserialize(data);
    return { ok: true, msg: `存档载入成功。（${_tsStr(data._ts)}）` };
  } catch (e) {
    console.error('[存档] 读取失败:', e);
    return { ok: false, msg: `读取失败：${e.message}` };
  }
}

/**
 * 删除存档
 * @param {string} key
 */
export async function deleteGame(key) {
  await storageRemove(key);
  return { ok: true, msg: '存档已删除。' };
}

/**
 * 自动存档（每次时间推进时调用）
 */
export async function autoSave() {
  return saveGame(AUTO_KEY);
}

// ─────────────────────────────────────────────
// 八、存档槽信息查询（供 UI 渲染）
// ─────────────────────────────────────────────

/**
 * 获取所有存档槽的元数据（不载入数据）
 * @returns {Promise<Array>}
 */
export async function getSlotInfos() {
  const infos = [];
  for (let i = 0; i < SLOT_KEYS.length; i++) {
    const key = SLOT_KEYS[i];
    const raw = await storageGet(key);
    if (!raw) {
      infos.push({ slot: i + 1, key, empty: true });
      continue;
    }
    try {
      const { checksum, payload } = JSON.parse(raw);
      const valid = crc32(payload) === checksum;
      const data  = valid ? JSON.parse(payload) : null;
      infos.push({
        slot     : i + 1,
        key,
        empty    : false,
        valid,
        ts       : data?._ts ?? null,
        tsStr    : data?._ts ? _tsStr(data._ts) : '—',
        sem      : data?.sem ?? 0,
        week     : data?.week ?? 0,
        charName : data?.charName ?? '—',
        charDept : data?.charDept ?? '—',
        size     : _sizeStr(raw.length),
      });
    } catch {
      infos.push({ slot: i + 1, key, empty: false, valid: false, tsStr: '损坏' });
    }
  }
  return infos;
}

// ─────────────────────────────────────────────
// 九、导出 / 导入（跨设备迁移）
// ─────────────────────────────────────────────

/**
 * 导出当前游戏为 Base64 JSON 文件并触发下载
 * @param {string} [slotKey] - 指定导出某个槽，默认导出当前游戏状态
 */
export async function exportSave(slotKey = null) {
  let payload;
  if (slotKey) {
    const raw = await storageGet(slotKey);
    if (!raw) return { ok: false, msg: '指定存档槽为空。' };
    payload = raw;
  } else {
    const data     = serialize();
    const json     = JSON.stringify(data);
    const checksum = crc32(json);
    payload        = JSON.stringify({ checksum, payload: json });
  }

  const b64      = btoa(unescape(encodeURIComponent(payload)));
  const blob     = new Blob([b64], { type: 'text/plain' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `isarel_save_${Date.now()}.isv`;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true, msg: '存档已导出。' };
}

/**
 * 从文件导入存档
 * @param {File}   file     - 用户选择的 .isv 文件
 * @param {string} slotKey  - 写入哪个槽
 * @returns {Promise<{ ok: boolean, msg: string }>}
 */
export async function importSave(file, slotKey = SLOT_KEYS[0]) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const b64     = e.target.result;
        const json    = decodeURIComponent(escape(atob(b64)));
        const wrapped = JSON.parse(json);

        // 验证格式
        if (!wrapped.checksum || !wrapped.payload)
          return resolve({ ok: false, msg: '文件格式无效。' });

        if (crc32(wrapped.payload) !== wrapped.checksum)
          return resolve({ ok: false, msg: '存档文件校验失败，文件可能已损坏或被篡改。' });

        // 写入指定槽
        await storageSet(slotKey, json);
        resolve({ ok: true, msg: `存档已导入至槽位 ${SLOT_KEYS.indexOf(slotKey) + 1}。` });
      } catch (err) {
        resolve({ ok: false, msg: `导入失败：${err.message}` });
      }
    };
    reader.onerror = () => resolve({ ok: false, msg: '文件读取失败。' });
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────
// 十、游戏设置存储
// ─────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  theme     : 'pink',
  volume    : 0.8,
  sfxVolume : 0.6,
  textSpeed : 'normal',  // slow / normal / fast
  shortcuts : {},        // 自定义快捷键
};

/**
 * 读取设置（同步）
 * @returns {object}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 写入设置（同步）
 * @param {object} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

// ─────────────────────────────────────────────
// 十一、内部工具
// ─────────────────────────────────────────────

function _sizeStr(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function _tsStr(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} `
       + `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
