/* ============================================================
   interpret.js — 객관적 해석 초안 생성기

   같은 생년월일시면 언제나 같은 문장이 나온다. 문장은 명식 구조에서
   규칙으로 끌어내며, 규칙의 뼈대는 '혼자 시작하는 사주명리 공부'의
   해석 순서를 따른다:

     일간 → 온도(조후)로 용신 후보 찾기 → 돕는/빼는 십신으로 신강약
     → 신강이면 관·식·재, 신약이면 비겁·인성, 종격이면 대세 강화가
       용신 후보 → 후보가 원국에 있는지, 지장간에 숨었는지,
       운에서 오는지 확인 → 새로 오는 글자의 합충까지 반드시 본다

   자료 우선순위(직접 정리 · 업로드 노트 → 참고자료 → AI)는 규칙을
   고를 때만 쓰고, 출력 문장에는 출처를 표시하지 않는다.
   같은 내용은 한 항목에서만 말한다 — 총평에서 말한 것은 아래에서
   되풀이하지 않는다.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Interpret = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* ── 오행 생극 (목화토금수 = 0~4) ────────────────────────── */
var SAENG = [1, 2, 3, 4, 0];   // a가 생하는 오행
var GEUK  = [2, 3, 4, 0, 1];   // a가 극하는 오행

/* ── 일간 열 가지 ────────────────────────────────────────── */
var ILGAN = {
  "甲":{ img:"큰 나무", 강:"부러질지언정 굽히지 않고, 대담하며 이상이 큽니다.",
         약:"자존심이 강하고 무뚝뚝해 속내를 늦게 꺼냅니다." },
  "乙":{ img:"풀과 꽃", 강:"변화에 예민하고 유연하며, 눕었다 다시 서는 끈기가 있습니다.",
         약:"스트레스를 많이 받고 결단이 늦습니다." },
  "丙":{ img:"한낮의 태양", 강:"통솔력이 있고 재주가 많으며 임기응변에 능합니다.",
         약:"감정에 휘둘리기 쉽고, 한번 싫어지면 되돌리기 어렵습니다." },
  "丁":{ img:"촛불", 강:"속이 깊고 예민하며 합리적입니다.",
         약:"걱정하다 기회를 놓치는 국면이 반복됩니다." },
  "戊":{ img:"넓은 벌판", 강:"신용을 중히 여기고 품이 넓으며 꾸준합니다.",
         약:"고집이 세고 움직임이 늦습니다." },
  "己":{ img:"텃밭", 강:"부지런하고 성실하며 사람을 잘 믿습니다.",
         약:"본심을 잘 드러내지 않아 속을 여는 데 시간이 걸립니다." },
  "庚":{ img:"단단한 바위", 강:"선악 구별이 분명하고 의로우며 리더십이 있습니다.",
         약:"아첨할 줄 몰라 구설에 오르고 차갑게 비칩니다." },
  "辛":{ img:"보석", 강:"감성이 풍부하고 직감이 발달했으며 판단이 영리합니다.",
         약:"한번 받은 상처가 오래가고, 틀어진 관계는 회복이 어렵습니다." },
  "壬":{ img:"바다", 강:"지혜롭고 통찰이 있으며 여러 방면에 능합니다.",
         약:"속을 알기 어렵다는 말을 듣고, 머무는 일을 답답해합니다." },
  "癸":{ img:"옹달샘", 강:"이치를 빨리 깨닫고 치밀하며 안정을 추구합니다.",
         약:"부탁을 거절하지 못하고 속으로 불편해합니다." }
};
// 따로 알려 주신 일간 · 일지
var ILGAN_ADD = {
  "丙":"외향적이고 사람들과 잘 섞이며, 자기를 드러내는 일이 맞습니다."
};
var ILJI_ADD = {
  "申":"완벽주의에 모방과 잡기가 능해 잘하는 것들을 하나로 잇는 일이 중요하고, 논리와 데이터에 강해 학문보다 기술·재능으로 성공하는 경우가 많습니다."
};

/* ── 십성 열 가지 ────────────────────────────────────────── */
var SIP = {
  "비견":{ key:"자존심 · 독립", 강:"스스로 판단하고 밀고 나갑니다.",
           약:"지시받기를 싫어하고, 일이 막히면 자존감이 급락합니다." },
  "겁재":{ key:"경쟁 · 승부욕", 강:"지고 못 사는 기질에서 도전 의식이 나옵니다.",
           약:"크게 벌이다 실패할 소지가 있어 작은 성공을 쌓는 편이 낫습니다." },
  "식신":{ key:"연구 · 몰입", 강:"하나를 파고들면 끝을 봅니다.",
           약:"변화를 꺼려 지나치면 움직임이 멎습니다." },
  "상관":{ key:"표현 · 사교", 강:"감정과 의견을 잘 드러내고 사교적입니다.",
           약:"시원한 말이 남에게 상처가 되고, 경직된 조직을 답답해합니다." },
  "편재":{ key:"큰돈 · 활동", 강:"활동적이고 사업가적 감각이 있습니다.",
           약:"작은 돈에 관심이 없어 월급에 만족하기 어렵습니다." },
  "정재":{ key:"꼼꼼함 · 안정", 강:"치밀하고 알뜰하며 안정감이 있습니다.",
           약:"집착이 생기면 상대를 답답하게 만듭니다." },
  "편관":{ key:"명예 · 인내", 강:"버티는 데 일가견이 있고 솔선수범합니다.",
           약:"속으로 스트레스가 크고 기력을 소모합니다." },
  "정관":{ key:"합리 · 명예욕", 강:"준법정신이 강하고 정직합니다.",
           약:"남의 눈을 의식해 실속을 놓칠 수 있습니다." },
  "편인":{ key:"특수한 배움", 강:"남이 안 가는 분야의 전문성과 장인 기질이 있습니다.",
           약:"배움이 곧바로 성과로 이어지지는 않습니다." },
  "정인":{ key:"보편적 배움", 강:"공부·자격·문서의 도움을 받고 너그럽습니다.",
           약:"지나치면 배우기만 하고 실행이 늦어집니다." }
};
var MISS_MEAN = { "비겁":"홀로 버티는 힘", "식상":"표현하고 만들어 내는 힘",
                  "재성":"돈을 붙드는 힘", "관성":"조직과 규율을 견디는 힘",
                  "인성":"뒤를 받쳐 주는 힘" };

/* ── 오행 점수 등급별 성정 ───────────────────────────────── */
var WX_HIGH = [
  { 강:"성장욕이 있고 진취적이며 순발력이 좋고 망설임이 없습니다.",
    주의:"일을 벌여 놓고 수습이 안 되거나 현실 감각이 무뎌질 수 있습니다." },
  { 강:"정의감이 있고 시원시원해 대인관계가 좋으며 자기 매력을 잘 드러냅니다.",
    주의:"감정선이 크게 흔들리니 타협이 필요합니다." },
  { 강:"있는 그대로 받아들이는 끈기가 있어 한번 시작하면 끝을 보고, 나이 들며 빛을 봅니다.",
    주의:"자기 어필이 서툴러, 일단 시작해 보는 것이 중요합니다." },
  { 강:"성격이 칼 같고 분명해 법·의료·경찰처럼 확실한 일이 어울립니다.",
    주의:"말과 행동이 남에게 상처가 될 수 있으니 화를 다스리고 취미로 감정을 풀어야 합니다." },
  { 강:"생각이 깊고 예술가적 기질이 있습니다.",
    주의:"고민과 우울감이 잦으니 현실성을 따로 챙겨야 합니다." }
];
var WX_LOW = [
  "시작하고 뻗는 힘이 약해 판을 새로 짜기보다 다듬는 일이 편합니다",
  "자기를 드러내는 데 서툴러 한 일에 비해 덜 알려지기 쉽습니다",
  "중심을 잡는 완충이 얇아 감정이 바로 부딪히기 쉽습니다",
  "끊고 맺는 결단이 약해 정리할 일을 오래 끌고 갑니다",
  "식히고 쉬는 유연함이 부족해 달아오르면 식힐 곳이 없습니다"
];
var ORGAN = ["간·담과 근골", "심장과 순환기", "비위와 소화기", "폐·호흡기와 대장", "신장과 방광"];

/* ── 십이운성 ────────────────────────────────────────────── */
var UNSEONG_NOTE = {
  "장생":"기운이 새로 돋는 자리", "목욕":"아직 다듬어지지 않은 자리", "관대":"틀을 갖추는 자리",
  "건록":"제 몫을 하는 자리",     "제왕":"기운이 절정인 자리",       "쇠":"한풀 꺾여 다지는 자리",
  "병":"힘이 무른 자리",         "사":"움직임이 멎는 자리",         "묘":"갈무리하는 자리",
  "절":"끊었다 다시 시작하는 자리","태":"싹이 맺히는 자리",          "양":"길러지는 자리"
};

/* ── 프롬프트용 자리 이름 ────────────────────────────────── */
var PILLAR_MEAN = {
  nyeon:{ ko:"년주" }, wol:{ ko:"월주" }, il:{ ko:"일주" }, si:{ ko:"시주" }
};

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
// 지면에 맞춰 뒤 문장부터 덜어 낸다 — 앞쪽일수록 구조적으로 중요한 문장
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
  var bg   = (sipCount["비견"]||0) + (sipCount["겁재"]||0);
  var gwan = (sipCount["정관"]||0) + (sipCount["편관"]||0);
  var jj   = sipCount["정재"]||0, pj = sipCount["편재"]||0, jae = jj + pj;
  var sik  = (sipCount["식신"]||0) + (sipCount["상관"]||0);
  var inS  = (sipCount["정인"]||0) + (sipCount["편인"]||0);
  var gwanWx = -1, inWx = -1;
  for (i = 0; i < 5; i++){ if (GEUK[i] === dw) gwanWx = i; if (SAENG[i] === dw) inWx = i; }
  var thisYear = new Date().getFullYear();
  var birthYear = a.chart.tst.y;

  /* ═ 총평 — 일간 → 온도 → 신강약과 용신 후보 → 용신 소재와 합충 ═ */
  var 총평 = [];
  총평.push("일간은 " + ilgan + WK[dw] + ", " + IG.img + "입니다.");

  var wj = p.wol.ji;
  var winter = "亥子丑".indexOf(wj) >= 0, summer = "巳午未".indexOf(wj) >= 0;
  if (a.johu.need != null){
    총평.push((winter ? "한겨울" : "한여름") + "(" + wj + "월)에 태어났는데 " +
      wx(a.johu.need) + J(WK[a.johu.need], "이", "가") + " 모자라 팔자가 " +
      (winter ? "차갑습니다" : "뜨겁습니다") + ". 온도부터 맞춰야 하는 명식이라 " +
      W[a.johu.need] + J(WK[a.johu.need], "이", "가") + " 첫 용신 후보가 되고, " +
      (cnt[a.johu.need] === 0 ? "그 글자가 원국에 하나도 없어 건강과 기력부터 지켜야 합니다."
                              : "다행히 그 글자가 원국에 있어 숨통은 트여 있습니다."));
  } else if (winter || summer){
    총평.push((winter ? "겨울" : "여름") + "생이지만 " + (winter ? "불" : "물") +
      " 기운이 받쳐 주어 온도는 견딜 만합니다.");
  }

  if (ys.jong){
    총평.push("일간을 돕는 비겁·인성이 원국에 없어 종격으로 봅니다. 홀로 버티는 팔자가 아니라 대세를 타는 팔자이므로, 가장 강한 " +
      wx(ys.yong) + "를 거스르지 않고 북돋우는 것이 용신이며, 오히려 비겁·인성 운이 오면 마음만 흔들립니다.");
  } else {
    총평.push("일간을 돕는 기운(비겁·인성)이 " + st.pct + "%로 " + st.label + "입니다. " +
      (st.strong ? "힘을 덜어 내는 관성·식상·재성이 용신 후보이고"
       : st.weak ? "힘을 보태는 비견·겁재·정인·편인이 용신 후보이고"
                 : "크게 기울지 않아 모자란 쪽을 채우는 글자가 용신 후보이고") +
      ", 이 명식은 " + wx(ys.yong) + J(WK[ys.yong], "을", "를") + " 용신, " +
      W[ys.hui] + J(WK[ys.hui], "을", "를") + " 희신으로 잡습니다." +
      (bg >= 3 && !st.strong ? " 다만 비겁이 이미 여럿 모여 있어 비겁은 용신 순위에서 뒤로 미룹니다." : ""));
  }

  // 용신 소재 — 원국 → 지장간 → 대운, 그리고 들어올 때의 합충
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
          duY.from + "~" + duY.to + "세 " + duY.gan + duY.ji + " 대운에서 들어오는데, " +
          (inter.length ? "이때 원국과 " + inter.slice(0,2).join("·") + " 관계가 걸려 온전히 쓰이는지 살펴야 합니다."
                        : "원국과 큰 합충 없이 들어와 그대로 쓸 수 있습니다.");
      } else {
        loc = "용신 " + W[yong] + J(WK[yong], "은", "는") + " 원국·지장간·대운 어디에도 뚜렷하지 않아 해마다 오는 세운에 기대야 합니다.";
      }
    }
  }
  총평.push(loc);

  /* ═ 기질 — 오행 점수 등급 + 십성 분포 ═ */
  var 기질 = [];
  var over = -1, lows = [];
  for (i = 0; i < 5; i++){
    if ((gr[i] === "과다" || gr[i] === "발달~과다") && (over < 0 || sc[i] > sc[over])) over = i;
    if (gr[i] === "미약") lows.push(i);
  }
  기질.push("오행 점수는 " + WK.map(function(k, n){ return k + sc[n]; }).join(" ") + "입니다.");
  if (over >= 0)
    기질.push(wx(over) + J(WK[over], "이", "가") + " " + gr[over] + " — " + WX_HIGH[over].강 +
      " 다만 " + WX_HIGH[over].주의 + " 이 기운을 다듬으면 오히려 극장점이 됩니다.");
  if (lows.length)
    기질.push(lows.map(wx).join("·") + J(WK[lows[lows.length-1]], "은", "는") + " 미약해 " +
      WX_LOW[lows[0]] + ". 보완할 방법을 함께 찾아야 합니다.");
  var missing = [];
  if (bg === 0) missing.push("비겁");
  if (sik === 0) missing.push("식상");
  if (jae === 0) missing.push("재성");
  if (gwan === 0) missing.push("관성");
  if (inS === 0) missing.push("인성");
  if (top)
    기질.push("십성은 " + top.name + " " + top.n + "자가 중심입니다. " + SIP[top.name].강 +
      " 반대로 " + SIP[top.name].약 +
      (missing.length ? " " + missing.join("·") + J(missing[missing.length-1], "이", "가") + " 비어 " +
        missing.map(function(m){ return MISS_MEAN[m]; }).join("과 ") + J(MISS_MEAN[missing[missing.length-1]],"이","가") + " 약합니다." : ""));
  if (sp.byeongjon && sp.byeongjon.length)
    기질.push(sp.byeongjon.join(", ") + " — 같은 글자가 나란히 서서 그 기운이 겹쳐 드러납니다.");
  if (sp.yangEight) 기질.push("여덟 자가 모두 양(양팔통)이라 펼치는 힘은 크되 거두는 자리가 없습니다.");
  if (sp.yinEight)  기질.push("여덟 자가 모두 음(음팔통)이라 거두는 힘은 크되 펼치는 자리가 없습니다.");

  /* ═ 성격 — 일간 상세 + 일주(일지 십성·지장간·십이운성) ═ */
  var 성격 = [];
  성격.push(IG.강 + " 다만 " + IG.약 + (ILGAN_ADD[ilgan] ? " " + ILGAN_ADD[ilgan] : ""));
  성격.push("일주 " + ilgan + p.il.ji + " — 일지에 " + a.sipseong.ji.il +
    J(a.sipseong.ji.il, "을", "를") + " 깔아 " + SIP[a.sipseong.ji.il].key +
    " 성향이 바탕에 놓입니다." + (ILJI_ADD[p.il.ji] ? " " + ILJI_ADD[p.il.ji] : ""));
  var hidSips = (S.JIJANG[p.il.ji] || []).map(function(x){
    return x[0] + "(" + S.sipseong(a.chart.ilganIdx, GAN.indexOf(x[0])) + ")";
  });
  성격.push("일지 " + p.il.ji + " 지장간에는 " + hidSips.join("·") +
    " — 겉으로 보이는 것과 다른 결이 안에 숨어 있습니다.");
  성격.push("일지 십이운성은 " + a.unseong.il + " — " + (UNSEONG_NOTE[a.unseong.il] || "") +
    "에 앉아 있습니다.");

  /* ═ 대인관계 · 결혼 — 배우자성과 그 손상, 극하는 시기 ═ */
  var 관계 = [];
  var spWx = (a.sex === "F") ? gwanWx : GEUK[dw];
  var spName = (a.sex === "F") ? "관성" : "재성";
  var spLetters = [];
  pos.forEach(function(k){
    if (wxOf(p[k].gan) === spWx) spLetters.push({ k:k, ch:p[k].gan, kind:"간" });
    if (wxOf(p[k].ji)  === spWx) spLetters.push({ k:k, ch:p[k].ji,  kind:"지" });
  });
  var 관계첫 = (a.sex === "F" ? "여성이므로 배우자운은 관성" : "남성이므로 배우자운은 재성") +
    "(" + W[spWx] + ")으로 봅니다. ";
  if (!spLetters.length){
    var duS = null;
    for (i = 0; i < a.daeun.list.length; i++){
      var r1 = a.daeun.list[i];
      if (S.GAN_WX[GAN.indexOf(r1.gan)] === spWx || S.JI_WX[JI.indexOf(r1.ji)] === spWx){ duS = r1; break; }
    }
    관계.push(관계첫 + "원국에 " + spName + J(spName, "이", "가") + " 없어 인연은 운에서 옵니다." +
      (duS ? " " + duS.from + "~" + duS.to + "세 " + duS.gan + duS.ji + " 대운이 " + spName + " 운이며, " +
        (spWx === ys.yong || spWx === ys.hui ? "용신·희신 쪽이라 이 시기의 인연이 실합니다."
                                             : "다만 용신 기운은 아니어서 인연의 무게는 따져 봐야 합니다.") : ""));
  } else {
    var early = spLetters[0].k === "nyeon" || spLetters[0].k === "wol";
    관계.push(관계첫 + spName + " 글자는 " +
      spLetters.map(function(x){ return posKo[x.k] + x.kind + " " + x.ch; }).join(", ") + " — " +
      (spLetters.length > 1 ? "여럿이라 년→월→일→시 차례로, 이른 인연부터 읽습니다."
        : early ? "이른 나이부터 인연이 들어오는 배치입니다." : "인연이 늦게 자리 잡는 배치입니다."));
    var dmg = spLetters.filter(function(x){
      return rels.some(function(r){ return /충|형/.test(r) && r.indexOf(x.ch) >= 0; });
    });
    var tied = spLetters.filter(function(x){
      return rels.some(function(r){ return /합/.test(r) && r.indexOf(x.ch) >= 0; });
    });
    if (dmg.length)
      관계.push("다만 배우자 글자 " + dmg[0].ch + J(koOf(dmg[0].ch), "이", "가") + " 충·형을 맞고 있어 인연이 흔들리기 쉽습니다.");
    else if (tied.length)
      관계.push("배우자 글자가 합으로 묶여 있어, 그 인연이 다른 관계에 매여 오는 수가 있습니다.");
    else
      관계.push("배우자 글자는 크게 다치지 않았습니다.");
  }
  // 배우자성을 강하게 치는 세운
  var hitYears = [];
  for (i = 0; i < 10 && hitYears.length < 2; i++){
    var yp0 = S.yearPillar(thisYear + i);
    var hits = (GEUK[wxOf(yp0.gan)] === spWx ? 1 : 0) + (GEUK[wxOf(yp0.ji)] === spWx ? 1 : 0);
    if (hits >= 1) hitYears.push({ y:thisYear + i, gz:yp0.gan + yp0.ji, strong:hits === 2 });
  }
  if (hitYears.length){
    var hy = hitYears[0];
    관계.push(hy.y + "년(" + hy.gz + ")은 " + spName + J(spName, "을", "를") +
      (hy.strong ? " 천간·지지에서 함께 치는 해라" : " 치는 해라") +
      " 이 무렵의 관계 결정은 한 박자 늦추는 편이 낫습니다.");
  }
  // 일지 합충 + 도화
  var ilChung = rels.filter(function(r){ return r.indexOf(p.il.ji) >= 0 && /충|형/.test(r); });
  var ilHap   = rels.filter(function(r){ return r.indexOf(p.il.ji) >= 0 && /합/.test(r); });
  if (ilChung.length) 관계.push("배우자 자리인 일지에 " + ilChung[0] + " — 부부 사이 변동을 겪기 쉽습니다.");
  else if (ilHap.length) 관계.push("일지가 " + ilHap[0] + "으로 묶여 배우자 인연을 끌어오는 배치입니다.");
  if (a.sinsal.indexOf("도화") >= 0) 관계.push("도화가 있어 사람을 끄는 힘이 있는 만큼, 정리도 분명해야 합니다.");

  /* ═ 직업 — 격국 + 관운 + 살 ═ */
  var 직업 = [];
  var gName = a.gyeokguk.name.replace("격","");
  var gSip = gName === "건록" ? "비견" : gName === "양인" ? "겁재" : gName;
  직업.push("격국은 " + a.gyeokguk.name + "(" + a.gyeokguk.basis.replace(" (투출 없음)", " · 투출 없음") + ")입니다. 사회에서는 " +
    (SIP[gSip] ? SIP[gSip].key + "의 방식으로 역량을 냅니다." : "이 기운의 방식으로 역량을 냅니다."));
  if (gwan >= 2 && !st.weak)
    직업.push("관성이 " + gwan + "자로 뚜렷하고 일간도 그 극을 감당할 힘이 있어 관운이 있습니다. 조직과 직급에서 크는 구조입니다.");
  else if (gwan >= 2)
    직업.push("관성은 " + gwan + "자로 강하나 일간이 약해 그 극이 버겁습니다. 직장이 곧 스트레스가 되기 쉬우니, 힘을 채워 주는 운의 시기에 승부를 거십시오.");
  else if (gwan === 1)
    직업.push("관성이 1자로 얇아 직급보다 실무와 전문성으로 서는 쪽입니다.");
  else {
    var duG = null;
    for (i = 0; i < a.daeun.list.length; i++){
      var r2 = a.daeun.list[i];
      if (S.GAN_WX[GAN.indexOf(r2.gan)] === gwanWx || S.JI_WX[JI.indexOf(r2.ji)] === gwanWx){ duG = r2; break; }
    }
    직업.push("원국에 관성이 없어 타고난 관운은 약하고, 자기 이름으로 성과가 남는 구조가 맞습니다." +
      (duG ? " 다만 " + duG.from + "~" + duG.to + "세 " + duG.gan + duG.ji + " 대운에 관성운이 들어오" +
        (gwanWx === ys.yong || gwanWx === ys.hui ? "고 용신 쪽이라 이 시기는 출세에 유리합니다."
                                                 : "니 이 시기에는 조직운이 살아납니다.") : ""));
  }
  var salBits = [];
  if (a.sinsal.indexOf("역마") >= 0) salBits.push("역마가 있어 이동·출장·해외처럼 움직이는 일이 맞고");
  if (a.sinsal.indexOf("화개") >= 0) salBits.push("화개가 있어 혼자 파고드는 연구·전문 분야도 어울립니다");
  if (salBits.length) 직업.push(salBits.join(", ") + (salBits.length === 1 ? "." : ""));
  if (sp.sal && sp.sal.same && sp.sal.il)
    직업.push("일지와 월지가 모두 " + sp.sal.il.name + "(" + sp.sal.il.sal.join("·") + ")에 들어 그 기운이 강하게 발현합니다.");

  /* ═ 재물 ═ */
  var 재물 = [];
  재물.push(pj > jj ? "재성은 편재 중심(" + pj + "자)이라 기회성 큰돈에 감각이 있으나, 들어온 돈을 묶어 두는 장치가 먼저입니다."
    : jj > pj ? "재성은 정재 중심(" + jj + "자)이라 고정수입을 지키고 쌓는 힘이 있습니다."
    : jae === 0 ? "재성이 원국에 없어 돈을 붙드는 힘보다 만들어 내는 힘을 먼저 세워야 합니다."
    : "정재와 편재가 나란해 안정 수입과 기회 수입을 함께 다룹니다.");
  if (jae >= 2)
    재물.push(st.strong ? "일간이 그 재물을 감당할 만큼 강해 재복이 실합니다."
      : st.weak ? "재성에 비해 일간이 약해(재다신약) 기회 대비 손에 쥐는 몫이 작을 수 있습니다. 힘을 채우는 운에 벌린 일이 남습니다."
      : "");
  if (bg >= 3)
    재물.push("비겁이 " + bg + "자로 겹쳐 재물을 두고 나누는 형국(군겁쟁재)이라 동업과 금전 대여에서 새기 쉽습니다.");

  /* ═ 건강 ═ */
  var 건강 = [];
  if (over >= 0) 건강.push(wx(over) + " 과다로 " + ORGAN[over] + "에 부담이 갑니다.");
  if (lows.length) 건강.push(wx(lows[0]) + " 미약으로 " + ORGAN[lows[0]] + " 쪽이 무릅니다.");
  건강.push("의학적 진단이 아니라 오행 치우침에서 읽는 경향입니다.");

  /* ═ 제언 — 대운 흐름 + 공망 + 신살 참고 + 개운 ═ */
  var 제언 = [];
  var good = a.daeun.list.filter(function(r){ return r.luck === "대길" || r.luck === "길"; });
  var bad  = a.daeun.list.filter(function(r){ return r.luck === "흉" || r.luck === "대흉"; });
  제언.push("대운은 " + (good.length ? ranges(good) + " 구간이 용신 쪽" : "용신 쪽 구간이 뚜렷하지 않") +
    (bad.length ? "이고, " + ranges(bad) + " 구간이 기신 쪽입니다." : "습니다.") +
    " 대운이 바뀌는 앞뒤 한두 해는 변동이 몰리니 큰 결정을 피하십시오.");
  var gmHit = pos.filter(function(k){ return a.gongmang.indexOf(p[k].ji) >= 0; });
  if (gmHit.length)
    제언.push("공망(" + a.gongmang.join("") + ")이 " + gmHit.map(function(k){ return posKo[k] + "지"; }).join("·") +
      "에 닿아 그 자리 글자의 힘은 반감해서 봅니다.");
  var refSal = a.sinsal.filter(function(x){ return /백호|괴강|양인|원진|귀문/.test(x); });
  if (refSal.length)
    제언.push(refSal.join(", ") + " 등이 보이나, 신살은 참고 지표일 뿐 위의 구조 판단을 뒤집지 않습니다.");
  제언.push("생활에서는 " + a.remedy.color + " 계열과 " + a.remedy.dir + "쪽, " + a.remedy.time +
    "의 리듬이 용신 " + W[yong] + J(WK[yong], "을", "를") + " 북돋습니다.");

  /* ═ 세운 — 올해·내년의 대운과의 생극 ═ */
  function seText(y){
    var yp = S.yearPillar(y);
    var gw = wxOf(yp.gan);
    var age = y - birthYear + 1, du = null;
    a.daeun.list.forEach(function(r){ if (age >= r.from && age <= r.to) du = r; });
    var luck = S.luckOf(gw, wxOf(yp.ji), ys);
    var s = [];
    if (du){
      var dgw = wxOf(du.gan), rel;
      if (gw === dgw) rel = "같은 기운이라 그 흐름이 증폭됩니다";
      else if (SAENG[gw] === dgw) rel = "생(生)하는 관계라 흐름이 순합니다";
      else if (SAENG[dgw] === gw) rel = "생을 받는 관계라 힘이 실립니다";
      else if (GEUK[gw] === dgw) rel = "극(剋)하는 관계라 부딪힘이 생깁니다";
      else rel = "극을 받는 관계라 눌리는 해입니다";
      s.push(y + "년 " + yp.gan + yp.ji + " — 세운 천간 " + yp.gan + "(" + WK[gw] + ")" +
        J(WK[gw], "이", "가") + " 대운 " + du.gan + du.ji + "의 천간을 " + rel + ".");
    } else {
      s.push(y + "년 " + yp.gan + yp.ji + " — 아직 첫 대운 전이라 세운 위주로 봅니다.");
    }
    s.push(luck === "대길" || luck === "길" ? "용신운이라 일을 벌이고 매듭짓기 좋은 해입니다."
      : luck === "평" ? "무난한 해라 준비와 정리에 알맞습니다."
      : "기신운이라 확장보다 지키는 쪽이 맞는 해입니다.");
    var inter = S.interactWith(yp.gan, yp.ji, p).filter(function(x){ return /충/.test(x); });
    if (inter.length) s.push("원국과 " + inter[0] + " — 그 방면의 변동을 살피십시오.");
    return s.join(" ").slice(0, 175);
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

  return {
    summary: fit(총평, 430),
    keywords: kw.slice(0, 6).join(", "),
    temperament: fit(기질, 250),
    personality: fit(성격, 225),
    relation: fit(관계, 255),
    career: fit(직업, 255),
    wealth: fit(재물, 150),
    health: fit(건강, 95),
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
         " 득세 " + (a.strength.deukSe ? "O" : "X") + (a.yongsin.jong ? "  종격" : ""));
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
