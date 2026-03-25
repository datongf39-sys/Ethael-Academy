// 地图系统
export const LOCATIONS = {

  // ============================================================
  // 公共区域
  // ============================================================
  via:      { name:'银叶大道',      sub:'Via Argentea',             dept:null,      icon:'road',   desc:'学院主干道，银叶白杨两侧，入秋如碎银。公告栏在交叉广场。' },
  forum:    { name:'中央广场',      sub:'Forum Centrale',           dept:null,      icon:'plaza',  desc:'学院地理中心，建院纪念碑所在地，节日庆典主会场。' },
  horti:    { name:'晖湖畔花园',    sub:'Horti Lacustres',          dept:null,      icon:'garden', desc:'南侧晖湖畔，凉亭石桥环湖步道。北侧有月弧台露天剧场。' },
  campus:   { name:'落星操场',      sub:'Campus Stellarum',         dept:null,      icon:'field',  desc:'战阵与星脉之间，全院最大户外运动场，设有简易看台。' },
  ambul:    { name:'迷径花廊',      sub:'Ambulacrum Labyrinthicum', dept:null,      icon:'path',   desc:'幻澜与翠灵交界，花廊内施有轻度幻象，随机事件高发地。' },
  thermae:  { name:'矿石浴场',      sub:'Thermae Minerales',        dept:null,      icon:'spa',    desc:'炉铸学部旁天然温泉，SP恢复最佳。矮人沉石礼净身之所。' },
  biblio:   { name:'星见书坊',      sub:'Bibliotheca Communis',     dept:null,      icon:'lib',    desc:'广场旁公共图书馆，通识藏书，内设墨香座咖啡角。' },
  atrium:   { name:'学生事务大厅',  sub:'Atrium Discipulorum',      dept:null,      icon:'admin',  desc:'广场东侧行政楼，教导主任办公室在此。社团注册窗口在一楼。' },

  // ============================================================
  // 曦光学部 Ordo Lucis
  // ============================================================
  lucis_h:  { name:'辉石殿',        sub:'曦光学部 · 教学楼',        dept:'lucis',   icon:'dept',   desc:'白色大理石三层建筑，彩色玻璃窗投射移动光斑。顶层光祷堂，地下治愈实操室。' },
  lucis_d:  { name:'晨露阁',        sub:'曦光学部 · 宿舍',          dept:'lucis',   icon:'dorm',   desc:'全朝东宿舍，确保清晨阳光照入。管理全院最严，就寝有硬性规定。' },
  lucis_f:  { name:'光合厅',        sub:'曦光学部 · 食堂',          dept:'lucis',   icon:'food',   desc:'透明魔法玻璃穹顶，白天自然光用餐。草药茶全院最受欢迎。' },
  lucis_l:  { name:'经典回廊',      sub:'曦光学部 · 图书馆',        dept:'lucis',   icon:'lib',    desc:'环形走廊式，书架嵌入弧形墙壁。禁止使用任何暗系魔法，包括无害照明术。' },
  lucis_s:  { name:'晖光疗所',      sub:'曦光学部 · 特色空间',      dept:'lucis',   icon:'heal',   desc:'学院唯一正式医疗站，高年级学子与教授轮值，所有学部均可就诊。' },

  // ============================================================
  // 暮影学部 Ordo Umbrae
  // ============================================================
  umbrae_h: { name:'夜幕塔',        sub:'暮影学部 · 教学楼',        dept:'umbrae',  icon:'dept',   desc:'幽蓝灯笼照明，影匿门遍布。地下两层为时序回廊，刻有移动的时间符文。' },
  umbrae_d: { name:'长夜馆',        sub:'暮影学部 · 宿舍',          dept:'umbrae',  icon:'dorm',   desc:'厚窗帘完全隔绝日光，就寝比其他学部晚两小时。每层设壁炉公共休息室。' },
  umbrae_f: { name:'暗锅堂',        sub:'暮影学部 · 食堂',          dept:'umbrae',  icon:'food',   desc:'夜幕塔底层半地下食堂，供应至深夜。血晶石饮品与普通饮品同等对待，不做区分。' },
  umbrae_l: { name:'禁卷阁',        sub:'暮影学部 · 图书馆',        dept:'umbrae',  icon:'lib',    desc:'暗魔法、时序术、诅咒学藏书。部分书架有魔法封印，按修习等级开放。全院最安静。' },
  umbrae_s: { name:'诅咒实验室',    sub:'暮影学部 · 特色空间',      dept:'umbrae',  icon:'lab',    desc:'全院唯一合法诅咒学研究场所，多重防护结界。入内需佩戴身份徽记并签署誓约。' },

  // ============================================================
  // 翠灵学部 Ordo Silvae
  // ============================================================
  silvae_h: { name:'藤蔓学舍',      sub:'翠灵学部 · 教学楼',        dept:'silvae',  icon:'dept',   desc:'半嵌入白杨林，部分教室半露天，藤蔓顶棚随天气开合。每间教室有一棵教学树。' },
  silvae_d: { name:'绿荫苑',        sub:'翠灵学部 · 宿舍',          dept:'silvae',  icon:'dorm',   desc:'外墙爬满常绿藤蔓，每间配小型阳台花园。管理全院最宽松，无明确就寝时间。' },
  silvae_f: { name:'四季灶',        sub:'翠灵学部 · 食堂',          dept:'silvae',  icon:'food',   desc:'圆形开放式，菜品随季节变化。半身人学子常客座掌勺，伙食全院评价最高。' },
  silvae_l: { name:'根脉书巢',      sub:'翠灵学部 · 图书馆',        dept:'silvae',  icon:'lib',    desc:'建在巨型银叶白杨树洞中，书架随树干弯曲。全院公认最适合静读的空间。' },
  silvae_s: { name:'翠灵温室群',    sub:'翠灵学部 · 特色空间',      dept:'silvae',  icon:'green',  desc:'七座相连玻璃温室，培育各地魔法植物。每学期末举办绿集药草交易会。' },

  // ============================================================
  // 炉铸学部 Ordo Fornacis
  // ============================================================
  fornacis_h: { name:'铁壁学堂',   sub:'炉铸学部 · 教学楼',        dept:'fornacis',icon:'dept',   desc:'防火黑石砌成，每间教室配符文刻写台和小型锻炉。室温常年偏高，金属气息弥漫。' },
  fornacis_d: { name:'砧石居',     sub:'炉铸学部 · 宿舍',          dept:'fornacis',icon:'dorm',   desc:'墙壁带隔音符文，全院唯一允许在宿舍内进行轻量级锻铸的宿舍楼。' },
  fornacis_f: { name:'炉边灶',     sub:'炉铸学部 · 食堂',          dept:'fornacis',icon:'food',   desc:'紧邻大锻炉，中央有真实烹饪壁炉。分量全院最大，用餐时讨论工艺是传统。' },
  fornacis_l: { name:'铭典库',     sub:'炉铸学部 · 图书馆',        dept:'fornacis',icon:'lib',    desc:'全院面积最小。核心藏品为始源符文拓本，炉铸学部更信赖口传师授。' },
  fornacis_s: { name:'大锻炉',     sub:'炉铸学部 · 特色空间',      dept:'fornacis',icon:'forge',  desc:'永不熄灭的巨型魔法熔炉，炉心据传封印始源矿。禁止非学部人员进入。' },

  // ============================================================
  // 幻澜学部 Ordo Mentis
  // ============================================================
  mentis_h: { name:'流光殿',        sub:'幻澜学部 · 教学楼',        dept:'mentis',  icon:'dept',   desc:'外观随心境变化，走廊比实际更长，天花板比实际更高。教室配色缓慢变换。' },
  mentis_d: { name:'梦蝶楼',        sub:'幻澜学部 · 宿舍',          dept:'mentis',  icon:'dorm',   desc:'每间宿舍墙壁可施幻象装饰，每扇窗后景色各异。管理松散，设共用冥想室。' },
  mentis_f: { name:'五味阁',        sub:'幻澜学部 · 食堂',          dept:'mentis',  icon:'food',   desc:'菜品附带轻微感官增幅幻象，无害且可关闭。全院体验最独特的食堂。' },
  mentis_l: { name:'梦境阅览室',    sub:'幻澜学部 · 图书馆',        dept:'mentis',  icon:'lib',    desc:'设有半梦半醒阅读区，可以梦境形式经历书中内容。配专职唤醒员防止沉入过深。' },
  mentis_s: { name:'梦境维度入口',  sub:'幻澜学部 · 特色空间',      dept:'mentis',  icon:'dream',  desc:'全院唯一合法梦境维度教学空间，每周开放两次。失败不造成真实伤害，但精神疲惫是真实的。' },

  // ============================================================
  // 战阵学部 Ordo Belli
  // ============================================================
  belli_h:  { name:'铁幕学堂',      sub:'战阵学部 · 教学楼',        dept:'belli',   icon:'dept',   desc:'实操场地占80%，理论教室面积全院最小。墙壁有抗冲击符文加固。' },
  belli_d:  { name:'戎行寮',        sub:'战阵学部 · 宿舍',          dept:'belli',   icon:'dorm',   desc:'陈设极简，每层设公共健身区。晨起最早，不参加晨练会被同学看不起。' },
  belli_f:  { name:'战灶',          sub:'战阵学部 · 食堂',          dept:'belli',   icon:'food',   desc:'军营式长条桌，分量与炉铸并列全院最大。臂力比试和赌注挑战是常见节目。' },
  belli_l:  { name:'兵法藏',        sub:'战阵学部 · 图书馆',        dept:'belli',   icon:'lib',    desc:'全院藏书最少但所藏皆精，以战阵图谱和体魄魔法手记为核心。' },
  belli_s:  { name:'裂风场',        sub:'战阵学部 · 特色空间',      dept:'belli',   icon:'arena',  desc:'环形训练场，设器械室、体能测试室和可重塑地形的模拟战场。裂风锦标赛主场地。' },

  // ============================================================
  // 渊潮学部 Ordo Abyssi
  // ============================================================
  abyssi_h: { name:'潮音殿',        sub:'渊潮学部 · 教学楼',        dept:'abyssi',  icon:'dept',   desc:'临晖湖而建，底层在水面以下，可透过玻璃墙看到湖底。毒素课程在独立密封实验室进行。' },
  abyssi_d: { name:'涟波居',        sub:'渊潮学部 · 宿舍',          dept:'abyssi',  icon:'dorm',   desc:'低层宿舍有直接入水通道供人鱼学子使用，每层设浅水池。湿度比其他学部略高。' },
  abyssi_f: { name:'深蓝馆',        sub:'渊潮学部 · 食堂',          dept:'abyssi',  icon:'food',   desc:'半悬湖面，景观全院最好。以海鲜水产为特色，设人鱼专用生食区。' },
  abyssi_l: { name:'潮汐文库',      sub:'渊潮学部 · 图书馆',        dept:'abyssi',  icon:'lib',    desc:'部分藏书以防水材料制作，可水下阅读。设隔音阅读间供声波魔法文献有声阅读。' },
  abyssi_s: { name:'声学实验厅',    sub:'渊潮学部 · 特色空间',      dept:'abyssi',  icon:'lab',    desc:'球形大厅，声学条件精密调校。水下教室在晖湖中，非人鱼学子需服用鳃息药剂入场。' },

  // ============================================================
  // 星脉学部 Ordo Stellae
  // ============================================================
  stellae_h:{ name:'天枢馆',        sub:'星脉学部 · 教学楼',        dept:'stellae', icon:'dept',   desc:'位于银脊山肩高处，须经蜿蜒石阶到达。教室按元素分区，中央公共讲堂可容跨学部讲座。' },
  stellae_d:{ name:'星辰舍',        sub:'星脉学部 · 宿舍',          dept:'stellae', icon:'dorm',   desc:'视野最开阔，夜间可直接观星。族裔构成全院最多元，走廊常能听到五种以上语言。' },
  stellae_f:{ name:'高原灶',        sub:'星脉学部 · 食堂',          dept:'stellae', icon:'food',   desc:'位置最高，需爬石阶，但可俯瞰全院。龙裔学子有专属灼烤区，自行用龙息加热食材。' },
  stellae_l:{ name:'万象阁',        sub:'星脉学部 · 图书馆',        dept:'stellae', icon:'lib',    desc:'全院藏书量最大，设跨系对照区，同主题不同学部视角文献并排陈列。自习人数最多。' },
  stellae_s:{ name:'星望塔',        sub:'星脉学部 · 特色空间',      dept:'stellae', icon:'tower',  desc:'顶层为天文台，观测魔力潮汐与天体共振。周围元素实验室群各以防护结界隔离。' },
};