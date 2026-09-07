// =============================================================
// 호그와트 생활 — 4단계
// API 없음. Claude와는 오직 복사/붙여넣기로 연동합니다.
// 웹사이트 역할: 게임 상태 저장·표시 / 행동문 생성 / Claude 답변 파싱
// =============================================================

const WEEKDAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const WEEKDAY_LABELS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];

const WEEKLY_SCHEDULE = {
  monday:[['07:30','08:30','아침 식사','meal'],['09:00','10:00','마법의 역사','class'],['10:00','11:00','변신술','class'],['11:00','12:00','주문','class'],['12:00','13:00','점심 식사','meal'],['13:00','15:00','마법약','class'],['15:00','16:00','자유시간','free'],['16:00','17:00','고대 룬 문자','class'],['17:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','22:00','자유시간','free'],['22:30','22:30','취침','sleep']],
  tuesday:[['07:30','08:30','아침 식사','meal'],['09:00','11:00','약초학','class'],['11:00','12:00','어둠의 마법 방어술','class'],['12:00','13:00','점심 식사','meal'],['13:00','14:00','산술점','class'],['14:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','20:00','천문학','class'],['20:00','22:00','자유시간','free'],['22:30','22:30','취침','sleep']],
  wednesday:[['07:30','08:30','아침 식사','meal'],['09:00','10:00','주문','class'],['10:00','11:00','변신술','class'],['11:00','12:00','고대 룬 문자','class'],['12:00','13:00','점심 식사','meal'],['13:00','15:00','어둠의 마법 방어술','class'],['15:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','22:00','자유시간','free'],['22:30','22:30','취침','sleep']],
  thursday:[['07:30','08:30','아침 식사','meal'],['09:00','10:00','마법의 역사','class'],['10:00','12:00','마법약','class'],['12:00','13:00','점심 식사','meal'],['13:00','14:00','변신술','class'],['14:00','15:00','주문','class'],['15:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','22:00','자유시간','free'],['22:30','22:30','취침','sleep']],
  friday:[['07:30','08:30','아침 식사','meal'],['09:00','11:00','약초학','class'],['11:00','12:00','어둠의 마법 방어술','class'],['12:00','13:00','점심 식사','meal'],['13:00','14:00','고대 룬 문자','class'],['14:00','15:00','산술점','class'],['15:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','22:00','자유시간','free'],['22:30','22:30','취침','sleep']],
  saturday:[['08:30','09:30','아침 식사','meal'],['09:30','12:00','자유시간','free'],['12:00','13:00','점심 식사','meal'],['13:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','23:00','자유시간','free'],['23:00','23:00','취침','sleep']],
  sunday:[['08:30','09:30','아침 식사','meal'],['09:30','13:00','자유시간','free'],['13:00','14:00','점심 식사','meal'],['14:00','18:00','자유시간','free'],['18:00','19:00','저녁 식사','meal'],['19:00','23:00','자유시간','free'],['23:00','23:00','취침','sleep']]
};
const scheduleObject = Object.fromEntries(Object.entries(WEEKLY_SCHEDULE).map(([day,items])=>[day,items.map(x=>({start:x[0],end:x[1],subject:x[2],type:x[3]}))]));

const HOUSES = ['그리핀도르','슬리데린','래번클로','후플푸프'];
const RELATION_LEVELS = [[80,'매우 가까움'],[60,'가까움'],[40,'우호적'],[20,'알고 지냄'],[0,'무난함'],[-20,'어색함'],[-45,'불편함'],[-70,'사이가 나쁨'],[-101,'매우 나쁨']];
const LOCATIONS = ['그레이트홀','래번클로 휴게실','도서관','복도','변신술 교실','주문 교실','마법약 교실','어둠의 마법 방어술 교실','온실','천문학 탑','운동장','호그스미드'];
const QUICK_ACTIONS = [
  ['대화','친구나 주변의 학생에게 말을 건다.'],
  ['도서관','도서관으로 가서 책이나 과제를 살펴본다.'],
  ['공부','현재 필요한 과목을 공부한다.'],
  ['과제','밀린 과제나 오늘의 과제를 한다.'],
  ['식사','그레이트홀로 가서 식사한다.'],
  ['휴식','공용 휴게실에서 잠시 쉬며 시간을 보낸다.'],
  ['탐색','주변을 돌아다니며 호그와트의 일상을 살펴본다.'],
  ['호그스미드','호그스미드 방문일이라면 마을로 가서 상점과 주변을 살펴본다.'],
  ['이동','가고 싶은 장소로 이동한다.']
];

// 게임용 호그스미드 방문일. 공식 연간 일정으로 취급하지 않는다.
const HOGSMEADE_DATES = new Set([
  '1994-09-24','1994-10-29','1994-11-26','1994-12-17',
  '1995-01-28','1995-02-25','1995-03-25','1995-04-22','1995-05-20','1995-06-03'
]);

const SHOPS = {
  '문구·교재': [
    {name:'필기용 양피지 묶음',description:'깨끗하고 질 좋은 양피지 12장.',category:'문구',price:8,roles:['기록','단서 작성','메모']},
    {name:'갈대펜 한 묶음',description:'쓰기 편한 일반 갈대펜 6개.',category:'문구',price:5,roles:['기록','필기','단서 작성']},
    {name:'자기잉크병',description:'책상에서 저절로 제자리로 돌아오는 작은 잉크병.',category:'문구',price:7,roles:['정리','기록','장시간 조사']},
    {name:'고급 잉크',description:'색이 오래 남는 진한 잉크.',category:'문구',price:12,roles:['기록','문서 식별']}
  ],
  '마법용품': [
    {name:'초보자용 부적 세트',description:'연습용 부적 카드와 작은 장식.',category:'도구',price:18,roles:['간단한 마법 실험','표식','탐색']},
    {name:'확대경',description:'미세한 룬과 글씨를 읽을 때 유용하다.',category:'도구',price:10,roles:['세부 관찰','룬 조사','단서 확인']},
    {name:'휴대용 망원경',description:'별이나 먼 곳의 움직임을 살펴보기 위한 작은 망원경.',category:'도구',price:22,roles:['원거리 관찰','천문학','감시']},
    {name:'보온 장갑',description:'마법약 재료를 다룰 때 손을 보호한다.',category:'도구',price:15,roles:['마법약 재료 취급','탐색','위험한 물건 조사']}
  ],
  '선물·기념품': [
    {name:'호그스미드 초콜릿',description:'조그마한 상자에 담긴 초콜릿.',category:'선물',price:6,roles:['선물','관계 형성']},
    {name:'래번클로 기념 배지',description:'푸른색과 청동색의 작은 배지.',category:'기념품',price:9,roles:['선물','소속감','관계 형성']},
    {name:'호그와트 머그',description:'학교 문장이 새겨진 머그컵.',category:'기념품',price:11,roles:['선물','공용실 일상']},
    {name:'마법 생물 엽서 세트',description:'움직이는 그림이 들어간 엽서 네 장.',category:'기념품',price:14,roles:['선물','정보 교환','편지']}
  ]
};

const INITIAL_STATE = {
  version: 5,
  gameVersion: '5단계',
  date: '1994-09-01', time: '08:00', season: '초가을', weather: '맑고 선선함', location: '그레이트홀',
  schedule: scheduleObject,
  galleons: 120, sickles: 0, knuts: 0,
  relationships: {
    '라비니아 애시컴': {value:92, note:'같은 방을 쓰며 오래 지낸 가장 가까운 친구', house:'래번클로', year:4},
    '마리벨 페어차일드': {value:84, note:'가십과 학교 소식에 누구보다 관심이 많다', house:'래번클로', year:4},
    '셀레스틴 모닝턴': {value:88, note:'친구들을 적극적으로 감싸는 든든한 친구', house:'래번클로', year:4},
    '해리 포터': {value:55, note:'지난 모험 이후 자연스럽게 친해진 사이', house:'그리핀도르', year:4},
    '헤르미온느 그레인저': {value:62, note:'학업 이야기가 잘 통하는 편', house:'그리핀도르', year:4},
    '론 위즐리': {value:45, note:'모험을 함께한 적이 있는 친숙한 사이', house:'그리핀도르', year:4},
    '드레이코 말포이': {value:32, note:'집안끼리 오래 알고 지낸 사이', house:'슬리데린', year:4},
    '세드릭 디고리': {value:42, note:'학교에서 가끔 대화를 나눈다', house:'후플푸프', year:6},
    '초 챙': {value:38, note:'가끔 마주치면 대화를 나누는 사이', house:'래번클로', year:5},
    '프레드 위즐리': {value:27, note:'학교 행사와 소문을 통해 알게 된 사이', house:'그리핀도르', year:6},
    '조지 위즐리': {value:27, note:'학교 행사와 소문을 통해 알게 된 사이', house:'그리핀도르', year:6}
  },
  rumors: [],
  clues: [],
  inventory: [
    {name:'지팡이',qty:1,description:'코델리아의 개인 지팡이',category:'도구',roles:['주문','변신술','탐색','방어']},
    {name:'교과서 세트',qty:1,description:'4학년 수업에 필요한 기본 교과서',category:'교재',roles:['학습','정보 조사','단서 확인']},
    {name:'필기 도구',qty:1,description:'양피지, 깃펜, 잉크',category:'문구',roles:['기록','단서 작성']},
  ],
  academics: {
    '변신술':95,'주문':98,'마법약':90,'마법의 역사':94,'어둠의 마법 방어술':96,'약초학':76,'천문학':99,'고대 룬 문자':97,'산술점':98
  },
  housePoints: {그리핀도르:0,슬리데린:0,래번클로:0,후플푸프:0},
  pointsHistory: [],
  events: [],
  sceneHistory: [],
  changes: [],
  lastScene: '',
  lastSceneAt: '',
  lastAction: '',
  currentEvent: null,
  saveMeta: {},
};

let gameState = deepClone(INITIAL_STATE);
let activeShop = Object.keys(SHOPS)[0];

function deepClone(obj){return JSON.parse(JSON.stringify(obj));}
function esc(s){return String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function pad2(n){return String(n).padStart(2,'0');}
function parseDateStr(str){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str||''));return m?{year:+m[1],month:+m[2],day:+m[3]}:{year:1994,month:9,day:1};}
function parseTimeStr(str){const m=/^(\d{1,2}):(\d{2})$/.exec(String(str||''));if(!m)return{hour:0,minute:0};return{hour:Math.min(23,+m[1]),minute:Math.min(59,+m[2])};}
function toDate(date,time='00:00'){const d=parseDateStr(date),t=parseTimeStr(time);return new Date(d.year,d.month-1,d.day,t.hour,t.minute);}
function iso(d){return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;}
function hm(d){return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;}
function timeMin(t){const x=parseTimeStr(t);return x.hour*60+x.minute;}
function weekday(date){return WEEKDAY_LABELS[toDate(date).getDay()];}
function dateDisplay(date){const d=parseDateStr(date);return `${d.year}년 ${d.month}월 ${d.day}일`}
function timeDisplay(t){const {hour,minute}=parseTimeStr(t);return `${hour<12?'오전':'오후'} ${hour%12||12}:${pad2(minute)}`;}

function isHogsmeadeDate(date=gameState.date){return HOGSMEADE_DATES.has(String(date));}
function isHogsmeadeOpen(){return isHogsmeadeDate() && gameState.location==='호그스미드';}
function normalizeItemObject(item){const x={...item};x.name=String(x.name||'이름 없는 물건');x.qty=Math.max(0,Number(x.qty)||0);x.description=String(x.description||'');x.category=String(x.category||'기타');x.roles=Array.isArray(x.roles)?x.roles.map(String):[];return x;}
function itemCatalogByName(name){const key=String(name||'').trim();for(const items of Object.values(SHOPS))for(const item of items)if(item.name===key)return item;return null;}
function addClue(text,source='',relatedItems=[]){const clean=String(text||'').trim();if(!clean)return;gameState.clues.unshift({text:clean,source:String(source||''),relatedItems:Array.isArray(relatedItems)?relatedItems.map(String):[],date:gameState.date,time:gameState.time});gameState.clues=gameState.clues.slice(0,50);}
function nowSchedule(){const key=WEEKDAY_KEYS[toDate(gameState.date).getDay()];return gameState.schedule[key]||[];}
function currentSchedule(){const now=timeMin(gameState.time);return nowSchedule().find(x=>{const s=timeMin(x.start),e=timeMin(x.end);return now>=s&&now<e})||null;}
function relationLevel(v){return (RELATION_LEVELS.find(x=>v>=x[0])||RELATION_LEVELS.at(-1))[1]}
function houseLetter(h){return {그리핀도르:'🦁',슬리데린:'🐍',래번클로:'🦅',후플푸프:'🦡'}[h]||'🏰'}
function formatMoney(){return `${gameState.galleons}갈레온 ${gameState.sickles?`${gameState.sickles}시클`:''} ${gameState.knuts?`${gameState.knuts}너클`:''}`.replace(/  +/g,' ').trim();}
function normalizeMoney(){
  let total=(Number(gameState.galleons)||0)*17*29+(Number(gameState.sickles)||0)*29+(Number(gameState.knuts)||0);
  total=Math.max(0,Math.round(total));
  gameState.galleons=Math.floor(total/(17*29));total%=17*29;gameState.sickles=Math.floor(total/29);gameState.knuts=total%29;
}
function changeMoneyGalleons(amount){gameState.galleons=Math.max(0,(Number(gameState.galleons)||0)+Number(amount||0));normalizeMoney();}
function getTotalKnuts(){return gameState.galleons*493+gameState.sickles*29+gameState.knuts;}
function canAfford(galleons){return getTotalKnuts()>=Math.round(Number(galleons)*493)}
function spendGalleons(g){if(!canAfford(g))return false;let total=getTotalKnuts()-Math.round(g*493);gameState.galleons=Math.floor(total/493);total%=493;gameState.sickles=Math.floor(total/29);gameState.knuts=total%29;return true;}
function addInventory(name,qty=1,description='',extra={}){const key=String(name||'').trim();if(!key)return;const catalog=itemCatalogByName(key);const existing=gameState.inventory.find(x=>x.name===key);if(existing){existing.qty+=(Number(qty)||0);if(description)existing.description=description;if(extra.category)existing.category=extra.category;if(extra.roles)existing.roles=extra.roles;}else gameState.inventory.push(normalizeItemObject({name:key,qty,description:description||catalog?.description||'',category:extra.category||catalog?.category||'기타',roles:extra.roles||catalog?.roles||[]}));}
function removeInventory(name,qty=1){const i=gameState.inventory.findIndex(x=>x.name===name);if(i<0)return false;gameState.inventory[i].qty-=qty;if(gameState.inventory[i].qty<=0)gameState.inventory.splice(i,1);return true;}

function advanceTime(minutes){
  const n=Math.round(Number(minutes));if(!Number.isFinite(n)||n<=0)return false;
  const d=toDate(gameState.date,gameState.time);d.setMinutes(d.getMinutes()+n);gameState.date=iso(d);gameState.time=hm(d);gameState.season=getSeason(d.getMonth()+1);saveAuto();renderGame();return true;
}
function getSeason(month){if([3,4,5].includes(month))return'봄';if([6,7,8].includes(month))return'여름';if([9,10,11].includes(month))return'가을';return'겨울';}
function setLocation(loc){if(typeof loc!=='string'||!loc.trim())return;gameState.location=loc.trim();saveAuto();renderGame();}
function setWeather(w){if(typeof w!=='string'||!w.trim())return;gameState.weather=w.trim();saveAuto();renderGame();}
function goNextDay(wake='07:00'){const d=toDate(gameState.date,gameState.time);d.setDate(d.getDate()+1);gameState.date=iso(d);gameState.time=/^\d{1,2}:\d\d$/.test(wake)?wake:'07:00';saveAuto();renderGame();}

function formatChangeLabel(type,name,delta,extra=''){const sign=delta>0?'+':'';if(type==='relationship')return `관계 · ${name} ${sign}${delta}`;if(type==='gossip')return `가십 · ${name}`;if(type==='house')return `기숙사 · ${name} ${sign}${delta}${extra?` (${extra})`:''}`;if(type==='academic')return `학업 · ${name} ${sign}${delta}`;if(type==='money')return `소지금 · ${sign}${delta}갈레온`;if(type==='item')return `소지품 · ${name} ${sign}${delta}`;if(type==='clue')return `단서 · ${name}`;if(type==='event')return `사건 · ${name}`;if(type==='location')return `위치 · ${name}`;if(type==='time')return `시간 · ${name}`;return String(name||type)}
function addChange(type,name,delta=0,extra=''){
  if(!Array.isArray(gameState.changes)) gameState.changes=[];
  const clean=String(name||'').trim();
  if(!clean)return;

  gameState.changes.unshift({
    type,
    label:formatChangeLabel(type,clean,Number(delta)||0,extra),
    date:gameState.date,
    time:gameState.time,
    delta:Number(delta)||0
  });

  gameState.changes=gameState.changes.slice(0,20);
}
function ensureRelationship(characterName){
  const canonicalName = normalizeCharacterName(characterName);

  if(!canonicalName) return null;

  if(!gameState.relationships[canonicalName]){
    gameState.relationships[canonicalName] = {
      level: 0,
      label: '처음 만남',
      notes: []
    };
  }

  return gameState.relationships[canonicalName];
}
function snapshotState(){return{date:gameState.date,time:gameState.time,location:gameState.location,weather:gameState.weather,galleons:gameState.galleons,relationships:deepClone(gameState.relationships),academics:deepClone(gameState.academics),housePoints:deepClone(gameState.housePoints),inventory:deepClone(gameState.inventory),rumors:deepClone(gameState.rumors),clues:deepClone(gameState.clues),events:deepClone(gameState.events)}}
function recordStateDiff(before){

  // 위치
  if(before.location!==gameState.location){
    addChange(
      'location',
      `${before.location} → ${gameState.location}`
    );
  }

  // 시간 / 날짜
  if(before.time!==gameState.time || before.date!==gameState.date){
    addChange(
      'time',
      `${dateDisplay(gameState.date)} ${timeDisplay(gameState.time)}`
    );
  }

  // 소지금
  const moneyDelta=
    Number(gameState.galleons||0)-Number(before.galleons||0);

  if(moneyDelta){
    addChange('money','소지금',moneyDelta);
  }

  // 관계
  for(const [name,after] of Object.entries(gameState.relationships||{})){
    const prev=
      Number(before.relationships?.[name]?.value||0);

    const current=
      Number(after.value||0);

    const delta=current-prev;

    if(delta){
      addChange(
        'relationship',
        normalizeCharacterName(name),
        delta
      );
    }
  }

  // 학업
  for(const [subject,after] of Object.entries(gameState.academics||{})){
    const prev=
      Number(before.academics?.[subject]||0);

    const delta=
      Number(after||0)-prev;

    if(delta){
      addChange('academic',subject,delta);
    }
  }

  // 기숙사 점수
  for(const house of HOUSES){
    const delta=
      Number(gameState.housePoints?.[house]||0)-
      Number(before.housePoints?.[house]||0);

    if(delta){
      addChange('house',house,delta);
    }
  }

  // 소지품
  const beforeItems=Object.fromEntries(
    (before.inventory||[]).map(i=>[i.name,Number(i.qty||0)])
  );

  const afterItems=Object.fromEntries(
    (gameState.inventory||[]).map(i=>[i.name,Number(i.qty||0)])
  );

  for(
    const name of new Set([
      ...Object.keys(beforeItems),
      ...Object.keys(afterItems)
    ])
  ){
    const delta=
      (afterItems[name]||0)-(beforeItems[name]||0);

    if(delta){
      addChange('item',name,delta);
    }
  }

  // 가십
  const beforeRumorCount=(before.rumors||[]).length;
  const afterRumorCount=(gameState.rumors||[]).length;

  if(afterRumorCount>beforeRumorCount){
    const newRumors=
      gameState.rumors.slice(
        0,
        afterRumorCount-beforeRumorCount
      );

    for(const rumor of newRumors){
      addChange('gossip',rumor.text);
    }
  }

  // 단서
  const beforeClueCount=(before.clues||[]).length;
  const afterClueCount=(gameState.clues||[]).length;

  if(afterClueCount>beforeClueCount){
    const newClues=
      gameState.clues.slice(
        0,
        afterClueCount-beforeClueCount
      );

    for(const clue of newClues){
      addChange('clue',clue.text);
    }
  }

  // 사건
  const beforeEventCount=(before.events||[]).length;
  const afterEventCount=(gameState.events||[]).length;

  if(afterEventCount>beforeEventCount){
    const newEvents=
      gameState.events.slice(
        0,
        afterEventCount-beforeEventCount
      );

    for(const event of newEvents){
      addChange('event',event.text);
    }
  }
}
function getCurrentScene(){return gameState.lastScene || ''}
function addScene(text){const clean=String(text||'').trim();if(!clean)return;gameState.lastScene=clean;gameState.lastSceneAt=`${gameState.date} ${gameState.time}`;gameState.sceneHistory.unshift({date:gameState.date,time:gameState.time,location:gameState.location,text:clean});gameState.sceneHistory=gameState.sceneHistory.slice(0,10);}
function addEvent(text){if(!text)return;gameState.events.unshift({date:gameState.date,time:gameState.time,text:String(text).trim()});gameState.events=gameState.events.slice(0,50);}
function addRumor(text,truth='미확인',source='',knownBy='코델리아'){gameState.rumors.unshift({text:String(text).trim(),truth:truth||'미확인',source:source||'미상',knownBy:knownBy||'코델리아',date:gameState.date});gameState.rumors=gameState.rumors.slice(0,40);}
function adjustRelationship(name,delta,note=''){
  if(!name)return;

  const key=normalizeCharacterName(name);
  if(!key)return;

  if(!gameState.relationships[key]){
    gameState.relationships[key]={
      value:0,
      note:'',
      house:'',
      year:''
    };
  }

  const rel=gameState.relationships[key];

  rel.value=Math.max(
    -100,
    Math.min(
      100,
      (Number(rel.value)||0)+Number(delta||0)
    )
  );

  if(note)rel.note=note;
}
function registerCharacter(name,year='',house='',value=0,note=''){
  if(!name)return;

  const key=normalizeCharacterName(name);
  if(!key)return;

  if(!gameState.relationships[key]){
    gameState.relationships[key]={
      value:0,
      note:'',
      house:'',
      year:''
    };
  }

  const rel=gameState.relationships[key];

  if(year)rel.year=String(year).trim();
  if(house)rel.house=String(house).trim();
  if(note)rel.note=String(note).trim();

  if(value!=='' && value!==null && value!==undefined){
    rel.value=Math.max(
      -100,
      Math.min(100,Number(value)||0)
    );
  }
}
function adjustAcademics(subject,delta){if(!subject)return;gameState.academics[subject]=Math.max(0,Math.min(100,(Number(gameState.academics[subject])||0)+Number(delta||0)));}
function adjustHouse(house,delta,reason=''){if(!HOUSES.includes(house))return;gameState.housePoints[house]=(Number(gameState.housePoints[house])||0)+Math.round(Number(delta)||0);gameState.pointsHistory.unshift({date:gameState.date,time:gameState.time,house,delta:Math.round(Number(delta)||0),reason:String(reason||'')});gameState.pointsHistory=gameState.pointsHistory.slice(0,50);}

function generateClaudePrompt(){
  const action=document.getElementById('actionInput').value.trim();
  if(!action){showNotice('코델리아의 행동을 먼저 입력해 주세요.',true);return;}
  gameState.lastAction=action;

  // 매 턴 전체 상태를 반복해서 보내지 않도록 최소 상태만 전달합니다.
  const sched=currentSchedule();
  const actionLower=action.toLowerCase();
  const relatedNames=Object.entries(gameState.relationships)
    .filter(([name])=>action.includes(name) || actionLower.includes(name.toLowerCase().split(' ')[0]))
    .slice(0,5)
    .map(([name,r])=>`${name}: ${relationLevel(r.value)}`)
    .join(', ');

  const inventory=gameState.inventory
    .filter(i=>i.qty>0)
    .map(i=>`${i.name}×${i.qty}`)
    .join(', ');

  const recentClues=gameState.clues.slice(0,3)
    .map(c=>c.text)
    .join(' / ');

  const previousScene=(gameState.lastScene||'')
    .replace(/\s+/g,' ')
    .slice(-350);

  const hs=isHogsmeadeDate(gameState.date)
    ? (isHogsmeadeOpen()?'방문 가능·현재 호그스미드':'방문 가능일·현재 호그와트')
    : '방문 불가일';

  const prompt=`[호그와트 생활 게임 — 현재 상태]
날짜: ${dateDisplay(gameState.date)} (${weekday(gameState.date)})
시간: ${timeDisplay(gameState.time)}
위치: ${gameState.location}
일정: ${sched?sched.subject:'자유시간'}
날씨: ${gameState.weather}
호그스미드: ${hs}
소지금: ${formatMoney()}
보유 물건: ${inventory||'없음'}
${relatedNames?`현재 행동 관련 관계: ${relatedNames}`:''}
${recentClues?`최근 단서: ${recentClues}`:'최근 단서: 없음'}
${previousScene?`직전 장면: ${previousScene}`:''}

[코델리아의 행동]
${action}

[진행 규칙]
- 코델리아의 말·행동·생각·감정은 플레이어가 정한 내용만 사용한다.
- 일상을 우선하고 매번 큰 사건을 만들지 않는다.
- NPC는 독립적인 일정·관계·목표를 가진다.
- 코델리아가 모르는 정보는 알려주지 않는다.
- 보유 물건은 가능한 추가 해결 방법으로 활용하되 자동 성공시키지 않는다.
- 소지품은 실제 소비·파손·분실 시에만 변경한다.
- 호그스미드 상점은 게임용 방문 가능일에 실제 호그스미드에 있을 때만 이용한다.

[출력 형식]
[장면]
현재 장면을 자연스럽게 서술한다.

[상태변경]
변경이 있을 때만 작성한다.
시간: +분
날짜: YYYY-MM-DD
위치: 장소
날씨: 날씨
관계: 이름: +숫자
학업: 과목: +숫자
소지품: 물건: +수량
소지금: -숫자갈레온 또는 +숫자갈레온
기숙사 점수: 기숙사: +숫자 | 이유
가십: 내용 | 진실여부: 사실/부분적으로 사실/과장/오해/거짓/미확인 | 출처: 인물
단서: 내용 | 출처: 장소/인물/사건 | 관련 물건: 물건명, 물건명
사건: 기록할 중요한 일

상태변경이 없는 항목은 작성하지 않는다.`;

  document.getElementById('generatedPrompt').textContent=prompt;
  document.getElementById('generatedPromptBox').hidden=false;
  saveAuto();
}

async function copyPrompt(){const text=document.getElementById('generatedPrompt').textContent;if(!text){showNotice('먼저 Claude용 문장을 만들어 주세요.',true);return;}try{await navigator.clipboard.writeText(text);showNotice('Claude에 보낼 문장을 복사했습니다.');}catch{showNotice('자동 복사가 막혀 있습니다. 아래 문장을 직접 복사해 주세요.',true)}}

function parseClaudeResponse(raw){
  const text=String(raw||'').trim();if(!text){return{ok:false,message:'붙여넣은 답변이 비어 있습니다.'};}
  const before=snapshotState();
  const sceneMatch=/\[장면\]([\s\S]*?)(?=\n\s*\[상태변경\]|$)/i.exec(text);
  const stateMatch=/\[상태변경\]([\s\S]*)$/i.exec(text);
  if(sceneMatch&&sceneMatch[1].trim())addScene(sceneMatch[1].trim());
  if(!stateMatch && !sceneMatch)return{ok:false,message:'[장면] 또는 [상태변경] 형식을 찾지 못했습니다.'};
  const block=stateMatch?stateMatch[1]:'';let changes=0;
  const lines=block.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  for(const line of lines){
    let m;
    if((m=/^시간\s*:\s*\+?(\d+)분?/i.exec(line))){if(advanceTime(+m[1]))changes++;continue;}
    if((m=/^시간\s*:\s*(\d{1,2}:\d{2})$/i.exec(line))){gameState.time=m[1];changes++;continue;}
    if((m=/^날짜\s*:\s*(\d{4}-\d{1,2}-\d{1,2})$/i.exec(line))){const d=parseDateStr(m[1]);gameState.date=`${d.year}-${pad2(d.month)}-${pad2(d.day)}`;gameState.season=getSeason(d.month);changes++;continue;}
    if((m=/^위치\s*:\s*(.+)$/i.exec(line))){setLocation(m[1]);changes++;continue;}
    if((m=/^날씨\s*:\s*(.+)$/i.exec(line))){setWeather(m[1]);changes++;continue;}
    if((m=/^소지금\s*:\s*([+-]?\d+(?:\.\d+)?)\s*갈레온/i.exec(line))){const amount=+m[1];if(amount>=0)changeMoneyGalleons(amount);else spendGalleons(Math.abs(amount));changes++;continue;}
    // 새 인물 등록
if((m=/^인물\s*:\s*(.+?)(?:\s*\|\s*학년\s*:\s*([^|]+))?(?:\s*\|\s*기숙사\s*:\s*([^|]+))?(?:\s*\|\s*관계\s*:\s*([+-]?\d+))?(?:\s*\|\s*메모\s*:\s*(.*))?$/i.exec(line))){
  registerCharacter(
    m[1].trim(),
    m[2] ? m[2].trim() : '',
    m[3] ? m[3].trim() : '',
    m[4] !== undefined ? +m[4] : 0,
    m[5] ? m[5].trim() : ''
  );
  changes++;
  continue;
}

// 기존/신규 인물 관계 변화
if((m=/^관계\s*:\s*(.+?)\s*:\s*([+-]?\d+)/i.exec(line))){
  adjustRelationship(
    m[1].trim(),
    +m[2]
  );
  changes++;
  continue;
}

if((m=/^관계\s*:\s*(.+?)\s+([+-]\d+)\s*$/i.exec(line))){
  adjustRelationship(
    m[1].trim(),
    +m[2]
  );
  changes++;
  continue;
}
    if((m=/^학업\s*:\s*([^:]+):\s*([+-]?\d+)/i.exec(line))){adjustAcademics(m[1].trim(),+m[2]);changes++;continue;}
    if((m=/^소지품\s*:\s*(.+?):\s*([+-]?\d+)/i.exec(line))){const item=m[1].trim(),qty=+m[2];if(qty>0)addInventory(item,qty);else removeInventory(item,Math.abs(qty));changes++;continue;}
    if((m=/^기숙사 점수\s*:\s*(그리핀도르|슬리데린|래번클로|후플푸프)\s*:\s*([+-]?\d+)(?:\s*\|\s*(.*))?$/i.exec(line))){adjustHouse(m[1],+m[2],m[3]||'');changes++;continue;}
    if((m=/^가십\s*:\s*(.+?)\s*\|\s*진실여부\s*:\s*(.+?)(?:\s*\|\s*출처\s*:\s*(.*))?$/i.exec(line))){addRumor(m[1],m[2],m[3]||'');changes++;continue;}
    if((m=/^단서\s*:\s*(.+?)(?:\s*\|\s*출처\s*:\s*(.*?))?(?:\s*\|\s*관련 물건\s*:\s*(.*))?$/i.exec(line))){const items=(m[3]||'').split(',').map(x=>x.trim()).filter(Boolean);addClue(m[1],m[2]||'',items);changes++;continue;}
    if((m=/^사건\s*:\s*(.+)$/i.exec(line))){addEvent(m[1]);changes++;continue;}
  }
  recordStateDiff(before);
  saveAuto();renderGame();return{ok:true,message:`장면을 반영했습니다. 상태 변경 ${changes}건`};
}
function applyClaude(){const raw=document.getElementById('claudeResponse').value;const result=parseClaudeResponse(raw);showNotice(result.message,!result.ok);if(result.ok)document.getElementById('claudeResponse').value='';}

function buyItem(index){
  if(!isHogsmeadeOpen()){showNotice(isHogsmeadeDate()?'호그스미드에 있을 때만 상점을 이용할 수 있습니다.':'오늘은 호그스미드 방문일이 아닙니다.',true);return;}
  const item=SHOPS[activeShop]?.[index];if(!item)return;
  if(!spendGalleons(item.price)){showNotice('소지금이 부족합니다.',true);return;}
  addInventory(item.name,1,item.description,{category:item.category,roles:item.roles});
  addEvent(`${item.name}을(를) ${item.price}갈레온에 구입했다.`);
  saveAuto();renderGame();showNotice(`${item.name}을(를) 구입했습니다.`);
}

function showNotice(msg,error=false){const el=document.getElementById('parseNotice');if(!el)return;el.hidden=false;el.className='notice'+(error?' error':'');el.textContent=msg;clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>el.hidden=true,3500)}


function getTimePhase(){
  const m = timeMin(gameState.time);
  if(m < 7*60) return 'dawn';
  if(m < 12*60) return 'morning';
  if(m < 17*60) return 'afternoon';
  if(m < 21*60) return 'evening';
  return 'night';
}

function getAtmosphere(){
  const loc = gameState.location || '';
  const phase = getTimePhase();
  const weather = gameState.weather || '';

  if(loc === '호그스미드'){
    if(gameState.season === '겨울' || /눈/.test(weather)) return {theme:'hogsmeade-snow',icon:'❄️',text:'눈 내리는 호그스미드'};
    return {theme:`hogsmeade-${phase}`,icon:'🏘',text:phase==='evening'||phase==='night'?'등불이 켜진 호그스미드':'호그스미드 거리'};
  }
  if(loc === '천문학 탑') return {theme:'astronomy-night',icon:'✦',text:'별빛이 내려앉은 천문학 탑'};
  if(loc === '도서관') return {theme:`library-${phase}`,icon:'📚',text:'고요한 도서관'};
  if(loc === '온실') return {theme:'greenhouse',icon:'🌿',text:'습기 어린 온실'};
  if(/마법약/.test(loc)) return {theme:'potions',icon:'⚗',text:'희미한 촛불의 마법약 교실'};
  if(/변신술/.test(loc)) return {theme:'transfiguration',icon:'✦',text:'정돈된 변신술 교실'};
  if(/주문/.test(loc)) return {theme:'charms',icon:'✧',text:'촛불이 반짝이는 주문 교실'};
  if(/어둠의 마법 방어술/.test(loc)) return {theme:'dada',icon:'🕯',text:'어둑한 어둠의 마법 방어술 교실'};
  if(loc === '래번클로 휴게실') return {theme:`ravenclaw-${phase}`,icon:'🦅',text:'래번클로 휴게실'};
  if(loc === '그레이트홀') return {theme:`great-hall-${phase}`,icon:'🏰',text:'촛불 아래의 그레이트홀'};
  return {theme:`castle-${phase}`,icon:'🏰',text:phase==='night'?'밤의 호그와트':'호그와트 성'};
}

function renderAtmosphere(){
  const at = getAtmosphere();
  document.body.className = `theme-hogwarts ${at.theme}`;
  const band = document.getElementById('atmosphereBand');
  const icon = document.getElementById('atmosphereIcon');
  const text = document.getElementById('atmosphereText');
  const crest = document.getElementById('statusCrest');
  if(band){band.dataset.phase=getTimePhase();}
  if(icon) icon.textContent = at.icon;
  if(text) text.textContent = at.text;
  if(crest) crest.textContent = at.icon === '🏰' ? '🦅' : at.icon;
}

function renderGame(){
  renderAtmosphere();
  renderStatus();renderSchedule();renderSituation();renderRelationships();renderGossip();renderInventory();renderClues();renderShop();renderAcademics();renderHouses();renderEvents();renderRecentChanges();renderLivePanel();renderSaves();
}
function renderStatus(){
  document.getElementById('statDate').textContent=`${dateDisplay(gameState.date)} · ${weekday(gameState.date)}`;
  document.getElementById('statTime').textContent=timeDisplay(gameState.time);
  document.getElementById('statWeather').textContent=`${gameState.season} · ${gameState.weather}`;
  document.getElementById('statLocation').textContent=`📍 ${gameState.location}`;
  document.getElementById('statMoney').textContent=formatMoney();
}
function renderSchedule(){const list=document.getElementById('scheduleList');const today=nowSchedule();const now=timeMin(gameState.time);document.getElementById('scheduleSubtitle').textContent=`${weekday(gameState.date)}의 일정`;list.innerHTML=today.length?today.map(x=>{const s=timeMin(x.start),e=timeMin(x.end);const status=now<s?'upcoming':(e>s&&now<e?'ongoing':'done');const icon={meal:'🍽',class:'📖',free:'🕊',sleep:'🌙'}[x.type]||'•';return `<li class="schedule-item schedule-item--${status}"><span class="schedule-item__time">${x.start===x.end?x.start:`${x.start}–${x.end}`}</span><span>${icon}</span><span>${esc(x.subject)}</span><span class="schedule-item__status">${status==='upcoming'?'예정':status==='ongoing'?'진행 중':'완료'}</span></li>`}).join(''):`<li class="empty">오늘은 등록된 일정이 없습니다.</li>`;}
function renderSituation(){
  document.getElementById('situationSubtitle').textContent=`${dateDisplay(gameState.date)} · ${weekday(gameState.date)} · ${timeDisplay(gameState.time)} · ${gameState.location}`;
  const sched=currentSchedule();document.getElementById('currentSchedulePill').textContent=sched?sched.subject:'자유시간';
  const card=document.getElementById('sceneCard');card.innerHTML=gameState.lastScene?`<div class="scene-meta"><span class="meta-chip">${esc(gameState.lastSceneAt||`${gameState.date} ${gameState.time}`)}</span><span class="meta-chip">📍 ${esc(gameState.location)}</span></div><div class="scene-card__text">${esc(gameState.lastScene)}</div>`:`<div class="scene-card__empty">아직 기록된 장면이 없습니다.<br><span class="muted">행동을 입력하고 Claude와 장면을 진행해 보세요.</span></div>`;
}
function renderRelationships(){const entries=Object.entries(gameState.relationships).sort((a,b)=>b[1].value-a[1].value);document.getElementById('relationshipSummary').textContent=`등록된 주요 인물 ${entries.length}명 · 관계 수치는 내부값으로 관리되고 화면에는 상태로 표시됩니다.`;document.getElementById('relationshipList').innerHTML=entries.length?entries.map(([name,r])=>`<article class="simple-card"><div class="card-row"><span class="relation-name">${esc(name)}</span><span class="relation-level">${esc(relationLevel(r.value))}</span></div><div class="subtext">${houseLetter(r.house)} ${esc(r.house||'')} · ${r.year?esc(r.year)+'학년':''}</div><div class="subtext">${esc(r.note||'')}</div></article>`).join(''):`<div class="empty">아직 등록된 관계가 없습니다.</div>`}
function renderGossip(){document.getElementById('gossipList').innerHTML=gameState.rumors.length?gameState.rumors.map(r=>`<article class="simple-card"><div class="card-row"><strong>${esc(r.text)}</strong><span class="relation-level">${esc(r.truth)}</span></div><div class="subtext">출처: ${esc(r.source||'미상')} · ${esc(r.date||'')}</div></article>`).join(''):`<div class="empty">현재 기록된 가십이 없습니다.</div>`}
function renderInventory(){
  document.getElementById('inventoryMoney').textContent=formatMoney();
  document.getElementById('inventoryList').innerHTML=gameState.inventory.length?gameState.inventory.map(i=>`<article class="simple-card"><div class="card-row"><span class="item-name">${esc(i.name)}</span><span>×${i.qty}</span></div><div class="subtext">${esc(i.description||'')}</div><div class="item-roles"><strong>사건 활용:</strong> ${esc((i.roles||[]).join(' · ')||'상황에 따라 활용')}</div></article>`).join(''):`<div class="inventory-empty">소지품이 비어 있습니다.</div>`;
}
function renderClues(){
  const el=document.getElementById('clueList');if(!el)return;
  el.innerHTML=gameState.clues.length?gameState.clues.map(c=>`<article class="simple-card clue-card"><div class="card-row"><strong>${esc(c.text)}</strong><span>${dateDisplay(c.date)} ${timeDisplay(c.time)}</span></div><div class="subtext">출처: ${esc(c.source||'미상')}</div>${c.relatedItems?.length?`<div class="item-roles"><strong>관련 물건:</strong> ${esc(c.relatedItems.join(', '))}</div>`:''}</article>`).join(''):`<div class="empty">아직 발견한 단서가 없습니다.</div>`;
}
function renderShop(){
  const open=isHogsmeadeOpen();
  document.getElementById('shopWallet').textContent=open?formatMoney():'이용 불가';
  const status=document.getElementById('shopStatus');
  if(status){status.className='shop-closed'+(open?' shop-open':'');status.textContent=open?'오늘은 호그스미드 상점 이용 가능':'호그스미드 방문일에 호그스미드에서만 이용할 수 있습니다.';}
  document.getElementById('shopTabs').innerHTML=Object.keys(SHOPS).map(k=>`<button class="shop-tab ${k===activeShop?'active':''}" ${open?'':'disabled'} data-shop="${esc(k)}">${esc(k)}</button>`).join('');
  document.querySelectorAll('.shop-tab').forEach(b=>b.onclick=()=>{if(!open)return;activeShop=b.dataset.shop;renderShop()});
  document.getElementById('shopList').innerHTML=open?SHOPS[activeShop].map((i,idx)=>`<article class="shop-card"><div class="shop-card__top"><strong>${esc(i.name)}</strong><span class="shop-price">${i.price}갈레온</span></div><div class="subtext">${esc(i.description)}</div><div class="item-roles"><strong>사건 활용:</strong> ${esc(i.roles.join(' · '))}</div><button class="buy-btn" ${canAfford(i.price)?'':'disabled'} data-index="${idx}">${canAfford(i.price)?'구입':'소지금 부족'}</button></article>`).join(''):`<div class="shop-lock"><div class="shop-lock__icon">🛍</div><strong>지금은 상점을 열 수 없습니다.</strong><p>${isHogsmeadeDate()?'오늘은 호그스미드 방문일입니다. 호그스미드로 이동하면 상점을 이용할 수 있습니다.':'오늘은 호그스미드 방문일이 아닙니다. 지정된 방문일에만 호그스미드 상점이 열립니다.'}</p><span>현재 날짜: ${dateDisplay(gameState.date)}</span></div>`;
  document.querySelectorAll('.buy-btn').forEach(b=>b.onclick=()=>buyItem(+b.dataset.index));
}

function renderAcademics(){document.getElementById('academicList').innerHTML=Object.entries(gameState.academics).map(([s,v])=>`<div class="academic-row"><span>${esc(s)}</span><div class="bar"><span style="width:${Math.max(0,Math.min(100,v))}%"></span></div><span class="academic-score">${v}</span></div>`).join('')}
function renderHouses(){const ranked=Object.entries(gameState.housePoints).sort((a,b)=>b[1]-a[1]);const leader=ranked[0]?.[0];document.getElementById('houseGrid').innerHTML=HOUSES.map(h=>`<article class="house-card ${h===leader?'house-card--leader':''}"><div class="house-name">${houseLetter(h)} ${h}</div><div class="house-score">${gameState.housePoints[h]}</div><div class="subtext">${h===leader?'현재 선두':'현재 누적 점수'}</div></article>`).join('');document.getElementById('pointsHistory').innerHTML=gameState.pointsHistory.length?gameState.pointsHistory.slice(0,15).map(x=>`<div class="history-item"><span>${esc(x.house)} · ${esc(x.reason||'점수 변동')}</span><strong class="${x.delta>=0?'positive':'negative'}">${x.delta>=0?'+':''}${x.delta}</strong></div>`).join(''):`<div class="empty">최근 점수 변동이 없습니다.</div>`}
function renderEvents(){const important=gameState.events.filter(e=>String(e?.text||'').trim()&&String(e.text).trim()!=='새 장면 기록').slice(0,50);const recent=gameState.sceneHistory.slice(0,10);const importantHtml=important.length?important.map(e=>`<article class="timeline-item timeline-item--important"><div class="timeline-time">${dateDisplay(e.date)} ${timeDisplay(e.time)}</div><div>${esc(e.text)}</div></article>`).join(''):`<div class="empty">기록할 중요한 사건이 아직 없습니다.</div>`;const recentHtml=recent.length?recent.map(e=>`<article class="timeline-item"><div class="timeline-time">${dateDisplay(e.date)} ${timeDisplay(e.time)} · ${esc(e.location)}</div><div>${esc(e.text)}</div></article>`).join(''):`<div class="empty">최근 장면이 아직 없습니다.</div>`;document.getElementById('eventsList').innerHTML=`<div class="record-group"><div class="record-group__heading"><h2>중요한 사건</h2><span>${important.length}개</span></div><div class="timeline">${importantHtml}</div></div><div class="record-group"><div class="record-group__heading"><h2>최근 장면</h2><span>최근 ${recent.length}개</span></div><div class="timeline">${recentHtml}</div></div>`}
function renderRecentChanges(){const el=document.getElementById('recentChanges');if(!el)return;const changes=gameState.changes.slice(0,8);el.innerHTML=changes.length?changes.map(c=>`<div class="change-item change-item--${esc(c.type)}"><span>${esc(c.label)}</span><time>${esc(c.time)}</time></div>`).join(''):`<div class="empty compact-empty">아직 변동이 없습니다.</div>`}
function renderLivePanel(){const current=currentSchedule();const gossipEl=document.getElementById('liveGossip');if(gossipEl)gossipEl.innerHTML=gameState.rumors.length?gameState.rumors.slice(0,3).map(r=>`<div class="live-gossip"><strong>${esc(r.text)}</strong><span>${esc(r.truth)}</span></div>`).join(''):`<div class="compact-empty">현재 가십 없음</div>`;const houseEl=document.getElementById('liveHouses');if(houseEl){const ranked=Object.entries(gameState.housePoints).sort((a,b)=>b[1]-a[1]);houseEl.innerHTML=ranked.map(([house,score],i)=>`<div class="live-row"><span>${i===0?'🏆 ':''}${esc(house)}</span><strong>${score}</strong></div>`).join('')}const liveStatus=document.getElementById('liveStatus');if(liveStatus)liveStatus.innerHTML=`<div class="live-status-row"><span>날짜</span><strong>${dateDisplay(gameState.date)} · ${weekday(gameState.date)}</strong></div><div class="live-status-row"><span>시간</span><strong>${timeDisplay(gameState.time)}</strong></div><div class="live-status-row"><span>일정</span><strong>${esc(current?.subject||'자유시간')}</strong></div><div class="live-status-row"><span>장소</span><strong>${esc(gameState.location)}</strong></div><div class="live-status-row"><span>소지금</span><strong>${esc(formatMoney())}</strong></div>`}

function renderSaves(){const wrap=document.getElementById('saveGrid');wrap.innerHTML=[1,2,3].map(n=>{const meta=gameState.saveMeta[n];return `<article class="save-slot"><strong>저장 슬롯 ${n}</strong><div class="subtext">${meta?`${esc(meta.date)} · ${esc(meta.time)} · ${esc(meta.location)}`:'비어 있음'}</div><div class="action-buttons"><button class="primary save-btn" data-slot="${n}">저장</button><button class="secondary load-btn" data-slot="${n}" ${meta?'':'disabled'}>불러오기</button></div></article>`}).join('');wrap.querySelectorAll('.save-btn').forEach(b=>b.onclick=()=>saveSlot(+b.dataset.slot));wrap.querySelectorAll('.load-btn').forEach(b=>b.onclick=()=>loadSlot(+b.dataset.slot));}

function stateForSave(){return deepClone({...gameState,saveMeta:undefined});}
function saveAuto(){try{localStorage.setItem('hogwartsLifeAuto',JSON.stringify(stateForSave()));}catch(e){console.warn('자동 저장 실패',e)}}
function saveSlot(slot){try{gameState.saveMeta[slot]={date:gameState.date,time:gameState.time,location:gameState.location,savedAt:new Date().toISOString()};const payload=deepClone(gameState);localStorage.setItem(`hogwartsLifeSave${slot}`,JSON.stringify(payload));refreshSaveMeta();saveAuto();renderSaves();showNotice(`저장 슬롯 ${slot}에 저장했습니다.`)}catch(e){showNotice('저장에 실패했습니다.',true)}}
function loadSlot(slot){try{const raw=localStorage.getItem(`hogwartsLifeSave${slot}`);if(!raw)return;gameState=mergeState(JSON.parse(raw));refreshSaveMeta();activeShop=Object.keys(SHOPS)[0];saveAuto();renderGame();showNotice(`저장 슬롯 ${slot}을 불러왔습니다.`)}catch(e){showNotice('불러오기에 실패했습니다.',true)}}
function mergeState(raw){
  return {...deepClone(INITIAL_STATE),...raw,relationships:{...deepClone(INITIAL_STATE.relationships),...(raw.relationships||{})},academics:{...deepClone(INITIAL_STATE.academics),...(raw.academics||{})},housePoints:{...deepClone(INITIAL_STATE.housePoints),...(raw.housePoints||{})},schedule:scheduleObject,inventory:Array.isArray(raw.inventory)?raw.inventory.map(normalizeItemObject):deepClone(INITIAL_STATE.inventory),rumors:Array.isArray(raw.rumors)?raw.rumors:[],clues:Array.isArray(raw.clues)?raw.clues:[],changes:Array.isArray(raw.changes)?raw.changes.slice(0,20):[],events:Array.isArray(raw.events)?raw.events.filter(e=>String(e?.text||'').trim()!=='새 장면 기록'):[],sceneHistory:Array.isArray(raw.sceneHistory)?raw.sceneHistory:[],pointsHistory:Array.isArray(raw.pointsHistory)?raw.pointsHistory:[],saveMeta:raw.saveMeta||{},currentEvent:raw.currentEvent||null};
}

function readSaveMetaFromStorage(){const meta={};for(let slot=1;slot<=3;slot++){try{const raw=localStorage.getItem(`hogwartsLifeSave${slot}`);if(!raw)continue;const saved=JSON.parse(raw);meta[slot]=saved.saveMeta||{date:saved.date,time:saved.time,location:saved.location,savedAt:''}}catch(e){}}return meta}
function refreshSaveMeta(){gameState.saveMeta={...readSaveMetaFromStorage(),...(gameState.saveMeta||{})}}
function newGame(){if(!confirm('현재 게임 상태를 모두 초기화할까요? 저장 슬롯은 유지됩니다.'))return;const preservedMeta=readSaveMetaFromStorage();gameState=deepClone(INITIAL_STATE);gameState.saveMeta=preservedMeta;saveAuto();renderGame();showNotice('새 게임으로 초기화했습니다. 기존 저장 슬롯은 유지됩니다.')}
function loadAuto(){try{const raw=localStorage.getItem('hogwartsLifeAuto');if(raw)gameState=mergeState(JSON.parse(raw));refreshSaveMeta()}catch(e){console.warn('자동 저장 불러오기 실패',e)}}

function setupNavigation(){const nav=document.querySelectorAll('.nav__item');const panels=document.querySelectorAll('.panel');nav.forEach(item=>item.addEventListener('click',()=>{const target=item.dataset.target;nav.forEach(x=>x.setAttribute('aria-selected',String(x===item)));panels.forEach(p=>p.hidden=p.dataset.panel!==target)}))}
function init(){loadAuto();setupNavigation();document.getElementById('generatePromptBtn').onclick=generateClaudePrompt;document.getElementById('copyPromptBtn').onclick=copyPrompt;document.getElementById('applyClaudeBtn').onclick=applyClaude;document.getElementById('clearClaudeBtn').onclick=()=>document.getElementById('claudeResponse').value='';document.getElementById('newGameBtn').onclick=newGame;renderGame();}
document.addEventListener('DOMContentLoaded',init);
window.hogwartsGame={getState:()=>gameState,advanceTime,setLocation,setWeather,goNextDay,isHogsmeadeDate,isHogsmeadeOpen,addScene,addEvent,addClue,adjustRelationship,adjustAcademics,adjustHouse,addInventory,removeInventory,parseClaudeResponse,generateClaudePrompt,saveSlot,loadSlot};
