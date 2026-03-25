/**
 * items.js
 * 10.2 — 道具系统
 *
 * 【分类】消耗品 CONSUMABLE / 持久品 DURABLE / 任务道具 QUEST / 节日限定 FESTIVAL
 * 【获取】商店、活动奖励、NPC赠送、随机事件、图书馆借阅
 * 【背包】上限 30 格，超出须丢弃或出售（回收价 = 原价 × 30%）
 */

import { G }    from '../core/gameState.js';
import { addExp } from '../core/experience.js';
import { checkAchievements } from './achievements.js';

// ─────────────────────────────────────────────
// 一、道具分类枚举
// ─────────────────────────────────────────────

export const ITEM_CAT = {
  CONSUMABLE : 'consumable',   // 消耗品（使用后消失）
  DURABLE    : 'durable',      // 持久品（使用/装备，不消失）
  QUEST      : 'quest',        // 任务道具（不可出售、不可丢弃）
  FESTIVAL   : 'festival',     // 节日限定（每学期限定获取）
};

export const BAG_CAP = 30;     // 背包容量上限（格）
export const SELL_RATE = 0.3;  // 出售回收比例

// ─────────────────────────────────────────────
// 二、道具定义表
// ─────────────────────────────────────────────

/**
 * 道具定义
 * id, cat, name, desc
 * price        原价（金币）/ priceC（水晶）；二选一或同时存在
 * stackable    是否可叠加（消耗品默认 true，持久品默认 false）
 * source       获取来源描述数组
 * useEffect(G) 使用效果函数，返回 { ok, msg }
 * passive      持久品被动效果描述（不执行函数，由其他系统读取 flag）
 * questLock    任务道具：true 时不可出售/丢弃
 * festivalSem  节日限定：限定学期索引数组（0秋 1冬 2春 3夏）
 */
export const ITEMS = {

  // ══ 消耗品·低价（5~15金） ════════════════

  potion_hp_s: {
    id: 'potion_hp_s', cat: ITEM_CAT.CONSUMABLE,
    name: '小型复原药', stackable: true,
    desc: '以草药蒸馏而成的基础回复剂，恢复少量 HP。',
    price: 8, priceC: null,
    source: ['校园商店', '食堂', '随机事件'],
    useEffect(g) {
      const val = 20;
      if (g.hp >= g.hpMax) return { ok: false, msg: 'HP 已满，无需使用。' };
      g.hp = Math.min(g.hp + val, g.hpMax);
      return { ok: true, msg: `HP 恢复 ${val}。（当前 ${g.hp}/${g.hpMax}）` };
    },
  },
  potion_mp_s: {
    id: 'potion_mp_s', cat: ITEM_CAT.CONSUMABLE,
    name: '小型魔力剂', stackable: true,
    desc: '含有轻微魔力晶体粉末，快速补充少量 MP。',
    price: 10, priceC: null,
    source: ['校园商店', '图书馆借阅活动'],
    useEffect(g) {
      const val = 25;
      if (g.mp >= g.mpMax) return { ok: false, msg: 'MP 已满。' };
      g.mp = Math.min(g.mp + val, g.mpMax);
      return { ok: true, msg: `MP 恢复 ${val}。（当前 ${g.mp}/${g.mpMax}）` };
    },
  },
  potion_sp_s: {
    id: 'potion_sp_s', cat: ITEM_CAT.CONSUMABLE,
    name: '精力饮料', stackable: true,
    desc: '校内食堂特供提神饮料，含轻微魔法配方，快速恢复体力。',
    price: 5, priceC: null,
    source: ['食堂', '校园商店'],
    useEffect(g) {
      const val = 20;
      if (g.sp >= g.spMax) return { ok: false, msg: 'SP 已满。' };
      g.sp = Math.min(g.sp + val, g.spMax);
      return { ok: true, msg: `SP 恢复 ${val}。（当前 ${g.sp}/${g.spMax}）` };
    },
  },
  meal_extra: {
    id: 'meal_extra', cat: ITEM_CAT.CONSUMABLE,
    name: '食堂加餐券', stackable: true,
    desc: '可在食堂兑换一份额外餐食，补充体力与精神。',
    price: 6, priceC: null,
    source: ['食堂', '校园商店'],
    useEffect(g) {
      g.hp = Math.min(g.hp + 10, g.hpMax);
      g.sp = Math.min(g.sp + 15, g.spMax);
      return { ok: true, msg: 'HP +10，SP +15。饱腹感让你精神好了许多。' };
    },
  },
  scroll_focus: {
    id: 'scroll_focus', cat: ITEM_CAT.CONSUMABLE,
    name: '专注符卷', stackable: true,
    desc: '单次使用的术法纸卷，激活后在本时段内提升魔法修炼效率。',
    price: 12, priceC: null,
    source: ['校园商店', '成就奖励（全勤学徒）'],
    useEffect(g) {
      g.dialogueFlags['buff_focus_active'] = true;
      return { ok: true, msg: '专注状态激活，本时段魔法修炼经验 +30%。' };
    },
  },

  // ══ 消耗品·中价（20~50金） ════════════════

  potion_hp_m: {
    id: 'potion_hp_m', cat: ITEM_CAT.CONSUMABLE,
    name: '中型复原药', stackable: true,
    desc: '配方更为精炼，回复量可观的 HP 恢复剂。',
    price: 25, priceC: null,
    source: ['校园商店', 'NPC赠送'],
    useEffect(g) {
      const val = 55;
      if (g.hp >= g.hpMax) return { ok: false, msg: 'HP 已满。' };
      g.hp = Math.min(g.hp + val, g.hpMax);
      return { ok: true, msg: `HP 恢复 ${val}。` };
    },
  },
  potion_mp_m: {
    id: 'potion_mp_m', cat: ITEM_CAT.CONSUMABLE,
    name: '中型魔力剂', stackable: true,
    desc: '提纯度更高的魔力补充剂，显著恢复 MP。',
    price: 30, priceC: null,
    source: ['校园商店'],
    useEffect(g) {
      const val = 60;
      if (g.mp >= g.mpMax) return { ok: false, msg: 'MP 已满。' };
      g.mp = Math.min(g.mp + val, g.mpMax);
      return { ok: true, msg: `MP 恢复 ${val}。` };
    },
  },
  book_study: {
    id: 'book_study', cat: ITEM_CAT.CONSUMABLE,
    name: '精选习题册', stackable: true,
    desc: '某门课程的精编习题，使用后为该门课程增加平时分。',
    price: 20, priceC: null,
    source: ['图书馆', '校园商店'],
    useEffect(g) {
      // 对当前学期有效课程随机选一门加平时分
      const courses = Object.keys(g.courseProgress);
      if (!courses.length) return { ok: false, msg: '目前没有进行中的课程。' };
      const target = courses[Math.floor(Math.random() * courses.length)];
      g.courseProgress[target].regular = (g.courseProgress[target].regular || 0) + 2;
      addExp('int', 0.5, g);
      return { ok: true, msg: `【${target}】平时分 +2，智力经验小幅提升。` };
    },
  },
  antidote: {
    id: 'antidote', cat: ITEM_CAT.CONSUMABLE,
    name: '解毒剂', stackable: true,
    desc: '通用解毒配方，可消除中毒、腐蚀等负面状态。',
    price: 22, priceC: null,
    source: ['校园商店', '随机事件'],
    useEffect(g) {
      const had = g.dialogueFlags['status_poison'] || g.dialogueFlags['status_corrode'];
      delete g.dialogueFlags['status_poison'];
      delete g.dialogueFlags['status_corrode'];
      return had
        ? { ok: true,  msg: '负面状态已清除。' }
        : { ok: false, msg: '你当前没有中毒或腐蚀状态。' };
    },
  },

  // ══ 消耗品·高价（80~150金） ════════════════

  potion_hp_l: {
    id: 'potion_hp_l', cat: ITEM_CAT.CONSUMABLE,
    name: '高级复原药', stackable: true,
    desc: '顶级草药炼制，完整恢复大量 HP，并短暂提升体魄上限。',
    price: 90, priceC: null,
    source: ['校园商店（高级区）', '节日活动'],
    useEffect(g) {
      g.hp = Math.min(g.hp + 120, g.hpMax);
      return { ok: true, msg: `HP 恢复 120。` };
    },
  },
  elixir_full: {
    id: 'elixir_full', cat: ITEM_CAT.CONSUMABLE,
    name: '全复苏药剂', stackable: false,
    desc: '极为珍稀的全属性恢复药剂，HP/MP/SP 全部恢复至满。',
    price: 150, priceC: null,
    source: ['节日活动', 'NPC赠送（高好感）'],
    useEffect(g) {
      g.hp = g.hpMax; g.mp = g.mpMax; g.sp = g.spMax;
      return { ok: true, msg: 'HP / MP / SP 全部恢复至上限。' };
    },
  },
  ink_memory: {
    id: 'ink_memory', cat: ITEM_CAT.CONSUMABLE,
    name: '记忆墨水', stackable: true,
    desc: '涂抹于笔记上可强化记忆留存，下次考试前使用可提升考试评分系数。',
    price: 80, priceC: null,
    source: ['校园商店（高级区）', '图书馆'],
    useEffect(g) {
      g.dialogueFlags['buff_exam_memory'] = true;
      return { ok: true, msg: '记忆强化激活，下次考试分数系数 +15%。' };
    },
  },

  // ══ 稀有道具（水晶定价） ═════════════════

  crystal_focus: {
    id: 'crystal_focus', cat: ITEM_CAT.CONSUMABLE,
    name: '凝晶专注石', stackable: true,
    desc: '以魔力水晶为核心的消耗品，激活后本时段所有技能修炼经验 +50%，且 MP 消耗减半。',
    price: null, priceC: 2,
    source: ['成就奖励', 'NPC赠送（挚友级）'],
    useEffect(g) {
      g.dialogueFlags['buff_crystal_focus'] = true;
      return { ok: true, msg: '凝晶专注石激活：修炼经验 +50%，MP 消耗减半（本时段）。' };
    },
  },
  tome_rare: {
    id: 'tome_rare', cat: ITEM_CAT.CONSUMABLE,
    name: '秘术残卷', stackable: false,
    desc: '残缺的古代术法记录，阅读后随机解锁一个稀有魔法的习得条件。',
    price: null, priceC: 4,
    source: ['图书馆（深层）', '随机事件', '隐藏成就奖励'],
    useEffect(g) {
      // 随机给予一个稀有魔法的 dialogueFlag
      const rareFlags = [
        'unlocked_umbrae_curse',
        'unlocked_belli_strike',
        'unlocked_abyssi_call',
        'unlocked_nexus_break',
      ];
      const unlocked = rareFlags.filter(f => !g.dialogueFlags[f]);
      if (!unlocked.length) return { ok: false, msg: '你已研读过所有能解读的残卷内容。' };
      const chosen = unlocked[Math.floor(Math.random() * unlocked.length)];
      g.dialogueFlags[chosen] = true;
      return { ok: true, msg: '残卷中的记忆渗入你的意识——某种禁忌术法的脉络变得清晰起来。' };
    },
  },
  gift_ally: {
    id: 'gift_ally', cat: ITEM_CAT.CONSUMABLE,
    name: '盟友信物', stackable: false,
    desc: '成就「坚实后盾」解锁的专属礼物，赠予特定 NPC 可触发隐藏剧情。',
    price: null, priceC: 3,
    source: ['成就奖励（坚实后盾）'],
    useEffect(g) {
      g.dialogueFlags['gift_ally_ready'] = true;
      return { ok: true, msg: '信物已准备好，可在对话中赠予你的挚友。' };
    },
  },

  // ══ 持久品 ════════════════════════════════

  badge_honor: {
    id: 'badge_honor', cat: ITEM_CAT.DURABLE,
    name: '荣耀徽章', stackable: false,
    desc: '优秀学业成就的象征，佩戴后在本学部 NPC 中的好感度获得小幅加成。',
    price: null, priceC: null,  // 仅成就获得
    source: ['成就奖励（试炼无惧）'],
    passive: '本学部 NPC 好感度上限 +10，对话时额外友好判定。',
    useEffect(g) {
      g.dialogueFlags['equipped_badge_honor'] = !g.dialogueFlags['equipped_badge_honor'];
      const state = g.dialogueFlags['equipped_badge_honor'] ? '已佩戴' : '已取下';
      return { ok: true, msg: `荣耀徽章 ${state}。` };
    },
  },
  robe_dept: {
    id: 'robe_dept', cat: ITEM_CAT.DURABLE,
    name: '学部荣耀长袍', stackable: false,
    desc: '本学部之星的专属袍服，穿着时学部声望效果加深，NPC 态度更为恭敬。',
    price: null, priceC: null,
    source: ['成就奖励（本部之星）'],
    passive: '穿着时本学部 envHint 升一级显示，NPC 态度描述增加尊敬前缀。',
    useEffect(g) {
      g.dialogueFlags['equipped_robe_dept'] = !g.dialogueFlags['equipped_robe_dept'];
      const state = g.dialogueFlags['equipped_robe_dept'] ? '已穿上' : '已取下';
      return { ok: true, msg: `学部荣耀长袍 ${state}。` };
    },
  },
  map_full: {
    id: 'map_full', cat: ITEM_CAT.DURABLE,
    name: '全校详绘地图', stackable: false,
    desc: '详细标注了全部地点（含隐藏区域）的精绘地图，持有后解锁地图中的隐藏地点。',
    price: null, priceC: null,
    source: ['成就奖励（校园漫游者）'],
    passive: '持有时地图模态框显示隐藏地点入口。',
    useEffect(g) {
      g.dialogueFlags['has_full_map'] = true;
      return { ok: true, msg: '地图已仔细翻阅，隐藏地点已标注。' };
    },
  },
  lantern_night: {
    id: 'lantern_night', cat: ITEM_CAT.DURABLE,
    name: '夜行提灯', stackable: false,
    desc: '内嵌持续发光魔石的精巧提灯，夜间外出时降低风险事件概率。',
    price: 60, priceC: null,
    source: ['成就奖励（夜枭）', '校园商店（高级区）'],
    passive: '夜间（period=4）外出时，随机事件危险概率 -20%。',
    useEffect(g) {
      g.dialogueFlags['equipped_lantern'] = !g.dialogueFlags['equipped_lantern'];
      const state = g.dialogueFlags['equipped_lantern'] ? '已点亮并持有' : '已收起';
      return { ok: true, msg: `夜行提灯 ${state}。` };
    },
  },
  white_robe: {
    id: 'white_robe', cat: ITEM_CAT.DURABLE,
    name: '无瑕白袍', stackable: false,
    desc: '零违规通关的极稀有奖励，持有者在全校声望获得被动加成，部分特殊剧情中触发专属文本。',
    price: null, priceC: null,
    source: ['成就奖励（无瑕之人）'],
    passive: '全学部声望被动 +3（持有状态），特殊剧情触发专属文本。',
    useEffect(g) {
      g.dialogueFlags['equipped_white_robe'] = !g.dialogueFlags['equipped_white_robe'];
      const state = g.dialogueFlags['equipped_white_robe'] ? '已穿上' : '已取下';
      return { ok: true, msg: `无瑕白袍 ${state}。` };
    },
  },
  medal_semester: {
    id: 'medal_semester', cat: ITEM_CAT.DURABLE,
    name: '学期勋章', stackable: true,  // 每学期可获得一枚
    desc: '完成一个完整学期的纪念勋章，数量代表经历过的学期数。',
    price: null, priceC: null,
    source: ['成就奖励（学期终章）'],
    passive: '每枚勋章在下一学期开始时提供 +2 金币的基础奖励。',
    useEffect() {
      return { ok: false, msg: '这枚勋章是你历程的见证，无法直接使用。' };
    },
  },
  token_library: {
    id: 'token_library', cat: ITEM_CAT.DURABLE,
    name: '图书馆深层通行证', stackable: false,
    desc: '成绩优异者获赐的特殊通行证，可进入图书馆深层借阅稀有典籍。',
    price: null, priceC: null,
    source: ['成就奖励（学期清）'],
    passive: '持有时图书馆可借阅【秘术残卷】及其他稀有书目。',
    useEffect(g) {
      g.dialogueFlags['has_library_deep_pass'] = true;
      return { ok: true, msg: '通行证已激活，图书馆深层书架向你开放。' };
    },
  },
  purse_gold: {
    id: 'purse_gold', cat: ITEM_CAT.DURABLE,
    name: '扩容钱袋', stackable: false,
    desc: '施有空间魔法的皮质钱袋，持有后金币上限由默认扩展至 999。',
    price: null, priceC: null,
    source: ['成就奖励（积敛之主）'],
    passive: '金币存量上限扩展。',
    useEffect(g) {
      g.dialogueFlags['has_purse_gold'] = true;
      return { ok: true, msg: '扩容钱袋已收入，金币上限扩展生效。' };
    },
  },
  item_club_badge: {
    id: 'item_club_badge', cat: ITEM_CAT.DURABLE,
    name: '社团骨干徽标', stackable: false,
    desc: '社团核心成员的身份标识，佩戴后在社团活动中获得额外金币收益。',
    price: null, priceC: null,
    source: ['成就奖励（中流砥柱）'],
    passive: '参与社团活动金币收益 +3。',
    useEffect(g) {
      g.dialogueFlags['equipped_club_badge'] = !g.dialogueFlags['equipped_club_badge'];
      const state = g.dialogueFlags['equipped_club_badge'] ? '已佩戴' : '已取下';
      return { ok: true, msg: `社团骨干徽标 ${state}。` };
    },
  },

  // ══ 任务道具 ══════════════════════════════

  quest_letter: {
    id: 'quest_letter', cat: ITEM_CAT.QUEST,
    name: '密封信件', stackable: false, questLock: true,
    desc: '一封尚未开封的信件，委托人要求你亲手交付给指定人物。',
    price: null, priceC: null,
    source: ['NPC委托'],
    useEffect() {
      return { ok: false, msg: '这封信需要亲手交给指定人物，而非直接使用。' };
    },
  },
  quest_key: {
    id: 'quest_key', cat: ITEM_CAT.QUEST,
    name: '古旧钥匙', stackable: false, questLock: true,
    desc: '不知通往何处的钥匙，散发着隐约的魔力残留。',
    price: null, priceC: null,
    source: ['随机事件', 'NPC赠送'],
    useEffect(g) {
      if (!g.dialogueFlags['near_locked_door']) return { ok: false, msg: '这里没有可以开启的锁。' };
      g.dialogueFlags['ancient_door_opened'] = true;
      return { ok: true, msg: '锁簧咔哒一响，尘封已久的门缓缓打开。' };
    },
  },

  // ══ 节日限定 ══════════════════════════════

  festival_lantern: {
    id: 'festival_lantern', cat: ITEM_CAT.FESTIVAL,
    name: '星愿灯笼', stackable: true,
    festivalSem: [0, 2],  // 秋季 & 春季限定
    desc: '节日期间在集市购入的精巧灯笼，可在特定地点放飞以触发节日剧情。',
    price: 15, priceC: null,
    source: ['节日集市'],
    useEffect(g) {
      if (!['horti', 'campus', 'forum'].includes(g.locKey))
        return { ok: false, msg: '此处不适合放飞灯笼，换个开阔的地方试试。' };
      g.dialogueFlags['festival_lantern_released'] = true;
      return { ok: true, msg: '灯笼缓缓升入夜空，带着你的心愿飘向星河……触发了节日特别剧情。' };
    },
  },
  festival_cake: {
    id: 'festival_cake', cat: ITEM_CAT.FESTIVAL,
    name: '节日蜜糕', stackable: true,
    festivalSem: [1, 3],  // 冬季 & 夏季限定
    desc: '节日特制甜点，与他人分享可提升好感度，自用则补充 HP 和 SP。',
    price: 12, priceC: null,
    source: ['节日集市', '食堂（节日期间）'],
    useEffect(g) {
      g.hp = Math.min(g.hp + 15, g.hpMax);
      g.sp = Math.min(g.sp + 20, g.spMax);
      return { ok: true, msg: '甜蜜的滋味让你心情愉快。HP +15，SP +20。' };
    },
  },
  festival_firework: {
    id: 'festival_firework', cat: ITEM_CAT.FESTIVAL,
    name: '彩焰烟花', stackable: true,
    festivalSem: [0, 1, 2, 3],  // 全学期节日可得
    desc: '节日庆典专用烟花，在特定地点燃放可吸引周围 NPC 注意，触发集体好感度小幅提升。',
    price: 18, priceC: null,
    source: ['节日集市'],
    useEffect(g) {
      if (!['campus', 'forum', 'atrium'].includes(g.locKey))
        return { ok: false, msg: '这里不适合燃放烟花，去广场或大厅试试。' };
      // 对所有 NPC 好感度 +2（上限100）
      for (const npcId in g.relations) {
        g.relations[npcId] = Math.min(100, (g.relations[npcId] ?? 0) + 2);
      }
      g.dialogueFlags['festival_firework_used'] = true;
      return { ok: true, msg: '绚烂的烟花在夜空中绽放，周围的人都投来欣喜的目光。周围 NPC 好感度 +2。' };
    },
  },
};

// ─────────────────────────────────────────────
// 三、背包操作
// ─────────────────────────────────────────────

/**
 * 获取背包已用格数
 * 可叠加道具同一 id 占 1 格
 */
export function bagUsed(bag) {
  return Object.keys(bag ?? {}).length;
}

/**
 * 背包是否已满（不可叠加新 id 时）
 * @param {string} itemId
 */
export function bagFull(bag, itemId) {
  if (bag[itemId] !== undefined) {
    const def = ITEMS[itemId];
    if (def?.stackable) return false; // 已有且可叠加，不占新格
  }
  return bagUsed(bag) >= BAG_CAP;
}

/**
 * 向背包添加道具
 * @param {string} itemId
 * @param {number} [qty=1]
 * @returns {{ ok: boolean, msg: string }}
 */
export function addItem(itemId, qty = 1) {
  const def = ITEMS[itemId];
  if (!def) return { ok: false, msg: '未知道具 ID。' };

  if (!G.bag) G.bag = {};

  // 背包容量检查
  if (bagFull(G.bag, itemId)) {
    return { ok: false, msg: `背包已满（${BAG_CAP}格），无法再收纳新道具。` };
  }

  if (def.stackable) {
    G.bag[itemId] = (G.bag[itemId] ?? 0) + qty;
  } else {
    if (G.bag[itemId] !== undefined)
      return { ok: false, msg: `你已持有【${def.name}】，无法重复获取。` };
    G.bag[itemId] = 1;
  }

  checkAchievements();
  return { ok: true, msg: `获得【${def.name}】×${qty}。` };
}

/**
 * 使用道具（消耗品使用后扣除，持久品调用 useEffect 但不扣除）
 * @param {string} itemId
 * @returns {{ ok: boolean, msg: string }}
 */
export function useItem(itemId) {
  const def = ITEMS[itemId];
  if (!def) return { ok: false, msg: '未知道具。' };
  if (!G.bag || G.bag[itemId] === undefined || G.bag[itemId] <= 0)
    return { ok: false, msg: `背包中没有【${def.name}】。` };

  const result = def.useEffect(G);
  if (!result.ok) return result;

  // 消耗品使用后减少数量
  if (def.cat === ITEM_CAT.CONSUMABLE || def.cat === ITEM_CAT.FESTIVAL) {
    G.bag[itemId]--;
    if (G.bag[itemId] <= 0) delete G.bag[itemId];
  }

  checkAchievements();
  return result;
}

/**
 * 丢弃道具（任务道具不可丢弃）
 * @param {string} itemId
 * @param {number} [qty=1]
 * @returns {{ ok: boolean, msg: string }}
 */
export function dropItem(itemId, qty = 1) {
  const def = ITEMS[itemId];
  if (!def) return { ok: false, msg: '未知道具。' };
  if (def.questLock) return { ok: false, msg: `【${def.name}】是任务道具，无法丢弃。` };
  if (!G.bag?.[itemId]) return { ok: false, msg: `背包中没有【${def.name}】。` };

  G.bag[itemId] = Math.max(0, G.bag[itemId] - qty);
  if (G.bag[itemId] <= 0) delete G.bag[itemId];
  return { ok: true, msg: `丢弃了【${def.name}】×${qty}。` };
}

/**
 * 出售道具（任务道具不可出售，回收价 = 原价 × 30%）
 * @param {string} itemId
 * @param {number} [qty=1]
 * @returns {{ ok: boolean, msg: string, earned?: number }}
 */
export function sellItem(itemId, qty = 1) {
  const def = ITEMS[itemId];
  if (!def) return { ok: false, msg: '未知道具。' };
  if (def.questLock) return { ok: false, msg: `【${def.name}】是任务道具，无法出售。` };
  if (!def.price && !def.priceC) return { ok: false, msg: `【${def.name}】无法出售。` };
  if (!G.bag?.[itemId] || G.bag[itemId] < qty)
    return { ok: false, msg: `背包中【${def.name}】数量不足。` };

  let earnedGold = 0, earnedCrystal = 0;
  if (def.price) {
    earnedGold = Math.floor(def.price * SELL_RATE * qty);
    G.gold += earnedGold;
  }
  if (def.priceC) {
    earnedCrystal = Math.floor(def.priceC * SELL_RATE * qty);
    G.crystal += earnedCrystal;
  }

  G.bag[itemId] -= qty;
  if (G.bag[itemId] <= 0) delete G.bag[itemId];

  const earnStr = [
    earnedGold    ? `${earnedGold} 金币` : '',
    earnedCrystal ? `${earnedCrystal} 水晶` : '',
  ].filter(Boolean).join(' + ');

  return { ok: true, msg: `出售【${def.name}】×${qty}，回收 ${earnStr}（原价30%）。`, earnedGold, earnedCrystal };
}

/**
 * 获取背包展示列表（供 UI 渲染）
 */
export function getBagList() {
  if (!G.bag) return [];
  return Object.entries(G.bag)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const def = ITEMS[id] ?? { id, name: id, desc: '未知道具', cat: 'unknown' };
      return {
        id, qty,
        name    : def.name,
        desc    : def.desc,
        cat     : def.cat,
        price   : def.price,
        priceC  : def.priceC,
        sellable: !def.questLock && (!!def.price || !!def.priceC),
        usable  : true,
        passive : def.passive ?? null,
      };
    });
}
