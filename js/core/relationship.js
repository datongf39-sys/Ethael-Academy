// 好感度关系系统
// 对应策划书 §6.1 NPC关系图谱

// ── 关系等级定义 ─────────────────────────────────────────────
// 等级从低到高排列，getRelLevel() 依次匹配
export const RELATION_LEVELS = [
  {
    key: 'enemy',
    label: '敌对',
    min: -100, max: -41,
    color: 'var(--ng)',
    icon: '⚔',
    desc: '对立事件，阻挠/陷害',
  },
  {
    key: 'hostile',
    label: '反感',
    min: -40, max: -11,
    color: '#E06050',
    icon: '✗',
    desc: '对话受限，部分地点排斥',
  },
  {
    key: 'stranger',
    label: '陌生',
    min: -10, max: 10,
    color: 'var(--tx3)',
    icon: '·',
    desc: '普通对话',
  },
  {
    key: 'acquaint',
    label: '熟识',
    min: 11, max: 40,
    color: 'var(--tx2)',
    icon: '○',
    desc: '更多对话选项，信息共享',
  },
  {
    key: 'friend',
    label: '友好',
    min: 41, max: 70,
    color: 'var(--ok)',
    icon: '◎',
    desc: '一起活动，好感事件，属性加成',
  },
  {
    key: 'bestie',
    label: '挚友/恋人',
    min: 71, max: 100,
    color: 'var(--gold)',
    icon: '★',
    desc: '专属剧情，特殊礼物，隐藏事件',
  },
];

// ── 工具函数 ─────────────────────────────────────────────────

/** 根据好感度数值返回对应等级对象 */
export function getRelLevel(score) {
  for (const lv of RELATION_LEVELS) {
    if (score >= lv.min && score <= lv.max) return lv;
  }
  return score < -100 ? RELATION_LEVELS[0] : RELATION_LEVELS[RELATION_LEVELS.length - 1];
}

/** 获取NPC好感度 */
export function getRel(npcId, G) {
  if (!G.relations) G.relations = {};
  return G.relations[npcId] ?? 0;
}

/** 修改好感度，返回修改后的值 */
export function changeRel(npcId, delta, G) {
  if (!G.relations) G.relations = {};
  const cur = G.relations[npcId] ?? 0;
  G.relations[npcId] = Math.max(-100, Math.min(100, cur + delta));
  return G.relations[npcId];
}

/** 友好以上时的属性加成（好感度奖励） */
export function getRelStatBonus(npcId, G) {
  const score = getRel(npcId, G);
  const lv    = getRelLevel(score);
  if (lv.key === 'bestie') return { cha: 2, int: 1 };
  if (lv.key === 'friend') return { cha: 1 };
  return {};
}

/**
 * 为NPC选取对话入口节点
 * 规则：
 *  - 敌对/反感：使用 hostile_default（若存在），否则返回 null（拒绝对话）
 *  - 友好+：优先使用 friend_* 事件（若存在且当日未触发）
 *  - 熟识+：以30%概率使用 acquaint_greeting（若存在且当日未触发）
 *  - 其他：使用 default
 */
export function pickEntryNode(npc, G) {
  const score = getRel(npc.id, G);
  const lv    = getRelLevel(score);

  if (lv.key === 'enemy' || lv.key === 'hostile') {
    return npc.dialogues.hostile_default ? 'hostile_default' : null;
  }

  // 友好/挚友：尝试触发友好事件（每日一次）
  if ((lv.key === 'friend' || lv.key === 'bestie') && npc.dialogues.friend_invite) {
    const dayKey = `${npc.id}_friend_${G.sem}_${G.week}_${G.day}`;
    if (!G.dialogueFlags) G.dialogueFlags = {};
    if (!G.dialogueFlags[dayKey]) {
      G.dialogueFlags[dayKey] = true;
      return 'friend_invite';
    }
  }

  // 熟识：30%概率触发 acquaint_greeting（每日一次）
  if ((lv.key === 'acquaint' || lv.key === 'friend' || lv.key === 'bestie') && npc.dialogues.acquaint_greeting) {
    const dayKey = `${npc.id}_acquaint_${G.sem}_${G.week}_${G.day}`;
    if (!G.dialogueFlags) G.dialogueFlags = {};
    if (!G.dialogueFlags[dayKey] && Math.random() < 0.3) {
      G.dialogueFlags[dayKey] = true;
      return 'acquaint_greeting';
    }
  }

  return 'default';
}

/** 将好感度区间格式化为显示文本 */
export function relLabel(npcId, G) {
  const score = getRel(npcId, G);
  const lv    = getRelLevel(score);
  return `${lv.icon} ${lv.label}（${score > 0 ? '+' : ''}${score}）`;
}
