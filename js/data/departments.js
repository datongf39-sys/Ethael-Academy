// 学部数据库
export const DEPTS = {
  lucis:    { name:'曦光学部',  short:'曦光', dorm:'晨露阁', hall:'辉石殿',
    courses: [
      { name:'圣辉基础',      type:'主修', periods:[1], days:[0,4] },
      { name:'治愈术理论与实践', type:'主修', periods:[1], days:[1,2] },
      { name:'净化仪式学',    type:'主修', periods:[1], days:[3] },
      { name:'光幕构造学',    type:'主修', periods:[0], days:[2] },
    ]
  },
  umbrae:   { name:'暮影学部',  short:'暮影', dorm:'长夜馆', hall:'夜幕塔',
    courses: [
      { name:'荫影入门',      type:'主修', periods:[1], days:[0,3] },
      { name:'时序术导论',    type:'主修', periods:[1], days:[2] },
      { name:'诅咒学·解咒篇', type:'主修', periods:[0], days:[1,4] },
      { name:'念力术基础',    type:'主修', periods:[1], days:[4] },
    ]
  },
  silvae:   { name:'翠灵学部',  short:'翠灵', dorm:'绿荫苑', hall:'藤蔓学舍',
    courses: [
      { name:'草木共鸣入门',  type:'主修', periods:[0], days:[0,2] },
      { name:'召唤术理论与实践', type:'主修', periods:[1], days:[1,3] },
      { name:'药草学基础',    type:'主修', periods:[1], days:[0,4] },
      { name:'高等药草学',    type:'主修', periods:[2], days:[2] },
    ]
  },
  fornacis: { name:'炉铸学部',  short:'炉铸', dorm:'砧石居', hall:'铁壁学堂',
    courses: [
      { name:'符文基础刻录',  type:'主修', periods:[1], days:[0,2] },
      { name:'锻铸入门',      type:'主修', periods:[0], days:[1,3] },
      { name:'附魔术理论',    type:'主修', periods:[1], days:[4] },
      { name:'解构与鉴定',    type:'主修', periods:[2], days:[0] },
    ]
  },
  mentis:   { name:'幻澜学部',  short:'幻澜', dorm:'梦蝶楼', hall:'流光殿',
    courses: [
      { name:'幻象术入门',    type:'主修', periods:[1], days:[0,2] },
      { name:'梦境术导论',    type:'主修', periods:[1], days:[1,4] },
      { name:'魅惑术与伦理',  type:'主修', periods:[2], days:[3] },
      { name:'心象投射基础',  type:'主修', periods:[0], days:[2,4] },
    ]
  },
  belli:    { name:'战阵学部',  short:'战阵', dorm:'戎行寮', hall:'铁幕学堂',
    courses: [
      { name:'体魄强化基础',  type:'主修', periods:[0], days:[0,1,2,3,4] },
      { name:'战阵术·小队协作', type:'主修', periods:[1], days:[2,4] },
      { name:'魔抗修炼基础',  type:'主修', periods:[1], days:[0,3] },
    ]
  },
  abyssi:   { name:'渊潮学部',  short:'渊潮', dorm:'涟波居', hall:'潮音殿',
    courses: [
      { name:'水流术入门',    type:'主修', periods:[1], days:[0,3] },
      { name:'声波术基础',    type:'主修', periods:[1], days:[2,4] },
      { name:'毒素学导论',    type:'主修', periods:[2], days:[1] },
      { name:'水下魔法实践',  type:'主修', periods:[0], days:[1,4] },
    ]
  },
  stellae:  { name:'星脉学部',  short:'星脉', dorm:'星辰舍', hall:'天枢馆',
    courses: [
      { name:'元素魔法概论',  type:'主修', periods:[1], days:[0,2,4] },
      { name:'大地术基础',    type:'主修', periods:[0], days:[1,3] },
      { name:'元素专精',      type:'主修', periods:[1], days:[1] },
      { name:'跨系魔法理论',  type:'主修', periods:[2], days:[3] },
    ]
  }
};

// 通选课（全院）
export const COMMON_COURSES = [
  { name:'魔法史通论',    type:'通选', periods:[2], days:[1,3] },
  { name:'跨族文化研究',  type:'通选', periods:[2], days:[0,4] },
  { name:'魔法伦理学',    type:'通选', periods:[3], days:[2] },
  { name:'古代语言入门',  type:'通选', periods:[0], days:[3] },
  { name:'学院生存指南',  type:'通选', periods:[3], days:[0] },
];