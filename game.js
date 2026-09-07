// =============================================================
// 호그와트 생활 — 10단계
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
const LOCATIONS = ['그레이트홀','래번클로 휴게실','래번클로 기숙사','도서관','복도','변신술 교실','주문 교실','마법약 교실','어둠의 마법 방어술 교실','온실','천문학 탑','운동장','호그스미드'];

const NIGHT_EXPLORATION_SPOTS = {
  '래번클로 휴게실': {minutes:10, icon:'🦅', desc:'출발지. 문을 조심스럽게 열고 복도로 나온다.', risk:0.04},
  '복도': {minutes:10, icon:'🕯️', desc:'긴 복도와 계단이 이어진다. 발소리가 쉽게 울린다.', risk:0.12},
  '도서관': {minutes:15, icon:'📚', desc:'문틈으로 희미한 달빛이 들어오는 도서관.', risk:0.14},
  '천문학 탑': {minutes:20, icon:'✦', desc:'차가운 밤공기와 별빛이 내려다보이는 높은 탑.', risk:0.16},
  '운동장': {minutes:15, icon:'🌙', desc:'성벽 아래의 조용한 운동장. 멀리 성의 창문 불빛이 보인다.', risk:0.18},
  '온실': {minutes:15, icon:'🌿', desc:'유리창 너머 어둑한 온실과 식물들의 그림자.', risk:0.20},
  '변신술 교실': {minutes:15, icon:'✧', desc:'정리된 책상과 칠판만 남은 교실.', risk:0.15},
  '주문 교실': {minutes:15, icon:'✨', desc:'촛불 몇 개가 꺼지지 않은 채 남아 있는 교실.', risk:0.15},
  '마법약 교실': {minutes:15, icon:'⚗️', desc:'차가운 돌바닥과 희미한 약초 냄새가 감도는 교실.', risk:0.18},
  '어둠의 마법 방어술 교실': {minutes:15, icon:'🕯️', desc:'밤에는 유난히 조용한 어둠의 마법 방어술 교실.', risk:0.18},
};

const NIGHT_DISCOVERIES = [
  {text:'창가에서 다른 기숙사의 불이 하나둘 꺼지는 모습을 발견했다.', clue:false},
  {text:'복도 난간에 누군가 급히 두고 간 메모 조각을 발견했다.', clue:true, clueText:'복도 난간에서 발견한 메모 조각. 누군가 특정 장소를 표시해 둔 흔적이 있다.'},
  {text:'책상 아래에서 오래된 학교 공지문 한 장을 발견했다.', clue:true, clueText:'오래된 학교 공지문. 현재 학생들이 잘 알지 못하는 과거의 행사에 관한 내용이다.'},
  {text:'창문 너머로 밤순찰을 도는 학생의 그림자가 스쳐 지나가는 것을 보았다.', clue:false},
  {text:'벽걸이 초상화가 잠시 잠에서 깨어 주변을 살피는 것을 보았다.', clue:false},
  {text:'책 사이에서 이름이 지워진 작은 쪽지를 발견했다.', clue:true, clueText:'도서관 책 사이에서 발견한 익명의 쪽지. 내용의 일부만 읽을 수 있다.'}
];
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

// 코델리아의 학교생활을 풍부하게 만드는 '사회적 맥락' 레이어입니다.
// 실제 관계 수치와 현재 위치/시간을 읽어 Claude에게 자연스러운 소재를 제공합니다.
const SOCIAL_PROFILES = {
  '라비니아 애시컴': {role:'룸메이트 겸 가장 가까운 친구',places:['래번클로 휴게실','그레이트홀','도서관'],hooks:['오늘 들은 소문을 먼저 알려줄 수 있다','숙제나 생활 얘기를 편하게 꺼낼 수 있다']},
  '마리벨 페어차일드': {role:'가십과 학교 소식에 밝은 친구',places:['그레이트홀','복도','래번클로 휴게실'],hooks:['새로 도는 소문의 출처를 알고 있을 가능성이 높다','학생들 사이의 분위기를 빠르게 읽는다']},
  '셀레스틴 모닝턴': {role:'친구들을 적극적으로 챙기는 친구',places:['래번클로 휴게실','그레이트홀','운동장'],hooks:['친구 사이의 갈등을 중재하려 한다','누군가 곤란해 보이면 먼저 말을 건다']},
  '해리 포터': {role:'친한 그리핀도르 친구',places:['그레이트홀','복도','운동장','도서관'],hooks:['친구들과 함께 움직이는 일이 많다','학교에서 이상한 일을 발견하면 관심을 보인다']},
  '헤르미온느 그레인저': {role:'학업 이야기가 잘 통하는 친구',places:['도서관','그레이트홀','복도'],hooks:['과제와 수업에 관한 도움을 주고받기 좋다','학교 규칙이나 이상한 소문을 꼼꼼히 따져본다']},
  '론 위즐리': {role:'모험을 함께한 적이 있는 친구',places:['그레이트홀','복도','운동장'],hooks:['친구들과 장난이나 잡담을 하는 시간이 많다','흥미로운 소식에 반응이 빠르다']},
  '드레이코 말포이': {role:'집안끼리 오래 알고 지낸 슬리데린 학생',places:['복도','그레이트홀'],hooks:['코델리아와의 친분을 의식하는 태도를 보일 수 있다','슬리데린 학생들 사이의 이야기를 알고 있을 수 있다']},
  '세드릭 디고리': {role:'다른 기숙사의 믿음직한 선배',places:['그레이트홀','운동장','복도'],hooks:['학생들에게 자연스럽게 신뢰받는 편이다','행사나 학교 분위기에 관한 이야기를 나누기 좋다']}
};

const DAILY_SOCIAL_HOOKS = [
  '아침 식탁에서 어제 저녁의 작은 소문이 다시 이야기되고 있다.',
  '복도를 지나던 학생 둘이 코델리아를 보고 말을 낮춘다.',
  '게시판에 새 공지가 붙었고 주변 학생들이 잠깐씩 멈춰 읽는다.',
  '부엉이 우편이 도착한 뒤 몇몇 학생들이 편지를 서로 보여주고 있다.',
  '수업이 끝난 뒤 학생들이 오늘 있었던 사소한 실수를 두고 웃고 있다.',
  '친한 학생 한 명이 다른 사람에게 말하기 어려운 부탁을 꺼낼 분위기다.',
  '누군가 점심시간에 들은 이야기를 과장해서 전하고 있는 듯하다.',
  '평소보다 복도가 조용하고, 몇몇 학생이 특정 교실 주변을 유심히 살핀다.'
];

// 게임용 호그스미드 방문일. 공식 연간 일정으로 취급하지 않는다.
const HOGSMEADE_DATES = new Set([
  '1994-09-24','1994-10-29','1994-11-26','1994-12-17',
  '1995-01-28','1995-02-25','1995-03-25','1995-04-22','1995-05-20','1995-06-03'
]);

const HOGSMEADE_PLACES = {
  '세 빗자루': {minutes:35, icon:'🍺', desc:'나무 간판 아래 따뜻한 불빛과 학생들의 대화가 흘러나오는 유명한 펍.', prompt:'세 빗자루에서 식사나 버터맥주 대신 따뜻한 무알코올 음료를 마시며 학생들과 주변 이야기를 나눈다.'},
  '허니듀크': {minutes:25, icon:'🍬', desc:'알록달록한 마법 과자가 가득 진열된 달콤한 향기의 과자점.', prompt:'허니듀크에서 과자를 구경하고 친구에게 줄 작은 선물을 고른다.'},
  '종코의 장난감 가게': {minutes:25, icon:'🎭', desc:'장난감과 괴상한 마법용품이 빼곡한 시끌벅적한 가게.', prompt:'종코의 장난감 가게를 구경하며 어떤 물건이 학생들 사이에서 인기인지 살펴본다.'},
  '스크리벤샤프트': {minutes:20, icon:'🪶', desc:'양피지와 깃펜, 잉크가 정갈하게 진열된 문구점.', prompt:'스크리벤샤프트에서 필기 도구를 살펴보고 필요한 문구를 고른다.'},
  '부엉이 우체국': {minutes:20, icon:'🦉', desc:'수많은 부엉이의 날갯짓과 우편물 분류 소리가 들리는 우체국.', prompt:'부엉이 우체국에 들러 편지를 보내거나 도착한 우편물을 확인한다.'},
  '호그스미드 거리': {minutes:10, icon:'🏘️', desc:'마을 중앙의 돌길. 상점과 학생들이 오가는 활기찬 거리.', prompt:'호그스미드 거리를 천천히 걸으며 친구와 마을 분위기를 구경하고 작은 소문을 듣는다.'},
  '오두막 앞 언덕': {minutes:20, icon:'🌲', desc:'마을 바깥쪽의 조용한 언덕. 멀리 호그와트 성이 보인다.', prompt:'사람이 적은 언덕으로 가서 호그와트와 마을을 바라보며 잠시 쉰다.'}
};

const HOGSMEADE_SOCIAL_HOOKS = [
  '오늘은 학생들이 주말 외출에 들떠 있어 평소보다 소문이 빨리 퍼진다.',
  '상점 앞에서 익숙한 학생들이 모여 누군가의 이야기를 하고 있다.',
  '호그스미드에 나온 학생들 사이에서 학교에서 있었던 작은 일이 화제가 되고 있다.',
  '마을의 상점 직원들이 손님들의 이야기를 흘려듣고 있는 듯하다.'
];

// 방학 기간은 원작의 큰 흐름과 충돌하지 않도록 별도의 플레이용 설정값으로 관리합니다.
const HOLIDAY_WINDOWS = [
  {id:'christmas-1994', name:'크리스마스 방학', start:'1994-12-19', end:'1995-01-05', note:'트리위저드 시합이 열린 해라 학생 상당수가 성에 남아 있을 수 있습니다.'},
  {id:'easter-1995', name:'부활절 방학', start:'1995-04-10', end:'1995-04-23', note:'약 2주간 수업이 없는 방학 구간으로 운영합니다.'},
  {id:'summer-1995', name:'여름방학', start:'1995-06-25', end:'1995-08-31', note:'학년이 끝난 뒤 다음 학기 시작 전까지의 장기 방학입니다.'}
];

const HOLIDAY_PLACES = {
  '집': {minutes:20, icon:'🏠', desc:'개인적인 휴식과 가족·친구와의 평범한 방학 일상을 보내는 공간.'},
  '킹스크로스역': {minutes:15, icon:'🚂', desc:'런던의 역. 마법사 사회와 머글 사회가 이어지는 경계의 공간.'},
  '다이애건 앨리': {minutes:30, icon:'🪄', desc:'런던에 숨겨진 마법사들의 대표적인 상점가.'},
  '리키 콜드런': {minutes:25, icon:'🏨', desc:'머글 런던과 마법사 세계를 잇는 유명한 여관.'},
  '머글 런던': {minutes:30, icon:'🏙️', desc:'1990년대 런던의 평범한 거리.'}
};

function getHolidayInfo(date=gameState.date){
  const value=String(date||gameState.date);
  return HOLIDAY_WINDOWS.find(x=>value>=x.start&&value<=x.end)||null;
}
function isHoliday(date=gameState.date){return !!getHolidayInfo(date);}
function getHolidaySpecial(date=gameState.date){if(String(date)==='1994-12-25')return '1994년 12월 25일 · 트리위저드 대회의 전통에 따른 크리스마스 무도회(Yule Ball)';return '';}



// =============================================================
// 10단계 — 1994~1995 원작 사건 타임라인
// 원작에 명시되거나 널리 정리된 사건의 날짜/핵심 결과를 고정하고,
// 코델리아의 플레이는 '현장에 있거나 주변에서 영향을 받는 방식'으로 연결합니다.
// 고정 결과 자체는 Claude가 임의로 변경하지 않도록 프롬프트에서 명시합니다.
// =============================================================
const CANON_EVENTS = [
  {id:'term-start', date:'1994-09-01', title:'호그와트 4학년 시작', type:'학기 시작', location:'호그와트', certainty:'원작 명시', status:'세계의 기본 배경', summary:'새 학년이 시작되고 트리위저드 대회가 예정되어 있다는 사실이 알려진다.', hooks:['개학식과 그레이트홀의 분위기를 직접 경험한다.','친구들과 새 학기의 계획을 이야기한다.']},
  {id:'moody-ferret', date:'1994-09-02', title:'무디의 첫 수업과 말포이 사건', type:'수업', location:'어둠의 마법 방어술 교실', certainty:'원작 명시', status:'핵심 결과 고정', summary:'알라스터 무디의 첫 수업에서 학생들은 어둠의 마법에 대해 강한 인상을 받는다. 이후 말포이가 페렛으로 변하는 사건이 일어난다.', hooks:['수업에서 무디의 방식과 학생들의 반응을 지켜본다.','사건 직후 친구들과 학교의 분위기를 이야기한다.']},
  {id:'dark-arts-lesson', date:'1994-09-04', title:'금지된 저주에 관한 수업', type:'수업', location:'어둠의 마법 방어술 교실', certainty:'원작 명시', status:'핵심 결과 고정', summary:'무디가 금지된 저주에 대해 학생들에게 가르친다.', hooks:['수업에 참여하고 교수의 설명을 듣는다.','친구들과 수업 뒤 충격적인 내용을 이야기한다.']},
  {id:'delegations-arrive', date:'1994-10-30', title:'보바통과 덤스트랭 도착', type:'학교 행사', location:'호그와트 운동장', certainty:'원작 기반 날짜', status:'핵심 결과 고정', summary:'트리위저드 대회를 위해 다른 두 마법학교의 대표단이 호그와트에 도착한다.', hooks:['도착 장면을 보거나 학생들 사이의 반응을 살핀다.','외국 학생들과 관련된 소문을 듣는다.']},
  {id:'goblet-selection', date:'1994-10-31', title:'불의 잔이 챔피언을 선택하다', type:'트리위저드 대회', location:'그레이트홀', certainty:'원작 명시', status:'핵심 결과 고정', summary:'세 명의 공식 챔피언이 선택된 뒤 예상 밖의 네 번째 이름으로 해리 포터가 선택된다.', hooks:['그레이트홀에서 학생들의 반응을 직접 지켜본다.','사건 직후 친구들과 이야기를 나눈다.']},
  {id:'weighing-wands', date:'1994-11-13', title:'챔피언 관련 공개 행사와 소문', type:'트리위저드 대회', location:'호그와트', certainty:'원작 타임라인', status:'핵심 결과 고정', summary:'챔피언을 둘러싼 긴장과 학교 내 소문이 커진다. 해리와 관련된 인터뷰와 지팡이 검사가 이어진다.', hooks:['학생들 사이의 분위기와 소문을 관찰한다.','코델리아가 친구들과 관련 이야기를 나눌 수 있다.']},
  {id:'first-task', date:'1994-11-24', title:'트리위저드 대회 첫 번째 과제', type:'트리위저드 대회', location:'호그와트 경기장', certainty:'원작 명시', status:'핵심 결과 고정', summary:'챔피언들이 용과 맞서는 첫 번째 과제를 수행한다.', hooks:['관중석에서 경기를 지켜본다.','과제 전후 학생들의 반응과 소문을 경험한다.']},
  {id:'yule-ball', date:'1994-12-25', title:'율 볼(Yule Ball)', type:'학교 행사', location:'그레이트홀', certainty:'원작 명시', status:'핵심 결과 고정', summary:'트리위저드 대회의 전통 행사인 크리스마스 무도회가 열린다. 공식적으로 저녁 8시부터 자정까지 진행된다.', hooks:['무도회 준비와 학생들 사이의 이야기를 경험한다.','무도회장에서 친구들과 대화하고 주변 분위기를 즐긴다.']},
  {id:'skeeter-hagrid', date:'1995-01-04', title:'리타 스키터의 기사', type:'사회적 파장', location:'학교 전역', certainty:'원작 타임라인', status:'핵심 결과 고정', summary:'리타 스키터가 해그리드에 관한 기사를 발표하면서 학교에 파장이 생긴다.', hooks:['아침 식사 자리에서 기사에 대한 반응을 듣는다.','친구들과 사실 여부를 두고 이야기한다.']},
  {id:'egg-clue', date:'1995-01-21', title:'황금알의 단서가 풀리다', type:'트리위저드 대회', location:'호그와트', certainty:'원작 타임라인', status:'핵심 결과 고정', summary:'첫 번째 과제에서 얻은 황금알의 단서가 해리에게 중요한 힌트를 준다.', hooks:['학생들 사이에서 황금알 이야기가 화제인지 살핀다.','도서관 등에서 관련된 분위기를 경험한다.']},
  {id:'second-task', date:'1995-02-24', title:'트리위저드 대회 두 번째 과제', type:'트리위저드 대회', location:'호그와트 호수', certainty:'원작 명시', status:'핵심 결과 고정', summary:'챔피언들이 호수 아래에서 중요한 사람을 구하는 두 번째 과제를 수행한다.', hooks:['호숫가에서 경기 결과를 기다린다.','과제가 끝난 뒤 학생들과 결과에 대해 이야기한다.']},
  {id:'hogsmeade-sirius', date:'1995-03-01', dateLabel:'1995년 3월경', exactDate:false, title:'호그스미드 방문과 중요한 만남', type:'학교 밖 사건', location:'호그스미드', certainty:'원작 타임라인(월 단위)', status:'정확한 일자는 불확실', summary:'3월의 호그스미드 방문 중 해리 일행에게 중요한 대화와 만남이 이어진다. 코델리아는 주변 인물로서 이를 목격하거나 별도의 일상을 보낼 수 있다.', hooks:['호그스미드에서 친구들과 평범하게 시간을 보낸다.','학교 친구들의 비밀스러운 움직임이나 소문을 접한다.']},
  {id:'crouch-aftermath', date:'1995-05-27', title:'바티 크라우치 시니어 사건', type:'사회적 파장', location:'호그와트 주변', certainty:'원작 타임라인', status:'핵심 결과 고정', summary:'트리위저드 대회 막바지에 큰 사건이 벌어지고 학교의 분위기가 불안해진다.', hooks:['학생들 사이에 퍼지는 불안한 소문을 접한다.','교수진의 분위기가 평소와 달라졌음을 느낀다.']},
  {id:'exams', date:'1995-06-23', dateLabel:'1995년 6월 23일경', exactDate:false, title:'기말 시험 기간', type:'학업', location:'호그와트', certainty:'원작 타임라인(약 날짜)', status:'플레이 연동', summary:'4학년 학생들이 학기 말 시험을 치른다.', hooks:['시험 공부를 하거나 친구들과 공부 계획을 세운다.','시험이 끝난 뒤 성적과 방학 계획을 이야기한다.']},
  {id:'third-task', date:'1995-06-24', title:'트리위저드 대회 세 번째 과제', type:'트리위저드 대회', location:'미궁', certainty:'원작 명시', status:'핵심 결과 고정', summary:'마지막 과제가 진행되며 4학년의 한 해가 중대한 전환점을 맞는다. 코델리아는 원작의 고정 결과를 바꾸지 않는 범위에서 주변 장면에 참여한다.', hooks:['미궁 과제가 진행되는 날 학교의 긴장감을 경험한다.','과제 전후 학생들과 교직원의 반응을 살핀다.']}
];

function getCanonEventsForDate(date=gameState.date){return CANON_EVENTS.filter(e=>e.exactDate!==false && e.date===String(date));}
function getNextCanonEvents(limit=3){
  return CANON_EVENTS.filter(e=>e.date>=String(gameState.date)).slice(0,limit);
}
function getRecentCanonEvents(limit=3){
  return CANON_EVENTS.filter(e=>e.exactDate!==false && e.date<String(gameState.date)).slice(-limit).reverse();
}
function getActiveCanonEvent(){return getCanonEventsForDate(gameState.date)[0]||null;}
function markCanonEventSeen(id){
  if(!gameState.canonSeen)gameState.canonSeen=[];
  if(!gameState.canonSeen.includes(id))gameState.canonSeen.push(id);
  saveAuto();renderGame();
}
function getCanonHook(event){
  if(!event)return '';
  const seed=toDate(event.date).getDate()+event.title.length;
  return event.hooks[seed%event.hooks.length];
}
function canonLocationMatches(current,eventLocation){
  const here=String(current||'');
  const target=String(eventLocation||'');
  if(!target) return false;
  if(target==='호그와트') return /호그와트|그레이트홀|교실|복도|도서관|운동장|호수|천문학|온실|기숙사/.test(here);
  if(target==='호그와트 경기장') return /경기장|운동장/.test(here);
  if(target==='호그와트 호수') return /호수|호숫가/.test(here);
  if(target==='호그스미드') return /호그스미드|세\s*빗자루|허니듀크|종코|부엉이 우체국/.test(here);
  if(target==='호그와트 주변') return /호그와트|금지된 숲|호수|운동장/.test(here);
  return here===target;
}
function getCanonContext(){
  const active=getActiveCanonEvent();
  if(!active)return null;
  const here=String(gameState.location||'');
  const sameSpot=canonLocationMatches(here,active.location);
  const onCampus=/호그와트|그레이트홀|교실|복도|도서관|운동장|호수|천문학|온실|기숙사/.test(here);
  let mode='간접';
  let guidance='원작 사건은 현재 날짜의 세계 사건으로 이미 진행 중이다. 플레이어의 일정과 위치를 임의로 바꾸지 말고, 현재 장면에서 자연스럽게 접할 수 있는 만큼만 반영한다.';
  if(sameSpot){
    mode='현장 인접';
    guidance='현재 위치가 원작 사건의 장소 또는 그와 직접 연결된 공간이다. 코델리아가 실제로 보고 듣는 범위에서 사건을 목격할 수 있다. 원작 핵심 결과와 주인공의 역할은 유지한다.';
  }else if(onCampus){
    mode='학교 내 간접';
    guidance='현재 위치가 학교 안이지만 원작 사건의 현장과 다르다. 직접 목격했다고 쓰지 말고, 멀리서 들리는 소리·학생들의 반응·공지·식사 자리의 대화·복도 소문처럼 현재 위치에서 알 수 있는 방식으로만 연결한다.';
  }
  return {event:active,mode,guidance};
}
function renderCanonContext(){ const el=document.getElementById('canonContextCard'); if(el){ el.hidden=true; el.innerHTML=''; } }


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
  version: 10,
  gameVersion: '10단계 — 원작 사건 타임라인',
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
  letters: [],
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
  canonSeen: [],
  holidayTravel: {active:false,holidayId:'',base:'집',location:'그레이트홀',placesVisited:[],lastActivity:''},
  nightExploration: {active:false, startLocation:'', returnLocation:'래번클로 휴게실', alert:0, steps:0, discoveries:[], lastResult:''},
  hogsmeadeVisit: {active:false, arrivalTime:'', placesVisited:[], lastActivity:''},
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
function currentSchedule(){if(isHoliday(gameState.date))return null;const now=timeMin(gameState.time);return nowSchedule().find(x=>{const s=timeMin(x.start),e=timeMin(x.end);return now>=s&&now<e})||null;}
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

function isNightExplorationAvailable(){
  const phase=getTimePhase();
  return (phase==='night' || timeMin(gameState.time)>=21*60) && gameState.location!=='호그스미드';
}
function explorationStatusText(){
  const ex=gameState.nightExploration||{};
  if(!ex.active)return '비활성';
  if(ex.alert>=4)return '발각 직전';
  if(ex.alert>=3)return '주의 필요';
  if(ex.alert>=1)return '조심스럽게 진행 중';
  return '아직 들키지 않음';
}
function startNightExploration(){
  if(!isNightExplorationAvailable()){showNotice('야간 탐험은 밤 9시 이후에 시작할 수 있습니다.',true);return false;}
  if(gameState.location!=='래번클로 휴게실' && gameState.location!=='래번클로 기숙사'){showNotice('야간 탐험은 래번클로 기숙사 쪽에서 준비하는 것이 좋습니다.',true);return false;}
  gameState.nightExploration={active:true,startLocation:gameState.location,returnLocation:gameState.location,alert:0,steps:0,discoveries:[],lastResult:'조용히 기숙사 밖으로 나왔다.'};
  gameState.lastAction='밤이 되어 기숙사에서 조용히 나와 호그와트를 탐색한다.';
  addEvent('밤에 기숙사를 나와 비공식적인 야간 탐험을 시작했다.');
  addScene('기숙사 주변이 조용해진 것을 확인한 뒤, 코델리아는 다른 학생들이 잠든 틈에 조심스럽게 밖으로 나섰다.');
  saveAuto();renderGame();showNotice('야간 탐험을 시작했습니다.');
  return true;
}
function exploreNightSpot(destination){
  if(!gameState.nightExploration?.active){showNotice('먼저 야간 탐험을 시작해 주세요.',true);return false;}
  const spot=NIGHT_EXPLORATION_SPOTS[destination];
  if(!spot){return false;}
  if(destination===gameState.location){showNotice('이미 그 장소에 있습니다.',true);return false;}
  const before=snapshotState();
  const minutes=spot.minutes;
  gameState.location=destination;
  advanceTime(minutes);
  const ex=gameState.nightExploration;
  ex.steps=(Number(ex.steps)||0)+1;
  ex.alert=Math.max(0,Math.min(5,(Number(ex.alert)||0)+(Math.random()<spot.risk?1:0)));
  let result=spot.desc;
  const discoveryChance=Math.min(.55,.18+ex.steps*.06);
  if(Math.random()<discoveryChance){
    const discovery=NIGHT_DISCOVERIES[Math.floor(Math.random()*NIGHT_DISCOVERIES.length)];
    ex.discoveries.unshift({date:gameState.date,time:gameState.time,location:destination,text:discovery.text});
    ex.discoveries=ex.discoveries.slice(0,8);
    result+=' '+discovery.text;
    if(discovery.clue)addClue(discovery.clueText, destination);
  }
  if(ex.alert>=4){
    result+=' 멀리서 인기척이 들린다. 더 머무르는 것은 좋지 않아 보인다.';
    ex.lastResult=result;
    recordStateDiff(before);saveAuto();renderGame();showNotice('순찰이나 다른 학생의 인기척이 가까워졌습니다.',true);
    return true;
  }
  ex.lastResult=result;
  addScene(result);
  recordStateDiff(before);
  saveAuto();renderGame();
  return true;
}
function endNightExploration(){
  const ex=gameState.nightExploration;
  if(!ex?.active){showNotice('현재 야간 탐험 중이 아닙니다.',true);return false;}
  const before=snapshotState();
  const returnLoc=ex.returnLocation||'래번클로 휴게실';
  const now=timeMin(gameState.time);
  const returnMinutes=gameState.location===returnLoc?0:(now<22*60?10:15);
  if(returnMinutes>0)advanceTime(returnMinutes);
  gameState.location=returnLoc;
  addScene('탐험을 마친 코델리아는 복도를 지나 다시 기숙사로 돌아왔다.');
  addEvent(`야간 탐험 종료 · ${ex.steps||0}곳 방문 · 경계 ${ex.alert||0}/5`);
  gameState.nightExploration={active:false,startLocation:'',returnLocation:returnLoc,alert:ex.alert||0,steps:ex.steps||0,discoveries:ex.discoveries||[],lastResult:'기숙사로 무사히 돌아왔다.'};
  recordStateDiff(before);saveAuto();renderGame();showNotice('야간 탐험을 종료하고 기숙사로 돌아왔습니다.');
  return true;
}
function getNightExplorationDestinations(){
  const current=gameState.location;
  return Object.entries(NIGHT_EXPLORATION_SPOTS)
    .filter(([name])=>name!==current && name!=='래번클로 휴게실')
    .map(([name,x])=>({name,...x}));
}

function isHogsmeadeVisitDay(){return isHogsmeadeDate(gameState.date);}
function canLeaveForHogsmeade(){
  if(gameState.nightExploration?.active){showNotice('야간 탐험 중에는 호그스미드로 이동할 수 없습니다.',true);return false;}
  if(!isHogsmeadeVisitDay()){showNotice('오늘은 호그스미드 방문일이 아닙니다.',true);return false;}
  if(gameState.location==='호그스미드'){showNotice('이미 호그스미드에 있습니다.',true);return false;}
  const sched=currentSchedule();
  if(sched && sched.type==='class'){showNotice('수업 시간에는 호그스미드로 출발할 수 없습니다.',true);return false;}
  return true;
}
function goToHogsmeade(){
  if(!canLeaveForHogsmeade())return false;
  const before=snapshotState();
  advanceTime(45);
  gameState.location='호그스미드';
  gameState.hogsmeadeVisit={active:true,arrivalTime:gameState.time,placesVisited:[],lastActivity:'마을에 도착했다.'};
  addScene('마차를 타고 호그스미드 마을에 도착했다. 돌길을 따라 상점들이 이어지고, 주말 외출을 나온 학생들의 목소리가 곳곳에서 들린다.');
  addEvent('호그스미드 방문 · 마을 도착');
  recordStateDiff(before);
  saveAuto();renderGame();showNotice('호그스미드에 도착했습니다.');
  return true;
}
function returnFromHogsmeade(){
  if(gameState.location!=='호그스미드'){showNotice('현재 호그스미드에 있지 않습니다.',true);return false;}
  const before=snapshotState();
  advanceTime(45);
  gameState.location='래번클로 휴게실';
  const visited=gameState.hogsmeadeVisit?.placesVisited||[];
  gameState.hogsmeadeVisit={active:false,arrivalTime:gameState.hogsmeadeVisit?.arrivalTime||'',placesVisited:visited,lastActivity:'호그와트로 돌아왔다.'};
  addScene('귀환 마차를 타고 호그스미드를 떠나 호그와트로 돌아왔다.');
  addEvent(`호그스미드 방문 종료 · ${visited.length}곳 방문`);
  recordStateDiff(before);saveAuto();renderGame();showNotice('호그와트로 돌아왔습니다.');
  return true;
}
function visitHogsmeadePlace(place){
  if(gameState.location!=='호그스미드' || !gameState.hogsmeadeVisit?.active){showNotice('먼저 호그스미드로 이동하세요.',true);return false;}
  const spot=HOGSMEADE_PLACES[place]; if(!spot)return false;
  const before=snapshotState();
  advanceTime(spot.minutes);
  gameState.hogsmeadeVisit.placesVisited.unshift(place);
  gameState.hogsmeadeVisit.placesVisited=[...new Set(gameState.hogsmeadeVisit.placesVisited)].slice(0,12);
  gameState.hogsmeadeVisit.lastActivity=spot.desc;
  const hook=HOGSMEADE_SOCIAL_HOOKS[Math.floor(Math.random()*HOGSMEADE_SOCIAL_HOOKS.length)];
  addScene(`${spot.desc} ${hook}`);
  if(place==='부엉이 우체국') gameState.lastAction=spot.prompt;
  addEvent(`호그스미드 · ${place} 방문`);
  recordStateDiff(before);saveAuto();renderGame();showNotice(`${place}에 도착했습니다.`);
  return true;
}
function renderHogsmeade(){
  const el=document.getElementById('hogsmeadeCard'); if(!el)return;
  const day=isHogsmeadeVisitDay(); const active=gameState.location==='호그스미드' && gameState.hogsmeadeVisit?.active;
  if(!day && !active){el.hidden=true;return;}
  el.hidden=false;
  if(!active){
    el.innerHTML=`<div class="section-heading"><div><h2>🏘️ 호그스미드</h2><span class="muted">오늘은 방문일입니다. 수업이 없는 시간에 마을로 갈 수 있습니다.</span></div><span class="pill">VISIT DAY</span></div><div class="hogsmeade-intro">돌길을 따라 상점과 펍이 늘어선 마을입니다. 장소마다 다른 사람과 소문, 작은 일상이 기다립니다.</div><button class="primary hogsmeade-go-btn" id="hogsmeadeGoBtn">호그스미드로 출발 · 45분</button>`;
    document.getElementById('hogsmeadeGoBtn').onclick=goToHogsmeade;
    return;
  }
  const places=Object.entries(HOGSMEADE_PLACES); const visited=gameState.hogsmeadeVisit.placesVisited||[];
  el.innerHTML=`<div class="section-heading"><div><h2>🏘️ 호그스미드 방문 중</h2><span class="muted">${esc(gameState.hogsmeadeVisit.lastActivity||'마을을 둘러보고 있다.')}</span></div><span class="pill">${visited.length}곳 방문</span></div><div class="hogsmeade-stats"><div><span>현재 시각</span><strong>${timeDisplay(gameState.time)}</strong></div><div><span>방문 장소</span><strong>${visited.length}곳</strong></div><div><span>소지금</span><strong>${formatMoney()}</strong></div></div><div class="hogsmeade-place-grid">${places.map(([name,x])=>`<button class="hogsmeade-place ${visited.includes(name)?'visited':''}" data-hogs-place="${esc(name)}"><span>${x.icon}</span><strong>${esc(name)}</strong><small>${x.minutes}분 · ${esc(x.desc)}</small></button>`).join('')}</div><div class="hogsmeade-visited">${visited.length?`최근 방문: ${visited.slice(0,5).map(x=>esc(x)).join(' · ')}`:'아직 방문한 장소가 없습니다.'}</div><button class="secondary hogsmeade-return-btn" id="hogsmeadeReturnBtn">호그와트로 돌아가기 · 45분</button>`;
  el.querySelectorAll('[data-hogs-place]').forEach(btn=>btn.onclick=()=>visitHogsmeadePlace(btn.dataset.hogsPlace));
  document.getElementById('hogsmeadeReturnBtn').onclick=returnFromHogsmeade;
}

function canUseHolidayTravel(){
  const holiday=getHolidayInfo();
  if(!holiday){showNotice('현재는 방학 기간이 아닙니다.',true);return false;}
  if(gameState.nightExploration?.active){showNotice('야간 탐험 중에는 방학 여행을 시작할 수 없습니다.',true);return false;}
  if(gameState.hogsmeadeVisit?.active){showNotice('호그스미드 방문을 먼저 종료하세요.',true);return false;}
  return true;
}
function startHolidayTravel(base='집'){
  if(!canUseHolidayTravel())return false;
  const holiday=getHolidayInfo();
  const before=snapshotState();
  const target=HOLIDAY_PLACES[base]?base:'집';
  advanceTime(target==='집'?30:180);
  gameState.location=target;
  gameState.holidayTravel={active:true,holidayId:holiday.id,base:target==='집'?'집':target,location:target,placesVisited:[],lastActivity:`${target}에 도착했다.`};
  addScene(`${holiday.name}이 시작되었다. 코델리아는 정규 수업에서 벗어나 ${target}에서 방학을 보낼 준비를 한다.`);
  addEvent(`${holiday.name} 시작 · ${target}`);
  recordStateDiff(before);saveAuto();renderGame();showNotice(`${holiday.name} · ${target}에서 방학을 시작합니다.`);
  return true;
}
function travelHolidayPlace(place){
  const holiday=getHolidayInfo();
  if(!holiday || !gameState.holidayTravel?.active){showNotice('방학 여행을 먼저 시작하세요.',true);return false;}
  const spot=HOLIDAY_PLACES[place]; if(!spot)return false;
  if(place===gameState.location){showNotice('이미 그 장소에 있습니다.',true);return false;}
  const before=snapshotState();
  advanceTime(spot.minutes);
  gameState.location=place;
  gameState.holidayTravel.location=place;
  gameState.holidayTravel.placesVisited.unshift(place);
  gameState.holidayTravel.placesVisited=[...new Set(gameState.holidayTravel.placesVisited)].slice(0,12);
  gameState.holidayTravel.lastActivity=spot.desc;
  addScene(spot.desc);
  addEvent(`${holiday.name} · ${place} 방문`);
  recordStateDiff(before);saveAuto();renderGame();showNotice(`${place}로 이동했습니다.`);
  return true;
}
function endHolidayTravel(){
  if(!gameState.holidayTravel?.active){showNotice('현재 방학 여행 중이 아닙니다.',true);return false;}
  const before=snapshotState();
  const holiday=getHolidayInfo();
  advanceTime(20);
  gameState.location='그레이트홀';
  const visited=gameState.holidayTravel.placesVisited||[];
  gameState.holidayTravel={active:false,holidayId:holiday?.id||gameState.holidayTravel.holidayId,base:gameState.holidayTravel.base||'집',location:'그레이트홀',placesVisited:visited,lastActivity:'호그와트로 돌아왔다.'};
  addScene('방학 동안의 이동을 마치고 코델리아는 호그와트로 돌아올 준비를 한다.');
  addEvent(`${holiday?.name||'방학'} 종료 · 호그와트 복귀 준비`);
  recordStateDiff(before);saveAuto();renderGame();showNotice('호그와트로 돌아왔습니다.');
  return true;
}
function renderHolidayTravel(){
  const el=document.getElementById('holidayTravelCard'); if(!el)return;
  const holiday=getHolidayInfo();
  const active=gameState.holidayTravel?.active;
  if(!holiday && !active){el.hidden=true;return;}
  el.hidden=false;
  if(!active){
    el.innerHTML='<div class="section-heading"><div><h2>🧳 '+esc(holiday?.name||'방학')+'</h2><span class="muted">'+esc(holiday?.note||'수업이 없는 기간입니다.')+'</span></div><span class="pill">HOLIDAY</span></div>'+
      '<div class="holiday-intro">원작의 핵심 사건을 임의로 바꾸지 않고, 방학 중 개인 일정과 마법사 사회의 일상을 중심으로 진행합니다.</div>'+(getHolidaySpecial()?'<div class="holiday-special">★ '+esc(getHolidaySpecial())+'</div>':'')+
      '<div class="holiday-start-grid"><button class="primary holiday-start" data-holiday-base="집">집에서 보내기</button><button class="secondary holiday-start" data-holiday-base="킹스크로스역">런던으로 나가기</button></div>';
  }else{
    const visited=gameState.holidayTravel.placesVisited||[];
    const placesHtml=Object.entries(HOLIDAY_PLACES)
      .filter(([name])=>name!==gameState.holidayTravel.location)
      .map(([name,x])=>'<button class="holiday-place" data-holiday-place="'+esc(name)+'"><span>'+x.icon+'</span><strong>'+esc(name)+'</strong><small>'+x.minutes+'분 · '+esc(x.desc)+'</small></button>')
      .join('');
    const visitedHtml=visited.length?'최근 방문: '+visited.slice(0,5).map(x=>esc(x)).join(' · '):'아직 방문한 장소가 없습니다.';
    el.innerHTML='<div class="section-heading"><div><h2>🧳 '+esc(holiday?.name||'방학')+' · '+esc(gameState.holidayTravel.location||gameState.location)+'</h2><span class="muted">'+esc(gameState.holidayTravel.lastActivity||'방학 일상을 보내고 있다.')+'</span></div><span class="pill">'+visited.length+'곳 방문</span></div>'+
      '<div class="holiday-stats"><div><span>현재 위치</span><strong>'+esc(gameState.holidayTravel.location||gameState.location)+'</strong></div><div><span>현재 시각</span><strong>'+timeDisplay(gameState.time)+'</strong></div><div><span>방문 장소</span><strong>'+visited.length+'곳</strong></div></div>'+
      '<div class="holiday-place-grid">'+placesHtml+'</div><div class="hogsmeade-visited">'+visitedHtml+'</div><button class="secondary holiday-return" id="holidayReturnBtn">호그와트로 돌아가기</button>';
  }
  el.querySelectorAll('[data-holiday-base]').forEach(btn=>btn.onclick=()=>startHolidayTravel(btn.dataset.holidayBase));
  el.querySelectorAll('[data-holiday-place]').forEach(btn=>btn.onclick=()=>travelHolidayPlace(btn.dataset.holidayPlace));
  const back=document.getElementById('holidayReturnBtn'); if(back)back.onclick=endHolidayTravel;
}
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
function snapshotState(){return{date:gameState.date,time:gameState.time,location:gameState.location,weather:gameState.weather,galleons:gameState.galleons,relationships:deepClone(gameState.relationships),academics:deepClone(gameState.academics),housePoints:deepClone(gameState.housePoints),inventory:deepClone(gameState.inventory),rumors:deepClone(gameState.rumors),clues:deepClone(gameState.clues),events:deepClone(gameState.events),nightExploration:deepClone(gameState.nightExploration)}}
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

function getDailySocialHook(){
  const d=toDate(gameState.date,gameState.time);
  const seed=(d.getFullYear()*1000000)+(d.getMonth()+1)*10000+d.getDate()*100+d.getHours();
  return DAILY_SOCIAL_HOOKS[Math.abs(seed)%DAILY_SOCIAL_HOOKS.length];
}

function getSocialLeads(){
  const loc=gameState.location||'';
  const ranked=Object.entries(gameState.relationships||{})
    .filter(([name])=>SOCIAL_PROFILES[name])
    .map(([name,r])=>{
      const profile=SOCIAL_PROFILES[name];
      const locationBonus=profile.places.includes(loc)?25:0;
      const relationScore=Number(r.value)||0;
      return {name,relation:relationLevel(relationScore),score:relationScore+locationBonus,role:profile.role,hook:profile.hooks[Math.abs(relationScore)%profile.hooks.length],locationBonus};
    })
    .sort((a,b)=>b.score-a.score)
    .slice(0,4);
  return ranked;
}

function renderQuickActions(){
  const el=document.getElementById('quickActions');
  if(!el)return;
  el.innerHTML=QUICK_ACTIONS.map(([label,desc])=>`<button type="button" title="${esc(desc)}" data-action="${esc(label)}">${esc(label)}</button>`).join('');
  el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    const presets={
      '대화':'근처에 있는 친구나 학생에게 자연스럽게 말을 건다.',
      '도서관':'도서관으로 가서 책을 둘러보고 필요한 사람에게 말을 건다.',
      '공부':'현재 해야 할 공부를 시작하고 주변 학생들과도 가볍게 상호작용한다.',
      '과제':'오늘 해야 할 과제를 시작한다.',
      '식사':'그레이트홀로 가서 식사하며 주변 대화를 살핀다.',
      '휴식':'지금 있는 장소에서 잠시 쉬며 주변 사람들의 행동을 살핀다.',
      '탐색':'지금 있는 곳 주변을 천천히 둘러보며 평범한 학교생활의 장면을 살핀다.',
      '호그스미드':'호그스미드 방문이 가능하다면 마을을 둘러보고 친구들과 이야기를 나눈다.',
      '이동':'다음에 가고 싶은 장소를 정해 그곳으로 이동한다.'
    };
    const input=document.getElementById('actionInput');
    if(input){input.value=presets[btn.dataset.action]||btn.dataset.action;input.focus();}
  }));
}

function renderSocialContext(){
  const hookEl=document.getElementById('dailySocialHook');
  const listEl=document.getElementById('socialLeadList');
  if(!hookEl||!listEl)return;
  hookEl.textContent=getDailySocialHook();
  const leads=getSocialLeads();
  listEl.innerHTML=leads.length?leads.map(x=>`<article class="social-lead"><div class="social-lead__top"><strong>${esc(x.name)}</strong><span class="relation-level">${esc(x.relation)}</span></div><div class="subtext">${esc(x.role)}</div><div class="social-lead__hook">${esc(x.hook)}</div><button type="button" class="social-lead__action" data-name="${esc(x.name)}">${esc(x.name)}에게 말 걸기</button></article>`).join(''):`<div class="empty">현재 연결할 주요 인물이 없습니다.</div>`;
  listEl.querySelectorAll('.social-lead__action').forEach(btn=>btn.addEventListener('click',()=>{
    const input=document.getElementById('actionInput');
    if(input){input.value=`${btn.dataset.name}에게 자연스럽게 말을 걸고, 지금 학교에서 무슨 일이 있는지 이야기한다.`;input.focus();}
  }));
}

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
    ? (isHogsmeadeOpen()?`방문 가능·현재 호그스미드 · ${gameState.hogsmeadeVisit?.placesVisited?.slice(0,5).join(', ')||'마을 도착 직후'}`:'방문 가능일·현재 호그와트')
    : '방문 불가일';

  const holidayInfo=getHolidayInfo();
  const holidayContext=holidayInfo?`${holidayInfo.name} · ${gameState.holidayTravel?.active?`현재 ${gameState.holidayTravel.location||gameState.location}`:'아직 방학 계획을 정하지 않음'}`:'정규 학기';

  const socialLeads=getSocialLeads();
  const socialContext=socialLeads.length
    ? socialLeads.map(x=>`${x.name}: ${x.relation}, ${x.role}. 소재: ${x.hook}`).join(' / ')
    : '주요 인물 없음';

  const prompt=`[호그와트 생활 게임 — 현재 상태]
날짜: ${dateDisplay(gameState.date)} (${weekday(gameState.date)})
시간: ${timeDisplay(gameState.time)}
위치: ${gameState.location}
일정: ${sched?sched.subject:'자유시간'}
날씨: ${gameState.weather}
호그스미드: ${hs}
방학 상태: ${holidayContext}
원작 특별 일정: ${getHolidaySpecial()||'없음'}
소지금: ${formatMoney()}
보유 물건: ${inventory||'없음'}
${relatedNames?`현재 행동 관련 관계: ${relatedNames}`:''}
주변 사회적 맥락: ${socialContext}
오늘의 생활 소재: ${getDailySocialHook()}
${recentClues?`최근 단서: ${recentClues}`:'최근 단서: 없음'}
최근 편지: ${(gameState.letters||[]).slice(0,3).map(l=>`${l.from}: ${l.subject}`).join(' / ')||'없음'}
${previousScene?`직전 장면: ${previousScene}`:''}
야간 탐험: ${gameState.nightExploration?.active?`진행 중 · 현재 ${gameState.location} · 방문 ${gameState.nightExploration.steps||0}곳 · 경계 ${gameState.nightExploration.alert||0}/5`:'비활성'}

[코델리아의 행동]
${action}

[진행 규칙]
- 코델리아의 말·행동·생각·감정은 플레이어가 정한 내용만 사용한다.
- 일상을 우선하고 매번 큰 사건을 만들지 않는다.
- NPC는 독립적인 일정·관계·목표를 가진다.
- NPC가 장면에 등장할 때는 그 인물의 학년·기숙사·수업 가능 여부와 현재 시간표를 먼저 고려한다. 현재 시간표와 양립할 수 없는 수업·장소·행동을 임의로 부여하지 않는다.
- 현재 화면에 표시된 일정은 코델리아의 현재 일정이며, 다른 NPC의 일정을 알 수 없는 경우 그 NPC가 수업 중이라고 단정하지 않는다. 반대로 이미 같은 장소에 있는 NPC를 수업 시간이라는 이유만으로 자동 퇴장시키지도 않는다.
- 시간표가 수업 시간일 때 NPC와의 상호작용은 해당 수업 안에서 가능한 행동으로 제한한다. 수업 시간에 unrelated한 장소에서 장시간 잡담하거나 다른 수업으로 이동하는 장면을 만들지 않는다.
- 시간표는 고정된 일정이다. 현재 일정의 종료 시각을 절대 넘기지 않는다.
- 행동에 필요한 시간이 남은 시간보다 길다면 남은 시간까지만 처리한다.
- 다음 일정이 시작되면 현재 장면을 마무리하고 다음 일정으로 넘어간다.
- 수업 중에는 질문, 실습, 관찰, 주변 학생과의 대화, 교수와의 상호작용 등 다양한 행동이 가능하다.
- 플레이어가 직접 행동을 제시하지 않았다고 수업을 자동으로 끝내지 않는다.
- 평범한 하루에도 식사 중 대화, 복도에서 들은 소문, 부엉이 우편, 친구의 부탁, 게시판 공지 같은 작은 생활 이벤트를 자연스럽게 발생시킨다.
- 화면에 표시된 '주변 사회적 맥락'과 '오늘의 생활 소재'는 의무 이벤트가 아니라 현재 장면을 풍부하게 만들기 위한 소재다. 한 장면에 0~3개 정도만 자연스럽게 활용한다.
- 학교생활에서는 서로 독립적인 소문이 동시에 존재할 수 있다. 한 장면에서 가십이 자연스럽게 발생할 만한 상황이라면 서로 다른 내용의 가십을 2~4개까지 제시할 수 있다. 단, 억지로 숫자를 채우지 말고 실제 대화·목격·게시판·전언 등 서로 다른 출처가 있을 때만 추가한다.
- 같은 소문을 표현만 바꿔 중복 기록하지 않는다. 새로운 소문은 기존 기록과 구별되는 내용이어야 한다.
- 가십은 한 인물이 혼자 말해주는 것뿐 아니라 여러 학생의 대화, 복도에서 들은 말, 기숙사에서 공유된 이야기, 게시판이나 편지에서 접한 이야기처럼 서로 다른 경로로 발생할 수 있다.
- 친밀한 친구는 먼저 말을 걸거나 부탁을 할 수 있지만, 모든 인물이 항상 코델리아를 중심으로 움직이지 않는다.
- 코델리아가 소문을 전할 때는 누구에게서 들었는지와 그 정확도를 고려하고, 관계가 높은 인물일수록 개인적인 이야기와 감정을 더 자연스럽게 공유할 수 있다.
- 소문은 사실·부분적 사실·과장·오해·거짓·미확인 중 하나이며, 플레이어가 직접 확인하기 전까지 확정된 사실처럼 말하지 않는다.
- NPC는 이전 대화와 행동을 기억하고 다음 만남의 말투·태도·부탁·거리감에 반영한다. 관계 변화는 수치보다 실제 행동과 대사로 보여준다.
- 편지는 보낸 사람, 제목, 내용, 도착 장소를 가진 실제 물건처럼 다룬다. 플레이어가 원하면 읽기·보관·답장·전달할 수 있다.
- 장소에 도착하면 그 장소의 구조와 시야, 소리, 빛, 냄새, 날씨, 움직이는 사람을 짧고 구체적으로 묘사한다. 장소마다 고유한 분위기를 유지한다.
- 수업은 학업 수치 상승만을 위한 시간이 아니라 학생들과 상호작용하고 작은 일상을 경험하는 시간이다.
- 장면 시작 시 현재 위치의 공간 구조, 분위기, 주변 소리, 빛, 날씨, 사람들의 움직임을 짧게 묘사한다.
- 플레이어가 현재 무엇을 보고 있는지 알 수 있도록 시야 중심으로 서술한다.
- NPC는 플레이어를 기다리는 존재가 아니라 주변에서 각자의 행동을 한다.
- 코델리아가 모르는 정보는 알려주지 않는다.
- 보유 물건은 가능한 추가 해결 방법으로 활용하되 자동 성공시키지 않는다.
- 소지품은 실제 소비·파손·분실 시에만 변경한다.
- 호그스미드 상점은 게임용 방문 가능일에 실제 호그스미드에 있을 때만 이용한다.
- 방학 중에는 정규 수업 일정 대신 개인 일정과 장소 이동을 우선한다.
- 1994-1995학년의 원작 핵심 사건은 임의로 순서를 바꾸거나 취소하지 않는다. 코델리아의 행동은 주변 장면, 소문, 개인적 일상 수준에서만 개입한다.
- 원작에서 확인되지 않는 장소·인물의 세부 정보는 사실처럼 단정하지 않고 플레이용 창작으로 처리한다.
- 호그스미드는 화면의 출발 버튼으로 이동하며, 방문 가능한 날짜가 아니면 이동시키지 않는다.
- 호그스미드에서는 화면의 장소 버튼으로 실제 이동 시간과 방문 기록을 처리하며, 장면 서술에서는 현재 선택된 장소를 일관되게 반영한다.
- 호그스미드의 생활 장면은 상점, 학생들의 대화, 직원의 행동, 마을 분위기 같은 작은 일상을 우선하고 매번 큰 사건을 만들지 않는다.
- 야간 탐험 중이라면 밤의 호그와트 특유의 고요함, 발소리, 초상화, 달빛, 순찰 분위기를 활용한다. 코델리아의 행동을 대신 결정하지 않는다.
- 야간 탐험에서 큰 사건을 매번 발생시키지 않는다. 작은 발견과 일상적인 우연을 우선하며, 경계가 높아지면 귀환 압박을 자연스럽게 묘사한다.
- 야간 탐험의 이동·종료 여부는 화면의 탐험 버튼으로 처리되며, 장면 서술에서는 이를 일관되게 반영한다.


[원작 사건 고증 규칙]
- 이 게임의 기본 연도는 1994~1995년, 해리 포터의 4학년(《불의 잔》) 시기를 기준으로 한다.
- 아래 원작 사건의 핵심 결과와 주요 인물 관계를 임의로 뒤집거나 삭제하지 않는다.
- 코델리아는 원작 주인공이 아니므로 원작 사건의 중심 결과를 대신 차지하지 않는다. 같은 장소에 있으면 직접 목격할 수 있고, 다른 장소라면 소문·공지·학생 반응 등 간접적인 방식으로 접한다.
- 1994-10-31의 챔피언 선정은 빅터 크룸, 플뢰르 델라쿠르, 세드릭 디고리, 해리 포터라는 원작 결과를 유지한다.
- 1994-11-24 첫 번째 과제, 1994-12-25 율 볼, 1995-02-24 두 번째 과제, 1995-06-24 세 번째 과제의 존재와 핵심 결과는 변경하지 않는다.
- 1994-12-25 율 볼은 크리스마스 당일 저녁 행사이며 공식 정보상 오후 8시부터 자정까지 열린다.
- 사건 날짜가 '원작 타임라인(월 단위)' 또는 '약 날짜'로 표시된 경우 날짜를 확정된 사실처럼 단정하지 말고 해당 시기의 분위기와 주변 장면에 초점을 둔다.
- 원작에 직접 근거가 없는 세부 대화나 장소 이동은 '추정' 또는 '코델리아의 개인 장면'으로 처리한다.

[현재 원작 흐름 — 일반 진행에 통합]
${(()=>{const c=getCanonContext();return c?`${c.event.date} · ${c.event.title} · 원작 장소: ${c.event.location} · 현재 접점: ${c.mode} · ${c.guidance}`:'오늘 날짜에는 등록된 주요 원작 사건이 없음';})()}
- 원작 사건은 별도의 미니게임이나 선택 페이지로 이동시키지 않는다. 현재 장면의 시간표·장소·행동 흐름 속에서만 자연스럽게 반영한다.
- 플레이어의 행동 때문에 원작 사건 현장으로 자동 이동시키지 않는다. 현재 일정과 위치가 맞을 때만 현장 장면으로 묘사하고, 그렇지 않으면 간접적으로 접한다.
- 원작 사건의 핵심 결과, 핵심 인물의 역할, 사건의 순서는 유지한다. 코델리아는 주변 학생으로서 관찰·대화·소문·개인적 행동을 할 수 있다.

[출력 형식]
[장면]
현재 장면을 자연스럽게 서술한다.
가십이 여러 개 생겼다면 각각을 별도의 줄에 기록한다. 한 줄에 여러 소문을 합치지 않는다. 줄 앞에 번호나 '-'가 붙어도 각 항목을 별도의 가십으로 기록한다. 같은 장면에서 새 가십이 2개 이상이라면 모두 기록한다.

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
편지: 보낸 사람 | 제목 | 내용 | 도착 장소
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
    if((m=/^시간\s*:\s*(\d{1,2}:\d{2})$/i.exec(line))){const target=timeMin(m[1]);const now=timeMin(gameState.time);if(target>=now){advanceTime(target-now);changes++;}continue;}
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
    if((m=/^(?:[-*•]\s*|\d+[.)]\s*)?가십\s*:\s*(.+?)\s*\|\s*진실여부\s*:\s*(.+?)(?:\s*\|\s*출처\s*:\s*(.*))?$/i.exec(line))){addRumor(m[1],m[2],m[3]||'');changes++;continue;}
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

function renderNightExploration(){
  const el=document.getElementById('nightExplorationCard');
  if(!el)return;
  const ex=gameState.nightExploration||{};
  const available=isNightExplorationAvailable();
  if(!available && !ex.active){el.hidden=true;return;}
  el.hidden=false;
  if(!ex.active){
    el.innerHTML=`<div class="section-heading"><div><h2>🌙 야간 탐험</h2><span class="muted">밤 9시 이후, 기숙사에서 조용히 호그와트를 돌아볼 수 있습니다.</span></div><span class="pill">NIGHT</span></div><div class="night-explore-intro">밤의 호그와트는 낮과 다른 소리와 분위기를 보여줍니다. 탐험은 시간과 경계를 소모하며, 발견한 내용은 기록과 단서에 남습니다.</div><button class="primary night-start-btn" id="nightStartBtn">야간 탐험 시작</button>`;
    document.getElementById('nightStartBtn').onclick=startNightExploration;
    return;
  }
  const destinations=getNightExplorationDestinations();
  const latest=(ex.discoveries||[]).slice(0,3);
  el.innerHTML=`<div class="section-heading"><div><h2>🌙 야간 탐험 중</h2><span class="muted">${esc(ex.lastResult||'조용히 주변을 살펴보고 있다.')}</span></div><span class="pill">${esc(explorationStatusText())}</span></div><div class="night-stats"><div><span>현재 위치</span><strong>${esc(gameState.location)}</strong></div><div><span>방문 횟수</span><strong>${Number(ex.steps)||0}곳</strong></div><div><span>경계</span><strong>${Number(ex.alert)||0} / 5</strong></div><div><span>시간</span><strong>${timeDisplay(gameState.time)}</strong></div></div><div class="night-dest-grid">${destinations.map(x=>`<button class="night-dest" data-night-dest="${esc(x.name)}"><span>${x.icon}</span><strong>${esc(x.name)}</strong><small>약 ${x.minutes}분</small></button>`).join('')}</div>${latest.length?`<div class="night-discoveries"><strong>최근 발견</strong>${latest.map(d=>`<div>· ${esc(d.text)} <span>(${esc(d.location)})</span></div>`).join('')}</div>`:''}<button class="secondary night-end-btn" id="nightEndBtn">탐험 종료 · 기숙사로 돌아가기</button>`;
  el.querySelectorAll('[data-night-dest]').forEach(btn=>btn.onclick=()=>exploreNightSpot(btn.dataset.nightDest));
  document.getElementById('nightEndBtn').onclick=endNightExploration;
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
  renderNightExploration();
  renderHogsmeade();
  renderHolidayTravel();
  renderCanonContext();
  renderStatus();renderSchedule();renderSituation();renderQuickActions();renderSocialContext();renderRelationships();renderGossip();renderInventory();renderClues();renderShop();renderAcademics();renderHouses();renderEvents();renderRecentChanges();renderLivePanel();renderSaves();
}
function renderStatus(){
  document.getElementById('statDate').textContent=`${dateDisplay(gameState.date)} · ${weekday(gameState.date)}`;
  document.getElementById('statTime').textContent=timeDisplay(gameState.time);
  document.getElementById('statWeather').textContent=`${gameState.season} · ${gameState.weather}`;
  document.getElementById('statLocation').textContent=`📍 ${gameState.location}`;
  document.getElementById('statMoney').textContent=formatMoney();
}
function renderSchedule(){
  const list=document.getElementById('scheduleList');
  const today=nowSchedule();
  const now=timeMin(gameState.time);
  const holiday=getHolidayInfo();
  document.getElementById('scheduleSubtitle').textContent=holiday?`${holiday.name} · 자유 일정`:`${weekday(gameState.date)}의 일정`;
  if(holiday){
    list.innerHTML=`<li class="empty">${esc(holiday.name)} 기간입니다. 정규 수업은 없습니다. 방학 카드에서 생활 계획을 선택할 수 있습니다.</li>`;
    return;
  }
  list.innerHTML=today.length?today.map(x=>{
    const s=timeMin(x.start),e=timeMin(x.end);
    const status=now<s?'upcoming':(e>s&&now<e?'ongoing':'done');
    const icon={meal:'🍽',class:'📖',free:'🕊',sleep:'🌙'}[x.type]||'•';
    return `<li class="schedule-item schedule-item--${status}"><span class="schedule-item__time">${x.start===x.end?x.start:`${x.start}–${x.end}`}</span><span>${icon}</span><span>${esc(x.subject)}</span><span class="schedule-item__status">${status==='upcoming'?'예정':status==='ongoing'?'진행 중':'완료'}</span></li>`;
  }).join(''):`<li class="empty">오늘은 등록된 일정이 없습니다.</li>`;
}
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

function renderAcademics(){const el=document.getElementById('academicList');if(!el)return;el.innerHTML=Object.entries(gameState.academics||{}).map(([s,v])=>`<div class="academic-row"><span>${esc(s)}</span><div class="bar"><span style="width:${Math.max(0,Math.min(100,v))}%"></span></div><span class="academic-score">${v}</span></div>`).join('')}
function renderHouses(){const ranked=Object.entries(gameState.housePoints).sort((a,b)=>b[1]-a[1]);const leader=ranked[0]?.[0];document.getElementById('houseGrid').innerHTML=HOUSES.map(h=>`<article class="house-card ${h===leader?'house-card--leader':''}"><div class="house-name">${houseLetter(h)} ${h}</div><div class="house-score">${gameState.housePoints[h]}</div><div class="subtext">${h===leader?'현재 선두':'현재 누적 점수'}</div></article>`).join('');document.getElementById('pointsHistory').innerHTML=gameState.pointsHistory.length?gameState.pointsHistory.slice(0,15).map(x=>`<div class="history-item"><span>${esc(x.house)} · ${esc(x.reason||'점수 변동')}</span><strong class="${x.delta>=0?'positive':'negative'}">${x.delta>=0?'+':''}${x.delta}</strong></div>`).join(''):`<div class="empty">최근 점수 변동이 없습니다.</div>`}
function renderEvents(){const important=gameState.events.filter(e=>String(e?.text||'').trim()&&String(e.text).trim()!=='새 장면 기록').slice(0,50);const recent=gameState.sceneHistory.slice(0,10);const importantHtml=important.length?important.map(e=>`<article class="timeline-item timeline-item--important"><div class="timeline-time">${dateDisplay(e.date)} ${timeDisplay(e.time)}</div><div>${esc(e.text)}</div></article>`).join(''):`<div class="empty">기록할 중요한 사건이 아직 없습니다.</div>`;const recentHtml=recent.length?recent.map(e=>`<article class="timeline-item"><div class="timeline-time">${dateDisplay(e.date)} ${timeDisplay(e.time)} · ${esc(e.location)}</div><div>${esc(e.text)}</div></article>`).join(''):`<div class="empty">최근 장면이 아직 없습니다.</div>`;document.getElementById('eventsList').innerHTML=`<div class="record-group"><div class="record-group__heading"><h2>중요한 사건</h2><span>${important.length}개</span></div><div class="timeline">${importantHtml}</div></div><div class="record-group"><div class="record-group__heading"><h2>최근 장면</h2><span>최근 ${recent.length}개</span></div><div class="timeline">${recentHtml}</div></div>`}
function renderRecentChanges(){const el=document.getElementById('recentChanges');if(!el)return;const changes=gameState.changes.slice(0,8);el.innerHTML=changes.length?changes.map(c=>`<div class="change-item change-item--${esc(c.type)}"><span>${esc(c.label)}</span><time>${esc(c.time)}</time></div>`).join(''):`<div class="empty compact-empty">아직 변동이 없습니다.</div>`}
function renderLivePanel(){const current=currentSchedule();const gossipEl=document.getElementById('liveGossip');if(gossipEl)gossipEl.innerHTML=gameState.rumors.length?gameState.rumors.slice(0,3).map(r=>`<div class="live-gossip"><strong>${esc(r.text)}</strong><span>${esc(r.truth)}</span></div>`).join(''):`<div class="compact-empty">현재 가십 없음</div>`;const houseEl=document.getElementById('liveHouses');if(houseEl){const ranked=Object.entries(gameState.housePoints).sort((a,b)=>b[1]-a[1]);houseEl.innerHTML=ranked.map(([house,score],i)=>`<div class="live-row"><span>${i===0?'🏆 ':''}${esc(house)}</span><strong>${score}</strong></div>`).join('')}const liveStatus=document.getElementById('liveStatus');if(liveStatus)liveStatus.innerHTML=`<div class="live-status-row"><span>날짜</span><strong>${dateDisplay(gameState.date)} · ${weekday(gameState.date)}</strong></div><div class="live-status-row"><span>시간</span><strong>${timeDisplay(gameState.time)}</strong></div><div class="live-status-row"><span>일정</span><strong>${esc(current?.subject||'자유시간')}</strong></div><div class="live-status-row"><span>장소</span><strong>${esc(gameState.location)}</strong></div><div class="live-status-row"><span>소지금</span><strong>${esc(formatMoney())}</strong></div>`}

function renderSaves(){}

function stateForSave(){
  const payload=deepClone(gameState);
  if(payload&&payload.saveMeta!==undefined)delete payload.saveMeta;
  return payload;
}
function saveAuto(){ /* 파일 저장 방식에서는 매 상태 변경 때 자동 파일을 만들지 않습니다. */ }
function buildSavePayload(){
  return {
    saveVersion: 11,
    gameVersion: gameState.gameVersion || 'Living in Hogwarts',
    exportedAt: new Date().toISOString(),
    state: stateForSave()
  };
}
function downloadBlob(filename,text){
  const blob=new Blob([text],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
function formatSaveFilename(){
  const safeDate=String(gameState.date||'save').replace(/[^0-9-]/g,'');
  const safeTime=String(gameState.time||'').replace(':','');
  return `Living_in_Hogwarts_${safeDate}_${safeTime}.json`;
}
function exportSave(){
  try{
    const payload=buildSavePayload();
    downloadBlob(formatSaveFilename(),JSON.stringify(payload,null,2));
    const el=document.getElementById('fileSaveStatus');if(el)el.textContent=`저장 완료 · ${formatSaveFilename()}`;
    showNotice('현재 게임을 JSON 파일로 저장했습니다.');
  }catch(e){console.error('JSON 저장 실패',e);showNotice(`JSON 저장에 실패했습니다: ${e.message||'오류'}`,true)}
}
function validateImportedSave(data){
  if(!data||typeof data!=='object')throw new Error('올바른 JSON 객체가 아닙니다.');
  if(data.state&&typeof data.state==='object')return data.state;
  if(data.date||data.time||data.location)return data;
  throw new Error('Living in Hogwarts 세이브 데이터가 아닙니다.');
}
function loadImportedSaveText(text,name='JSON 파일'){
  try{
    const data=JSON.parse(text);
    const raw=validateImportedSave(data);
    gameState=mergeState(raw);
    renderGame();
    const el=document.getElementById('fileSaveStatus');if(el)el.textContent=`불러오기 완료 · ${name}`;
    showNotice(`${name}을 불러왔습니다.`);
  }catch(e){console.error('JSON 불러오기 실패',e);showNotice(`JSON 불러오기에 실패했습니다: ${e.message||'저장 데이터 오류'}`,true)}
}
function importSaveFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>loadImportedSaveText(String(reader.result||''),file.name);
  reader.onerror=()=>showNotice('JSON 파일을 읽지 못했습니다.',true);
  reader.readAsText(file,'utf-8');
}
function newGame(){
  if(!confirm('현재 게임 상태를 모두 초기화할까요?'))return;
  gameState=deepClone(INITIAL_STATE);
  renderGame();
  showNotice('새 게임으로 초기화했습니다.');
}
function loadAuto(){ /* JSON 파일 저장 방식에서는 자동 불러오기를 사용하지 않습니다. */ }

function setupNavigation(){const nav=document.querySelectorAll('.nav__item');const panels=document.querySelectorAll('.panel');nav.forEach(item=>item.addEventListener('click',()=>{const target=item.dataset.target;nav.forEach(x=>x.setAttribute('aria-selected',String(x===item)));panels.forEach(p=>p.hidden=p.dataset.panel!==target)}))}
function init(){loadAuto();setupNavigation();document.getElementById('generatePromptBtn').onclick=generateClaudePrompt;document.getElementById('copyPromptBtn').onclick=copyPrompt;document.getElementById('applyClaudeBtn').onclick=applyClaude;document.getElementById('clearClaudeBtn').onclick=()=>document.getElementById('claudeResponse').value='';document.getElementById('newGameBtn').onclick=newGame;document.getElementById('exportSaveBtn').onclick=exportSave;document.getElementById('importSaveBtn').onclick=()=>document.getElementById('importSaveInput').click();document.getElementById('importSaveInput').onchange=e=>importSaveFile(e.target.files?.[0]);renderGame();}
document.addEventListener('DOMContentLoaded',init);
window.hogwartsGame={getState:()=>gameState,advanceTime,setLocation,setWeather,goNextDay,isHogsmeadeDate,isHogsmeadeOpen,getHolidayInfo,isHoliday,getHolidaySpecial,addScene,addEvent,addClue,adjustRelationship,adjustAcademics,adjustHouse,addInventory,removeInventory,parseClaudeResponse,generateClaudePrompt,startHolidayTravel,travelHolidayPlace,endHolidayTravel,startNightExploration,exploreNightSpot,endNightExploration,goToHogsmeade,returnFromHogsmeade,visitHogsmeadePlace};
