// 随机事件系统
// 对应策划书 §7.3 随机事件系统
//
// 事件池按「地点 × 时间段 × 属性/关系」分类
// 类型：fortune（奇遇/正面）| trouble（麻烦/负面）| neutral（中立叙事）| choice（选择型）
// 触发点：advTime 推进时 + 自由时间行动后
// 权重受季节（sem）和时间段（period）影响

import { G } from '../core/gameState.js';
import { CHAR } from '../core/character.js';
import { addExp } from '../core/experience.js';
import { changeRel } from '../core/relationship.js';

// ── 事件类型常量 ──────────────────────────────────────────────
export const EVT_TYPE = {
  FORTUNE: 'fortune',
  TROUBLE: 'trouble',
  NEUTRAL: 'neutral',
  CHOICE:  'choice',
};

// ── 触发器配置 ────────────────────────────────────────────────
export const TRIGGER_CONFIG = {
  BASE_CHANCE_ADVANCE: 0.18,
  BASE_CHANCE_ACTION:  0.12,
  COOLDOWN_PERIODS:    2,
};

// ── 事件池 ────────────────────────────────────────────────────
export const EVENT_POOL = [

  // ════════════════════════════════════════════════════════
  // 银叶大道 Via Argentea
  // ════════════════════════════════════════════════════════

  {
    id: 'VIA_001', type: EVT_TYPE.CHOICE, weight: 6,
    filter: { locs: ['via'], periods: [0, 2, 3] },
    text: '公告栏前聚着几个学子，你走近一看——上面新贴了一张通知，墨迹还未干透。',
    options: [
      { text: '仔细阅读通知', outcome: { log: '认真阅读公告', text: '获得学院最新动态信息。', effects: [{ type: 'stat', stat: 'int', amount: 0.1 }] } },
      { text: '随便扫一眼', outcome: { effects: [] } },
      { text: '无视，继续走', outcome: { effects: [] } },
    ],
  },

  {
    id: 'VIA_002', type: EVT_TYPE.FORTUNE, weight: 5,
    filter: { locs: ['via'], periods: [0, 3], sems: [0] },
    text: '一片银叶不偏不倚落在你的肩上，在阳光下折射出细碎的光。旁边经过的学子朝你看了一眼，嘴角微微上扬。',
    options: [
      { text: '捡起银叶，夹进笔记本', outcome: { log: '获得银叶书签', effects: [{ type: 'item', key: 'silver_leaf_bookmark', label: '银叶书签' }] } },
      { text: '让它飘走', outcome: { effects: [{ type: 'sp', delta: 2 }] } },
    ],
  },

  {
    id: 'VIA_003', type: EVT_TYPE.CHOICE, weight: 4,
    filter: { locs: ['via'], periods: [1, 2] },
    text: '一个你不认识的学子从对面走来，步伐匆忙，手里的书快要掉了。',
    options: [
      { text: '帮对方捡起书', outcome: { log: '帮忙捡书', text: '对方道谢，互报名字。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'met_random_npc_via', value: true }] } },
      { text: '侧身让路走过', outcome: { effects: [] } },
    ],
  },

  {
    id: 'VIA_004', type: EVT_TYPE.CHOICE, weight: 2,
    filter: { locs: ['via'], periods: [3] },
    text: '你走过的那盏魔力路灯突然熄灭，周围陷入短暂的昏暗。路灯发出微弱的嗡鸣，似乎在等待有魔力的人修复它。',
    options: [
      { text: '尝试修复路灯', stat: { key: 'mag', min: 12 }, outcome: { log: '修复路灯', text: '路灯恢复照明，附近的学子投来赞许的目光。', effects: [{ type: 'stat', stat: 'mag', amount: 0.3 }, { type: 'mp', delta: -8 }, { type: 'repute', deptKey: 'own', delta: 2 }] } },
      { text: '去学生事务大厅报告', outcome: { log: '上报故障', effects: [{ type: 'repute', deptKey: 'own', delta: 1 }] } },
      { text: '绕道走过', outcome: { effects: [] } },
    ],
  },

  {
    id: 'VIA_005', type: EVT_TYPE.FORTUNE, weight: 8,
    filter: { locs: ['via'], periods: [2, 3], weeks: [1, 2, 3] },
    text: '大道两侧摆着五六个社团招新摊位，各自张贴着花花绿绿的招牌。有人正在朝你招手。',
    options: [
      { text: '逐一了解各社团', outcome: { log: '了解社团情况', effects: [{ type: 'flag', key: 'know_all_clubs', value: true }] } },
      { text: '走向感兴趣的摊位', outcome: { log: '与社团成员互动', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }] } },
      { text: '快步走过', outcome: { effects: [] } },
    ],
  },

  {
    id: 'VIA_006', type: EVT_TYPE.CHOICE, weight: 7,
    filter: { locs: ['via'], periods: [0] },
    text: '战阵学部的学子正在大道旁列队晨练，整齐的呼喝声穿透薄雾。领队的高年级学生扫了你一眼。',
    options: [
      { text: '跟着跑两圈', outcome: { log: '加入晨练', text: '汗水打湿了衣衫，却精神一振。', effects: [{ type: 'sp', delta: 5 }, { type: 'stat', stat: 'phy', amount: 0.2 }, { type: 'repute', deptKey: 'belli', delta: 1 }] } },
      { text: '停下来观看', outcome: { effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '绕道走过', outcome: { effects: [] } },
    ],
  },

  {
    id: 'VIA_007', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['via'], periods: [1, 2] },
    text: '你在路边石凳旁看到一本翻开的笔记，密密麻麻的字迹，封面上写着某个学部的名字——但没有写主人姓名。',
    options: [
      { text: '送到学生事务大厅失物招领', outcome: { log: '归还失物', text: '第二天笔记主人找上门道谢。', effects: [{ type: 'flag', key: 'notebook_quest', value: 'returned' }] } },
      { text: '翻看内容再决定', outcome: { log: '翻阅笔记', effects: [{ type: 'stat', stat: 'int', amount: 0.2 }, { type: 'flag', key: 'notebook_quest', value: 'read' }] } },
      { text: '放回原处', outcome: { effects: [] } },
      { text: '据为己有', outcome: { log: '拿走笔记', text: '笔记内容详尽，但心里有些不踏实。', effects: [{ type: 'stat', stat: 'int', amount: 0.3 }, { type: 'flag', key: 'notebook_quest', value: 'taken' }] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 晖湖畔花园 Horti Lacustres
  // ════════════════════════════════════════════════════════

  {
    id: 'HORTI_001', type: EVT_TYPE.CHOICE, weight: 4,
    filter: { locs: ['horti'], periods: [2, 3] },
    text: '湖边坐着一位年迈的矮人，手持鱼竿，面前放着一个空鱼桶。他没有看你，但开口说话了：「你看起来有心事。」',
    options: [
      { text: '坐下来聊聊', outcome: { log: '与老人交谈', text: '老人话不多，但每句话都令人若有所思。', effects: [{ type: 'sp', delta: 8 }, { type: 'stat', stat: 'sen', amount: 0.2 }] } },
      { text: '礼貌地说没事，继续走', outcome: { effects: [{ type: 'sp', delta: 3 }] } },
      { text: '问他是谁', outcome: { log: '发现老人身份', text: '老人是已退休的炉铸学部前教授，解锁特殊对话支线。', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'branch', branchId: 'retired_professor' }] } },
    ],
  },

  {
    id: 'HORTI_002', type: EVT_TYPE.CHOICE, weight: 5,
    filter: { locs: ['horti'], periods: [0, 1] },
    text: '几个翠灵学部的学子正在整理花园的魔法植物，其中一人因为一株不配合的藤蔓而焦头烂额。',
    options: [
      { text: '主动帮忙', outcome: { log: '帮忙整理植物', text: '藤蔓在两人的配合下终于安分下来。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'repute', deptKey: 'silvae', delta: 3 }, { type: 'item', key: 'herb_bundle', label: '药草束' }] } },
      { text: '在旁边出主意', outcome: { effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'repute', deptKey: 'silvae', delta: 1 }] } },
      { text: '绕开走', outcome: { effects: [] } },
    ],
  },

  {
    id: 'HORTI_003', type: EVT_TYPE.CHOICE, weight: 8,
    filter: { locs: ['horti'], weeks: [6, 7, 8, 14, 15, 16] },
    text: '草坪上坐满了捧着厚书的学子，空气里弥漫着焦虑和墨水的气息。有人朝你举了举手里的笔记，用眼神询问：要不要一起复习？',
    options: [
      { text: '加入复习小组', outcome: { log: '加入复习小组', effects: [{ type: 'stat', stat: 'int', amount: 0.2 }, { type: 'mp', delta: -5 }, { type: 'flag', key: 'group_study_bonus', value: true }] } },
      { text: '找个安静角落自己复习', outcome: { log: '独自复习', effects: [{ type: 'stat', stat: 'int', amount: 0.3 }, { type: 'mp', delta: -8 }, { type: 'flag', key: 'solo_study_bonus', value: true }] } },
      { text: '发现自己一点都不想复习', outcome: { log: '躺草坪上放空', effects: [{ type: 'sp', delta: 5 }] } },
    ],
  },

  {
    id: 'HORTI_004', type: EVT_TYPE.CHOICE, weight: 6,
    filter: { locs: ['horti'], periods: [3] },
    text: '月弧台传来断断续续的歌声和台词朗诵，月弧剧社正在排练。舞台上的人注意到了你，喊了一声：「要不要进来看看？」',
    options: [
      { text: '进去观看', outcome: { log: '观看排练', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'theatre_intro', value: true }] } },
      { text: '站在外面听了一会儿再走', outcome: { effects: [{ type: 'sp', delta: 3 }] } },
      { text: '婉拒，继续散步', outcome: { effects: [] } },
    ],
  },

  {
    id: 'HORTI_005', type: EVT_TYPE.CHOICE, weight: 2,
    filter: { locs: ['horti'], periods: [4] },
    text: '夜深人静，晖湖的湖面上出现了隐约的光点，像是有什么在水下缓缓移动。这不是月光的反射——月亮在你背后。',
    options: [
      { text: '靠近观察', stat: { key: 'sen', min: 13 }, outcome: { log: '发现夜光藻', text: '是一种罕见的夜光藻，在水面下缓慢漂流，美得令人窒息。', effects: [{ type: 'stat', stat: 'sen', amount: 0.3 }, { type: 'item', key: 'bioluminescent_algae', label: '夜光藻样本' }] } },
      { text: '记录在日记里', outcome: { log: '记录见闻', effects: [{ type: 'stat', stat: 'int', amount: 0.1 }, { type: 'flag', key: 'curious_nature', value: true }] } },
      { text: '觉得有些诡异，快步离开', outcome: { effects: [] } },
    ],
  },

  {
    id: 'HORTI_006', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['horti'], periods: [2, 3] },
    text: '凉亭里两个学子正在激烈争论，声音压得很低但情绪明显激动。你能听出是关于某次课堂分组作业的分歧。',
    options: [
      { text: '走过去调解', outcome: { log: '调解争论', text: '凭着你冷静的态度，两人的情绪都缓和下来。', effects: [{ type: 'stat', stat: 'cha', amount: 0.2 }, { type: 'mp', delta: -3 }] } },
      { text: '假装没看见走过', outcome: { effects: [] } },
      { text: '站远一点等他们说完', outcome: { log: '旁听争论', text: '无意中了解了一些课程评分细节。', effects: [{ type: 'stat', stat: 'int', amount: 0.1 }] } },
    ],
  },

  {
    id: 'HORTI_007', type: EVT_TYPE.CHOICE, weight: 4,
    filter: { locs: ['horti'], periods: [0, 3] },
    text: '石桥中央站着一个人，靠着栏杆望着湖面，背对着你。从身影和校服颜色来判断，是某个学部的学生——看起来情绪不太好。',
    options: [
      { text: '上前搭话', outcome: { log: '主动搭话', text: '对方愣了一下，随即说了谢谢——也许只是需要有人在旁边。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'branch', branchId: 'bridge_stranger' }] } },
      { text: '悄悄从旁边走过', outcome: { log: '未打扰对方', effects: [{ type: 'flag', key: 'bridge_did_not_disturb', value: true }] } },
      { text: '在远处确认对方状态再决定', stat: { key: 'sen', min: 10 }, outcome: { log: '观察后决定', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'flag', key: 'bridge_read_mood', value: true }] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 中央广场 Forum Centrale
  // ════════════════════════════════════════════════════════

  {
    id: 'FORUM_001', type: EVT_TYPE.CHOICE, weight: 9,
    filter: { locs: ['forum'], sems: [0], weeks: [1, 2] },
    text: '纪念碑前站着几个和你一样的新生，仰头看着石柱上的浮雕，交头接耳。其中一人用手指着人类与精灵握手的浮雕说：「这就是建院的两个人？」',
    options: [
      { text: '加入他们，分享自己知道的历史', outcome: { log: '分享历史知识', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'new_student_connections', value: true }] } },
      { text: '纠正他们的错误认知', stat: { key: 'int', min: 12 }, outcome: { log: '纠正错误', text: '你引经据典，对方听完若有所思地点点头。', effects: [{ type: 'stat', stat: 'int', amount: 0.1 }, { type: 'stat', stat: 'cha', amount: 0.1 }] } },
      { text: '默默绕开', outcome: { effects: [] } },
    ],
  },

  {
    id: 'FORUM_002', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['forum'] },
    weightMod: [{ period: 1, mul: 1.3 }, { period: 2, mul: 1.3 }],
    text: '广场一角，曦光学部和暮影学部的学子正在进行一场激烈的口头交锋，引来不少围观者。双方声音越来越大。',
    options: [
      { text: '围观', outcome: { log: '旁观学部对立', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '试图劝架', stat: { key: 'cha', min: 13 }, outcome: { log: '成功劝架', text: '双方在你的斡旋下各退一步，场面平息。', effects: [{ type: 'stat', stat: 'cha', amount: 0.3 }, { type: 'repute', deptKey: 'lucis', delta: 1 }, { type: 'repute', deptKey: 'umbrae', delta: 1 }] } },
      { text: '走过去站在某一侧', outcome: { log: '选择立场', effects: [{ type: 'repute', deptKey: 'own', delta: 3 }] } },
      { text: '快步离开', outcome: { effects: [] } },
    ],
  },

  {
    id: 'FORUM_003', type: EVT_TYPE.FORTUNE, weight: 4,
    filter: { locs: ['forum'], periods: [2, 3] },
    text: '一个魅魔学生正在广场中央进行心象投射的非正式展示——他将脑海中的图像投射到空中，像一场无声的烟火。路过的人纷纷停下来看。',
    options: [
      { text: '停下来欣赏', outcome: { effects: [{ type: 'sp', delta: 5 }] } },
      { text: '拍手叫好', outcome: { log: '热情鼓掌', text: '表演者朝你笑了笑，你们目光交汇了片刻。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'met_fey_performer', value: true }] } },
      { text: '路过时顺口称赞一句', outcome: { effects: [{ type: 'stat', stat: 'cha', amount: 0.05 }] } },
    ],
  },

  {
    id: 'FORUM_004', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['forum'], periods: [0, 3] },
    text: '你在广场石凳上发现了一件折叠整齐的深蓝外袍，上面别着某学部的徽章，但没有名字。',
    options: [
      { text: '送到学生事务大厅', outcome: { log: '归还外袍', text: '翌日主人来认领，两人因此相识。', effects: [{ type: 'flag', key: 'cloak_quest', value: 'returned' }] } },
      { text: '留在原地等主人回来', outcome: { log: '等候失主', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'cloak_quest', value: 'waited' }] } },
      { text: '披上看看合不合适', outcome: { log: '试穿外袍', text: '袖子长了一截，不太合身。你把它叠好放回去。', effects: [] } },
    ],
  },

  {
    id: 'FORUM_005', type: EVT_TYPE.CHOICE, weight: 6,
    filter: { locs: ['forum'], periods: [2, 3] },
    text: '银羽辩论社在广场搭起了简易讲台，今天的辩题：「魔法修习是否应设置种族门槛？」台上两位辩手各执一词，台下已聚了不少人。',
    options: [
      { text: '认真听完全程', outcome: { log: '聆听辩论', effects: [{ type: 'stat', stat: 'int', amount: 0.2 }, { type: 'flag', key: 'debate_society_aware', value: true }] } },
      { text: '在台下发言参与讨论', stat: { key: 'cha', min: 12 }, outcome: { log: '参与辩论', text: '你的观点引发了几个人的注意，散场后有人主动来交流。', effects: [{ type: 'stat', stat: 'cha', amount: 0.2 }, { type: 'stat', stat: 'int', amount: 0.1 }, { type: 'flag', key: 'debate_society_noticed', value: true }] } },
      { text: '辩了几句就走', outcome: { effects: [] } },
    ],
  },

  {
    id: 'FORUM_006', type: EVT_TYPE.CHOICE, weight: 5,
    filter: { locs: ['forum'], sems: [0], weeks: [1, 2] },
    text: '一个拿着地图转来转去的新生看起来完全不知道自己在哪里，手里还提着一大袋行李，表情快要哭出来了。',
    options: [
      { text: '上前帮忙指路', outcome: { log: '指引新生', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'helped_lost_freshman', value: true }] } },
      { text: '帮对方拿行李，一路送过去', outcome: { log: '护送新生', text: '一路上聊了起来，对方感激不已。', effects: [{ type: 'stat', stat: 'cha', amount: 0.15 }, { type: 'sp', delta: -3 }, { type: 'flag', key: 'helped_lost_freshman', value: true }] } },
      { text: '路过时瞥了一眼', outcome: { effects: [] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 落星操场 Campus Stellarum
  // ════════════════════════════════════════════════════════

  {
    id: 'CAMPUS_001', type: EVT_TYPE.CHOICE, weight: 7,
    filter: { locs: ['campus'], periods: [0] },
    text: '操场跑道上，一个看起来精力旺盛得离谱的学子正在绕圈慢跑，看到你走来，朝你挥了挥手：「要一起吗？就三圈。」',
    options: [
      { text: '加入', outcome: { log: '一起晨跑', text: '跑完三圈，呼吸平稳下来，精神却更好了。', effects: [{ type: 'stat', stat: 'phy', amount: 0.2 }, { type: 'sp', delta: 5 }, { type: 'flag', key: 'met_campus_jogger', value: true }] } },
      { text: '婉拒，自己热身一下', outcome: { effects: [{ type: 'stat', stat: 'phy', amount: 0.1 }, { type: 'sp', delta: 3 }] } },
      { text: '找个看台坐下来发呆', outcome: { effects: [{ type: 'sp', delta: 5 }] } },
    ],
  },

  {
    id: 'CAMPUS_002', type: EVT_TYPE.CHOICE, weight: 4,
    filter: { locs: ['campus'], periods: [2, 3] },
    text: '操场上两个学部的学生正在进行一场混战式的魔法对抗游戏，规则看起来是临时制定的，但参与者玩得很起劲。有人朝你喊：「缺人，进来凑一个！」',
    options: [
      { text: '加入', outcome: { log: '参与友谊赛', text: '打得热火朝天，赢了两局又输了一局。', effects: [{ type: 'stat', stat: 'phy', amount: 0.3 }, { type: 'mp', delta: -15 }, { type: 'sp', delta: -5 }, { type: 'repute', deptKey: 'own', delta: 2 }] } },
      { text: '在看台上观战', outcome: { effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '拒绝，绕道走', outcome: { effects: [] } },
    ],
  },

  {
    id: 'CAMPUS_003', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['campus'], periods: [2, 3] },
    text: '操场一角，一个龙裔学生正对着草地重复练习着某个动作，周围已经烧出了几个焦痕。他没有注意到你，专注得近乎入迷。',
    options: [
      { text: '观察一会儿再走', outcome: { log: '观察龙裔训练', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '走近打招呼', outcome: { log: '打招呼', text: '对方被打断练习，微微皱了眉，但还是礼貌地回应了。', effects: [{ type: 'flag', key: 'met_dragonborn_campus', value: true }] } },
    ],
  },

  {
    id: 'CAMPUS_004', type: EVT_TYPE.CHOICE, weight: 7,
    filter: { locs: ['campus'], periods: [2], sems: [2], weeks: [10, 11, 12] },
    text: '操场中央摆着几个目标靶，裂风竞技会的成员正在对报名选手进行初步测试。看台上有不少人在围观。',
    options: [
      { text: '报名参加测试', stat: { key: 'phy', min: 15 }, outcome: { log: '通过裂风测试', text: '测试官点了点头，将你的名字记入名单。', effects: [{ type: 'stat', stat: 'phy', amount: 0.5 }, { type: 'flag', key: 'ruptiventi_qualified', value: true }] } },
      { text: '观看测试过程', outcome: { effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '为参赛者加油', outcome: { effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }] } },
    ],
  },

  {
    id: 'CAMPUS_005', type: EVT_TYPE.CHOICE, weight: 2,
    filter: { locs: ['campus'] },
    weightMod: [{ period: 2, mul: 1.3 }, { period: 3, mul: 1.3 }],
    text: '练习魔法的学生一个判断失误，被自己的反弹魔力弄伤了手腕，正蹲在地上捂着，旁边的同伴慌了手脚。',
    options: [
      { text: '上前施展治愈术', outcome: { log: '施展治愈术', text: '手腕上的淤伤在光芒中慢慢消散。', effects: [{ type: 'mp', delta: -10 }, { type: 'repute', deptKey: 'lucis', delta: 2 }, { type: 'flag', key: 'helped_injured_student', value: true }] } },
      { text: '帮忙把对方送去晖光疗所', outcome: { log: '送去医疗站', effects: [{ type: 'sp', delta: -3 }, { type: 'flag', key: 'helped_injured_student', value: true }] } },
      { text: '告诉旁边的人去叫人', outcome: { effects: [{ type: 'flag', key: 'helped_injured_student', value: 'minor' }] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 迷径花廊 Ambulacrum Labyrinthicum
  // ════════════════════════════════════════════════════════

  {
    id: 'AMBUL_001', type: EVT_TYPE.NEUTRAL, weight: 8,
    filter: { locs: ['ambul'] },
    weightMod: [{ period: 3, mul: 1.5 }, { sem: 2, mul: 1.3 }],
    text: '花廊里的幻象今天格外活跃，藤蔓颜色似乎比昨天换了个色调，空气里带着不知道哪里来的花香。你踩着碎石小路穿行其中，感觉整个人都轻盈了一些。',
    outcome: { log: '花廊漫步', effects: [{ type: 'sp', delta: 5 }, { type: 'stat', stat: 'sen', amount: 0.1 }] },
  },

  {
    id: 'AMBUL_002', type: EVT_TYPE.CHOICE, weight: 5,
    filter: { locs: ['ambul'], periods: [3] },
    text: '傍晚的花廊里，你遇见了一个正在对着一株会发光的花低声说话的学子。对方似乎没注意到你，眼神专注而柔和。',
    options: [
      { text: '悄悄绕开', outcome: { effects: [] } },
      { text: '轻声打招呼', outcome: { log: '轻声问候', text: '对方回过头，笑了笑，说在跟花说话是翠灵学部的传统。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'ambul_silvae_encounter', value: true }] } },
    ],
  },

  {
    id: 'AMBUL_003', type: EVT_TYPE.CHOICE, weight: 10,
    filter: { locs: ['ambul'], once: true, notFlag: { key: 'ambul_lost_done' } },
    text: '你走着走着，发现完全不认识眼前的路了。幻象把走廊改变了，你甚至不确定自己走了多久。迷径花廊的名字诚不欺人。',
    options: [
      { text: '冷静辨别方向，凭感觉走', stat: { key: 'sen', min: 10 }, outcome: { log: '成功找到出口', text: '你调动感知，隐约感觉到了人造石路的方向，顺着走出去了。', effects: [{ type: 'stat', stat: 'sen', amount: 0.3 }, { type: 'flag', key: 'ambul_lost_done', value: true }] } },
      { text: '原路返回', outcome: { log: '迷路后原路返回', text: '花廊像是在捉弄你——「原路」也变了。但最终还是走出去了。', effects: [{ type: 'sp', delta: -3 }, { type: 'flag', key: 'ambul_lost_done', value: true }] } },
      { text: '坐下来等幻象消散', outcome: { log: '等待幻象消散', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'flag', key: 'ambul_lost_done', value: true }] } },
    ],
  },

  {
    id: 'AMBUL_004', type: EVT_TYPE.CHOICE, weight: 4,
    filter: { locs: ['ambul'], periods: [0, 1] },
    text: '清晨的花廊里，你遇见了一个正在速写的学子——画板上的花廊和真实的花廊微妙地不同，她画的似乎是幻象消退前的样子。',
    options: [
      { text: '凑过去看画', outcome: { log: '欣赏速写', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'flag', key: 'met_ambul_painter', value: true }] } },
      { text: '称赞对方', outcome: { log: '称赞画作', text: '对方抬起头，明显有些惊讶，但随即笑了。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'met_ambul_painter', value: true }] } },
      { text: '走过不打扰', outcome: { effects: [] } },
    ],
  },

  {
    id: 'AMBUL_005', type: EVT_TYPE.FORTUNE, weight: 4,
    filter: { locs: ['ambul'], periods: [3] },
    text: '花廊的光影在黄昏时特别好看，这大概是为什么你们同时选择了这里散步——对面走来的人也是独行，看到你的瞬间略微停顿了一下。',
    options: [
      { text: '打招呼，一起走一段', outcome: { log: '偶遇同行', text: '两人并排走着，一路聊了不少。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'ambul_romantic_encounter', value: true }] } },
      { text: '微笑点头，继续走', outcome: { effects: [{ type: 'stat', stat: 'cha', amount: 0.05 }] } },
      { text: '低头走过', outcome: { effects: [] } },
    ],
  },

  {
    id: 'AMBUL_006', type: EVT_TYPE.CHOICE, weight: 2,
    filter: { locs: ['ambul'], periods: [3] },
    text: '幻象突然变得异常清晰——你看到的不是花廊，而是一个完全陌生的场景：一个房间，几个人，一场争论。声音从很远的地方传来，你只能模糊地听到几个词。然后幻象消散，你又回到了花廊。',
    options: [
      { text: '努力记住所有细节', outcome: { log: '记住幻象碎片', text: '你努力抓住那个场景，某些细节在记忆里留了下来。', effects: [{ type: 'flag', key: 'ambul_vision_memory', value: true }, { type: 'branch', branchId: 'ambul_past_vision' }] } },
      { text: '去向幻澜学部报告', outcome: { log: '向幻澜报告异象', text: '幻澜学部的教授听完你的描述，神情变得认真起来。', effects: [{ type: 'repute', deptKey: 'mentis', delta: 3 }, { type: 'branch', branchId: 'ambul_past_vision' }] } },
      { text: '摇摇头走出花廊', outcome: { effects: [] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 矿石浴场 Thermae Minerales
  // ════════════════════════════════════════════════════════

  {
    id: 'THERM_001', type: EVT_TYPE.FORTUNE, weight: 8,
    filter: { locs: ['thermae'], periods: [2, 3] },
    text: '公共区的热泉里已经泡着几个人，气氛颇为悠闲。泡汤似乎让所有人都降低了戒备，话也多了起来。有人朝你点了点头，示意你过去。',
    options: [
      { text: '加入闲聊', outcome: { log: '泡汤闲聊', text: '一边泡着热水一边东拉西扯，不知不觉过了很长时间。', effects: [{ type: 'sp', delta: 15 }, { type: 'stat', stat: 'cha', amount: 0.1 }] } },
      { text: '泡着不说话，听别人聊', outcome: { log: '静静旁听', effects: [{ type: 'sp', delta: 12 }, { type: 'stat', stat: 'sen', amount: 0.1 }] } },
      { text: '选包间独自泡', outcome: { log: '独自浸泡', effects: [{ type: 'sp', delta: 18 }] } },
    ],
  },

  {
    id: 'THERM_002', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['thermae'], periods: [3] },
    text: '浴场一侧隔出了一小块区域，几个矮人学子正在进行某种仪式——他们将石块逐一放入温泉，低声吟唱着什么。气氛庄重而安静。',
    options: [
      { text: '远远看着，保持安静', outcome: { log: '旁观沉石礼', text: '一种难以名状的庄重感弥漫开来。', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'flag', key: 'know_dwarf_ritual', value: true }] } },
      { text: '走近询问这是什么仪式', stat: { key: 'cha', min: 11 }, outcome: { log: '了解沉石礼', text: '对方礼貌地解释了沉石礼的含义，感谢你的尊重。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'know_dwarf_ritual', value: true }] } },
      { text: '赶紧绕开', outcome: { effects: [] } },
    ],
  },

  {
    id: 'THERM_003', type: EVT_TYPE.FORTUNE, weight: 10,
    filter: { locs: ['thermae'] },
    text: '矿石浴场的温泉水温适宜，矿物质的气息让人精神一振。你浸泡了一会儿，感觉身体比来时轻松了许多。',
    options: [
      { text: '泡足一小时', outcome: { log: '充分浸泡', effects: [{ type: 'sp', delta: 20 }, { type: 'hp', delta: 5 }] } },
      { text: '泡半小时', outcome: { log: '适度浸泡', effects: [{ type: 'sp', delta: 12 }] } },
      { text: '只泡脚', outcome: { log: '简单泡脚', effects: [{ type: 'sp', delta: 6 }] } },
    ],
  },

  {
    id: 'THERM_004', type: EVT_TYPE.CHOICE, weight: 6,
    filter: { locs: ['thermae'], periods: [3] },
    text: '傍晚的浴场里，炉铸学部的学子在进行一种不成文的传统——呈工礼前夕，大家聚在这里放松，顺便互相点评这周的作品。气氛热烈，声音颇大。',
    options: [
      { text: '加入他们', outcome: { log: '加入炉铸聚会', text: '你被热情地拉进了讨论，即便不是炉铸学部的人也没人在意。', effects: [{ type: 'sp', delta: 10 }, { type: 'repute', deptKey: 'fornacis', delta: 2 }] } },
      { text: '在旁边泡着，偶尔参与', outcome: { effects: [{ type: 'sp', delta: 12 }, { type: 'repute', deptKey: 'fornacis', delta: 1 }] } },
      { text: '避开这块区域', outcome: { effects: [{ type: 'sp', delta: 15 }] } },
    ],
  },

  {
    id: 'THERM_005', type: EVT_TYPE.TROUBLE, weight: 2,
    filter: { locs: ['thermae'], periods: [2] },
    text: '公共区突然响起了争吵声——两个人为了某件事闹得不可开交，把周围其他人都弄得很尴尬。其中一人朝你看来，像是在寻求支持。',
    options: [
      { text: '支持A', outcome: { log: '站在A一边', effects: [] } },
      { text: '支持B', outcome: { log: '站在B一边', effects: [] } },
      { text: '说双方都有一定道理', stat: { key: 'cha', min: 11 }, outcome: { log: '居中调解', text: '你的态度让双方都冷静了一些，局面没有进一步恶化。', effects: [{ type: 'stat', stat: 'cha', amount: 0.2 }] } },
      { text: '默默换到包间', outcome: { effects: [{ type: 'sp', delta: 18 }] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 星见书坊 Bibliotheca Communis
  // ════════════════════════════════════════════════════════

  {
    id: 'BIBLIO_001', type: EVT_TYPE.FORTUNE, weight: 6,
    filter: { locs: ['biblio'] },
    weightMod: [{ period: 1, mul: 1.2 }, { period: 2, mul: 1.3 }],
    text: '书架间，你发现了一个熟悉的面孔正在翻书——或者说，是一个你意想不到会在这里出现的人。',
    options: [
      { text: '走过去打招呼', outcome: { log: '书坊偶遇', text: '对方也没想到会在这里碰见你，气氛意外地轻松。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'biblio_npc_encounter', value: true }] } },
      { text: '找个离对方不远的位置坐下来', outcome: { effects: [{ type: 'stat', stat: 'int', amount: 0.15 }] } },
      { text: '假装没看见，去另一个区域', outcome: { effects: [] } },
    ],
  },

  {
    id: 'BIBLIO_002', type: EVT_TYPE.NEUTRAL, weight: 4,
    filter: { locs: ['biblio'] },
    weightMod: [{ period: 1, mul: 1.2 }, { period: 2, mul: 1.2 }],
    text: '你想找的书应该在这个位置，但书架上空了一格，旁边留着一张写着「借阅中」的小纸条，落款是某个你不认识的名字。',
    options: [
      { text: '向管理员询问，留预约登记', outcome: { log: '预约借阅', effects: [{ type: 'flag', key: 'book_reservation', value: true }] } },
      { text: '换一本类似的书看', outcome: { effects: [{ type: 'stat', stat: 'int', amount: 0.1 }] } },
      { text: '记下借阅者名字，下次遇到时直接问', outcome: { log: '记下名字', effects: [{ type: 'flag', key: 'biblio_borrower_noted', value: true }] } },
    ],
  },

  {
    id: 'BIBLIO_003', type: EVT_TYPE.FORTUNE, weight: 7,
    filter: { locs: ['biblio'], periods: [2, 3] },
    text: '墨香座不大，只有六七张桌子，现在坐了大半。靠窗的位置只剩一个空位，而坐在旁边的人……你认识，或者说，想要认识。',
    options: [
      { text: '坐过去，点了杯饮品', outcome: { log: '墨香座偶坐', text: '饮品端上来，两人自然地聊了起来。', effects: [{ type: 'sp', delta: 5 }, { type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'biblio_cafe_encounter', value: true }] } },
      { text: '点了饮品站着喝', outcome: { effects: [{ type: 'sp', delta: 3 }, { type: 'stat', stat: 'cha', amount: 0.05 }] } },
      { text: '去角落找了个没人的位置', outcome: { effects: [{ type: 'sp', delta: 3 }, { type: 'stat', stat: 'int', amount: 0.1 }] } },
    ],
  },

  {
    id: 'BIBLIO_004', type: EVT_TYPE.CHOICE, weight: 3,
    filter: { locs: ['biblio'] },
    weightMod: [{ period: 1, mul: 1.2 }, { period: 2, mul: 1.2 }],
    text: '你在看一本书时碰到了一段古精灵语的注释，完全看不懂，但这个注释似乎对理解内容很重要。',
    options: [
      { text: '跳过这部分', outcome: { effects: [] } },
      { text: '去找一个精灵或暗精灵学子帮忙翻译', outcome: { log: '寻求翻译帮助', text: '对方翻译完，还顺带解释了一些上下文背景。', effects: [{ type: 'stat', stat: 'int', amount: 0.2 }, { type: 'flag', key: 'elf_translation_help', value: true }] } },
      { text: '去旁边的语言学书架自己查', outcome: { log: '自学古精灵语', text: '查了将近半小时，终于弄清楚了，成就感不小。', effects: [{ type: 'stat', stat: 'int', amount: 0.4 }] } },
    ],
  },

  {
    id: 'BIBLIO_005', type: EVT_TYPE.TROUBLE, weight: 3,
    filter: { locs: ['biblio'] },
    text: '书坊里突然来了一群人，其中几个说话完全不注意音量，把本来安静的氛围破坏殆尽。管理员正在考虑是否出声提醒。',
    options: [
      { text: '皱眉，换个位置继续看书', outcome: { effects: [] } },
      { text: '礼貌地提醒对方注意音量', stat: { key: 'cha', min: 11 }, outcome: { log: '提醒安静', text: '对方道了歉，书坊恢复了安静，旁边的人朝你点了点头。', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }] } },
      { text: '收拾书去墨香座喝点东西', outcome: { effects: [{ type: 'sp', delta: 5 }, { type: 'flag', key: 'biblio_cafe_visit', value: true }] } },
    ],
  },

  {
    id: 'BIBLIO_006', type: EVT_TYPE.FORTUNE, weight: 5,
    filter: { locs: ['biblio'], periods: [4] },
    text: '书坊偶尔会在夜间开放两小时的特别自习时间。此刻来的人不多，但都是认真在看书的。整个书坊安静得只剩翻书声。',
    options: [
      { text: '专注学习', outcome: { log: '夜间专注学习', effects: [{ type: 'stat', stat: 'int', amount: 0.5 }, { type: 'mp', delta: -5 }] } },
      { text: '一边看书一边发呆', outcome: { effects: [{ type: 'stat', stat: 'int', amount: 0.2 }, { type: 'sp', delta: 5 }] } },
      { text: '观察其他夜读者', outcome: { log: '观察夜读者', effects: [{ type: 'stat', stat: 'sen', amount: 0.1 }, { type: 'flag', key: 'biblio_night_npc', value: true }] } },
    ],
  },

  // ════════════════════════════════════════════════════════
  // 学生事务大厅 Atrium Discipulorum
  // ════════════════════════════════════════════════════════

  {
    id: 'ATRIUM_001', type: EVT_TYPE.NEUTRAL, weight: 5,
    filter: { locs: ['atrium'], periods: [0, 1], weeks: [1, 2, 3] },
    text: '大厅里排着长队，各种手续办理窗口前人满为患。你旁边站着一个看起来同样无奈的学子，叹了口气说：「每年都这样。」',
    options: [
      { text: '聊起来打发等待时间', outcome: { log: '等待时闲聊', effects: [{ type: 'stat', stat: 'cha', amount: 0.1 }, { type: 'flag', key: 'atrium_queue_friend', value: true }] } },
      { text: '刷一下公告板', outcome: { log: '查看公告', effects: [{ type: 'flag', key: 'read_bulletin_board', value: true }] } },
      { text: '默默等着', outcome: { effects: [] } },
    ],
  },

  {
    id: 'ATRIUM_002', type: EVT_TYPE.NEUTRAL, weight: 2,
    filter: { locs: ['atrium'] },
    weightMod: [{ period: 1, mul: 1.3 }, { period: 2, mul: 1.3 }],
    text: '大厅一角正在进行一场违纪申诉——一个学生正在向工作人员解释某次事件的经过，声音压得很低，但神情相当紧张。',
    options: [
      { text: '看一眼走过去', outcome: { log: '了解申诉流程', effects: [{ type: 'flag', key: 'know_appeal_process', value: true }] } },
      { text: '在旁边等自己的事，顺便听了一耳朵', outcome: { effects: [{ type: 'stat', stat: 'sen', amount: 0.05 }] } },
    ],
  },

  {
    id: 'ATRIUM_003', type: EVT_TYPE.FORTUNE, weight: 4,
    filter: { locs: ['atrium'], periods: [1, 2] },
    text: '教导主任从走廊里走过，步伐一如既往地平稳，手里夹着一叠文件。她扫了一眼等候区，视线在你身上停了一秒。',
    options: [
      { text: '点头致意', outcome: { log: '向教导主任致意', effects: [{ type: 'flag', key: 'ada_noticed_me', value: true }] } },
      { text: '主动打招呼', outcome: { log: '与艾达交谈', text: '艾达停下来，简短地回应了几句。', effects: [{ type: 'stat', stat: 'cha', amount: 0.05 }, { type: 'flag', key: 'ada_interaction', value: true }] } },
      { text: '假装没注意到她', outcome: { log: '假装没看见', text: '她已经注意到你了。', effects: [] } },
    ],
  },

  {
    id: 'ATRIUM_004', type: EVT_TYPE.NEUTRAL, weight: 10,
    filter: { locs: ['atrium'], weeks: [3], once: true },
    text: '社团注册窗口前贴着一张公告：「本学期社团加入申请截止日——今日17时前。」还有两个小时。',
    options: [
      { text: '去窗口确认自己的申请状态', outcome: { log: '确认社团申请', effects: [{ type: 'flag', key: 'checked_club_status', value: true }] } },
      { text: '趁最后机会临时决定加入', outcome: { log: '最后机会加入社团', effects: [{ type: 'flag', key: 'last_minute_club_join', value: true }] } },
      { text: '这学期不打算参加社团', outcome: { effects: [] } },
    ],
  },

  {
    id: 'ATRIUM_005', type: EVT_TYPE.FORTUNE, weight: 3,
    filter: { locs: ['atrium'], periods: [1] },
    text: '奥利安·菲尔医师路过大厅，手里端着一杯不知道凉了多久的茶，正在和一个工作人员说着什么。他看到你时，帽子下的眼睛弯了弯。',
    options: [
      { text: '打招呼', outcome: { log: '与奥利安相遇', text: '奥利安随手塞给你一个小瓶，说「多余的，你拿着」。', effects: [{ type: 'item', key: 'basic_healing_potion', label: '基础恢复药剂' }, { type: 'flag', key: 'orian_relation_start', value: true }] } },
      { text: '点头走过', outcome: { effects: [{ type: 'flag', key: 'orian_noticed', value: true }] } },
      { text: '主动提起身体不适', outcome: { log: '向奥利安寻求帮助', text: '奥利安认真听完，随手取出一个小药瓶，叮嘱了几句注意事项。', effects: [{ type: 'hp', delta: 10 }, { type: 'flag', key: 'orian_relation_start', value: true }] } },
    ],
  },

];

// ── 权重计算 ──────────────────────────────────────────────────

function calcWeight(evt) {
  const f = evt.filter;
  if (f.locs?.length && !f.locs.includes(G.locKey)) return 0;
  if (f.periods?.length && !f.periods.includes(G.period)) return 0;
  if (f.sems?.length && !f.sems.includes(G.sem)) return 0;
  if (f.weeks?.length && !f.weeks.includes(G.week)) return 0;
  if (f.minStat && (G.stats[f.minStat.key] ?? 0) < f.minStat.min) return 0;
  if (f.maxStat && (G.stats[f.maxStat.key] ?? 0) > f.maxStat.max) return 0;
  if (f.npcRel) {
    const s = G.relations?.[f.npcRel.npcId] ?? 0;
    if (s < (f.npcRel.minScore ?? -100) || s > (f.npcRel.maxScore ?? 100)) return 0;
  }
  if (f.flag && G.dialogueFlags?.[f.flag.key] !== f.flag.value) return 0;
  if (f.notFlag && G.dialogueFlags?.[f.notFlag.key]) return 0;
  if (f.once) {
    if (!G.firedEvents) G.firedEvents = {};
    if (G.firedEvents[evt.id]) return 0;
  }
  let w = evt.weight;
  if (evt.weightMod) {
    for (const mod of evt.weightMod) {
      const ok = (mod.sem === undefined || mod.sem === G.sem) &&
                 (mod.period === undefined || mod.period === G.period);
      if (ok) w *= mod.mul;
    }
  }
  return w;
}

// ── 抽取事件 ─────────────────────────────────────────────────

export function pickEvent() {
  const candidates = [];
  let total = 0;
  for (const evt of EVENT_POOL) {
    const w = calcWeight(evt);
    if (w > 0) { candidates.push({ evt, w }); total += w; }
  }
  if (!candidates.length) return null;
  let roll = Math.random() * total;
  for (const { evt, w } of candidates) {
    roll -= w;
    if (roll <= 0) return evt;
  }
  return candidates[candidates.length - 1].evt;
}

// ── 结果执行器 ────────────────────────────────────────────────

export function applyEffects(effects, pushNarr, pushEvt) {
  if (!effects?.length) return;
  for (const fx of effects) {
    switch (fx.type) {
      case 'stat':   addExp(fx.stat, fx.amount, G); break;
      case 'hp':     G.hp = Math.max(1, Math.min(G.hpMax, G.hp + fx.delta)); break;
      case 'mp':     G.mp = Math.max(0, Math.min(G.mpMax, G.mp + fx.delta)); break;
      case 'sp':     G.sp = Math.max(0, Math.min(G.spMax, G.sp + fx.delta)); break;
      case 'gold':   G.gold = Math.max(0, G.gold + fx.delta); break;
      case 'rel':    changeRel(fx.npcId, fx.delta, G); break;
      case 'repute':
        if (!G.repute) G.repute = {};
        // 'own' 是自身学部的别名
        const dk = fx.deptKey === 'own' ? CHAR.dept : fx.deptKey;
        G.repute[dk] = Math.max(-100, Math.min(100, (G.repute[dk] ?? 0) + fx.delta));
        break;
      case 'flag':
        if (!G.dialogueFlags) G.dialogueFlags = {};
        G.dialogueFlags[fx.key] = fx.value;
        break;
      case 'item':
        if (!G.items) G.items = {};
        G.items[fx.key] = (G.items[fx.key] ?? 0) + 1;
        if (pushEvt) pushEvt(`获得道具：${fx.label}`, '已存入背包');
        break;
      case 'branch':
        if (!G.dialogueFlags) G.dialogueFlags = {};
        G.dialogueFlags[`branch_${fx.branchId}`] = true;
        if (pushNarr) pushNarr([`〔隐藏支线「${fx.branchId}」已解锁〕`]);
        break;
    }
  }
}

// ── 主触发函数 ────────────────────────────────────────────────

export function tryTriggerEvent(source, pushNarr, pushEvt, openChoiceModalFn) {
  if (!G.eventCooldown) G.eventCooldown = 0;
  if (G.eventCooldown > 0) { G.eventCooldown--; return false; }

  const chance = source === 'advance'
    ? TRIGGER_CONFIG.BASE_CHANCE_ADVANCE
    : TRIGGER_CONFIG.BASE_CHANCE_ACTION;
  if (Math.random() > chance) return false;

  const evt = pickEvent();
  if (!evt) return false;

  if (evt.filter.once) {
    if (!G.firedEvents) G.firedEvents = {};
    G.firedEvents[evt.id] = true;
  }
  G.eventCooldown = TRIGGER_CONFIG.COOLDOWN_PERIODS;

  const text = typeof evt.text === 'function' ? evt.text() : evt.text;
  pushNarr([text]);

  const isChoice = evt.type === EVT_TYPE.CHOICE || evt.options?.length;
  if (isChoice) {
    if (openChoiceModalFn) openChoiceModalFn(evt);
  } else {
    if (evt.outcome) {
      applyEffects(evt.outcome.effects, pushNarr, pushEvt);
      if (evt.outcome.log) {
        const label = { fortune: '✦ 奇遇', trouble: '✘ 麻烦', neutral: '· 路遇' }[evt.type] || '事件';
        pushEvt(`${label}：${evt.outcome.log}`, _fxSummary(evt.outcome.effects));
      }
    }
  }
  return true;
}

// ── 选择型事件结果提交 ────────────────────────────────────────

export function resolveChoice(evt, optIndex, pushNarr, pushEvt) {
  const opt = evt.options?.[optIndex];
  if (!opt) return;
  if (opt.stat && (G.stats[opt.stat.key] ?? 0) < opt.stat.min) return;
  if (opt.outcome.text) pushNarr([opt.outcome.text]);
  applyEffects(opt.outcome.effects, pushNarr, pushEvt);
  if (opt.outcome.log) pushEvt(`选择：${opt.outcome.log}`, _fxSummary(opt.outcome.effects));
}

// ── 选择型事件 UI Modal ───────────────────────────────────────

export function openChoiceModal(evt, pushNarr, pushEvt, onDone) {
  let mo = document.getElementById('rand-evt-mo');
  if (!mo) {
    mo = document.createElement('div');
    mo.id = 'rand-evt-mo';
    mo.className = 'mo';
    mo.innerHTML = `
      <div class="mb" style="max-width:440px;">
        <div class="mt-m" id="re-title">事件</div>
        <div id="re-body" style="max-height:60vh;overflow-y:auto;padding-right:4px;"></div>
      </div>`;
    document.body.appendChild(mo);
  }
  const statLabel = { int:'智力', mag:'法力', phy:'体魄', cha:'魅力', sen:'感知' };
  const typeLabel = { choice:'⟐ 抉择时刻', fortune:'✦ 奇遇', trouble:'✘ 麻烦', neutral:'· 路遇' };
  document.getElementById('re-title').textContent = typeLabel[evt.type] || '事件';
  document.getElementById('re-body').innerHTML = evt.options.map((opt, i) => {
    const locked  = opt.stat && (G.stats[opt.stat.key] ?? 0) < opt.stat.min;
    const lockTip = locked ? `<span style="font-size:8px;color:var(--ng);display:block;margin-top:2px;">需要${statLabel[opt.stat.key]} ≥ ${opt.stat.min}（当前 ${G.stats[opt.stat.key] ?? 0}）</span>` : '';
    return `<button class="abtn ${locked ? '' : 'pri'}" ${locked ? 'disabled' : ''} style="width:100%;text-align:left;margin-bottom:6px;padding:8px 10px;" onclick="randEvtChoose(${i})"><span style="opacity:.5;margin-right:6px;">${i+1}</span>${opt.text}${lockTip}</button>`;
  }).join('');
  mo.classList.add('open');
  globalThis.randEvtChoose = (idx) => {
    resolveChoice(evt, idx, pushNarr, pushEvt);
    mo.classList.remove('open');
    if (onDone) onDone();
  };
}

// ── 内部工具 ──────────────────────────────────────────────────

function _fxSummary(effects) {
  if (!effects?.length) return '无机制效果';
  const statLabel = { int:'智力', mag:'法力', phy:'体魄', cha:'魅力', sen:'感知' };
  return effects.map(fx => {
    if (fx.type === 'stat')   return `${statLabel[fx.stat]||fx.stat}经验 +${fx.amount}`;
    if (fx.type === 'hp')     return `HP ${fx.delta>=0?'+':''}${fx.delta}`;
    if (fx.type === 'mp')     return `MP ${fx.delta>=0?'+':''}${fx.delta}`;
    if (fx.type === 'sp')     return `SP ${fx.delta>=0?'+':''}${fx.delta}`;
    if (fx.type === 'gold')   return `金币 ${fx.delta>=0?'+':''}${fx.delta}`;
    if (fx.type === 'item')   return `获得${fx.label}`;
    if (fx.type === 'repute') return `声望 ${fx.delta>=0?'+':''}${fx.delta}`;
    if (fx.type === 'branch') return `支线解锁`;
    return '';
  }).filter(Boolean).join('，') || '无机制效果';
}
