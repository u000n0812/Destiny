/* ============================================================
   interpret.js — 객관적 해석 초안 생성기

   같은 생년월일시면 언제나 같은 문장이 나온다. 규칙의 뼈대는
   '혼자 시작하는 사주명리 공부'의 감명 순서(일간 → 온도 → 신강약
   → 용신 후보와 소재 → 합충 확인)를 따르고, 병존·합화·신살 풀이는
   대화로 알려 주신 정리와 명리 통설로 보완했다.

   서술 원칙:
   - 현상을 먼저 말하고 근거를 뒤에 댄다.
     "주인공은 ~한 성향이 있습니다. 사주에 ~가 있기 때문입니다."
   - 모든 해석은 일간 중심이다. 합화로 강해진 오행도 일간에게
     무슨 십성인지로 풀어 영향을 말한다.
   - 1면에 표시된 형충회합·신살은 하나도 빠짐없이 아래 어딘가에서
     설명한다. 본문에서 다루지 못한 것은 제언 끝에 짧게라도 단다.
   - 출처는 문장에 표시하지 않는다.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Interpret = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* ── 오행 생극 (목화토금수 = 0~4) ────────────────────────── */
var SAENG = [1, 2, 3, 4, 0];
var GEUK  = [2, 3, 4, 0, 1];
var WX_SEASON = ["봄", "여름", "사계(환절기)", "가을", "겨울"];

/* ── 일간 열 가지 ────────────────────────────────────────── */
var ILGAN = {
  "甲":{ img:"큰 나무", 강:"굽히지 않고 밀고 나가며 이상이 큽니다",
         약:"자존심이 강하고 무뚝뚝해 속내를 늦게 꺼냅니다" },
  "乙":{ img:"풀과 꽃", 강:"유연하고, 눕었다 다시 서는 끈기가 있습니다",
         약:"스트레스를 많이 받고 결단이 늦습니다" },
  "丙":{ img:"한낮의 태양", 강:"통솔력이 있고 재주가 많으며 사람들과 잘 섞입니다",
         약:"감정에 휘둘리기 쉽고, 한번 싫어지면 되돌리기 어렵습니다" },
  "丁":{ img:"촛불", 강:"속이 깊고 예민하며 합리적입니다",
         약:"걱정하다 기회를 놓치는 국면이 반복됩니다" },
  "戊":{ img:"넓은 벌판", 강:"신용을 중히 여기고 품이 넓으며 꾸준합니다",
         약:"고집이 세고 움직임이 늦습니다" },
  "己":{ img:"텃밭", 강:"부지런하고 성실하며 사람을 잘 믿습니다",
         약:"본심을 잘 드러내지 않아 속을 여는 데 시간이 걸립니다" },
  "庚":{ img:"단단한 바위", 강:"선악 구별이 분명하고 의로우며 리더십이 있습니다",
         약:"아첨할 줄 몰라 구설에 오르고 차갑게 비칩니다" },
  "辛":{ img:"보석", 강:"감성이 풍부하고 직감이 발달했으며 판단이 영리합니다",
         약:"한번 받은 상처가 오래가고, 틀어진 관계는 회복이 어렵습니다" },
  "壬":{ img:"바다", 강:"지혜롭고 통찰이 있으며 여러 방면에 능합니다",
         약:"속을 알기 어렵다는 말을 듣고, 머무는 일을 답답해합니다" },
  "癸":{ img:"옹달샘", 강:"이치를 빨리 깨닫고 치밀하며 안정을 추구합니다",
         약:"부탁을 거절하지 못하고 속으로 불편해합니다" }
};
var ILJI_ADD = {
  "申":"완벽주의에 모방과 잡기가 능해 잘하는 것을 하나로 잇는 일이 중요하고, 논리와 데이터에 강해 학문보다 기술·재능으로 서는 경우가 많습니다."
};

/* ── 십성 ────────────────────────────────────────────────── */
var SIP = {
  "비견":{ key:"자존심 · 독립", 강:"스스로 판단하고 밀고 나가는", 약:"지시받기를 싫어하고 일이 막히면 자존감이 급락하는" },
  "겁재":{ key:"경쟁 · 승부욕", 강:"지고 못 사는 승부 기질의", 약:"크게 벌이다 잃기 쉬워 작은 성공을 쌓아야 하는" },
  "식신":{ key:"연구 · 몰입", 강:"하나를 파고들면 끝을 보는", 약:"변화를 꺼려 지나치면 멎어 버리는" },
  "상관":{ key:"표현 · 사교", 강:"감정과 의견을 시원하게 드러내는", 약:"그 말이 남에게 상처가 되고 경직된 조직을 답답해하는" },
  "편재":{ key:"큰돈 · 활동", 강:"활동적이고 사업 감각이 있는", 약:"작은 돈에 관심이 없어 월급에 만족하기 어려운" },
  "정재":{ key:"꼼꼼함 · 안정", 강:"치밀하고 알뜰한", 약:"집착이 생기면 상대를 답답하게 만드는" },
  "편관":{ key:"명예 · 인내", 강:"버티는 데 일가견이 있는", 약:"속으로 스트레스가 크고 기력을 소모하는" },
  "정관":{ key:"합리 · 명예욕", 강:"바르고 원칙을 지키는", 약:"남의 눈을 의식해 실속을 놓치는" },
  "편인":{ key:"특수한 배움", 강:"남이 안 가는 분야를 파는", 약:"배움이 곧바로 성과로 이어지지 않는" },
  "정인":{ key:"보편적 배움", 강:"공부·문서의 도움을 받는", 약:"배우기만 하고 실행이 늦어지는" }
};
var SIP_GROUP = { "비견":"비겁","겁재":"비겁","식신":"식상","상관":"식상",
                  "편재":"재성","정재":"재성","편관":"관성","정관":"관성",
                  "편인":"인성","정인":"인성" };
var MISS_MEAN = { "비겁":"홀로 버티는 힘", "식상":"표현하고 만들어 내는 힘",
                  "재성":"돈을 붙드는 힘", "관성":"조직과 규율을 견디는 힘",
                  "인성":"뒤를 받쳐 주는 힘" };
var GROUP_EFFECT = { "비겁":"주체성과 고집", "식상":"표현하고 벌이는 일",
                     "재성":"돈과 현실 감각", "관성":"책임과 조직의 요구",
                     "인성":"배움과 기댈 언덕" };
var SE_EVENT = { "비겁":"경쟁·동업·지출", "식상":"새로 벌이는 일과 표현(이직·창작, 건강 관리 포함)",
                 "재성":"돈과 이성, 실속", "관성":"직장·평가·직책(이동·승진·시험)",
                 "인성":"문서·계약·공부와 윗사람의 도움" };

/* ── 오행 점수 등급별 성정 ───────────────────────────────── */
var WX_HIGH = [
  { 강:"성장욕이 있고 진취적이며 망설임이 없습니다", 주의:"벌인 일의 수습과 현실 감각이 무뎌질 수 있습니다" },
  { 강:"정의감이 있고 시원시원해 자기 매력을 잘 드러냅니다", 주의:"감정선이 크게 흔들려 타협이 필요합니다" },
  { 강:"받아들이는 끈기가 있어 한번 시작하면 끝을 보고 나이 들며 빛을 봅니다", 주의:"자기 어필이 서툴러 일단 시작하는 것이 중요합니다" },
  { 강:"성격이 칼 같고 분명해 법·의료·경찰처럼 확실한 일이 어울립니다", 주의:"말이 남을 다치게 할 수 있어 화를 다스려야 합니다" },
  { 강:"생각이 깊고 예술가적 기질이 있습니다", 주의:"고민과 우울감이 잦아 현실성을 따로 챙겨야 합니다" }
];
var WX_LOW = [
  "시작하고 뻗는 힘이 약해 판을 새로 짜기보다 다듬는 일이 편합니다",
  "자기를 드러내는 데 서툴러 한 일에 비해 덜 알려지기 쉽습니다",
  "중심을 잡는 완충이 얇아 감정이 바로 부딪히기 쉽습니다",
  "끊고 맺는 결단이 약해 정리할 일을 오래 끌고 갑니다",
  "식히고 쉬는 유연함이 부족해 달아오르면 식힐 곳이 없습니다"
];
var ORGAN = ["간·담과 근골", "심장과 순환기", "비위와 소화기", "폐·호흡기와 대장", "신장과 방광"];

/* ── 합충 풀이 ───────────────────────────────────────────── */
// 천간합 — 합화 오행과 전통 명칭, 그 성향 (명리 통설)
var GANHAP = {
  "甲己":{ wx:2, name:"중정지합", trait:"자리를 지키는 믿음직함과 중용" },
  "乙庚":{ wx:3, name:"인의지합", trait:"강직함과 의리" },
  "丙辛":{ wx:4, name:"위엄지합", trait:"겉은 위엄 있고 속은 차게 계산하는 기운" },
  "丁壬":{ wx:0, name:"인수지합", trait:"정이 많고 감성이 짙어지는 기운" },
  "戊癸":{ wx:1, name:"무정지합", trait:"화려하지만 정이 얕아지기 쉬운 기운" }
};
var GANCHUNG_MEAN = {
  "甲庚":"세운 계획이 결단에 부딪혀 뒤집히는",
  "乙辛":"부드러운 뜻이 날카로운 비판에 꺾이는",
  "丙壬":"드러내려는 마음과 눌러 담는 이성이 맞서는",
  "丁癸":"따뜻한 정과 차가운 현실 판단이 맞서는"
};
var JICHUNG_MEAN = {
  "子午":"감정이 급히 뒤집히는 왕지충", "丑未":"묵은 일과 문서가 불거지는 고지충",
  "寅申":"이동·교통·환경 변화가 잦은 생지충", "卯酉":"가까운 사람과 부딪히는 왕지충",
  "辰戌":"재물 창고가 열렸다 닫히는 고지충", "巳亥":"먼 곳과의 인연이 오가는 생지충"
};
var HAE_MEAN = "가까운 사이가 어긋나는 해(害)";
var PA_MEAN  = "오래된 관계에 금이 가는 파(破)";

// 병존 — 같은 글자가 나란할 때, 글자별로 강해지는 성향
var BYEONGJON_GAN = {
  "甲甲":"경쟁 속에서 크되 고독해지는", "乙乙":"밟혀도 다시 서는 생존력이 강해지는",
  "丙丙":"표현과 열정이 폭발적으로 커지는", "丁丁":"예민한 헌신이 깊어지는",
  "戊戊":"움직이지 않는 고집이 굳어지는", "己己":"신중함이 의심으로 짙어지는",
  "庚庚":"강 대 강으로 부딪히는", "辛辛":"예리함이 겹쳐 말이 칼이 되는",
  "壬壬":"큰물처럼 떠도는 기질이 커지는", "癸癸":"잔정이 많고 여려지는"
};
var BYEONGJON_JI = {
  "子子":"밤의 정서와 사람을 끄는 기운(도화)이 짙어지는", "丑丑":"쌓아 두고 견디는 고독이 깊어지는",
  "寅寅":"나서서 움직이는 역마가 겹치는", "卯卯":"손재주와 예민한 감각(도화)이 겹치는",
  "辰辰":"고집이 굳고 스스로와 다투는(자형)", "巳巳":"급하고 권력적인 기운이 겹치는(자형)",
  "午午":"열기가 겹쳐 조급해지는(자형)", "未未":"속으로 삭이는 고집이 굳는",
  "申申":"재주와 이동이 겹치되 스스로 볶는", "酉酉":"예리함이 겹쳐 상처를 주고받는(자형)",
  "戌戌":"외로운 의협심이 깊어지는", "亥亥":"생각이 많아 떠도는(자형)"
};

/* ── 신살 풀이 ───────────────────────────────────────────── */
var SINSAL_MEAN = {
  "도화":"사람을 끄는 매력", "홍염":"은근한 매력과 정",
  "역마":"움직여야 풀리는 기운", "화개":"홀로 파고드는 정신적 기운",
  "천을귀인":"어려울 때 돕는 사람이 나타나는 길신", "문창귀인":"글과 공부 머리",
  "양인":"칼 같은 추진력, 과하면 사고수", "괴강":"극단을 오가는 카리스마",
  "백호":"사고·수술을 조심하라는 살", "원진":"이유 없이 서로 미워지는 관계 기운",
  "귀문":"예민함과 신경성, 달리 보면 높은 직관", "공망":"그 자리 글자의 힘이 반감됨"
};

/* ── 십이운성 ────────────────────────────────────────────── */
var UNSEONG_NOTE = {
  "장생":"기운이 새로 돋는 자리", "목욕":"아직 다듬어지지 않은 자리", "관대":"틀을 갖추는 자리",
  "건록":"제 몫을 하는 자리",     "제왕":"기운이 절정인 자리",       "쇠":"한풀 꺾여 다지는 자리",
  "병":"힘이 무른 자리",         "사":"움직임이 멎는 자리",         "묘":"갈무리하는 자리",
  "절":"끊었다 다시 시작하는 자리","태":"싹이 맺히는 자리",          "양":"길러지는 자리"
};
var PILLAR_MEAN = { nyeon:{ ko:"년주" }, wol:{ ko:"월주" }, il:{ ko:"일주" }, si:{ ko:"시주" } };
var PILLAR_HIT  = { nyeon:"집안·바깥 어른", wol:"직장·부모", il:"배우자와 내 몸", si:"자녀·아랫사람" };

/* ── 도우미 ──────────────────────────────────────────────── */
function jong(ko){
  var c = ko.charCodeAt(ko.length - 1) - 0xAC00;
  return (c >= 0 && c <= 11171) && (c % 28) !== 0;
}
function J(ko, withJong, without){ return jong(ko) ? withJong : without; }
function countSip(sipseong){
  var c = {};
  ["si","il","wol","nyeon"].forEach(function(p){
    [sipseong.gan[p], sipseong.ji[p]].forEach(function(s){
      if (s && s !== "日元") c[s] = (c[s] || 0) + 1;
    });
  });
  return c;
}
function topSip(counts){
  var best = null, n = 0;
  Object.keys(counts).sort().forEach(function(k){ if (counts[k] > n){ n = counts[k]; best = k; } });
  return best ? { name:best, n:n } : null;
}
function fit(parts, max){
  var out = parts.filter(Boolean);
  while (out.length > 2 && out.join(" ").length > max) out.pop();
  return out.join(" ");
}
function ranges(list){
  return list.map(function(r){ return r.from + "~" + r.to + "세"; }).join(", ");
}

/* ── 생성기 ──────────────────────────────────────────────── */
function generate(a, S){
  var p = a.pillars, W = S.WX_HANJA, WK = S.WX_KO, GAN = S.GAN, JI = S.JI;
  var ilgan = p.il.gan, IG = ILGAN[ilgan];
  var dw = S.GAN_WX[GAN.indexOf(ilgan)];
  var st = a.strength, ys = a.yongsin, sc = a.profile.scores, cnt = a.profile.counts;
  var sipCount = countSip(a.sipseong), top = topSip(sipCount);
  var sp = a.special || {}, gr = sp.grades || [];
  var rels = a.relations || [];
  var pos = ["nyeon","wol","il","si"], posKo = { nyeon:"년", wol:"월", il:"일", si:"시" };
  var i;
  function wx(n){ return W[n] + "(" + WK[n] + ")"; }
  function wxOf(ch){
    var g = GAN.indexOf(ch); if (g >= 0) return S.GAN_WX[g];
    var j = JI.indexOf(ch); return j >= 0 ? S.JI_WX[j] : -1;
  }
  function koOf(ch){
    var g = GAN.indexOf(ch); if (g >= 0) return S.GAN_KO[g];
    var j = JI.indexOf(ch); return j >= 0 ? S.JI_KO[j] : ch;
  }
  function groupOfWx(w){
    if (w === dw) return "비겁";
    if (SAENG[dw] === w) return "식상";
    if (GEUK[dw] === w) return "재성";
    if (GEUK[w] === dw) return "관성";
    return "인성";
  }
  var bg   = (sipCount["비견"]||0) + (sipCount["겁재"]||0);
  var gwan = (sipCount["정관"]||0) + (sipCount["편관"]||0);
  var jj   = sipCount["정재"]||0, pj = sipCount["편재"]||0, jae = jj + pj;
  var sik  = (sipCount["식신"]||0) + (sipCount["상관"]||0);
  var inS  = (sipCount["정인"]||0) + (sipCount["편인"]||0);
  var gwanWx = -1;
  for (i = 0; i < 5; i++) if (GEUK[i] === dw) gwanWx = i;
  var thisYear = new Date().getFullYear();
  var birthYear = a.chart.tst.y;
  var yinYang = GAN.indexOf(ilgan) % 2 === 0 ? "양(陽)" : "음(陰)";

  // 형충회합을 갈래별로 나눈다
  var ganHapRels = [], ganChungRels = [], hoegukRels = [];
  rels.forEach(function(r){
    var isGanPair = GAN.indexOf(r[0]) >= 0 && GAN.indexOf(r[1]) >= 0;
    if (/삼합|반합|방합/.test(r)) hoegukRels.push(r);
    else if (isGanPair && / 합/.test(r)) ganHapRels.push(r);
    else if (isGanPair && /충/.test(r)) ganChungRels.push(r);
  });
  function ganHapInfo(r){
    var k1 = r[0] + r[1], k2 = r[1] + r[0];
    return GANHAP[k1] || GANHAP[k2] || null;
  }

  /* ═ 총평 ═ */
  var 총평 = [];
  총평.push("사주의 주인공은 " + IG.강 + ". 일간이 " + ilgan + WK[dw] + " — " +
    yinYang + "의 " + WK[dw] + ", " + WX_SEASON[dw] + "의 기운인 " + IG.img + "이기 때문입니다.");

  var wj = p.wol.ji;
  var winter = "亥子丑".indexOf(wj) >= 0, summer = "巳午未".indexOf(wj) >= 0;
  if (a.johu.need != null){
    총평.push("무엇보다 몸과 운의 온도부터 챙겨야 합니다. " + (winter ? "한겨울" : "한여름") +
      "(" + wj + "월)에 태어났는데 팔자에 " + wx(a.johu.need) + J(WK[a.johu.need], "이", "가") +
      " 모자라 " + (winter ? "차갑게" : "뜨겁게") + " 기울었기 때문입니다. 그래서 " +
      W[a.johu.need] + J(WK[a.johu.need], "이", "가") + " 첫 용신 후보가 되고, " +
      (cnt[a.johu.need] === 0 ? "그 글자가 원국에 하나도 없어 건강과 기력이 먼저 위협받는 구조입니다."
                              : "그 글자가 원국에 있어 숨통은 트여 있습니다."));
  } else if (winter || summer){
    총평.push("계절 치우침은 걱정할 정도가 아닙니다. " + (winter ? "겨울" : "여름") +
      "생이지만 " + (winter ? "불" : "물") + " 기운이 원국에서 받쳐 주기 때문입니다.");
  }

  if (ys.jong){
    총평.push("주인공은 홀로 버티기보다 대세를 타야 풀리는 명입니다. 일간을 돕는 비겁·인성이 원국에 없는 종격이기 때문입니다. " +
      "가장 강한 " + wx(ys.yong) + J(WK[ys.yong], "을", "를") + " 거스르지 않고 북돋우는 것이 용신이며, 비겁·인성 운이 오면 오히려 마음만 흔들립니다.");
  } else {
    총평.push("주인공은 " +
      (st.strong ? "스스로 밀고 나가는 힘이 넉넉한 명입니다" :
       st.weak ? "혼자 힘보다 기댈 곳과 채움이 필요한 명입니다" :
                 "어느 쪽으로도 크게 기울지 않은 명입니다") +
      ". 일간을 돕는 기운(비겁·인성)이 " + st.pct + "%로 " + st.label + "이기 때문입니다. 그래서 " +
      (st.strong ? "힘을 덜어 내는 관성·식상·재성" :
       st.weak ? "힘을 보태는 비견·겁재·정인·편인" : "모자란 쪽을 채우는 글자") +
      "가 용신 후보이고, 이 명식은 " + wx(ys.yong) + J(WK[ys.yong], "을", "를") + " 용신으로 잡습니다." +
      (bg >= 3 && !st.strong ? " 비겁이 이미 여럿이라 비겁은 후보에서 뒤로 미룹니다." : ""));
  }

  var yong = ys.yong, loc;
  if (cnt[yong] > 0){
    loc = "용신 " + W[yong] + J(WK[yong], "은", "는") + " 원국에 " + cnt[yong] + "자 있어 바로 쓸 수 있습니다.";
  } else {
    var hid = [];
    pos.forEach(function(k){
      (S.JIJANG[p[k].ji] || []).forEach(function(x){
        if (S.GAN_WX[GAN.indexOf(x[0])] === yong) hid.push(posKo[k] + "지 " + p[k].ji + " 속 " + x[0]);
      });
    });
    if (hid.length){
      loc = "용신 " + W[yong] + J(WK[yong], "은", "는") + " 겉글자에 없고 " + hid[0] +
        "에 숨어 있어, 그 기운을 깨우는 운이 와야 힘을 씁니다.";
    } else {
      var duY = null;
      for (i = 0; i < a.daeun.list.length; i++){
        var r0 = a.daeun.list[i];
        if (S.GAN_WX[GAN.indexOf(r0.gan)] === yong || S.JI_WX[JI.indexOf(r0.ji)] === yong){ duY = r0; break; }
      }
      if (duY){
        var inter = S.interactWith(duY.gan, duY.ji, p);
        loc = "용신 " + W[yong] + J(WK[yong], "은", "는") + " 원국에도 지장간에도 없어 운에서 와야 합니다. " +
          duY.from + "~" + duY.to + "세 " + duY.gan + duY.ji + " 대운에 들어오는데, " +
          (inter.length ? "이때 원국과 " + inter.slice(0,2).join("·") + " 관계가 걸려 온전히 쓰이는지 살펴야 합니다."
                        : "원국과 큰 합충 없이 들어와 그대로 쓸 수 있습니다.");
      } else {
        loc = "용신 " + W[yong] + J(WK[yong], "은", "는") + " 원국·지장간·대운 어디에도 뚜렷하지 않아 해마다 오는 세운에 기대야 합니다.";
      }
    }
  }
  총평.push(loc);

  /* ═ 기질 — 오행 등급 + 십성 분포 + 회국(삼합·반합·방합) + 병존 ═ */
  var 기질 = [];
  var over = -1, lows = [];
  for (i = 0; i < 5; i++){
    if ((gr[i] === "과다" || gr[i] === "발달~과다") && (over < 0 || sc[i] > sc[over])) over = i;
    if (gr[i] === "미약") lows.push(i);
  }
  if (over >= 0)
    기질.push("주인공은 " + WX_HIGH[over].강 + ". " + wx(over) + J(WK[over], "이", "가") +
      " " + sc[over] + "점으로 과다하기 때문입니다. 다만 " + WX_HIGH[over].주의 +
      ". 이 기운은 다듬으면 오히려 극장점이 됩니다.");
  if (lows.length)
    기질.push("반대로 " + WX_LOW[lows[0]] + ". " + lows.map(wx).join("·") +
      J(WK[lows[lows.length-1]], "이", "가") + " 20점 미만으로 미약하기 때문입니다.");
  // 회국 — 합화로 강해지는 오행을 일간 시점에서 푼다
  if (hoegukRels.length){
    var hr = hoegukRels[0];
    var hwx = WK.indexOf(hr.charAt(hr.length - 1));
    if (hwx >= 0){
      var hgroup = groupOfWx(hwx);
      기질.push("팔자에서 " + GROUP_EFFECT[hgroup] + " 쪽이 실제 글자 수보다 크게 작동합니다. 지지의 " +
        hr + J(hr.slice(-1), "이", "가") + " 합을 이뤄 " + wx(hwx) + " 세력을 만들고, 그 " +
        WK[hwx] + J(WK[hwx], "은", "는") + " 일간 " + ilgan + "에게 " + hgroup + "이기 때문입니다." +
        (hoegukRels.length > 1 ? " " + hoegukRels.slice(1).join(", ") + "도 같은 방식으로 읽습니다." : ""));
    }
  }
  if (top)
    기질.push("십성으로는 " + SIP[top.name].강 + " 기질이 몸에 배어 있습니다. " + top.name +
      J(top.name, "이", "가") + " " + top.n + "자로 가장 두텁기 때문입니다.");
  var missing = [];
  if (bg === 0) missing.push("비겁");
  if (sik === 0) missing.push("식상");
  if (jae === 0) missing.push("재성");
  if (gwan === 0) missing.push("관성");
  if (inS === 0) missing.push("인성");
  if (missing.length)
    기질.push(missing.map(function(m){ return MISS_MEAN[m]; }).join(", ") +
      J(MISS_MEAN[missing[missing.length-1]], "이", "가") + " 약합니다. " +
      missing.join("·") + J(missing[missing.length-1], "이", "가") + " 원국에 없기 때문입니다.");
  // 병존 — 글자별 구체 해석
  (sp.byeongjon || []).forEach(function(b){
    var pair = b.slice(0, 2);
    var mean = BYEONGJON_GAN[pair] || BYEONGJON_JI[pair];
    if (mean)
      기질.push("주인공은 " + mean + " 쪽으로 기울 수 있습니다. 같은 글자가 나란히 선 " +
        b + " 때문입니다.");
  });
  if (sp.yangEight) 기질.push("펼치는 힘은 크되 거두는 자리가 없습니다. 여덟 자가 모두 양인 양팔통이기 때문입니다.");
  if (sp.yinEight)  기질.push("거두는 힘은 크되 펼치는 자리가 없습니다. 여덟 자가 모두 음인 음팔통이기 때문입니다.");

  /* ═ 성격 — 일간 상세 + 일주 + 지장간 + 십이운성 + 천간합충 ═ */
  var 성격 = [];
  성격.push("주인공은 " + IG.강 + ". 반면 " + IG.약 + ". 모두 일간 " + ilgan +
    "(" + IG.img + ")에서 나오는 결입니다.");
  성격.push("바탕에는 " + SIP[a.sipseong.ji.il].key + " 성향이 놓여 있습니다. 나의 기본 자질을 뜻하는 일지에 " +
    a.sipseong.ji.il + J(a.sipseong.ji.il, "을", "를") + " 깔았기 때문입니다." +
    (ILJI_ADD[p.il.ji] ? " " + ILJI_ADD[p.il.ji] : ""));
  // 천간합 — 합화이론 (12)
  if (ganHapRels.length){
    var gh = ganHapRels[0], info = ganHapInfo(gh);
    if (info){
      var ghGroup = groupOfWx(info.wx);
      var mine = gh.indexOf(ilgan) >= 0;
      성격.push((mine
        ? "주인공은 " + info.trait + J(info.trait, "이", "가") + " 몸에 배고, 뜻이 사람이나 일에 잘 묶입니다. 일간 " +
          ilgan + J(koOf(ilgan), "이", "가") + " 직접 " + gh + "(" + info.name + ")" + "을 맺기 때문입니다."
        : "주인공에게는 " + info.trait + J(info.trait, "이", "가") + " 더해집니다. 천간에서 " + gh +
          "(" + info.name + ")" + "이 이뤄지기 때문입니다.") +
        " 합화한 " + wx(info.wx) + J(WK[info.wx], "은", "는") + " 일간에게 " + ghGroup + "이라 " +
        GROUP_EFFECT[ghGroup] + " 쪽 경험이 늘어납니다.");
    }
  }
  if (ganChungRels.length){
    var gc = ganChungRels[0];
    var gcKey = [gc[0], gc[1]].sort(function(x, y){ return GAN.indexOf(x) - GAN.indexOf(y); }).join("");
    성격.push("마음속에서 " + (GANCHUNG_MEAN[gcKey] || "서로 다른 뜻이 맞서는") +
      " 갈등이 되풀이될 수 있습니다. 천간 " + gc + J(koOf(gc[1]), "이", "가") + " 있기 때문입니다." +
      (gc.indexOf(ilgan) >= 0 ? " 일간이 직접 충을 맞아 그 진폭이 더 큽니다." : ""));
  }
  var hidSips = (S.JIJANG[p.il.ji] || []).map(function(x){
    return x[0] + "(" + S.sipseong(a.chart.ilganIdx, GAN.indexOf(x[0])) + ")";
  });
  성격.push("겉모습과 속의 결이 다를 수 있습니다. 일지 " + p.il.ji + " 지장간에 " +
    hidSips.join("·") + J(koOf(hidSips.length ? hidSips[hidSips.length-1][0] : ""), "이", "가") + " 숨어 있기 때문입니다.");
  성격.push("스스로를 " + (UNSEONG_NOTE[a.unseong.il] || "") + "에 두고 삽니다. 일지 십이운성이 " +
    a.unseong.il + "이기 때문입니다.");

  /* ═ 대인관계 · 결혼 ═ */
  var 관계 = [];
  var spWx = (a.sex === "F") ? gwanWx : GEUK[dw];
  var spName = (a.sex === "F") ? "관성" : "재성";
  var spLetters = [];
  pos.forEach(function(k){
    if (wxOf(p[k].gan) === spWx) spLetters.push({ k:k, ch:p[k].gan, kind:"간" });
    if (wxOf(p[k].ji)  === spWx) spLetters.push({ k:k, ch:p[k].ji,  kind:"지" });
  });
  if (!spLetters.length){
    var duS = null;
    for (i = 0; i < a.daeun.list.length; i++){
      var r1 = a.daeun.list[i];
      if (S.GAN_WX[GAN.indexOf(r1.gan)] === spWx || S.JI_WX[JI.indexOf(r1.ji)] === spWx){ duS = r1; break; }
    }
    관계.push("배우자 인연은 타고나기보다 운에서 옵니다. " +
      (a.sex === "F" ? "여성의 배우자성인 관성" : "남성의 배우자성인 재성") +
      "(" + W[spWx] + ")" + J(WK[spWx], "이", "가") + " 원국에 없기 때문입니다." +
      (duS ? " " + duS.from + "~" + duS.to + "세 " + duS.gan + duS.ji + " 대운이 " + spName + " 운이며, " +
        (spWx === ys.yong || spWx === ys.hui ? "용신·희신 쪽이라 이 시기의 인연이 실합니다."
                                             : "다만 용신 기운은 아니어서 인연의 무게는 따져 봐야 합니다.") : ""));
  } else {
    var early = spLetters[0].k === "nyeon" || spLetters[0].k === "wol";
    관계.push((early ? "인연이 이른 나이부터 들어오는 배치입니다. " : "인연이 늦게 자리 잡는 배치입니다. ") +
      (a.sex === "F" ? "배우자성인 관성" : "배우자성인 재성") + "(" + W[spWx] + ") 글자가 " +
      spLetters.map(function(x){ return posKo[x.k] + x.kind + " " + x.ch; }).join(", ") +
      "에 있기 때문입니다." +
      (spLetters.length > 1 ? " 글자가 여럿이니 년→월→일→시 차례로, 이른 인연부터 읽습니다." : ""));
    var dmg = spLetters.filter(function(x){
      return rels.some(function(r){ return /충|형/.test(r) && r.indexOf(x.ch) >= 0; });
    });
    var tied = spLetters.filter(function(x){
      return rels.some(function(r){ return /합/.test(r) && r.indexOf(x.ch) >= 0; });
    });
    if (dmg.length)
      관계.push("그 인연이 흔들리기 쉽습니다. 배우자 글자 " + dmg[0].ch +
        J(koOf(dmg[0].ch), "이", "가") + " 충·형을 맞고 있기 때문입니다.");
    else if (tied.length)
      관계.push("그 인연이 다른 관계에 매여 올 수 있습니다. 배우자 글자가 합으로 묶여 있기 때문입니다.");
  }
  var hitYears = [];
  for (i = 0; i < 10 && hitYears.length < 1; i++){
    var yp0 = S.yearPillar(thisYear + i);
    var hits = (GEUK[wxOf(yp0.gan)] === spWx ? 1 : 0) + (GEUK[wxOf(yp0.ji)] === spWx ? 1 : 0);
    if (hits >= 1) hitYears.push({ y:thisYear + i, gz:yp0.gan + yp0.ji, strong:hits === 2 });
  }
  if (hitYears.length)
    관계.push(hitYears[0].y + "년(" + hitYears[0].gz + ") 무렵의 관계 결정은 한 박자 늦추십시오. 그해 세운이 " +
      spName + J(spName, "을", "를") + (hitYears[0].strong ? " 천간·지지에서 함께" : "") + " 극하기 때문입니다.");
  var ilChung = rels.filter(function(r){ return r.indexOf(p.il.ji) >= 0 && /충|형/.test(r); });
  var ilHap   = rels.filter(function(r){ return r.indexOf(p.il.ji) >= 0 && /합/.test(r); });
  if (ilChung.length)
    관계.push("부부 사이에 변동을 겪기 쉽습니다. 배우자 자리인 일지에 " + ilChung[0] + " 관계가 걸려 있기 때문입니다.");
  else if (ilHap.length)
    관계.push("배우자 인연을 끌어오는 배치입니다. 일지가 " + ilHap[0] + "으로 묶여 있기 때문입니다.");
  if (a.sinsal.indexOf("도화") >= 0 || a.sinsal.indexOf("홍염") >= 0)
    관계.push("사람을 끄는 힘이 있는 만큼 정리도 분명해야 합니다. " +
      ["도화","홍염"].filter(function(x){ return a.sinsal.indexOf(x) >= 0; }).join("·") +
      J(a.sinsal.indexOf("홍염") >= 0 ? "염" : "화", "이", "가") + " 있기 때문입니다.");

  /* ═ 직업 ═ */
  var 직업 = [];
  var gName = a.gyeokguk.name.replace("격", "");
  var gSip = gName === "건록" ? "비견" : gName === "양인" ? "겁재" : gName;
  직업.push("사회에서는 " + (SIP[gSip] ? SIP[gSip].key : gName) + "의 방식으로 역량을 냅니다. 격국이 " +
    a.gyeokguk.name + "(" + a.gyeokguk.basis.replace(" (투출 없음)", " · 투출 없음") + ")이기 때문입니다.");
  if (gwan >= 2 && !st.weak)
    직업.push("조직과 직급에서 크는 관운이 있습니다. 관성이 " + gwan + "자로 뚜렷하고 일간이 그 극을 감당할 힘이 있기 때문입니다.");
  else if (gwan >= 2)
    직업.push("직장이 곧 스트레스가 되기 쉽습니다. 관성은 " + gwan + "자로 강한데 일간이 약해 그 극이 버겁기 때문입니다. 힘을 채워 주는 운의 시기에 승부를 거십시오.");
  else if (gwan === 1)
    직업.push("직급보다 실무와 전문성으로 서는 쪽입니다. 관성이 1자로 얇기 때문입니다.");
  else {
    var duG = null;
    for (i = 0; i < a.daeun.list.length; i++){
      var r2 = a.daeun.list[i];
      if (S.GAN_WX[GAN.indexOf(r2.gan)] === gwanWx || S.JI_WX[JI.indexOf(r2.ji)] === gwanWx){ duG = r2; break; }
    }
    직업.push("자기 이름으로 성과가 남는 구조가 맞습니다. 원국에 관성이 없어 타고난 관운이 약하기 때문입니다." +
      (duG ? " 다만 " + duG.from + "~" + duG.to + "세 " + duG.gan + duG.ji + " 대운에 관성운이 들어오" +
        (gwanWx === ys.yong || gwanWx === ys.hui ? "고 용신 쪽이라 이 시기는 출세에 유리합니다."
                                                 : "니 이 시기에는 조직운이 살아납니다.") : ""));
  }
  var jobSal = [];
  if (a.sinsal.indexOf("역마") >= 0) jobSal.push("이동·출장·해외처럼 움직이는 일이 맞습니다(역마)");
  if (a.sinsal.indexOf("화개") >= 0) jobSal.push("혼자 파고드는 연구·전문 분야가 어울립니다(화개)");
  if (a.sinsal.indexOf("문창귀인") >= 0) jobSal.push("글과 공부 머리가 따릅니다(문창귀인)");
  if (a.sinsal.indexOf("천을귀인") >= 0) jobSal.push("어려울 때 돕는 사람이 나타납니다(천을귀인)");
  if (jobSal.length) 직업.push(jobSal.join(", ") + ".");
  if (sp.sal && sp.sal.same && sp.sal.il)
    직업.push("그 기운은 유난히 강하게 발현합니다. 일간을 받치는 일지·월지가 모두 " +
      sp.sal.il.name + "(" + sp.sal.il.trait.join("·") + " 기질) 그룹이기 때문입니다.");
  var hyeongRels = rels.filter(function(r){ return /형/.test(r) && !/자형/.test(r); });
  if (hyeongRels.length)
    직업.push("규율이 센 환경(법무·의료·세무·수사)에서 오히려 제 몫을 합니다. 지지에 " +
      hyeongRels.join(", ") + " — 다듬고 조정하는 형(刑)의 기운이 있기 때문입니다.");

  /* ═ 재물 ═ */
  var 재물 = [];
  재물.push(pj > jj
    ? "기회성 큰돈에 감각이 있으나 들어온 돈을 묶는 장치가 먼저입니다. 재성이 편재 중심(" + pj + "자)이기 때문입니다."
    : jj > pj
    ? "고정수입을 지키고 쌓는 힘이 있습니다. 재성이 정재 중심(" + jj + "자)이기 때문입니다."
    : jae === 0
    ? "돈을 붙드는 힘보다 만들어 내는 힘을 먼저 세워야 합니다. 재성이 원국에 없기 때문입니다."
    : "안정 수입과 기회 수입을 함께 다룹니다. 정재와 편재가 나란하기 때문입니다.");
  if (jae >= 2 && st.weak)
    재물.push("기회 대비 손에 쥐는 몫이 작을 수 있습니다. 재성에 비해 일간이 약한 재다신약 구조이기 때문입니다.");
  else if (jae >= 2 && st.strong)
    재물.push("그 재물을 감당할 힘은 충분합니다. 일간이 신강하기 때문입니다.");
  if (bg >= 3)
    재물.push("동업과 금전 대여에서 새기 쉽습니다. 비겁 " + bg + "자가 재물을 두고 다투는 군겁쟁재 구조이기 때문입니다.");

  /* ═ 건강 ═ */
  var 건강 = [];
  if (over >= 0) 건강.push(ORGAN[over] + "에 부담이 갑니다. " + wx(over) + " 과다 때문입니다.");
  if (lows.length) 건강.push(ORGAN[lows[0]] + " 쪽이 무릅니다. " + wx(lows[0]) + " 미약 때문입니다.");
  건강.push("의학적 진단이 아니라 오행 치우침에서 읽는 경향입니다.");

  /* ═ 제언 ═ */
  var 제언 = [];
  // 구간마다 등급을 매기지 않고, 어느 구간에 무슨 기운이 들어오는지로 적는다
  var good = a.daeun.list.filter(function(r){ return r.bearing.favor && !r.bearing.block; });
  var bad  = a.daeun.list.filter(function(r){ return r.bearing.block && !r.bearing.favor; });
  var yongIn = "용신 " + W[yong] + " 쪽 기운이 들어와 하려는 일이 순하게 풀";
  var giIn   = "기신 " + W[ys.gi] + " 쪽 기운이 들어와 같은 일에도 힘이 더 듭니다.";
  var duLine;
  if (good.length && bad.length)
    duLine = "대운은 " + ranges(good) + " 구간에 " + yongIn + "리고, " + ranges(bad) + " 구간에는 " + giIn;
  else if (good.length)
    duLine = "대운은 " + ranges(good) + " 구간에 " + yongIn + "립니다.";
  else if (bad.length)
    duLine = "대운은 " + ranges(bad) + " 구간에 " + giIn;
  else
    duLine = "대운은 용신 쪽으로도 기신 쪽으로도 크게 기울지 않아 흐름이 완만합니다.";
  제언.push(duLine + " 대운이 바뀌는 앞뒤 한두 해는 변동이 몰리니 큰 결정을 피하십시오.");
  var gmHit = pos.filter(function(k){ return a.gongmang.indexOf(p[k].ji) >= 0; });
  if (gmHit.length)
    제언.push(gmHit.map(function(k){ return posKo[k] + "지"; }).join("·") +
      " 자리의 글자는 힘을 반감해서 봅니다. 공망(" + a.gongmang.join("") + ")에 닿아 있기 때문입니다.");
  // 괴강·백호는 앉은 기둥이 곧 대상이다 — 년주 조부모, 월주 부모, 일주 본인·배우자, 시주 자녀
  var SAL_WHO = { "년주":"조부모 대", "월주":"부모 쪽", "일주":"본인과 배우자", "시주":"자녀 쪽" };
  var refSal = a.sinsal.filter(function(x){ return /백호|괴강|양인|원진|귀문/.test(x); });
  if (refSal.length)
    제언.push("참고로 " + refSal.map(function(x){
      var part = x.split(" "), base = part[0], who = SAL_WHO[part[1]];
      return x + "(" + (who ? who + "에 걸린 " : "") + (SINSAL_MEAN[base] || "") + ")";
    }).join(", ") + " 기운이 보입니다. 다만 신살은 보조 지표일 뿐 위의 구조 판단을 뒤집지 않습니다.");

  /* ═ 세운 — 올해·내년 ═ */
  function seText(y){
    var yp = S.yearPillar(y);
    var gw = wxOf(yp.gan);
    var seSip = S.sipseong(a.chart.ilganIdx, GAN.indexOf(yp.gan));
    var seGroup = SIP_GROUP[seSip];
    var age = y - birthYear + 1, du = null;
    a.daeun.list.forEach(function(r){ if (age >= r.from && age <= r.to) du = r; });
    var bear = S.unBearing(gw, wxOf(yp.ji), ys);
    var s = [];
    s.push(y + "년 " + yp.gan + yp.ji + "년에는 " + SE_EVENT[seGroup] + " 방면의 일이 앞에 놓입니다. 세운 천간 " +
      yp.gan + J(koOf(yp.gan), "이", "가") + " 일간에게 " + seSip + "(" + seGroup + ")이기 때문입니다.");
    if (du){
      var dgw = wxOf(du.gan), rel;
      if (gw === dgw) rel = "같은 기운이라 그 흐름이 증폭되고";
      else if (SAENG[gw] === dgw) rel = "생(生)하는 사이라 순하게 흐르고";
      else if (SAENG[dgw] === gw) rel = "생을 받는 사이라 힘이 실리고";
      else if (GEUK[gw] === dgw) rel = "극(剋)하는 사이라 부딪히고";
      else rel = "극을 받는 사이라 눌리고";
      s.push("대운 " + du.gan + du.ji + J(koOf(du.ji), "과는", "와는") + " " + rel + ", 용신 " + W[yong] + " 기준 " +
        (bear.favor && !bear.block ? "힘을 받는 해라 벌이고 매듭짓기에 알맞습니다."
         : bear.block && !bear.favor ? "힘이 눌리는 해라 확장보다 지키는 쪽이 맞습니다."
         : "밀고 당기는 기운이 섞인 해라 준비와 정리에 알맞습니다."));
    }
    var chung = S.interactWith(yp.gan, yp.ji, p).filter(function(x){ return /충/.test(x); });
    if (chung.length){
      var tgt = null;
      pos.forEach(function(k){ if (!tgt && chung[0].indexOf(p[k].ji) >= 1) tgt = k; });
      pos.forEach(function(k){ if (!tgt && chung[0].indexOf(p[k].gan) >= 1) tgt = k; });
      // 조사는 바로 앞 글자를 따른다 — '午子충' 뒤에는 지지가 아니라 '충'을 본다
      s.push("특히 " + chung[0] + J(chung[0].slice(-1), "이", "가") + " 걸려 " +
        (tgt ? PILLAR_HIT[tgt] + " 쪽" : "그 방면") + " 변동을 살펴야 합니다.");
    }
    return s.join(" ").slice(0, 210);
  }

  /* ═ 키워드 · 꼬리표 ═ */
  var kw = [];
  if (top) kw.push(SIP[top.name].key);
  kw.push(IG.img);
  if (over >= 0) kw.push(WK[over] + " " + gr[over]);
  kw.push(ys.jong ? "종격" : st.strong ? "밀고 나가는 힘" : st.weak ? "기대고 조율하는 힘" : "균형");
  ["역마","도화","화개"].forEach(function(x){
    if (a.sinsal.indexOf(x) >= 0)
      kw.push(x === "역마" ? "이동" : x === "도화" ? "사람을 끄는 기운" : "혼자 파고듦");
  });

  /* ═ 대운 구간별 한 줄 ═
     길흉 등급을 걷어낸 자리를 채운다. 등급 두 글자 대신, 그 10년에 어느 방면이
     앞에 서고 일간에게 무슨 기운으로 오는지 한 줄로 적는다. */
  var duKw = a.daeun.list.map(function(r){
    // 십성 칸이 이미 이름을 보여 주므로, 여기에는 그 십성이 무엇으로 오는지를 적는다
    var key = (SIP[r.sipGan] || {}).key, grp = SIP_GROUP[r.sipGan];
    var head = key ? key + " 쪽 일이 앞에 섭니다"
             : grp ? GROUP_EFFECT[grp] + J(GROUP_EFFECT[grp], "이", "가") + " 앞에 섭니다"
             : "흐름이 완만합니다";
    var tail = r.bearing.favor && !r.bearing.block ? "용신 " + W[yong] + " 쪽이라 애쓴 만큼 남습니다"
             : r.bearing.block && !r.bearing.favor ? "기신 " + W[ys.gi] + " 쪽이라 무리하면 탈이 납니다"
             : r.bearing.favor ? "용신과 기신이 섞여 오르내립니다"
             : "용신과 무관해 기복이 크지 않습니다";
    return head + ". " + tail + ".";
  });

  var out = {
    summary: fit(총평, 430),
    keywords: kw.slice(0, 6).join(", "),
    duKw: duKw,
    temperament: fit(기질, 275),
    personality: fit(성격, 280),
    relation: fit(관계, 275),
    career: fit(직업, 255),
    wealth: fit(재물, 130),
    health: fit(건강, 85),
    advice: fit(제언, 420),
    seThis: seText(thisYear),
    seNext: seText(thisYear + 1),
    tags: {
      personality: (top ? top.name + " 중심 · " : "") + IG.img,
      relation: spName + " " + (spLetters.length ? spLetters.length + "자" : "무") + " · 일지 " + a.sipseong.ji.il,
      career: a.gyeokguk.name + " · 관성 " + gwan + "자",
      wealth: pj > jj ? "편재형" : jj > pj ? "정재형" : "재성 " + jae + "자",
      health: (over >= 0 ? WK[over] + " 과다" : "") +
              (lows.length ? (over >= 0 ? " · " : "") + WK[lows[0]] + " 미약" : "")
    }
  };

  /* ═ 커버리지 — 1면의 형충회합·신살은 반드시 어딘가에서 설명한다 ═ */
  function glossRel(r){
    if (/삼합|반합|방합/.test(r)){
      var w0 = WK.indexOf(r.charAt(r.length - 1));
      return r + "(" + (w0 >= 0 ? wx(w0) + " 세력이 뭉쳐 일간의 " + groupOfWx(w0) + " 방면을 키움" : "세력이 뭉침") + ")";
    }
    if (/육합/.test(r)) return r + "(두 자리가 서로 붙들어 묶임)";
    if (/자형/.test(r)) return r + "(같은 기운이 겹쳐 스스로를 볶음)";
    if (/삼형/.test(r) || /형/.test(r)){
      var chars = r.slice(0, r.indexOf(" "));
      if ("寅巳申".indexOf(chars[0]) >= 0 && "寅巳申".indexOf(chars[1]) >= 0)
        return r + "(권력·관재가 얽히는 지세지형)";
      if ("丑戌未".indexOf(chars[0]) >= 0 && "丑戌未".indexOf(chars[1]) >= 0)
        return r + "(믿었던 사이의 서운함이 이는 무은지형)";
      if (chars.indexOf("子") >= 0 && chars.indexOf("卯") >= 0)
        return r + "(가까운 사이에 선을 넘는 무례지형)";
      return r + "(다듬고 조정하는 마찰)";
    }
    if (/충/.test(r)){
      var a0 = r[0], b0 = r[1];
      if (GAN.indexOf(a0) >= 0){
        var gk = [a0, b0].sort(function(x, y){ return GAN.indexOf(x) - GAN.indexOf(y); }).join("");
        return r + "(" + (GANCHUNG_MEAN[gk] || "뜻이 맞서는") + " 마음의 충)";
      }
      var jk = [a0, b0].sort(function(x, y){ return JI.indexOf(x) - JI.indexOf(y); }).join("");
      return r + "(" + (JICHUNG_MEAN[jk] || "부딪혀 흔들림") + ")";
    }
    if (/파/.test(r)) return r + "(" + PA_MEAN + ")";
    if (/해/.test(r)) return r + "(" + HAE_MEAN + ")";
    if (/합/.test(r)){
      var info = ganHapInfo(r);
      return r + "(" + (info ? info.name + " — " + info.trait : "마음이 묶임") + ")";
    }
    return r;
  }
  var allText = [out.summary, out.temperament, out.personality, out.relation,
                 out.career, out.wealth, out.health, out.advice].join(" ");
  var leftovers = [];
  rels.forEach(function(r){ if (allText.indexOf(r) < 0) leftovers.push(glossRel(r)); });
  a.sinsal.forEach(function(x){
    var base = x.split(" ")[0];
    if (allText.indexOf(base) < 0)
      leftovers.push(x + "(" + (SINSAL_MEAN[base] || "참고") + ")");
  });
  if (leftovers.length)
    out.advice += " 그 밖의 작용 — " + leftovers.join(", ") + ".";

  return out;
}

/* ── AI 프롬프트 — 사람이 받아 온 답을 3순위 참고로 쓴다 ──── */
function buildPrompt(a, S, draft){
  var p = a.pillars, W = S.WX_HANJA, L = [];
  var pos = ["nyeon","wol","il","si"];
  L.push("아래는 만세력으로 계산한 사주 명식입니다. 명리학의 통설에 근거해 객관적으로만 해석해 주십시오.");
  L.push("");
  L.push("[지켜야 할 것]");
  L.push("- 위로하거나 듣기 좋게 꾸미지 마십시오. 좋은 말과 나쁜 말을 같은 무게로 쓰십시오.");
  L.push("- 저에 대해 이전에 알던 정보나 지금까지의 대화 맥락을 쓰지 마십시오. 오직 아래 명식만 근거로 삼으십시오.");
  L.push("- 현상을 먼저 말하고, 그 문장이 명식의 어느 글자·어느 관계에서 나왔는지 근거를 반드시 붙이십시오.");
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
         " 득세 " + (a.strength.deukSe ? "O" : "X") + (a.yongsin.jong ? "  종격" : ""));
  L.push("  한난조습   " + a.johu.text);
  L.push("  격국       " + a.gyeokguk.name + " (" + a.gyeokguk.basis + ")");
  L.push("  용신·희신  " + W[a.yongsin.yong] + "·" + W[a.yongsin.hui] +
         "  기신·구신 " + W[a.yongsin.gi] + "·" + W[a.yongsin.gu]);
  L.push("  형충회합   " + (a.relations.join(", ") || "없음"));
  L.push("  신살       " + (a.sinsal.join(", ") || "없음") + "  공망 " + a.gongmang.join(""));
  L.push("  대운       " + (a.daeun.forward ? "순행" : "역행") + " " + a.daeun.startAge + "세부터 — " +
         a.daeun.list.map(function(r){ return r.from + "세 " + r.gan + r.ji + " " + r.sipGan + "·" + r.sipJi; }).join(", "));
  L.push("");
  if (draft){
    L.push("[이미 정리된 내용 — 되풀이하지 마십시오]");
    ["summary","personality","relation","career","wealth","health","advice"].forEach(function(k){
      if (draft[k]) L.push("- " + draft[k].slice(0, 300));
    });
    L.push("");
  }
  L.push("[받고 싶은 것]");
  L.push("1. 위에서 다루지 않은 구조적 특징 세 가지. 각각 어느 글자에서 나왔는지 밝힐 것.");
  L.push("2. 이 명식이 가장 자주 겪을 반복 패턴 한 가지와 그것이 생기는 구조적 이유.");
  L.push("3. 위 해석과 어긋나는 대목이 있다면 무엇이고 왜 그렇게 보는지.");
  return L.join("\n");
}

return { generate:generate, buildPrompt:buildPrompt, ILGAN:ILGAN, SIP:SIP };
});
