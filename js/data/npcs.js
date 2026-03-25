// NPC数据
// 每个NPC包含：基本信息、出现地点/时段、对话树
// 对话选项结构：{ id, text, relDelta, stat?(属性门槛), next(下一节点，null=结束) }
// relBonus：抵达该节点时额外加的好感度（不来自选项点击，而是叙事奖励）

export const NPCS = {

  // ============================================================
  // 学院人员
  // ============================================================

  selyn: {
    id: 'selyn', name: '瑟琳·阿什维尔', nameEn: 'Selyn Ashveil',
    title: '院长', race: 'elf', gender: 'F', age: '约340岁', dept: null,
    locations: ['forum', 'atrium'], periods: [1],
    romanceable: false,
    intro: '学院院长，精灵族，极少现身。每次出现都意味着事态已超出普通学生事务的范畴。',
    dialogues: {}
  },

  ada: {
    id: 'ada', name: '艾达·克洛薇尔', nameEn: 'Ada Clovel',
    title: '教导主任', race: 'human', gender: 'F', age: '44岁', dept: null,
    locations: ['atrium'], periods: [0, 1, 2, 3],
    romanceable: false,
    intro: '教导主任，冷静严格，对所有学生一视同仁。违纪处理、特殊申请的主要接触对象。好感度极难提升。',
    dialogues: {}
  },

  orian: {
    id: 'orian', name: '奥利安·菲尔', nameEn: 'Orian Fell',
    title: '医师', race: 'halfling', gender: 'M', age: '67岁', dept: 'lucis',
    locations: ['lucis_s'], periods: [0, 1, 2, 3, 4],
    romanceable: false,
    intro: '晖光疗所医师，半身人，絮叨热情，记性极好。HP归零或受伤后接触，好感度提升后会分享学院旧事和药剂。',
    dialogues: {}
  },

  lena: {
    id: 'lena', name: '莱娜·苏恩', nameEn: 'Lena Suun',
    title: '心理辅导师', race: 'fey', gender: 'F', age: '29岁', dept: null,
    locations: ['atrium', 'biblio'], periods: [1, 2, 3],
    romanceable: false,
    intro: '学院心理辅导师，魅魔，温柔善听。可主动前往咨询，特定负面状态下系统会提示。好感度提升后会出现在墨香座。',
    dialogues: {}
  },

  evan: {
    id: 'evan', name: '埃文·索拉斯', nameEn: 'Evan Solas',
    title: '曦光学部主任', race: 'elf', gender: 'M', age: '约180岁', dept: 'lucis',
    locations: ['lucis_h'], periods: [1, 2],
    romanceable: false,
    intro: '曦光学部主任，精灵，保守派核心人物。措辞优雅，立场从不动摇。',
    dialogues: {}
  },

  veil: {
    id: 'veil', name: '薇尔·纳赫特', nameEn: 'Veil Nacht',
    title: '暮影学部主任', race: 'vampire', gender: 'F', age: '约420岁', dept: 'umbrae',
    locations: ['umbrae_h'], periods: [1, 2, 3],
    romanceable: false,
    intro: '暮影学部主任，吸血鬼，冷淡精确。「不问出身」文化的塑造者之一。',
    dialogues: {}
  },

  fern: {
    id: 'fern', name: '芙恩·格林', nameEn: 'Fern Green',
    title: '翠灵学部主任', race: 'halfling', gender: 'F', age: '52岁', dept: 'silvae',
    locations: ['silvae_h', 'silvae_s'], periods: [0, 1, 2, 3],
    romanceable: false,
    intro: '翠灵学部主任，半身人，随和散漫，大多数时间在温室里。在自然保护议题上会突然强硬。',
    dialogues: {}
  },

  grom: {
    id: 'grom', name: '格罗姆·铁心', nameEn: 'Grom Ironheart',
    title: '炉铸学部主任', race: 'dwarf', gender: 'M', age: '约130岁', dept: 'fornacis',
    locations: ['fornacis_h', 'fornacis_s'], periods: [0, 1, 2, 3],
    romanceable: false,
    intro: '炉铸学部主任，矮人，直接务实。「拿出来让我看」是口头禅，说「还行」是最高评价。',
    dialogues: {}
  },

  talis: {
    id: 'talis', name: '塔利斯·幻', nameEn: 'Talis Huan',
    title: '幻澜学部主任', race: 'fey', gender: 'X', age: '约55岁', dept: 'mentis',
    locations: ['mentis_h', 'mentis_s'], periods: [1, 2, 3],
    romanceable: false,
    intro: '幻澜学部主任，魅魔（双性），飘忽难以捉摸。「幻象没有正确答案」是祂的口头禅。',
    dialogues: {}
  },

  kar: {
    id: 'kar', name: '卡尔·裂石', nameEn: 'Kar Splitrock',
    title: '战阵学部主任', race: 'orc', gender: 'M', age: '约45岁', dept: 'belli',
    locations: ['belli_h', 'belli_s'], periods: [0, 1, 2],
    romanceable: false,
    intro: '战阵学部主任，兽人，嗓门大，对公平有偏执的坚持。裂风锦标赛规则是他亲自修订的。',
    dialogues: {}
  },

  coral: {
    id: 'coral', name: '珊瑚·蒂芙', nameEn: 'Coral Tiv',
    title: '渊潮学部主任', race: 'merfolk', gender: 'F', age: '约90岁', dept: 'abyssi',
    locations: ['abyssi_h'], periods: [1, 2, 3],
    romanceable: false,
    intro: '渊潮学部主任，人鱼，温和开放，善于调解。声波术造诣极深，是回声祭的主要发起人之一。',
    dialogues: {}
  },

  dex: {
    id: 'dex', name: '德克·星野', nameEn: 'Dex Hoshino',
    title: '星脉学部主任', race: 'human', gender: 'M', age: '38岁', dept: 'stellae',
    locations: ['stellae_h', 'forum'], periods: [1, 2, 3],
    romanceable: false,
    intro: '星脉学部主任，人类，学院最年轻的主任。热情话多，跨系融合魔法研究的狂热支持者。',
    dialogues: {}
  },

  // ── 治愈术教授（已有完整对话树）────────────────────────────
  vesta: {
    id: 'vesta', name: '维斯塔', title: '教授',
    race: 'human', gender: 'F', dept: 'lucis',
    locations: ['lucis_h'], periods: [1, 2],
    romanceable: false,
    intro: '曦光学部的治愈术教授，严谨而公正，对认真的学生尤为赏识。',
    dialogues: {
      default: {
        speaker: '维斯塔教授',
        text:    '「同学，有什么需要帮助的？」她抬起头，目光平和而审视。',
        options: [
          { id: 'ask_lesson',  text: '向教授请教课程内容',                relDelta: 2,  next: 'lesson_reply' },
          { id: 'ask_score',   text: '询问自己的平时成绩',                relDelta: 1,  next: 'score_reply'  },
          { id: 'compliment',  text: '「教授，您今天的讲解非常精彩。」',  relDelta: 3,  stat: { key: 'cha', min: 12 }, next: 'compliment_reply' },
          { id: 'leave',       text: '「没什么，打扰了。」',              relDelta: 0,  next: null },
        ]
      },
      lesson_reply: {
        speaker: '维斯塔教授',
        text:    '「治愈术的核心在于精准而非强力——你问到点子上了。」她随手翻开一本厚重的医典，指向一处图解。「下次课会重点讲这里，提前预习会有帮助。」',
        relBonus: 1,
        options: [
          { id: 'thanks',   text: '认真记下，道谢离开',  relDelta: 1, next: null },
          { id: 'ask_more', text: '继续深入请教',        relDelta: 2, stat: { key: 'int', min: 11 }, next: 'deepen_reply' },
        ]
      },
      score_reply: {
        speaker: '维斯塔教授',
        text:    '她翻查了一下记录簿。「平时分尚可，但出勤还需注意。期中考试之前，建议不要缺席。」',
        options: [
          { id: 'ok', text: '「明白了，谢谢教授。」', relDelta: 1, next: null },
        ]
      },
      compliment_reply: {
        speaker: '维斯塔教授',
        text:    '她微微停顿，随后嘴角出现一丝不易察觉的弧度。「言过其实了——不过，课后习题你完成了吗？」',
        options: [
          { id: 'yes', text: '「已经完成了。」',  relDelta: 2,  next: null },
          { id: 'no',  text: '「……还没有。」',    relDelta: -1, next: null },
        ]
      },
      deepen_reply: {
        speaker: '维斯塔教授',
        text:    '她难得地露出一丝赞许。「这个问题问得很好——很少有学生能想到这一层。」她随即讲解了一段教材之外的内容。',
        relBonus: 2,
        options: [
          { id: 'end', text: '认真倾听，铭记于心', relDelta: 1, next: null },
        ]
      },
      acquaint_greeting: {
        speaker: '维斯塔教授',
        text:    '「你来得正好，我刚好有些课外资料想推荐给几位用功的学生。」她从抽屉里取出一张书单。',
        options: [
          { id: 'accept', text: '双手接过，道谢',                        relDelta: 2,  next: 'acquaint_booklist' },
          { id: 'pass',   text: '「谢谢教授，但我最近事情较多。」',     relDelta: -1, next: null },
        ]
      },
      acquaint_booklist: {
        speaker: '维斯塔教授',
        text:    '「星见书坊的馆藏区有这几本，凭学生证可以借阅。有问题随时来找我。」',
        options: [
          { id: 'end', text: '「一定认真拜读。」', relDelta: 1, next: null },
        ]
      },
    }
  },

  // ============================================================
  // 可攻略NPC（12人）
  // ============================================================

  // 01 · 罗薇·卡兰（人类·女·双性恋·星脉一年级）
  rovi: {
    id: 'rovi', name: '罗薇·卡兰', nameEn: 'Rovi Calan',
    title: '同学', race: 'human', gender: 'F', age: '18岁',
    sexuality: 'bi', dept: 'stellae', year: 1,
    locations: ['stellae_h', 'forum', 'campus', 'biblio', 'via'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '星脉学部一年级，人类，外向好奇，凡事想亲自试一试。在星见书坊墨香座比图书馆本身更常见。',
    dialogues: {}
  },

  // 02 · 艾尔·薄雾（精灵·男·同性恋·曦光三年级）
  ael: {
    id: 'ael', name: '艾尔·薄雾', nameEn: 'Ael Mist',
    title: '学长', race: 'elf', gender: 'M', age: '约80岁（外貌约20岁）',
    sexuality: 'gay', dept: 'lucis', year: 3,
    locations: ['lucis_h', 'lucis_d', 'biblio', 'via'],
    periods: [0, 1, 2],
    romanceable: true,
    intro: '曦光学部三年级，精灵，寡言精准，成绩名列前茅。情光冷银色。与所有人保持不远不近的距离。',
    dialogues: {}
  },

  // 03 · 夜绯·奥姆（暗精灵·女·双性恋·暮影二年级）
  yefei: {
    id: 'yefei', name: '夜绯·奥姆', nameEn: 'Yefei Om',
    title: '学姐', race: 'darkelf', gender: 'F', age: '约65岁（外貌约19岁）',
    sexuality: 'bi', dept: 'umbrae', year: 2,
    locations: ['umbrae_h', 'umbrae_d', 'via', 'ambul'],
    periods: [1, 2, 3, 4],
    romanceable: true,
    intro: '暮影学部二年级，暗精灵，直接有点刻薄，分得清场合。对感兴趣的事会突然话多。',
    dialogues: {}
  },

  // 04 · 薇罗妮卡·德拉（吸血鬼·女·异性恋·暮影教职）
  veronica: {
    id: 'veronica', name: '薇罗妮卡·德拉', nameEn: 'Veronica Dra',
    title: '讲师', race: 'vampire', gender: 'F', age: '约200岁（外貌约22岁）',
    sexuality: 'straight', dept: 'umbrae', year: null,
    locations: ['umbrae_h'],
    periods: [1, 2],
    romanceable: true,
    intro: '暮影学部时序术讲师（助理教授），吸血鬼，冷静精确，讲课逻辑严密近乎苛刻。',
    dialogues: {}
  },

  // 05 · 杜根·铸山（矮人·男·异性恋·炉铸二年级）
  dugan: {
    id: 'dugan', name: '杜根·铸山', nameEn: 'Dugan Forgehil',
    title: '学长', race: 'dwarf', gender: 'M', age: '约55岁',
    sexuality: 'straight', dept: 'fornacis', year: 2,
    locations: ['fornacis_h', 'fornacis_s', 'fornacis_d', 'thermae'],
    periods: [0, 1, 2, 3, 4],
    romanceable: true,
    intro: '炉铸学部二年级，矮人，话少但每句有用。对锻铸技艺近乎偏执，认定朋友就是真朋友。',
    dialogues: {}
  },

  // 06 · 潮鸣（人鱼·无性·双性恋·渊潮一年级）
  chaoming: {
    id: 'chaoming', name: '潮鸣', nameEn: 'Chaoming',
    title: '同学', race: 'merfolk', gender: 'N', age: '约35岁',
    sexuality: 'bi', dept: 'abyssi', year: 1,
    locations: ['abyssi_h', 'abyssi_d', 'horti', 'via'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '渊潮学部一年级，人鱼（无性），温和好奇，对陆地一切有真诚的兴趣。说话时会无意识带出旋律。',
    dialogues: {}
  },

  // 07 · 拉格纳·破晓（兽人·男·双性恋·战阵一年级）
  ragna: {
    id: 'ragna', name: '拉格纳·破晓', nameEn: 'Ragna Dawnbreak',
    title: '同学', race: 'orc', gender: 'M', age: '约22岁',
    sexuality: 'bi', dept: 'belli', year: 1,
    locations: ['belli_h', 'belli_s', 'biblio', 'campus', 'via'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '战阵学部一年级，兽人，外表强硬实则比外表敏感得多。私下在书坊看和战阵完全无关的书。左腕有祖母绑的深蓝布条。',
    dialogues: {}
  },

  // 08 · 菲利克斯·幸运草（半身人·男·双性恋·翠灵三年级）
  felix: {
    id: 'felix', name: '菲利克斯·幸运草', nameEn: 'Felix Clover',
    title: '学长', race: 'halfling', gender: 'M', age: '24岁',
    sexuality: 'bi', dept: 'silvae', year: 3,
    locations: ['silvae_h', 'silvae_f', 'silvae_s', 'forum', 'via', 'horti'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '翠灵学部三年级，半身人，乐观随和，口袋里永远有糖。人脉广但真正亲近的朋友不多。绿集商会活跃成员。',
    dialogues: {}
  },

  // 09 · 炎夜·卡尔达斯（龙裔·女·同性恋·战阵一年级）
  yenye: {
    id: 'yenye', name: '炎夜·卡尔达斯', nameEn: 'Yenye Caldas',
    title: '同学', race: 'dragonborn', gender: 'F', age: '约19岁',
    sexuality: 'gay', dept: 'belli', year: 1,
    locations: ['belli_h', 'belli_s', 'campus', 'stellae_s'],
    periods: [0, 1, 2],
    romanceable: true,
    intro: '战阵学部一年级，龙裔，骄傲但不蛮横。龙息控制课压力最大，对自己的要求已超过课程本身。',
    dialogues: {}
  },

  // 10 · 流光（魅魔·双性·双性恋·幻澜二年级）
  liuguang: {
    id: 'liuguang', name: '流光', nameEn: 'Liuguang',
    title: '学长/学姐', race: 'fey', gender: 'X', age: '约31岁',
    sexuality: 'bi', dept: 'mentis', year: 2,
    locations: ['mentis_h', 'mentis_d', 'mentis_s', 'forum', 'ambul'],
    periods: [1, 2, 3],
    romanceable: true,
    intro: '幻澜学部二年级，魅魔（双性），随性敏锐。因天然吸引力难与真实情感区分，初期会主动保持距离。专攻心象投射。',
    dialogues: {}
  },

  // 11 · 艾苇·晨（混血裔精灵×人类·女·双性恋·曦光二年级）
  aiwei: {
    id: 'aiwei', name: '艾苇·晨', nameEn: 'Aiwei Chen',
    title: '学姐', race: 'halfblood', parents: ['elf', 'human'],
    gender: 'F', age: '20岁',
    sexuality: 'bi', dept: 'lucis', year: 2,
    locations: ['lucis_h', 'lucis_d', 'horti', 'biblio', 'via'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '曦光学部二年级，混血裔（精灵×人类），温和细腻，对周围人的情绪变化很敏感。浅金色头发，没有情光。',
    dialogues: {}
  },

  // 12 · 赫卡·铁血（混血裔吸血鬼×兽人·男·异性恋·战阵二年级）
  heka: {
    id: 'heka', name: '赫卡·铁血', nameEn: 'Heka Ironblood',
    title: '学长', race: 'halfblood', parents: ['vampire', 'orc'],
    gender: 'M', age: '21岁',
    sexuality: 'straight', dept: 'belli', year: 2,
    locations: ['belli_h', 'belli_s', 'belli_d', 'campus', 'thermae'],
    periods: [0, 1, 2, 3],
    romanceable: true,
    intro: '战阵学部二年级，混血裔（吸血鬼×兽人），矛盾真实，对自己的矛盾毫不掩饰。来战阵是因为这里对种族偏见最少。',
    dialogues: {}
  },

};

// 获取当前地点+时段可互动的NPC列表
export function getNpcsAt(locKey, period) {
  return Object.values(NPCS).filter(npc =>
    npc.locations.includes(locKey) && npc.periods.includes(period)
  );
}

// 获取所有可攻略NPC
export function getRomanceableNpcs() {
  return Object.values(NPCS).filter(npc => npc.romanceable);
}