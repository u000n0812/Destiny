/* ============================================================
   interpret.js — 객관적 해석 초안 생성기

   같은 생년월일시면 언제나 같은 문장이 나온다. 대화 맥락이나 기분에
   맞춰 달라지지 않는다는 뜻이며, 이것이 이 파일의 존재 이유다.

   문장은 명식 구조에서 규칙으로 끌어내고, 각 문장에 근거를 붙인다.
   근거의 우선순위는 아래와 같다.

     1순위  올려 주신 자료 5종        → 표시 [자료1]~[자료5]
     2순위  추가로 찾은 참고자료      → 표시 [참고]
     3순위  AI 프롬프트로 얻은 해석   → 이 파일에서 만들지 않는다.
            프롬프트만 만들어 주고, 사람이 받아 온 답을 따로 붙인다.

   1·2순위로 말할 수 있는 것을 먼저 다 말하고, 그래도 남는 자리를
   3순위에 넘긴다. 순서를 뒤집지 않는다.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Interpret = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* ── 근거 표시 ───────────────────────────────────────────── */
var SRC = {
  S1: { tag:"자료1", name:"사주명리 기초 강의 노트", rank:1 },
  S2: { tag:"자료2", name:"음양오행·천간지지 노트", rank:1 },
  S3: { tag:"자료3", name:"사주팔자와 운 노트",     rank:1 },
  S4: { tag:"자료4", name:"풍수 인테리어 노트",     rank:1 },
  S5: { tag:"자료5", name:"관상 노트",              rank:1 },
  R1: { tag:"참고",  name:"십이운성 일반 해설",     rank:2 },
  R2: { tag:"참고",  name:"명리 일반 통설",         rank:2 }
};

/* ── 1순위 · 올려 주신 자료에서 옮긴 규칙 ────────────────── */

// 일간 열 가지 — [자료3]
var ILGAN = {
  "甲":{ img:"큰 나무", 강:"부러질지언정 굽히지 않고, 대담하며 이상이 큽니다. 활동적이고 건실하게 노력합니다.",
         약:"겉으로 쾌활해 보여도 자존심이 강하고 무뚝뚝한 편이라 속내를 늦게 꺼냅니다." },
  "乙":{ img:"풀과 꽃", 강:"변화에 예민하고 유연합니다. 바람이 불면 누웠다가 지나가면 다시 서는 끈기가 있습니다.",
         약:"꾸준한 대신 스트레스를 많이 받고, 결단이 늦으며 비교에서 오는 질투가 생기기 쉽습니다." },
  "丙":{ img:"한낮의 태양", 강:"통솔력과 지도력을 갖추고 재주가 많으며 임기응변에 능합니다.",
         약:"감정에 휘둘려 실수하고, 솔직하고 단순해 비밀을 오래 담아 두지 못합니다. 한번 싫어지면 되돌리기 어렵습니다." },
  "丁":{ img:"촛불", 강:"작은 불꽃이되 속이 깊고 예민하며, 서두르는 가운데서도 합리적입니다.",
         약:"감성적이고 의존심이 있어 걱정하다 기회를 놓치는 국면이 반복됩니다." },
  "戊":{ img:"넓은 벌판", 강:"신뢰와 신용을 중히 여기고 다른 기운을 품는 아량이 있습니다. 침착하고 꾸준합니다.",
         약:"고집이 세고 움직임이 늦어, 결정을 미루는 사이 기회가 지나갑니다." },
  "己":{ img:"텃밭", 강:"부지런하고 성실하며 사람을 잘 믿습니다. 이야기를 편하게 끌어냅니다.",
         약:"본심을 잘 드러내지 않고 다소 보수적이라 속내를 털어놓기까지 시간이 걸립니다." },
  "庚":{ img:"단단한 바위", 강:"선악 구별이 분명하고 의로우며 리더십이 있습니다. 약자를 돕고 강자에 맞섭니다.",
         약:"아첨할 줄 몰라 억울하게 구설에 오르고, 표정이 굳어 차갑게 비칩니다." },
  "辛":{ img:"보석", 강:"감성이 풍부하고 직감이 발달했으며 판단이 영리합니다.",
         약:"성깔이 있어 한번 받은 상처가 오래가고, 관계가 한번 틀어지면 회복이 어렵습니다." },
  "壬":{ img:"바다", 강:"지혜롭고 통찰이 있으며 변화를 즐깁니다. 여러 방면에 능한 팔방미인입니다.",
         약:"두뇌 회전이 빠른 만큼 속을 알기 어렵다는 말을 듣고, 한곳에 머무는 일을 답답해합니다." },
  "癸":{ img:"옹달샘", 강:"이치를 빨리 깨닫고 정확하게 처리합니다. 성격이 치밀하고 안정을 추구합니다.",
         약:"남의 부탁을 거절하지 못하고, 거절하고 나서도 속이 불편합니다." }
};

// 십성 열 가지 — [자료3] 주 · [자료1] 보완
var SIP = {
  "비견":{ key:"자존심 · 독립", 강:"스스로 판단하고 밀고 나갑니다. 대인관계를 주관합니다.",
           약:"지시받는 것을 싫어하고, 일이 안 풀리면 자존감이 급격히 떨어집니다.",
           조언:"장기적으로 독보적인 자리에 서는 일을 준비하는 편이 낫습니다." },
  "겁재":{ key:"경쟁 · 승부욕", 강:"지고 못 사는 기질에서 도전 의식이 나옵니다.",
           약:"고독하고 남의 시선에 좌절이 큽니다. 사업을 크게 벌이다 실패할 소지가 있습니다.",
           조언:"작은 성공을 여러 번 체험하고, 싸우지 않고 이기는 길도 있음을 익히십시오." },
  "식신":{ key:"연구 · 몰입", 강:"하나를 파고들면 끝을 봅니다. 원리 원칙을 지키고 조용히 자기 일을 합니다.",
           약:"변화를 좋아하지 않아 지나치면 행동이 멎고, 인간관계가 다소 부족할 수 있습니다.",
           조언:"의식주와 언어를 주관하니 말과 먹는 것으로 먹고사는 일이 어울립니다." },
  "상관":{ key:"표현 · 사교", 강:"감정과 의견을 잘 드러내고 사교적입니다.",
           약:"충동적이고 과시가 있으며 시원한 말이 남에게 상처가 됩니다. 직장의 경직된 구조를 답답해합니다.",
           조언:"큰 변화를 스스로 만들어 굴곡을 자초하지 않도록 말을 한 박자 늦추십시오." },
  "편재":{ key:"큰돈 · 활동", 강:"손재주가 있고 활동적이며 사업가적 감각이 있습니다. 미래지향적입니다.",
           약:"작은 돈에 관심이 없어 월급에 만족하기 어렵고, 낭비와 한 방을 노리는 마음이 있습니다.",
           조언:"비정기적인 큰돈을 다루는 자리이니 들어온 돈을 묶어 두는 장치를 먼저 만드십시오." },
  "정재":{ key:"꼼꼼함 · 안정", 강:"계산이 치밀하고 알뜰하며 안정감이 있습니다. 믿음을 주면 배신하지 않습니다.",
           약:"인색하고 집착이 있으며 감정이 예민해 상대를 답답하게 만들 수 있습니다.",
           조언:"고정수입을 지키는 힘이 강점이니 위험한 확장보다 축적으로 가십시오." },
  "편관":{ key:"명예 · 인내", 강:"봉사와 희생 정신이 있고 인내심이 좋으며 솔선수범합니다. 버티는 데 일가견이 있습니다.",
           약:"내면 스트레스가 크고 반항적이며 고집이 셉니다. 남을 세우느라 자기 기력이 쇠합니다.",
           조언:"한계를 넘는 목표를 이뤄야 만족하는 구조이니, 목표의 크기보다 회복의 주기를 관리하십시오." },
  "정관":{ key:"합리 · 명예욕", 강:"준법정신이 강하고 정직하며 대의명분을 지킵니다.",
           약:"우유부단하고 남의 눈을 의식해 체면치레로 실속을 놓칠 수 있습니다.",
           조언:"규칙이 분명한 조직에서 강점이 살아납니다." },
  "편인":{ key:"특수한 배움", 강:"남이 잘 가지 않는 분야의 전문성과 장인 기질이 있습니다.",
           약:"친절한 도움이라기보다 까칠한 도움이라 배움이 곧바로 성과로 이어지지 않습니다.",
           조언:"특수 자격이나 독자 영역으로 자리를 잡는 편이 유리합니다." },
  "정인":{ key:"보편적 도움", 강:"잘 알려진 공부와 자격, 문서의 도움을 받습니다. 여유와 너그러움이 있습니다.",
           약:"지나치면 게으름으로 바뀌어 배우기만 하고 실행이 늦어집니다.",
           조언:"배운 것을 밖으로 내보내는 통로를 함께 두십시오." }
};

// 오행 다섯 — [자료2] 주 · [자료1] 보완
var WX_TRAIT = [
  { 많:"수직으로 뻗는 기운이 강해 미래지향적이고 의욕이 큽니다. 고집도 함께 셉니다. 교육·제조·기획처럼 만들어 내는 일과 인연합니다.",
    없:"뻗어 나가는 힘과 시작하는 의욕이 약해, 판을 새로 짜는 일보다 있는 판을 다듬는 일이 편합니다." },
  { 많:"드러내고 펼치는 기운이 강합니다. 말을 잘하고 상상력이 풍부하나 성질이 급합니다.",
    없:"자기를 알리고 드러내는 데 서툴러 한 일에 비해 덜 알려지기 쉽고, 시작한 일의 마무리에 힘이 빠집니다." },
  { 많:"중간에서 조절하는 힘이 있어 남의 말을 잘 듣습니다. 다만 지나치면 판단이 둔해집니다.",
    없:"중심을 잡아 주는 기운이 얇아 결정이 흔들리고, 완충 없이 감정이 바로 부딪힙니다." },
  { 많:"냉정하고 실리를 따집니다. 내 것과 남의 것을 분명히 가르되 공적인 의리는 지킵니다.",
    없:"끊고 맺는 힘과 결단이 약해, 정리해야 할 관계와 일을 오래 끌고 갑니다." },
  { 많:"인내와 지구력이 있고 정신적인 세계에 관심이 많습니다. 지혜와 임기응변이 좋으며 과감합니다.",
    없:"쉬어 가는 자리와 유연함이 부족해 한번 달아오르면 식힐 곳이 없습니다." }
];

// 주(柱)별 자리 의미 — [자료2]
var PILLAR_MEAN = {
  nyeon:{ ko:"년주", 뜻:"조상·나라·명예이자 초년(0~15세)" },
  wol:  { ko:"월주", 뜻:"가정·부모·정신·문서이자 청년기(15~30세)" },
  il:   { ko:"일주", 뜻:"나 자신이자 배우자 자리, 장년기(30~45세)" },
  si:   { ko:"시주", 뜻:"자식·사회·미래·건강이자 말년(45~60세)" }
};

// 대운 오행운 — [자료2]
var DAEUN_WX = ["창조하고 만들어 내는 일", "알리고 드러내는 일", "중재하고 쌓아 두는 일",
                "내실을 다지는 일(전자·금융·법무·기계)", "보이지 않는 것을 좇는 일(연구·종교·철학)"];

/* ── 2순위 · 추가 참고자료 ───────────────────────────────── */
var UNSEONG_NOTE = {   // [참고] 십이운성 일반 해설
  "장생":"기운이 새로 돋는 자리", "목욕":"아직 다듬어지지 않은 자리", "관대":"틀을 갖추는 자리",
  "건록":"제 몫을 하는 자리",     "제왕":"기운이 절정인 자리",       "쇠":"한풀 꺾이는 자리",
  "병":"힘이 무른 자리",         "사":"움직임이 멎는 자리",         "묘":"갈무리하는 자리",
  "절":"끊어졌다 다시 시작하는 자리","태":"싹이 맺히는 자리",        "양":"길러지는 자리"
};
var ORGAN = ["간·담과 근골", "심장과 순환기", "비위와 소화기", "폐와 호흡기·대장", "신장과 방광"];

/* ── 도우미 ──────────────────────────────────────────────── */
// 한글 받침에 따라 조사를 고른다 (금이 / 화가)
function jong(ko){
  var c = ko.charCodeAt(ko.length - 1) - 0xAC00;
  return (c >= 0 && c <= 11171) && (c % 28) !== 0;
}
function J(ko, withJong, without){ return jong(ko) ? withJong : without; }

function cite(){
  var t = [];
  for (var i = 0; i < arguments.length; i++){
    var s = SRC[arguments[i]];
    if (s && t.indexOf(s.tag) < 0) t.push(s.tag);
  }
  return " [" + t.join("·") + "]";
}
function countSip(sipseong){
  var c = {};
  ["si","il","wol","nyeon"].forEach(function(p){
    [sipseong.gan[p], sipseong.ji[p]].forEach(function(s){
      if (s && s !== "日元") c[s] = (c[s] || 0) + 1;
    });
  });
  return c;
}
// 지면에 맞춰 뒤 문장부터 덜어 낸다. 앞쪽일수록 구조적으로 중요한 문장이다.
function fit(parts, max){
  var out = parts.slice();
  while (out.length > 2 && out.join(" ").length > max) out.pop();
  return out.join(" ");
}
function topSip(counts){
  var best = null, n = 0;
  Object.keys(counts).sort().forEach(function(k){ if (counts[k] > n){ n = counts[k]; best = k; } });
  return best ? { name:best, n:n } : null;
}

/* ── 생성기 ──────────────────────────────────────────────── */
function generate(a, S){
  var p = a.pillars, W = S.WX_HANJA, WK = S.WX_KO;
  var ilgan = p.il.gan, IG = ILGAN[ilgan];
  var st = a.strength, ys = a.yongsin, sc = a.profile.scores, cnt = a.profile.counts;
  var sipCount = countSip(a.sipseong), top = topSip(sipCount);
  var used = {};
  function u(){ for (var i = 0; i < arguments.length; i++) used[arguments[i]] = 1; return cite.apply(null, arguments); }
  function wx(i){ return W[i] + "(" + WK[i] + ")"; }

  var many = [], none = [], i;
  for (i = 0; i < 5; i++){
    if (sc[i] >= 40) many.push(i);
    if (cnt[i] === 0) none.push(i);
  }
  var bg   = (sipCount["비견"]||0) + (sipCount["겁재"]||0);
  var gwan = (sipCount["정관"]||0) + (sipCount["편관"]||0);
  var jj   = sipCount["정재"]||0, pj = sipCount["편재"]||0, jae = jj + pj;
  var sik  = (sipCount["식신"]||0) + (sipCount["상관"]||0);

  /* 총평 */
  var 총평 = [];
  총평.push("일간이 " + ilgan + WK[S.GAN_WX[S.GAN.indexOf(ilgan)]] + ", 곧 " + IG.img +
    "에 해당합니다. " + IG.강 + u("S3"));
  총평.push("여덟 자를 자리별 무게로 견주면 나를 돕는 기운이 " + st.pct + "퍼센트로 " + st.label +
    "에 해당하고, 월지 " + p.wol.ji + "에서 계절의 도움을 " +
    (st.deukRyeong ? "받습니다" : "받지 못합니다") +
    ". 월지가 무엇을 차지하느냐에 따라 사주의 판도가 갈립니다." + u("S2","S1"));
  if (many.length)
    총평.push("오행으로는 " + many.map(wx).join("·") + J(WK[many[many.length-1]], "이", "가") +
      " 두드러집니다. " + WX_TRAIT[many[0]].많 + u("S2"));
  if (none.length)
    총평.push("반대로 " + none.map(wx).join("·") + J(WK[none[none.length-1]], "이", "가") +
      " 원국에 없습니다. " + WX_TRAIT[none[0]].없 + u("S2"));
  총평.push("치우친 기운은 중화되는 시기를 기다리는 것이 곧 운입니다. 이 명식에서는 " +
    wx(ys.yong) + J(WK[ys.yong], "이", "가") + " 그 자리를 맡습니다." + u("S3","S1"));

  /* 기질 키워드 */
  var kw = [];
  if (top) kw.push(SIP[top.name].key);
  kw.push(IG.img);
  if (many.length) kw.push(WK[many[0]] + " 기운");
  kw.push(st.strong ? "밀고 나가는 힘" : st.weak ? "기대고 조율하는 힘" : "균형");
  ["역마","도화","화개"].forEach(function(s){
    if (a.sinsal.indexOf(s) >= 0)
      kw.push(s === "역마" ? "이동" : s === "도화" ? "사람을 끄는 기운" : "혼자 파고듦");
  });

  /* 기질 */
  var 기질 = [];
  기질.push(IG.강 + " 다만 " + IG.약 + u("S3"));
  if (top)
    기질.push("십성으로는 " + top.name + "이 " + top.n + "자로 가장 두텁습니다. " +
      SIP[top.name].강 + " 반대로 " + SIP[top.name].약 + u("S3"));
  if (bg >= 3)
    기질.push("비견과 겁재를 합쳐 " + bg + "자로, 보통 서넛을 넘으면 많다고 봅니다. " +
      "내 것을 나누려는 사람이 주변에 많다는 뜻이어서 의심과 강박이 함께 붙습니다." + u("S1"));
  기질.push("천간은 하고 싶은 마음이고 지지는 실제로 벌어지는 일입니다. 천간 " +
    [p.nyeon.gan, p.wol.gan, p.si.gan].join("·") + "이 바라는 바라면, 지지 " +
    [p.nyeon.ji, p.wol.ji, p.il.ji, p.si.ji].join("·") + "이 그것이 실제로 일어나는 자리입니다." + u("S2"));

  /* 성격과 내면 */
  var 성격 = [];
  성격.push("일간 " + ilgan + "은 " + IG.img + "입니다. " + IG.강 + u("S3"));
  성격.push("그늘 쪽을 보면, " + IG.약 + u("S3"));
  성격.push("일지 " + p.il.ji + "은 십이운성으로 " + a.unseong.il + ", " +
    (UNSEONG_NOTE[a.unseong.il] || "") + "입니다. 스스로를 어떤 상태에 두고 사는지를 보여 주는 자리입니다." +
    u("R1","S1"));

  /* 대인관계 */
  var 관계 = [];
  관계.push("일주는 나 자신이면서 배우자 자리입니다. 이 명식의 일지는 " + p.il.ji +
    "이고 십성으로 " + a.sipseong.ji.il + "에 해당합니다." + u("S2"));
  var ilHit = a.relations.filter(function(r){ return r.indexOf(p.il.ji) >= 0 && /충|형|파|해/.test(r); });
  관계.push(ilHit.length
    ? "일지에 " + ilHit.join(", ") + "이 걸립니다. 일주가 형·충·파·극을 받으면 부부 사이에 충돌이 있거나 배우자의 건강이 약해질 수 있다고 봅니다." + u("S2")
    : "일지를 직접 치는 형·충·파·해가 없어 배우자 자리 자체는 비교적 안정된 편입니다." + u("S2"));
  if (gwan === 0 && jae === 0)
    관계.push("관성과 재성이 모두 없습니다. 배우자에 해당하는 십성이 원국에 없으면 대운과 세운에서 그 기운이 들어오는 때를 기다리게 됩니다." + u("S1"));
  if (a.sinsal.indexOf("도화") >= 0)
    관계.push("도화가 있어 사람을 끄는 기운이 있습니다. 관계가 쉽게 열리는 만큼 정리도 분명해야 합니다." + u("R2"));

  /* 직업 */
  var 직업 = [];
  직업.push("격국은 " + a.gyeokguk.name + "입니다. " + a.gyeokguk.basis +
    ". 월지 지장간 가운데 천간에 드러난 글자로 격을 잡습니다." + u("S1"));
  직업.push("직장운은 관성으로 봅니다. 이 명식의 관성은 " + gwan + "자" +
    (gwan >= 2 ? "로 뚜렷해, 조직의 규칙과 평가 안에서 자리를 잡는 구조입니다."
     : gwan === 1 ? "로 있기는 하되 두텁지 않아, 조직의 위계보다 실무로 인정받는 편이 낫습니다."
     : "로 없습니다. 조직의 위계보다 자기 이름으로 성과가 남는 구조가 맞습니다.") + u("S1"));
  직업.push("사업은 재성으로 봅니다. 재성 " + jae + "자, 식상 " + sik + "자입니다. " +
    (jae >= 2 && st.strong ? "신강하면서 재성이 두터우니 그 재물을 감당할 힘이 있습니다."
     : jae >= 2 && st.weak ? "재성은 두터운데 일간이 약합니다. 기회에 비해 실제로 벌지 못하거나 분쟁에 휘말릴 수 있어, 힘을 먼저 채워야 합니다."
     : sik >= 2 ? "재성이 두텁지 않아도 식상이 유리하게 서 있으니, 성실하게 쌓아 올리는 방식이면 사업도 가능합니다."
     : "재성과 식상이 모두 얇아, 큰 판을 벌이기보다 안정된 수입 구조가 맞습니다.") + u("S1"));
  직업.push("용신 " + wx(ys.yong) + " 쪽으로는 " + DAEUN_WX[ys.yong] + "이 어울립니다." + u("S2"));
  var hyeong = a.relations.filter(function(r){ return /형/.test(r); });
  if (hyeong.length)
    직업.push("형(" + hyeong.join(", ") + ")이 있습니다. 형이 있는 명식은 법무·건설·사법·의료·세무처럼 규율이 센 환경에서 오히려 제 몫을 하는 경우가 많습니다." + u("S2"));

  /* 재물 */
  var 재물 = [];
  재물.push("재성은 정재 " + jj + "자, 편재 " + pj + "자입니다. " +
    (pj > jj ? "편재가 앞서니 비정기적인 큰돈에 감각이 있습니다. " + SIP["편재"].약
     : jj > pj ? "정재가 앞서니 고정수입을 지키고 쌓는 힘이 있습니다. " + SIP["정재"].약
     : jae === 0 ? "재성이 원국에 없어, 돈이 붙는 자리보다 만들어 내는 자리를 먼저 봐야 합니다."
     : "정재와 편재가 나란해 안정된 수입과 기회성 수입을 함께 다루게 됩니다.") + u("S3"));
  if (bg >= 3)
    재물.push("비겁이 " + bg + "자로 두터워 재물을 두고 주변과 나누게 되는 구조입니다. 동업과 금전 대여에서 새는 곳이 생기기 쉽습니다." + u("S3","S1"));
  재물.push("일간을 돕는 힘이 약하면 벌어도 지키기 어렵다고 봅니다. 이 명식은 " + st.label + "이므로 " +
    (st.weak ? "버는 힘보다 지키는 힘을 먼저 세우는 편이 낫습니다."
             : "벌어들인 것을 흘려보내지 않고 묶어 두는 장치가 관건입니다.") + u("S2","S1"));

  /* 건강 */
  var 건강 = [];
  if (many.length)
    건강.push(wx(many[0]) + J(WK[many[0]], "이", "가") + " 치우쳐 " + ORGAN[many[0]] + "에 부담이 갑니다." + u("R2"));
  if (none.length)
    건강.push(wx(none[0]) + J(WK[none[0]], "이", "가") + " 없어 " + ORGAN[none[0]] + " 쪽이 무릅니다." + u("R2"));
  건강.push("한난조습으로는 " + a.johu.text + "에 해당합니다. 너무 덥거나 추운 원국은 온도를 맞추는 일이 먼저입니다." + u("S1"));
  건강.push("의학적 진단이 아니라 오행의 치우침에서 읽는 경향입니다.");

  /* 제언 */
  var 제언 = [];
  제언.push("이 명식이 기다리는 기운은 " + wx(ys.yong) + J(WK[ys.yong], "이", "") + "고, " +
    wx(ys.hui) + J(WK[ys.hui], "이", "가") + " 이를 돕습니다. 반대로 " +
    wx(ys.gi) + J(WK[ys.gi], "은", "는") + " 이를 칩니다. 판단 근거는 " + ys.reason + "입니다." + u("S1"));
  var good = a.daeun.list.filter(function(r){ return r.luck === "대길" || r.luck === "길"; });
  var bad  = a.daeun.list.filter(function(r){ return r.luck === "흉" || r.luck === "대흉"; });
  if (good.length)
    제언.push("대운으로는 " + good.map(function(r){ return r.from + "~" + r.to + "세 " + r.gan + r.ji; }).join(", ") +
      " 구간이 용신 쪽으로 흐릅니다." + u("S1"));
  if (bad.length)
    제언.push("반대로 " + bad.map(function(r){ return r.from + "~" + r.to + "세"; }).join(", ") +
      " 구간은 기신 쪽입니다. 운과 운 사이 간절기에는 충돌과 변동이 몰리니 대운이 바뀌는 앞뒤 두어 해를 특히 조심하십시오." + u("S3"));
  if (top) 제언.push(SIP[top.name].조언 + u("S3"));
  제언.push("타고난 것은 기질이고, 그 기질이 어떤 환경을 만나느냐에 따라 발현이 달라집니다. 한 분야에서 너무 어려운 상황만 없으면 좋은 사주라고 봅니다." + u("S1"));
  제언.push("개운으로는 " + a.remedy.color + " 계열, " + a.remedy.dir + "쪽 방위, " + a.remedy.time +
    "의 리듬이 용신을 북돋습니다. 사는 자리를 이 방향으로 조금씩 바꾸는 것이 가장 손쉬운 실천입니다." + u("S2","S4"));

  var sources = Object.keys(used).map(function(k){
    return { tag:SRC[k].tag, name:SRC[k].name, rank:SRC[k].rank };
  }).sort(function(x, y){ return x.rank - y.rank || x.name.localeCompare(y.name); });

  // A4 3매에 들어가도록 항목별 분량을 제한한다
  return {
    summary: fit(총평, 370),
    keywords: kw.slice(0, 6).join(", "),
    temperament: fit(기질, 250),
    personality: fit(성격, 175),
    relation: fit(관계, 170),
    career: fit(직업, 245),
    wealth: fit(재물, 180),
    health: fit(건강, 145),
    advice: fit(제언, 470),
    tags: {
      personality: (top ? top.name + " 중심 · " : "") + IG.img,
      relation: "일지 " + p.il.ji + " " + a.sipseong.ji.il,
      career: a.gyeokguk.name + " · 관성 " + gwan + "자",
      wealth: pj > jj ? "편재형" : jj > pj ? "정재형" : "재성 " + jae + "자",
      health: (many.length ? WK[many[0]] + " 과다" : "") +
              (none.length ? (many.length ? " · " : "") + WK[none[0]] + " 없음" : "")
    },
    sources: sources
  };
}

/* ── 3순위 · AI 프롬프트 만들기 ──────────────────────────────
   여기서 AI를 부르지 않는다. 계산된 명식과 1·2순위로 이미 정리된 내용을
   담은 프롬프트를 만들어 줄 뿐이고, 사람이 그것을 챗지피티 등에 넣어
   받아 온 답을 세 번째 자리에 붙인다. */
function buildPrompt(a, S, draft){
  var p = a.pillars, W = S.WX_HANJA, L = [];
  var pos = ["nyeon","wol","il","si"];
  L.push("아래는 만세력으로 계산한 사주 명식입니다. 명리학의 통설에 근거해 객관적으로만 해석해 주십시오.");
  L.push("");
  L.push("[지켜야 할 것]");
  L.push("- 위로하거나 듣기 좋게 꾸미지 마십시오. 좋은 말과 나쁜 말을 같은 무게로 쓰십시오.");
  L.push("- 저에 대해 이전에 알던 정보나 지금까지의 대화 맥락을 쓰지 마십시오. 오직 아래 명식만 근거로 삼으십시오.");
  L.push("- 각 문장이 명식의 어느 글자, 어느 관계에서 나왔는지 밝히십시오. 근거를 댈 수 없으면 쓰지 마십시오.");
  L.push("- 단정하지 말고 '이런 구조다', '이렇게 쓰면 강점이고 저렇게 쓰면 약점이다' 형태로 쓰십시오.");
  L.push("- 아래 '이미 정리된 내용'과 겹치는 말은 빼고, 거기서 다루지 않은 것만 보태십시오.");
  L.push("");
  L.push("[명식]");
  L.push("  년주 " + p.nyeon.gan + p.nyeon.ji + " · 월주 " + p.wol.gan + p.wol.ji +
         " · 일주 " + p.il.gan + p.il.ji + " · 시주 " + p.si.gan + p.si.ji);
  L.push("  천간 십성  " + ["nyeon","wol","si"].map(function(k){ return PILLAR_MEAN[k].ko + " " + a.sipseong.gan[k]; }).join(" · "));
  L.push("  지지 십성  " + pos.map(function(k){ return PILLAR_MEAN[k].ko + " " + a.sipseong.ji[k]; }).join(" · "));
  L.push("  지장간     " + pos.map(function(k){ return PILLAR_MEAN[k].ko + " " + a.jijang[k]; }).join(" · "));
  L.push("  십이운성   " + pos.map(function(k){ return PILLAR_MEAN[k].ko + " " + a.unseong[k]; }).join(" · "));
  L.push("  오행 개수  " + S.WX_KO.map(function(k, i){ return k + a.profile.counts[i]; }).join(" "));
  L.push("  오행 점수  " + S.WX_KO.map(function(k, i){ return k + a.profile.scores[i]; }).join(" ") +
         "  (천간 각 10, 지지 시15·일15·월30·년10, 합 110)");
  L.push("  강약       " + a.strength.label + " " + a.strength.pct + "%  득령 " +
         (a.strength.deukRyeong ? "O" : "X") + " 득지 " + (a.strength.deukJi ? "O" : "X") +
         " 득세 " + (a.strength.deukSe ? "O" : "X"));
  L.push("  한난조습   " + a.johu.text);
  L.push("  격국       " + a.gyeokguk.name + " (" + a.gyeokguk.basis + ")");
  L.push("  용신·희신  " + W[a.yongsin.yong] + "·" + W[a.yongsin.hui] +
         "  기신·구신 " + W[a.yongsin.gi] + "·" + W[a.yongsin.gu]);
  L.push("  형충회합   " + (a.relations.join(", ") || "없음"));
  L.push("  신살       " + (a.sinsal.join(", ") || "없음") + "  공망 " + a.gongmang.join(""));
  L.push("  대운       " + (a.daeun.forward ? "순행" : "역행") + " " + a.daeun.startAge + "세부터 — " +
         a.daeun.list.map(function(r){ return r.from + "세 " + r.gan + r.ji + "(" + r.luck + ")"; }).join(", "));
  L.push("");
  if (draft){
    L.push("[이미 정리된 내용 — 되풀이하지 마십시오]");
    ["summary","personality","relation","career","wealth","health","advice"].forEach(function(k){
      if (draft[k]) L.push("- " + draft[k].replace(/\s*\[[^\]]*\]/g, "").slice(0, 300));
    });
    L.push("");
  }
  L.push("[받고 싶은 것]");
  L.push("1. 위에서 다루지 않은 구조적 특징 세 가지. 각각 어느 글자에서 나왔는지 밝힐 것.");
  L.push("2. 이 명식이 가장 자주 겪을 반복 패턴 한 가지와 그것이 생기는 구조적 이유.");
  L.push("3. 위 해석과 어긋나는 대목이 있다면 무엇이고 왜 그렇게 보는지.");
  return L.join("\n");
}

return { generate:generate, buildPrompt:buildPrompt, SRC:SRC, ILGAN:ILGAN, SIP:SIP };
});
