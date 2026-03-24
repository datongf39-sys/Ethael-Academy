// 种族数据库
export const RACES = {
  human:    { name:'人类',   stat:{int:0,mag:0,phy:0,cha:0,sen:0}, skipChance:0.15, passive:'跨学部无衰减', hpBase:100, mpBase:80,  spBase:60 },
  elf:      { name:'精灵',   stat:{int:2,mag:3,phy:-1,cha:0,sen:2}, skipChance:0.20, passive:'情光（紧张时发光）', hpBase:90,  mpBase:95,  spBase:55 },
  vampire:  { name:'吸血鬼', stat:{int:0,mag:4,phy:-2,cha:2,sen:1}, skipChance:0.15, passive:'夜间效率+15%', hpBase:85,  mpBase:105, spBase:50 },
  dwarf:    { name:'矮人',   stat:{int:1,mag:-1,phy:3,cha:-1,sen:0}, skipChance:0.12, passive:'抗扰乱减半', hpBase:110, mpBase:70,  spBase:70 },
  merfolk:  { name:'人鱼',   stat:{int:0,mag:1,phy:-2,cha:3,sen:2}, skipChance:0.18, passive:'说服+20%', hpBase:85,  mpBase:85,  spBase:55 },
  orc:      { name:'兽人',   stat:{int:-2,mag:1,phy:5,cha:-2,sen:0}, skipChance:0.20, passive:'体魄考试免失控', hpBase:130, mpBase:75,  spBase:80 },
  darkelf:  { name:'暗精灵', stat:{int:2,mag:1,phy:-2,cha:-1,sen:4}, skipChance:0.07, passive:'逆向解析', hpBase:88,  mpBase:88,  spBase:52 },
  halfling: { name:'半身人', stat:{int:1,mag:0,phy:-3,cha:3,sen:2}, skipChance:0.10, passive:'8%好运波动', hpBase:80,  mpBase:78,  spBase:65 },
  dragonborn:{ name:'龙裔',  stat:{int:-1,mag:4,phy:2,cha:0,sen:-1}, skipChance:0.23, passive:'MP上限+25%', hpBase:105, mpBase:110, spBase:65 },
  fey:      { name:'魅魔',   stat:{int:0,mag:1,phy:-4,cha:5,sen:2}, skipChance:0.09, passive:'人群MP+50%', hpBase:78,  mpBase:90,  spBase:50 },
  halfblood:{ name:'混血裔', stat:{int:0,mag:0,phy:0,cha:1,sen:0}, skipChance:0.15, passive:'双系共鸣15%', hpBase:95,  mpBase:88,  spBase:58,
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
  }
};