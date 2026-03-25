// 节日与不定期活动数据库
// 对应策划书 §6.2 年度节日 / §6.3 不定期校园活动 / §7.2

// ── 年度五大节日 ──────────────────────────────────────────────
// sem:    学期索引 0=秋 1=冬 2=春 3=夏
// week:   触发周次
// length: 持续游戏日数

export const FESTIVALS = {

  // ── 星辰祭 ────────────────────────────────────────────────
  stellarum: {
    id: 'stellarum',
    name: '星辰祭',
    sub:  'Festum Stellarum',
    sem: 0, week: 3, length: 2,
    desc: '学年开始时的全院庆典，纪念建院日。白天学部展示，夜间观星许愿。',
    activities: [
      '学部摊位巡游（每学部设一个展示摊位）',
      '新生欢迎晚宴',
      '观星许愿仪式',
    ],
    rewards: [
      { type: 'item',   key: 'badge_stellarum', label: '星辰祭纪念徽（成就道具）' },
      { type: 'repute', key: 'own_dept',         value: 5, label: '本学部声望 +5（参与本学部展示时）' },
    ],
  },

  // ── 冬焰夜 ────────────────────────────────────────────────
  ignis: {
    id: 'ignis',
    name: '冬焰夜',
    sub:  'Nox Ignis Hiemalis',
    sem: 1, week: 10, length: 1,
    desc: '冬至之夜的篝火庆典。炉铸学部特制「永冬火」，学子围火交换手制小礼物。',
    activities: [
      '篝火点燃仪式',
      '礼物交换（影响NPC好感度）',
      '冬季传说讲述（半身人学子高光时刻）',
      '热饮品鉴',
    ],
    rewards: [
      { type: 'item',      key: 'bottle_ignis', label: '冬焰小瓶（使用后 SP +20）' },
      { type: 'relation',  key: 'gift_target',  value: 10, label: '礼物交换对象好感度 +10' },
    ],
  },

  // ── 绿集 ──────────────────────────────────────────────────
  viridis: {
    id: 'viridis',
    name: '绿集',
    sub:  'Mercatus Viridis',
    sem: 2, week: 5, length: 3,
    host: 'silvae',
    desc: '翠灵学部主办的全院药草交易会，翠灵温室群全面开放参观。',
    activities: [
      '药草交易（买卖道具）',
      '药剂配方比赛',
      '温室参观导览',
      '翠灵学部特别公开课',
    ],
    rewards: [
      { type: 'item',   key: 'potion_viridis_limited', label: '绿集限定药剂' },
      { type: 'repute', key: 'silvae',                  value: 8, label: '翠灵学部声望 +8' },
      { type: 'misc',   label: '稀有药材获取机会' },
    ],
  },

  // ── 裂风锦标赛 ────────────────────────────────────────────
  ruptiventi: {
    id: 'ruptiventi',
    name: '裂风锦标赛',
    sub:  'Ludus Ruptiventi',
    sem: 2, week: 12, length: 5,
    host: 'belli',
    desc: '战阵学部主办，全院规模最大竞技赛事，设个人赛和团体赛。',
    activities: [
      '个人淘汰赛',
      '三人团体赛',
      '跨学部挑战赛',
      '决赛盛典',
    ],
    rewards: [
      { type: 'exp',    key: 'phy',   label: '参赛者获得体魄经验（胜负影响）' },
      { type: 'repute', key: 'dept',  label: '学部声望变化（胜负影响）' },
      { type: 'gold',   label: '观赛下注系统：可赢取或失去少量金币' },
      { type: 'title',  key: 'crown_ruptiventi', label: '冠军获得「裂风之冠」称号' },
    ],
    // 参加报名须通过裂风竞技会推荐
    joinReq: { club: 'arena' },
  },

  // ── 回声祭 ────────────────────────────────────────────────
  resonantiae: {
    id: 'resonantiae',
    name: '回声祭',
    sub:  'Festum Resonantiae',
    sem: 2, week: 15, length: 2,
    host: 'abyssi',
    desc: '学年结束前的告别庆典，由渊潮学部人鱼学子主导，核心是晖湖畔合声之夜。',
    activities: [
      '合声之夜（月弧剧社协办）',
      '湖畔灯放（许愿灯顺湖漂流）',
      '学年回顾座谈',
      '告别聚餐',
    ],
    rewards: [
      { type: 'item',     key: 'echo_record', label: '回声之音（成就道具，记录本学年关键选择摘要）' },
      { type: 'relation', key: 'all_npc',      value: 3, label: '全NPC好感度 +3（氛围加成）' },
    ],
  },
};

// ── 不定期校园活动 ────────────────────────────────────────────
// trigger: 触发条件类型
//   'repute_diff' = 两学部声望差距触发
//   'week_1'      = 开学第一周
//   'per_sem'     = 每学期一次（随机周次）
//   'sem_end'     = 学期末
//   'random'      = 随机/魔力潮汐

export const CAMPUS_EVENTS = {

  dept_rivalry: {
    id: 'dept_rivalry',
    name: '学部对抗赛',
    desc: '两个学部之间的非正式竞赛（学术问答、魔法对决或创意比拼）。',
    trigger: 'repute_diff',
    effect: '胜负影响学部声望',
  },

  welcome_party: {
    id: 'welcome_party',
    name: '新生欢迎会',
    desc: '开学第一周由各学部自行组织的内部聚会，建立学部内NPC关系的第一个机会。',
    trigger: 'week_1',
    effect: '学部内NPC好感度机会',
  },

  magic_expo: {
    id: 'magic_expo',
    name: '魔法展览日',
    desc: '各学部展示本学期教学成果和学生作品。炉铸「呈工礼」和翠灵温室开放均在此日。',
    trigger: 'per_sem',
    effect: '学部声望加成',
  },

  theatre_show: {
    id: 'theatre_show',
    name: '月弧台公演',
    desc: '月弧剧社每学期末大型公演，可选择参与演出或观看。',
    trigger: 'sem_end',
    participateReward: { exp: { cha: 2 } },
    watchReward: { relation: 3 },
  },

  stargazing: {
    id: 'stargazing',
    name: '星望塔开放夜',
    desc: '星脉学部不定期开放天文台供全院学生观星。触发概率与天气和魔力潮汐有关。',
    trigger: 'random',
    effect: '感知经验加成，触发特殊天文事件',
  },
};

// ── 工具函数 ─────────────────────────────────────────────────

/**
 * 检查当前时间是否处于某节日期间
 * @param {string} festId
 * @param {object} G - 游戏状态
 * @returns {boolean}
 */
export function isFestivalActive(festId, G) {
  const f = FESTIVALS[festId];
  if (!f) return false;
  if (G.sem !== f.sem) return false;
  return G.week >= f.week && G.week < f.week + f.length;
}

/**
 * 获取当前时间正在进行的节日（可能为 null）
 */
export function getCurrentFestival(G) {
  for (const f of Object.values(FESTIVALS)) {
    if (isFestivalActive(f.id, G)) return f;
  }
  return null;
}

/**
 * 获取本学期即将到来的节日列表（按周次排序）
 */
export function getUpcomingFestivals(G) {
  return Object.values(FESTIVALS)
    .filter(f => f.sem === G.sem && f.week > G.week)
    .sort((a, b) => a.week - b.week);
}
