// 社团数据库
// 对应策划书 §6.1 / §7.1 社团系统
// 每学期最多加入 2 个社团
// 等级：新成员 → 正式 → 骨干 → 社长候选

export const CLUBS = {

  // ── 银羽辩论社 ────────────────────────────────────────────
  debate: {
    id: 'debate',
    name: '银羽辩论社',
    sub:  'Societas Pennae Argenteae',
    desc: '以魔法学术辩论和政策讨论为核心，主题涵盖魔法伦理、族裔政策、学部改革等。',
    joinReq: { int: 15 },           // 加入条件：智力 ≥ 15
    statGain: ['int', 'cha'],       // 提升属性
    activities: ['辩论赛', '读书研讨会'],
    period: 2,                      // 占用时间段（下午）
    days: [1, 3],                   // 周二、周四
    npcTags: ['academic'],          // 关联NPC类型标签
  },

  // ── 绿集商会 ──────────────────────────────────────────────
  mercatus: {
    id: 'mercatus',
    name: '绿集商会',
    sub:  'Mercatus Viridis',
    desc: '围绕翠灵绿集发展出的学生商业组织，全年运营校内药剂与道具交易。',
    joinReq: {},                    // 无门槛（药草学基础有助晋升）
    statGain: ['int', 'sen'],
    activities: ['配药实践', '商品定价讨论', '绿集筹备'],
    period: 3,                      // 傍晚
    days: [0, 2],                   // 周一、周三
    perk: '社团成员可获得道具折扣',
    npcTags: ['silvae', 'merchant'],
  },

  // ── 裂风竞技会 ────────────────────────────────────────────
  arena: {
    id: 'arena',
    name: '裂风竞技会',
    sub:  'Ludus Ruptiventi',
    desc: '裂风锦标赛的筹备与参赛组织，也负责日常跨学部友谊赛。',
    joinReq: { phy: 15 },          // 体魄 ≥ 15
    statGain: ['phy'],
    activities: ['训练', '对抗赛', '赛事筹备'],
    period: 0,                      // 清晨
    days: [0, 1, 2, 3, 4],         // 每天晨练
    perk: '裂风锦标赛报名须通过竞技会推荐',
    npcTags: ['belli', 'athlete'],
  },

  // ── 月弧剧社 ──────────────────────────────────────────────
  theatre: {
    id: 'theatre',
    name: '月弧剧社',
    sub:  'Theatrum Arcus Lunae',
    desc: '在晖湖畔月弧台进行戏剧和音乐表演，每学期末举办大型公演。',
    joinReq: { cha: 12 },          // 魅力 ≥ 12
    statGain: ['cha', 'sen'],
    activities: ['排练', '剧本创作', '舞台魔法效果设计'],
    period: 3,                      // 傍晚
    days: [2, 4],                   // 周三、周五
    perk: '人鱼与魅魔学子的重要社交场所',
    npcTags: ['merfolk', 'fey', 'arts'],
  },

  // ── 裂隙会 ────────────────────────────────────────────────
  rima: {
    id: 'rima',
    name: '裂隙会',
    sub:  'Rima Society',
    desc: '混血裔学子自发成立的互助团体，以「介乎之间者的骄傲」为旗帜，已获学院默认。',
    joinReq: { race: 'halfblood' }, // 混血裔身份（其他族裔可作盟友）
    allyAllowed: true,              // 其他族裔可以「盟友」身份参与部分活动
    statGain: ['cha'],
    activities: ['互助聚会', '族裔平权倡议'],
    period: 3,                      // 傍晚
    days: [1],                      // 周二
    perk: '与进步派教授保持联系，是学院政治生态的重要力量',
    npcTags: ['halfblood', 'progressive'],
  },

  // ── 星隐探索社 ────────────────────────────────────────────
  explore: {
    id: 'explore',
    name: '星隐探索社',
    sub:  'Societas Exploratorum',
    desc: '以探索学院未知角落和银脊山脉周边区域为宗旨的冒险社团。',
    joinReq: { sen: 12 },          // 感知 ≥ 12
    statGain: ['sen', 'phy'],
    activities: ['夜间探索', '地图绘制', '隐藏地点搜寻'],
    period: 4,                      // 夜间
    days: [0, 3],                   // 周一、周四
    perk: '隐藏地点和隐藏事件的触发概率提升',
    npcTags: ['adventurer'],
  },

  // ── 墨渊笔会 ──────────────────────────────────────────────
  calamus: {
    id: 'calamus',
    name: '墨渊笔会',
    sub:  'Calamus Abyssi',
    desc: '专注于魔法文献研究和学术写作的社团，成员来自各学部的学术型学子。',
    joinReq: { int: 12 },          // 智力 ≥ 12
    statGain: ['int'],
    activities: ['论文互评', '文献翻译', '古籍修复'],
    period: 2,                      // 下午
    days: [2, 4],                   // 周三、周五
    perk: '可提前获取部分图书馆限制级文献的阅读权限',
    npcTags: ['academic', 'library'],
  },
};

// ── 工具函数 ─────────────────────────────────────────────────

/** 检查角色是否满足加入条件 */
export function canJoinClub(clubId, G, CHAR) {
  const club = CLUBS[clubId];
  if (!club) return false;
  const req = club.joinReq;

  // 种族限制
  if (req.race) {
    if (CHAR.race !== req.race) {
      // 允许盟友加入的社团，非限定种族也可参与
      return club.allyAllowed ? true : false;
    }
  }

  // 属性门槛
  for (const [stat, minVal] of Object.entries(req)) {
    if (stat === 'race') continue;
    if ((G.stats[stat] ?? 0) < minVal) return false;
  }

  return true;
}

/** 获取当前学期已加入的社团列表 */
export function getJoinedClubs(G) {
  if (!G.clubs) G.clubs = [];
  return G.clubs;
}

/** 加入社团（最多2个）*/
export function joinClub(clubId, G, CHAR) {
  if (!G.clubs) G.clubs = [];
  if (G.clubs.includes(clubId)) return { ok: false, reason: '已加入该社团' };
  if (G.clubs.length >= 2) return { ok: false, reason: '本学期已达社团上限（2个）' };
  if (!canJoinClub(clubId, G, CHAR)) return { ok: false, reason: '不满足加入条件' };

  G.clubs.push(clubId);
  // 初始化等级
  if (!G.clubRank) G.clubRank = {};
  G.clubRank[clubId] = 0; // 0=新成员 1=正式 2=骨干 3=社长候选
  return { ok: true };
}

/** 退出社团 */
export function leaveClub(clubId, G) {
  if (!G.clubs) G.clubs = [];
  const idx = G.clubs.indexOf(clubId);
  if (idx === -1) return false;
  G.clubs.splice(idx, 1);
  return true;
}

/** 等级标签 */
export const CLUB_RANK_LABELS = ['新成员', '正式成员', '骨干', '社长候选'];

export function getClubRankLabel(clubId, G) {
  if (!G.clubRank) return CLUB_RANK_LABELS[0];
  const r = G.clubRank[clubId] ?? 0;
  return CLUB_RANK_LABELS[Math.min(r, 3)];
}
