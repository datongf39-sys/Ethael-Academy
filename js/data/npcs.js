// NPC数据
// 每个NPC包含：基本信息、出现地点/时段、对话树
// 对话选项结构：{ id, text, relDelta, stat?(属性门槛), next(下一节点，null=结束) }
// relBonus：抵达该节点时额外加的好感度（不来自选项点击，而是叙事奖励）

export const NPCS = {

  // ── 维斯塔教授 ──────────────────────────────────────────────
  vesta: {
    id:       'vesta',
    name:     '维斯塔',
    title:    '教授',
    dept:     'lucis',
    gender:   'F',
    locations: ['lucis_h'],
    periods:   [1, 2],       // 上午、下午
    intro:    '曦光学部的治愈术教授，严谨而公正，对认真的学生尤为赏识。',
    dialogues: {
      default: {
        speaker: '维斯塔教授',
        text:    '「同学，有什么需要帮助的？」她抬起头，目光平和而审视。',
        options: [
          { id: 'ask_lesson',  text: '向教授请教课程内容',                       relDelta: 2,  next: 'lesson_reply' },
          { id: 'ask_score',   text: '询问自己的平时成绩',                       relDelta: 1,  next: 'score_reply'  },
          { id: 'compliment',  text: '「教授，您今天的讲解非常精彩。」',          relDelta: 3,  stat: { key: 'cha', min: 12 }, next: 'compliment_reply' },
          { id: 'leave',       text: '「没什么，打扰了。」',                      relDelta: 0,  next: null },
        ]
      },
      lesson_reply: {
        speaker: '维斯塔教授',
        text:    '「治愈术的核心在于精准而非强力——你问到点子上了。」她随手翻开一本厚重的医典，指向一处图解。「下次课会重点讲这里，提前预习会有帮助。」',
        relBonus: 1,
        options: [
          { id: 'thanks',   text: '认真记下，道谢离开',     relDelta: 1, next: null },
          { id: 'ask_more', text: '继续深入请教',           relDelta: 2, stat: { key: 'int', min: 11 }, next: 'deepen_reply' },
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
          { id: 'yes', text: '「已经完成了。」',    relDelta: 2,  next: null },
          { id: 'no',  text: '「……还没有。」',      relDelta: -1, next: null },
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
      // 熟识（11+）解锁
      acquaint_greeting: {
        speaker: '维斯塔教授',
        text:    '「你来得正好，我刚好有些课外资料想推荐给几位用功的学生。」她从抽屉里取出一张书单。',
        options: [
          { id: 'accept', text: '双手接过，道谢',                               relDelta: 2,  next: 'acquaint_booklist' },
          { id: 'pass',   text: '「谢谢教授，但我最近事情较多。」',             relDelta: -1, next: null },
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

  // ── 林霜 ────────────────────────────────────────────────────
  lin_shuang: {
    id:       'lin_shuang',
    name:     '林霜',
    title:    '同学',
    dept:     'mentis',
    gender:   'F',
    locations: ['mentis_d', 'mentis_h', 'horti', 'biblio'],
    periods:   [0, 3, 4],   // 清晨、傍晚、夜间
    intro:    '幻澜学部的同届同学，话少心细，冷淡外表下藏着细腻的情感。',
    dialogues: {
      default: {
        speaker: '林霜',
        text:    '她正靠着窗台看书，察觉到你的靠近，抬眼扫了你一眼，没有主动开口。',
        options: [
          { id: 'greet',      text: '「你好，最近怎么样？」',          relDelta: 1, next: 'greet_reply'      },
          { id: 'ask_notes',  text: '「我能看看你的笔记吗？」',        relDelta: 1, next: 'notes_reply'      },
          { id: 'compliment', text: '「你的头发今天很好看。」',        relDelta: 2, stat: { key: 'cha', min: 11 }, next: 'compliment_reply' },
          { id: 'leave',      text: '默默离开，不打扰她',              relDelta: 0, next: null               },
        ]
      },
      greet_reply: {
        speaker: '林霜',
        text:    '「还行。」她顿了顿，又低下头继续看书，但这次书页没有翻动。',
        options: [
          { id: 'continue', text: '「最近幻术课压力很大吧……」',  relDelta: 1, next: 'pressure_reply' },
          { id: 'ok',       text: '「好，那你继续。」',           relDelta: 0, next: null             },
        ]
      },
      notes_reply: {
        speaker: '林霜',
        text:    '她沉默片刻，将笔记本推过来，语气平淡：「借你看，别弄脏。」',
        relBonus: 1,
        options: [
          { id: 'thanks',    text: '仔细翻阅，连声道谢',        relDelta: 2,  next: null },
          { id: 'flip_fast', text: '随手翻了几页就还回去',      relDelta: -1, next: null },
        ]
      },
      compliment_reply: {
        speaker: '林霜',
        text:    '她停顿了一秒，随后若无其事地拢了拢发丝。「……随便梳的。」但耳尖隐约有些红。',
        relBonus: 1,
        options: [
          { id: 'end', text: '微笑，不再多说', relDelta: 1, next: null },
        ]
      },
      pressure_reply: {
        speaker: '林霜',
        text:    '「还好。」她抬起眼，罕见地多说了几个字：「你上次幻象成型的角度不太对，要注意。」',
        relBonus: 1,
        options: [
          { id: 'thanks', text: '「谢谢提醒——你自己怎么做到的？」',  relDelta: 2, next: 'tip_reply' },
          { id: 'ok',     text: '「我会注意的，谢谢你。」',           relDelta: 1, next: null       },
        ]
      },
      tip_reply: {
        speaker: '林霜',
        text:    '她短暂思考后，用极简的语言解释了心法要点，手指轻轻在空中比划了一下。「大概就这样。」',
        relBonus: 2,
        options: [
          { id: 'end', text: '认真记下，心中多了几分暖意', relDelta: 2, next: null },
        ]
      },
      // 友好（41+）解锁
      friend_invite: {
        speaker: '林霜',
        text:    '她罕见地主动出声：「……晖湖畔今天有新的风铃草开了。你要去看吗？」',
        options: [
          { id: 'yes', text: '「当然，走吧。」',             relDelta: 3,  next: 'friend_walk' },
          { id: 'no',  text: '「现在有点忙，下次吧。」',    relDelta: -1, next: null          },
        ]
      },
      friend_walk: {
        speaker: '林霜',
        text:    '两人沿晖湖漫步，她话不多，但偶尔说一句，就总是恰到好处。湖面上光影流动，你感到某种说不清楚的舒适。',
        relBonus: 2,
        options: [
          { id: 'end', text: '「这里真的很美。」', relDelta: 1, next: null },
        ]
      },
    }
  },

  // ── 沈墨白 ──────────────────────────────────────────────────
  shen_mobai: {
    id:       'shen_mobai',
    name:     '沈墨白',
    title:    '同学',
    dept:     'umbrae',
    gender:   'M',
    locations: ['umbrae_h', 'via', 'forum', 'ambul'],
    periods:   [1, 2, 3],
    intro:    '暮影学部二年级，表情漫不经心，从不轻易得罪人——除非对方先动手。',
    dialogues: {
      default: {
        speaker: '沈墨白',
        text:    '他倚着柱子，手里把玩着一枚暗色的魔力晶石，瞥了你一眼：「哟，幻澜的同学。迷路了？」',
        options: [
          { id: 'retort', text: '「你暮影的人不都夜间才出门吗？」',  relDelta: 2,  stat: { key: 'cha', min: 11 }, next: 'banter_reply'  },
          { id: 'normal', text: '「只是路过。你在等人？」',          relDelta: 1,  next: 'waiting_reply' },
          { id: 'ignore', text: '无视他，径直走过',                  relDelta: -2, next: null             },
        ]
      },
      banter_reply: {
        speaker: '沈墨白',
        text:    '他稍微坐直了一点，嘴角翘起：「哈，有意思——你胆子不小嘛。」他伸出手，「沈墨白，二年级。」',
        relBonus: 2,
        options: [
          { id: 'shake', text: '与他握手，报上自己的名字',  relDelta: 2, next: 'intro_reply' },
          { id: 'nod',   text: '只点点头，保持距离',       relDelta: 0, next: null           },
        ]
      },
      waiting_reply: {
        speaker: '沈墨白',
        text:    '「算是。」他轻描淡写，「等一个不一定会来的人。」他侧过头，「你要去哪里？」',
        options: [
          { id: 'chat',  text: '「正好没事，陪你等一会儿。」',  relDelta: 2, next: 'wait_together' },
          { id: 'leave', text: '「随便走走。先走了。」',        relDelta: 0, next: null             },
        ]
      },
      intro_reply: {
        speaker: '沈墨白',
        text:    '「幻澜……」他若有所思地重复了一遍，「改天可以交流一下，你们学部我认识的人不多。」',
        options: [
          { id: 'agree', text: '「随时欢迎。」', relDelta: 1, next: null },
        ]
      },
      wait_together: {
        speaker: '沈墨白',
        text:    '你就这么站在他旁边，也没说什么话。过了一会儿，他轻声道：「那个人果然没来。」他站起身，「请你去中央广场买杯茶？」',
        relBonus: 2,
        options: [
          { id: 'yes', text: '「可以。」',        relDelta: 2, next: null },
          { id: 'no',  text: '「不了，先走了。」', relDelta: 0, next: null },
        ]
      },
      // 反感（-11 ~ -40）限制对话
      hostile_default: {
        speaker: '沈墨白',
        text:    '他看了你一眼，眼神带着一点凉意。「有事吗？」语气不太友好。',
        options: [
          { id: 'apologize', text: '「上次的事……我想道个歉。」',  relDelta: 3, next: 'apology_reply' },
          { id: 'leave',     text: '「没事，走了。」',             relDelta: 0, next: null             },
        ]
      },
      apology_reply: {
        speaker: '沈墨白',
        text:    '他沉默片刻，将手中的晶石收进口袋。「……知道了。」这算是接受了。',
        relBonus: 2,
        options: [
          { id: 'end', text: '点头，就此揭过', relDelta: 1, next: null },
        ]
      },
    }
  },

  // ── 孟清远 ──────────────────────────────────────────────────
  meng_qingyuan: {
    id:       'meng_qingyuan',
    name:     '孟清远',
    title:    '学长',
    dept:     'mentis',
    gender:   'M',
    locations: ['mentis_h', 'forum', 'biblio', 'horti'],
    periods:   [0, 1, 2, 3],
    intro:    '幻澜学部的学长，热情开朗，喜欢收集奇异物品，在学部颇有人缘。',
    dialogues: {
      default: {
        speaker: '孟清远',
        text:    '「哟，晚晚！」他朝你挥手，「正好遇见你——你对幻象叠加有研究吗？我最近卡住一个地方了。」',
        options: [
          { id: 'help',   text: '「说来听听，也许我能帮上。」',    relDelta: 2, next: 'help_reply'   },
          { id: 'unsure', text: '「我也不太擅长这个……」',          relDelta: 0, next: 'unsure_reply' },
          { id: 'genius', text: '「这我最拿手了——说吧。」',        relDelta: 1, stat: { key: 'mag', min: 13 }, next: 'genius_reply' },
        ]
      },
      help_reply: {
        speaker: '孟清远',
        text:    '「太好了！」他立刻掏出一张满是符文草图的纸，「你看这里，叠加第三层的时候形态就开始模糊了——」',
        options: [
          { id: 'analyze', text: '认真分析，给出建议',          relDelta: 3,  next: 'analyze_reply' },
          { id: 'pass',    text: '「这个我也搞不定，抱歉了。」',relDelta: -1, next: null             },
        ]
      },
      unsure_reply: {
        speaker: '孟清远',
        text:    '「没事没事！」他摆摆手，「一起研究嘛，说不定两个人能想出来。」他把图纸递过来。',
        relBonus: 1,
        options: [
          { id: 'try',  text: '「好，试试看。」',        relDelta: 2, next: 'analyze_reply' },
          { id: 'pass', text: '「我还有事，下次吧。」',  relDelta: 0, next: null             },
        ]
      },
      genius_reply: {
        speaker: '孟清远',
        text:    '「太好了！」他眼睛一亮，「那你快讲讲！幻象叠加第三层的形态稳定化问题怎么解？」',
        options: [
          { id: 'explain', text: '详细解说心法要诀', relDelta: 3, next: 'analyze_reply' },
        ]
      },
      analyze_reply: {
        speaker: '孟清远',
        text:    '他猛地拍了一下桌子，「就是这里！我怎么没想到！」他兴奋地在图纸上修改，「你真的帮了大忙，谢谢！」',
        relBonus: 3,
        options: [
          { id: 'happy', text: '「能帮到你我也很高兴。」',                         relDelta: 1, next: null },
          { id: 'tease', text: '「下次再有问题记得来找我。」',                     relDelta: 2, stat: { key: 'cha', min: 10 }, next: null },
        ]
      },
    }
  },

  // ── 艾薇拉 ──────────────────────────────────────────────────
  ai_weila: {
    id:       'ai_weila',
    name:     '艾薇拉',
    title:    '同学',
    dept:     'silvae',
    gender:   'F',
    locations: ['horti', 'via', 'ambul', 'silvae_h'],
    periods:   [0, 3],      // 清晨、傍晚
    intro:    '翠灵学部的精灵裔学生，温柔细腻，热爱自然，经常在晖湖边采集草药。',
    dialogues: {
      default: {
        speaker: '艾薇拉',
        text:    '她正蹲在花圃旁仔细端详一株白色草药。听见脚步声，她回头，露出温柔的笑：「哦，你好，是幻澜的同学吗？」',
        options: [
          { id: 'greet',     text: '「你好，这是什么植物？」',                          relDelta: 2, next: 'herb_reply'       },
          { id: 'sit',       text: '在她旁边坐下，什么也不说，只是欣赏花园',           relDelta: 1, next: 'silent_reply'     },
          { id: 'elf_bond',  text: '「你的耳廓很漂亮——我也有精灵血统。」',            relDelta: 3, stat: { key: 'cha', min: 10 }, next: 'elf_reply' },
        ]
      },
      herb_reply: {
        speaker: '艾薇拉',
        text:    '「哦！这叫月白芙蓉——晖湖边才有，对净化魔力残留很有效果。」她轻轻摘下一朵递给你，「拿着吧，有时候对幻术的副作用有帮助。」',
        relBonus: 2,
        options: [
          { id: 'accept', text: '「谢谢，你真的很懂草药。」',        relDelta: 2, next: null               },
          { id: 'chat',   text: '「你是专门研究草药的吗？」',        relDelta: 1, next: 'herb_study_reply' },
        ]
      },
      silent_reply: {
        speaker: '艾薇拉',
        text:    '她没有打扰你，只是偶尔轻声哼着什么。晖湖的风带着草木气息，令人安心。过了一会儿，她低声说：「这里是全学院最安静的地方了。」',
        relBonus: 1,
        options: [
          { id: 'agree', text: '「确实……谢谢你没赶我走。」', relDelta: 2, next: null },
        ]
      },
      elf_reply: {
        speaker: '艾薇拉',
        text:    '她的眼睛一下亮了起来：「真的！混血裔。」她有些激动地凑近，「我们精灵在这里真的不多，你平时会感到什么不适应吗？」',
        relBonus: 2,
        options: [
          { id: 'share',  text: '坦诚分享自己的体验',          relDelta: 3, next: 'share_reply' },
          { id: 'modest', text: '「倒还好，习惯了。」',        relDelta: 1, next: null           },
        ]
      },
      herb_study_reply: {
        speaker: '艾薇拉',
        text:    '「算是吧。翠灵学部的课程里有草药学，但我业余也在做记录。」她站起身，「如果你感兴趣的话，我可以带你认识几种。」',
        relBonus: 1,
        options: [
          { id: 'join', text: '「好啊，什么时候？」',      relDelta: 2, next: null },
          { id: 'pass', text: '「下次有机会吧。」',        relDelta: 0, next: null },
        ]
      },
      share_reply: {
        speaker: '艾薇拉',
        text:    '她认真地倾听，偶尔点头。「嗯……混血裔其实比纯血更能感受到两种文化的美。」她摘下手腕上的一条细藤，「这是精灵传统的友谊信物，送你。」',
        relBonus: 3,
        options: [
          { id: 'accept', text: '「我会好好保存的。」', relDelta: 2, next: null },
        ]
      },
    }
  },
};

// 获取当前地点+时段可互动的NPC列表
export function getNpcsAt(locKey, period) {
  return Object.values(NPCS).filter(npc =>
    npc.locations.includes(locKey) && npc.periods.includes(period)
  );
}
