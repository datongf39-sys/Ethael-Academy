// 种族数据库
// v1.1 — 新增 affinity（各魔法系亲和率）与 primaryMagic（代表魔法系，供混血裔双系共鸣使用）

/**
 * affinity 字段说明：
 *   key   = 魔法系标识（nature / dark / body / rune / illusion / charm / arcane / dragon）
 *   value = 亲和率小数（0.30 = +30%；-0.15 = -15%排斥；缺省 = 0，即无加减）
 *
 * 学习效率乘数：1 + affinityRate
 * 施法效验乘数：1 + affinityRate × 0.5
 * → 详见 affinity.js
 */
export const RACES = {
  human: {
    name: '人类',
    stat: { int:0, mag:0, phy:0, cha:0, sen:0 },
    skipChance: 0.15,
    passive: '跨学部无衰减',
    hpBase: 100, mpBase: 80, spBase: 60,
    primaryMagic: 'arcane',
    affinity: {
      // 人类天赋「跨学部无衰减」体现于 passive，亲和率全系均衡，无加减
    }
  },

  elf: {
    name: '精灵',
    stat: { int:2, mag:3, phy:-1, cha:0, sen:2 },
    skipChance: 0.20,
    passive: '情光（紧张时发光）',
    hpBase: 90, mpBase: 95, spBase: 55,
    primaryMagic: 'nature',
    affinity: {
      nature:   0.30,   // 自然魔法 +30%（施法精准度最高）
      illusion: 0.15,   // 幻术系小加成
      dark:    -0.15,   // 排斥暗魔法
    }
  },

  vampire: {
    name: '吸血鬼',
    stat: { int:0, mag:4, phy:-2, cha:2, sen:1 },
    skipChance: 0.15,
    passive: '夜间效率+15%',
    hpBase: 85, mpBase: 105, spBase: 50,
    primaryMagic: 'dark',
    affinity: {
      dark:    0.40,   // 暗魔法 +40%（魔力凝炼超群）
      charm:   0.20,   // 魅惑系 +20%（摄魄之眼）
      nature: -0.10,   // 微弱排斥自然魔法
    }
  },

  dwarf: {
    name: '矮人',
    stat: { int:1, mag:-1, phy:3, cha:-1, sen:0 },
    skipChance: 0.12,
    passive: '抗扰乱减半',
    hpBase: 110, mpBase: 70, spBase: 70,
    primaryMagic: 'rune',
    affinity: {
      rune:    0.40,   // 符文/锻铸 +40%（器物刻录造诣天下第一）
      body:    0.10,   // 体魄魔法小加成
      illusion:-0.20,  // 排斥幻术
    }
  },

  merfolk: {
    name: '人鱼',
    stat: { int:0, mag:1, phy:-2, cha:3, sen:2 },
    skipChance: 0.18,
    passive: '说服+20%',
    hpBase: 85, mpBase: 85, spBase: 55,
    primaryMagic: 'charm',
    affinity: {
      charm:   0.30,   // 魅惑系 +30%（说服加成）
      nature:  0.15,   // 自然魔法小加成
      rune:   -0.10,   // 排斥符文
    }
  },

  orc: {
    name: '兽人',
    stat: { int:-2, mag:1, phy:5, cha:-2, sen:0 },
    skipChance: 0.20,
    passive: '体魄考试免失控',
    hpBase: 130, mpBase: 75, spBase: 80,
    primaryMagic: 'body',
    affinity: {
      body:    0.50,   // 体魄魔法 +50%（无需咒文，豁免失控）
      rune:   -0.15,   // 排斥符文
      illusion:-0.25,  // 排斥幻术
    }
  },

  darkelf: {
    name: '暗精灵',
    stat: { int:2, mag:1, phy:-2, cha:-1, sen:4 },
    skipChance: 0.07,
    passive: '逆向解析',
    hpBase: 88, mpBase: 88, spBase: 52,
    primaryMagic: 'dark',
    affinity: {
      dark:    0.35,   // 暗魔法 +35%（无声施法）
      illusion: 0.20,  // 幻术 +20%（逆向解析）
      nature:  -0.20,  // 排斥自然魔法
    }
  },

  halfling: {
    name: '半身人',
    stat: { int:1, mag:0, phy:-3, cha:3, sen:2 },
    skipChance: 0.10,
    passive: '8%好运波动',
    hpBase: 80, mpBase: 78, spBase: 65,
    primaryMagic: 'charm',
    affinity: {
      charm:   0.20,   // 魅惑系 +20%
      illusion: 0.15,  // 幻术小加成（幸运魔法特性）
      body:   -0.15,   // 排斥体魄魔法
    }
  },

  dragonborn: {
    name: '龙裔',
    stat: { int:-1, mag:4, phy:2, cha:0, sen:-1 },
    skipChance: 0.23,
    passive: 'MP上限+25%',
    hpBase: 105, mpBase: 110, spBase: 65,
    primaryMagic: 'dragon',
    affinity: {
      dragon:  0.50,   // 龙系魔法 +50%（龙息独占技能）
      arcane:  0.20,   // 奥术 +20%
      charm:  -0.10,   // 微弱排斥魅惑
    }
  },

  fey: {
    name: '魅魔',
    stat: { int:0, mag:1, phy:-4, cha:5, sen:2 },
    skipChance: 0.09,
    passive: '人群MP+50%',
    hpBase: 78, mpBase: 90, spBase: 50,
    primaryMagic: 'charm',
    affinity: {
      charm:   0.50,   // 魅惑系 +50%（面容模糊感、人群MP）
      illusion: 0.25,  // 幻术 +25%
      body:   -0.30,   // 强排斥体魄魔法
      rune:   -0.20,   // 排斥符文
    }
  },

  halfblood: {
    name: '混血裔',
    stat: { int:0, mag:0, phy:0, cha:1, sen:0 },
    skipChance: 0.15,
    passive: '双系共鸣15%',
    hpBase: 95, mpBase: 88, spBase: 58,
    primaryMagic: null,   // 由双亲决定，见 affinity.js resolveAffinityRate

    // 混血裔需要指定双亲
    calcStats(p1, p2) {
      const r1 = RACES[p1], r2 = RACES[p2];
      const merged = {};
      for (const k of Object.keys(this.stat)) {
        merged[k] = Math.floor((r1.stat[k] + r2.stat[k]) / 2) + this.stat[k];
      }
      merged.cha += 1; // 混血裔额外魅力+1
      return merged;
    }
    // 混血裔 affinity 在运行时由 affinity.js#resolveAffinityRate 动态合并双亲数据
    // 无需在此预设 affinity 字段
  }
};
