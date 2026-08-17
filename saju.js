/* ============================================================
   saju.js — 만세력 계산 엔진
   브라우저(window.Saju)와 Node(module.exports) 양쪽에서 동작한다.
   DOM에 기대지 않는 순수 계산부.

   출력은 모두 '초안'이다. 격국·용신처럼 유파에 따라 갈리는 항목은
   알고리즘이 한 가지 답을 고를 뿐이므로 최종 판단은 감정인이 한다.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Saju = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* ── 기본 상수 ───────────────────────────────────────────── */
var GAN    = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
var JI     = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
var GAN_KO = ["갑","을","병","정","무","기","경","신","임","계"];
var JI_KO  = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

var MOK=0, HWA=1, TO=2, GEUM=3, SU=4;               // 오행 인덱스
var WX_KEY   = ["mok","hwa","to","geum","su"];
var WX_HANJA = ["木","火","土","金","水"];
var WX_KO    = ["목","화","토","금","수"];

var GAN_WX   = [MOK,MOK,HWA,HWA,TO,TO,GEUM,GEUM,SU,SU];
var GAN_YANG = [1,0,1,0,1,0,1,0,1,0];
var JI_WX    = [SU,TO,MOK,MOK,TO,HWA,HWA,TO,GEUM,GEUM,TO,SU];

var SAENG = [HWA, TO, GEUM, SU, MOK];   // a가 生하는 오행
var GEUK  = [TO, GEUM, SU, MOK, HWA];   // a가 剋하는 오행

// 지장간 — 여기 · 중기 · 정기
var JIJANG = {
  "子":[["壬","여기"],["癸","정기"]],
  "丑":[["癸","여기"],["辛","중기"],["己","정기"]],
  "寅":[["戊","여기"],["丙","중기"],["甲","정기"]],
  "卯":[["甲","여기"],["乙","정기"]],
  "辰":[["乙","여기"],["癸","중기"],["戊","정기"]],
  "巳":[["戊","여기"],["庚","중기"],["丙","정기"]],
  "午":[["丙","여기"],["己","중기"],["丁","정기"]],
  "未":[["丁","여기"],["乙","중기"],["己","정기"]],
  "申":[["戊","여기"],["壬","중기"],["庚","정기"]],
  "酉":[["庚","여기"],["辛","정기"]],
  "戌":[["辛","여기"],["丁","중기"],["戊","정기"]],
  "亥":[["戊","여기"],["甲","중기"],["壬","정기"]]
};

// 오행 점수 가중치 (대시보드 표기와 동일)
var WEIGHT = { gan:{si:10,il:10,wol:10,nyeon:10}, ji:{si:15,il:15,wol:30,nyeon:10} };

var DEG = Math.PI / 180;
function mod(n, m){ return ((n % m) + m) % m; }
function mod360(x){ return mod(x, 360); }
function sdiff(a, b){ var d = mod(a - b, 360); return d > 180 ? d - 360 : d; }

/* ── 율리우스일 ──────────────────────────────────────────── */
function toJD(y, m, d, h, mi, s){
  h = h||0; mi = mi||0; s = s||0;
  if (m <= 2){ y -= 1; m += 12; }
  var A = Math.floor(y/100), B = 2 - A + Math.floor(A/4);
  return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + d + B - 1524.5
       + (h + mi/60 + s/3600) / 24;
}
function fromJD(jd){
  var z = Math.floor(jd + 0.5), f = jd + 0.5 - z, A = z;
  if (z >= 2299161){ var a = Math.floor((z - 1867216.25)/36524.25); A = z + 1 + a - Math.floor(a/4); }
  var B = A + 1524, C = Math.floor((B - 122.1)/365.25),
      D = Math.floor(365.25*C), E = Math.floor((B - D)/30.6001);
  var day = B - D - Math.floor(30.6001*E) + f;
  var month = E < 14 ? E - 1 : E - 13;
  var year = month > 2 ? C - 4716 : C - 4715;
  var di = Math.floor(day), frac = (day - di) * 24;
  var hh = Math.floor(frac + 1e-9), mm = Math.floor((frac - hh)*60 + 1e-7);
  var ss = Math.round((((frac - hh)*60) - mm)*60);
  if (ss >= 60){ ss -= 60; mm += 1; }
  if (mm >= 60){ mm -= 60; hh += 1; }
  return { y:year, m:month, d:di, hh:hh, mm:mm, ss:ss };
}
function jdn(jd){ return Math.floor(jd + 0.5); }   // 정오 기준 일련번호

/* ── ΔT (TT − UT), 초 ────────────────────────────────────── */
function deltaT(year){
  var t, u;
  if (year >= 2005 && year < 2050){ t = year - 2000; return 62.92 + 0.32217*t + 0.005589*t*t; }
  if (year >= 1986 && year < 2005){ t = year - 2000;
    return 63.86 + 0.3345*t - 0.060374*t*t + 0.0017275*t*t*t
         + 0.000651814*Math.pow(t,4) + 0.00002373599*Math.pow(t,5); }
  if (year >= 1961 && year < 1986){ t = year - 1975; return 45.45 + 1.067*t - t*t/260 - t*t*t/718; }
  if (year >= 1941 && year < 1961){ t = year - 1950; return 29.07 + 0.407*t - t*t/233 + t*t*t/2547; }
  if (year >= 1920 && year < 1941){ t = year - 1920; return 21.20 + 0.84493*t - 0.076100*t*t + 0.0020936*t*t*t; }
  if (year >= 1900 && year < 1920){ t = year - 1900;
    return -2.79 + 1.494119*t - 0.0598939*t*t + 0.0061966*t*t*t - 0.000197*Math.pow(t,4); }
  if (year >= 1860 && year < 1900){ t = year - 1860;
    return 7.62 + 0.5737*t - 0.251754*t*t + 0.01680668*t*t*t
         - 0.0004473624*Math.pow(t,4) + Math.pow(t,5)/233174; }
  if (year >= 2050){ return -20 + 32*Math.pow((year-1820)/100, 2) - 0.5628*(2150 - year); }
  u = (year - 1820)/100; return -20 + 32*u*u;
}

/* ── 태양 겉보기황경 ─────────────────────────────────────── */
function solarLongitude(jde){
  var T = (jde - 2451545.0) / 36525;
  var L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T;
  var M  = 357.52911 + 35999.05029*T - 0.0001537*T*T;
  var Mr = M * DEG;
  var C  = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(Mr)
         + (0.019993 - 0.000101*T)*Math.sin(2*Mr)
         + 0.000289*Math.sin(3*Mr);
  var lon = L0 + C;
  // 행성·달 섭동 — 이 계수들은 1900.0 기준 세기(T19)로 정의된 값이다.
  // J2000 기준 T를 넣으면 위상이 어긋나 절기가 5~10분씩 밀린다.
  var T19 = (jde - 2415020.0) / 36525;
  var A  = 153.23 + 22518.7541*T19, B = 216.57 + 45037.5082*T19,
      Cc = 312.69 + 32964.3577*T19, D = 350.74 + 445267.1142*T19 - 0.00144*T19*T19,
      E  = 231.19 + 20.20*T19;
  lon += 0.00134*Math.cos(A*DEG)  + 0.00154*Math.cos(B*DEG)
       + 0.00200*Math.cos(Cc*DEG) + 0.00179*Math.sin(D*DEG)
       + 0.00178*Math.sin(E*DEG);
  var omega = 125.04 - 1934.136*T;
  return mod360(lon - 0.00569 - 0.00478*Math.sin(omega*DEG));
}
function sunLonUT(jdUT){ return solarLongitude(jdUT + deltaT(fromJD(jdUT).y)/86400); }

// 목표 황경에 도달하는 UT 시각 (guess 부근의 해)
function solarTermUT(guess, targetLon){
  var jd = guess;
  for (var i = 0; i < 40; i++){
    var d = sdiff(targetLon, sunLonUT(jd));
    if (Math.abs(d) < 1e-9) break;
    jd += d * 365.2422 / 360;
  }
  return jd;
}

/* ── 균시차 (분) ─────────────────────────────────────────── */
function equationOfTime(jde){
  var T = (jde - 2451545.0)/36525;
  var L0 = mod360(280.46646 + 36000.76983*T + 0.0003032*T*T);
  var M  = 357.52911 + 35999.05029*T - 0.0001537*T*T;
  var e  = 0.016708634 - 0.000042037*T - 0.0000001267*T*T;
  var eps = 23.439291 - 0.0130042*T;
  var yv = Math.tan(eps/2*DEG); yv = yv*yv;
  var Mr = M*DEG, L0r = L0*DEG;
  var Ev = yv*Math.sin(2*L0r) - 2*e*Math.sin(Mr) + 4*e*yv*Math.sin(Mr)*Math.cos(2*L0r)
         - 0.5*yv*yv*Math.sin(4*L0r) - 1.25*e*e*Math.sin(2*Mr);
  return Ev / DEG * 4;
}

/* ── 한국 표준시 역사 · 서머타임 ─────────────────────────── */
var TZ_HISTORY = [
  [toJD(1908,4,1,0,0,0),  toJD(1912,1,1,0,0,0),  127.5],
  [toJD(1912,1,1,0,0,0),  toJD(1954,3,21,0,0,0), 135.0],
  [toJD(1954,3,21,0,0,0), toJD(1961,8,10,0,0,0), 127.5],
  [toJD(1961,8,10,0,0,0), Infinity,              135.0]
];
var DST = [
  [1948,6,1,1948,9,13],[1949,4,3,1949,9,11],[1950,4,1,1950,9,10],[1951,5,6,1951,9,9],
  [1955,5,5,1955,9,9],[1956,5,20,1956,9,30],[1957,5,5,1957,9,22],[1958,5,4,1958,9,21],
  [1959,5,3,1959,9,20],[1960,5,1,1960,9,18],[1987,5,10,1987,10,11],[1988,5,8,1988,10,9]
];
function standardMeridian(jdLocal){
  for (var i = 0; i < TZ_HISTORY.length; i++)
    if (jdLocal >= TZ_HISTORY[i][0] && jdLocal < TZ_HISTORY[i][1]) return TZ_HISTORY[i][2];
  return 135.0;
}
function inDST(y, m, d){
  var t = toJD(y, m, d, 12, 0, 0);
  for (var i = 0; i < DST.length; i++){
    var r = DST[i];
    if (t >= toJD(r[0],r[1],r[2],0,0,0) && t < toJD(r[3],r[4],r[5],0,0,0)) return true;
  }
  return false;
}

/* ── 십성 ────────────────────────────────────────────────── */
function sipseong(ilganIdx, targetGanIdx){
  var dw = GAN_WX[ilganIdx], tw = GAN_WX[targetGanIdx];
  var same = GAN_YANG[ilganIdx] === GAN_YANG[targetGanIdx];
  if (tw === dw)        return same ? "비견" : "겁재";
  if (SAENG[dw] === tw) return same ? "식신" : "상관";
  if (GEUK[dw]  === tw) return same ? "편재" : "정재";
  if (GEUK[tw]  === dw) return same ? "편관" : "정관";
  if (SAENG[tw] === dw) return same ? "편인" : "정인";
  return "";
}
var SIP_GROUP = {
  "비견":"bigeop","겁재":"bigeop","식신":"siksang","상관":"siksang",
  "편재":"jaeseong","정재":"jaeseong","편관":"gwanseong","정관":"gwanseong",
  "편인":"inseong","정인":"inseong"
};
function jiJeonggi(ji){
  var t = JIJANG[ji];
  for (var i = 0; i < t.length; i++) if (t[i][1] === "정기") return t[i][0];
  return t[t.length-1][0];
}
function sipseongOfJi(ilganIdx, ji){ return sipseong(ilganIdx, GAN.indexOf(jiJeonggi(ji))); }

/* ── 십이운성 ────────────────────────────────────────────── */
var UNSEONG = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
var JANGSAENG = { "甲":11,"乙":6,"丙":2,"戊":2,"丁":9,"己":9,"庚":5,"辛":0,"壬":8,"癸":3 };
function unseong(gan, ji){
  var start = JANGSAENG[gan], forward = GAN_YANG[GAN.indexOf(gan)] === 1;
  var jIdx = JI.indexOf(ji);
  return UNSEONG[forward ? mod(jIdx - start, 12) : mod(start - jIdx, 12)];
}

/* ── 형충회합 ────────────────────────────────────────────── */
var GAN_HAP = { "甲己":"토","乙庚":"금","丙辛":"수","丁壬":"목","戊癸":"화" };
var GAN_CHUNG = ["甲庚","乙辛","丙壬","丁癸"];
var YUKHAP = { "子丑":"토","寅亥":"목","卯戌":"화","辰酉":"금","巳申":"수","午未":"토" };
var SAMHAP = [["申","子","辰","수"],["亥","卯","未","목"],["寅","午","戌","화"],["巳","酉","丑","금"]];
var BANGHAP = [["寅","卯","辰","목"],["巳","午","未","화"],["申","酉","戌","금"],["亥","子","丑","수"]];
var JI_CHUNG = [["子","午"],["丑","未"],["寅","申"],["卯","酉"],["辰","戌"],["巳","亥"]];
var SAMHYEONG = [["寅","巳","申"],["丑","戌","未"]];
var JAHYEONG = ["辰","午","酉","亥"];
var PA  = [["子","酉"],["丑","辰"],["寅","亥"],["卯","午"],["巳","申"],["未","戌"]];
var HAE = [["子","未"],["丑","午"],["寅","巳"],["卯","辰"],["申","亥"],["酉","戌"]];
var WONJIN = [["子","未"],["丑","午"],["寅","酉"],["卯","申"],["辰","亥"],["巳","戌"]];
var GWIMUN = [["子","酉"],["丑","午"],["寅","未"],["卯","申"],["辰","亥"],["巳","戌"]];
function pk(a,b){ return [a,b].sort().join(""); }
function inPairs(list, a, b){
  var k = pk(a,b);
  for (var i = 0; i < list.length; i++) if (pk(list[i][0], list[i][1]) === k) return true;
  return false;
}
function findRelations(gans, jis){
  var out = [], seen = {}, i, j;
  function push(s){ if (!seen[s]){ seen[s] = 1; out.push(s); } }
  // 천간의 합·충은 바로 옆에 붙은 기둥끼리만 성립한다. 년간과 시간처럼 떨어진 자리는
  // 만세력에서도 잡지 않는다. gans 는 [시, 일, 월, 년] 순이므로 뒤에서부터 짝지어
  // 년→월, 월→일, 일→시 차례로 읽히게 만든다.
  // 같은 두 글자가 두 자리에서 겹쳐 잡히면(쟁합) 만세력처럼 한 번만 적되,
  // 일간이 낀 쪽을 남긴다.
  var ganRel = {};
  for (i = gans.length - 1; i > 0; i--){
    var a = gans[i], b = gans[i-1];
    var onIl = (i === 1 || i - 1 === 1);            // gans[1] 이 일간
    var key = [a, b].sort(function(m, n){ return GAN.indexOf(m) - GAN.indexOf(n); }).join("");
    var hap = GAN_HAP[a+b] || GAN_HAP[b+a];
    if (hap && (!ganRel["합"+key] || onIl)) ganRel["합"+key] = { text:a+b + " 합" + hap, il:onIl };
    if ((GAN_CHUNG.indexOf(a+b) >= 0 || GAN_CHUNG.indexOf(b+a) >= 0) &&
        (!ganRel["충"+key] || onIl)) ganRel["충"+key] = { text:a+b + " 충", il:onIl };
  }
  Object.keys(ganRel).forEach(function(k){ push(ganRel[k].text); });
  for (i = 0; i < SAMHAP.length; i++){
    var s = SAMHAP[i], have = s.slice(0,3).filter(function(x){ return jis.indexOf(x) >= 0; });
    if (have.length === 3) push(s[0]+s[1]+s[2] + " 삼합" + s[3]);
    else if (have.length === 2 && have.indexOf(s[1]) >= 0) push(have.join("") + " 반합" + s[3]);
  }
  for (i = 0; i < BANGHAP.length; i++){
    var bg = BANGHAP[i], hv = bg.slice(0,3).filter(function(x){ return jis.indexOf(x) >= 0; });
    if (hv.length === 3) push(bg[0]+bg[1]+bg[2] + " 방합" + bg[3]);
  }
  for (i = 0; i < jis.length; i++) for (j = i+1; j < jis.length; j++){
    var x = jis[i], y = jis[j];
    // 같은 짝이 순서만 달리 두 번 잡히지 않도록 지지 차례로 정규화한다
    var xy = [x, y].sort(function(m, n){ return JI.indexOf(m) - JI.indexOf(n); }).join("");
    var yh = YUKHAP[x+y] || YUKHAP[y+x];
    if (yh) push(xy + " 육합" + yh);
    if (inPairs(JI_CHUNG, x, y)) push(xy + " 충");
    if (inPairs(PA, x, y))  push(xy + " 파");
    if (inPairs(HAE, x, y)) push(xy + " 해");
    if (x === y && JAHYEONG.indexOf(x) >= 0) push(x+y + " 자형");
  }
  SAMHYEONG.forEach(function(t){
    var hv = t.filter(function(x){ return jis.indexOf(x) >= 0; });
    if (hv.length === 3) push(t.join("") + " 삼형");
    else if (hv.length === 2) push(hv.join("") + " 형");
  });
  if (jis.indexOf("子") >= 0 && jis.indexOf("卯") >= 0) push("子卯 형");
  return out;
}

// 새로 들어오는 글자(대운·세운)가 원국 여덟 자와 맺는 합충
function interactWith(gan, ji, p){
  var out = [], seen = {};
  function push(x){ if (!seen[x]){ seen[x] = 1; out.push(x); } }
  ["nyeon","wol","il","si"].forEach(function(k){
    var g = p[k].gan, j = p[k].ji;
    if (gan){
      var h = GAN_HAP[gan+g] || GAN_HAP[g+gan];
      if (h) push(gan + g + "합" + h);
      if (GAN_CHUNG.indexOf(gan+g) >= 0 || GAN_CHUNG.indexOf(g+gan) >= 0) push(gan + g + "충");
    }
    if (ji){
      var y = YUKHAP[ji+j] || YUKHAP[j+ji];
      if (y) push(ji + j + "합" + y);
      if (inPairs(JI_CHUNG, ji, j)) push(ji + j + "충");
    }
  });
  return out;
}

/* ── 신살 ────────────────────────────────────────────────── */
var CHEONEUL = { "甲":["丑","未"],"戊":["丑","未"],"庚":["丑","未"],
                 "乙":["子","申"],"己":["子","申"],
                 "丙":["亥","酉"],"丁":["亥","酉"],
                 "辛":["午","寅"],"壬":["巳","卯"],"癸":["巳","卯"] };
var MUNCHANG = { "甲":"巳","乙":"午","丙":"申","戊":"申","丁":"酉","己":"酉",
                 "庚":"亥","辛":"子","壬":"寅","癸":"卯" };
var YANGIN   = { "甲":"卯","丙":"午","戊":"午","庚":"酉","壬":"子" };
var GWAEGANG = ["庚辰","庚戌","壬辰","戊戌"];
var BAEKHO   = ["甲辰","乙未","丙戌","丁丑","戊辰","壬戌","癸丑"];
// 홍염살 — 일간 기준. 도화(삼합 기준)와는 뿌리가 다른 별개의 살이므로 따로 둔다.
var HONGYEOM = { "甲":"午","乙":"午","丙":"寅","丁":"未","戊":"辰",
                 "己":"辰","庚":"戌","辛":"酉","壬":"子","癸":"申" };
function samhapOf(ji){
  for (var i = 0; i < SAMHAP.length; i++)
    if (SAMHAP[i].slice(0,3).indexOf(ji) >= 0) return SAMHAP[i];
  return null;
}

/* ── 십이신살 ─────────────────────────────────────────────
   기준 지지가 속한 삼합의 고지(마지막 글자) 바로 다음 자리에서 겁살이 시작해
   열두 지지를 차례로 돈다. 예) 일지 寅(寅午戌, 고지 戌) → 亥 겁살, 子 재살,
   丑 천살, 寅 지살, 卯 연살, 辰 월살, 巳 망신살, 午 장성살, 未 반안살,
   申 역마살, 酉 육해살, 戌 화개살.
   이 배열에서 연살=도화, 역마살, 화개살이 각각 생지+1 · 생지+6 · 고지로 떨어진다. */
var SIBI_SINSAL = ["겁살","재살","천살","지살","연살","월살",
                   "망신살","장성살","반안살","역마살","육해살","화개살"];
function sibiSinsal(base, ji){
  var g = samhapOf(base); if (!g) return null;
  var start = mod(JI.indexOf(g[2]) + 1, 12);        // 고지 다음 = 겁살
  return SIBI_SINSAL[mod(JI.indexOf(ji) - start, 12)];
}
// 네 지지 각각에 대해 연지 기준·일지 기준 십이신살을 매긴다
function twelveSinsal(p){
  var keys = ["nyeon","wol","il","si"], out = { yeon:{}, il:{} };
  keys.forEach(function(k){
    out.yeon[k] = sibiSinsal(p.nyeon.ji, p[k].ji);
    out.il[k]   = sibiSinsal(p.il.ji,    p[k].ji);
  });
  return out;
}

function findSinsal(p){
  var out = [], jis = [p.nyeon.ji, p.wol.ji, p.il.ji, p.si.ji], ilgan = p.il.gan;
  function add(s){ if (out.indexOf(s) < 0) out.push(s); }
  // 도화(연살)·역마·화개는 연지 또는 일지가 속한 삼합에서만 나온다.
  // 도화는 삼합 생지의 다음 글자다. 왕지 다음으로 잡으면 만세력과 어긋난다.
  [p.nyeon.ji, p.il.ji].forEach(function(base){
    var g = samhapOf(base); if (!g) return;
    var dohwa  = JI[mod(JI.indexOf(g[0]) + 1, 12)];   // 생지 다음 = 연살
    var yeokma = JI[mod(JI.indexOf(g[0]) + 6, 12)];   // 생지의 충
    var hwagae = g[2];                                 // 고지
    if (jis.indexOf(dohwa)  >= 0) add("도화");
    if (jis.indexOf(yeokma) >= 0) add("역마");
    if (jis.indexOf(hwagae) >= 0) add("화개");
  });
  if (jis.indexOf(HONGYEOM[ilgan]) >= 0) add("홍염");
  (CHEONEUL[ilgan] || []).forEach(function(j){ if (jis.indexOf(j) >= 0) add("천을귀인"); });
  if (jis.indexOf(MUNCHANG[ilgan]) >= 0) add("문창귀인");
  if (YANGIN[ilgan] && jis.indexOf(YANGIN[ilgan]) >= 0) add("양인");
  // 괴강·백호는 간지 한 쌍으로 성립하므로 어느 기둥에 앉았는지가 곧 대상을 가른다.
  // 년주 조부모 · 월주 부모 · 일주 본인과 배우자 · 시주 자녀.
  var PKO = { nyeon:"년주", wol:"월주", il:"일주", si:"시주" };
  ["nyeon","wol","il","si"].forEach(function(k){
    var gz = p[k].gan + p[k].ji;
    if (GWAEGANG.indexOf(gz) >= 0) add("괴강 " + PKO[k]);
    if (BAEKHO.indexOf(gz)   >= 0) add("백호 " + PKO[k]);
  });
  for (var i2 = 0; i2 < jis.length; i2++) for (var j2 = i2+1; j2 < jis.length; j2++){
    var pr = [jis[i2], jis[j2]].sort(function(a,b){ return JI.indexOf(a) - JI.indexOf(b); }).join("");
    if (inPairs(WONJIN, jis[i2], jis[j2])) add("원진 " + pr);
    if (inPairs(GWIMUN, jis[i2], jis[j2])) add("귀문 " + pr);
  }
  return out;
}
function gongmang(dayIdx60){
  var base = mod(10 + Math.floor(dayIdx60/10)*10, 12);
  return [JI[base], JI[mod(base+1, 12)]];
}

/* ── 지지 세 그룹의 성향 ─────────────────────────────────
   寅申巳亥 생지는 역마의 기질, 子午卯酉 왕지는 도화·홍염의 기질,
   辰戌丑未 고지는 화개의 기질을 띤다. 각 그룹을 둘씩 가르면 그대로 충하는 짝이 된다.
   여기 적힌 이름은 그룹이 지닌 '기질'일 뿐 신살 판정이 아니다.
   실제 도화·역마·화개·홍염 판정은 findSinsal 의 삼합·일간 기준을 따른다. */
var JI_GROUP = [
  { name:"생지", trait:["역마"],        members:["寅","申","巳","亥"] },
  { name:"왕지", trait:["도화","홍염"], members:["子","午","卯","酉"] },
  { name:"고지", trait:["화개"],        members:["辰","戌","丑","未"] }
];
function groupOf(ji){
  for (var i = 0; i < JI_GROUP.length; i++)
    if (JI_GROUP[i].members.indexOf(ji) >= 0) return JI_GROUP[i];
  return null;
}
// 오행 점수 등급 — 20 미만 미약, 25~45 발달, 50 이상 과다
function gradeOf(score){
  if (score >= 50) return "과다";
  if (score >= 46) return "발달~과다";
  if (score >= 25) return "발달";
  if (score >= 20) return "미약~발달";
  return "미약";
}
// 양팔통 · 음팔통 · 병존
function specials(p){
  var order = ["si","il","wol","nyeon"];
  var gans = order.map(function(k){ return p[k].gan; });
  var jis  = order.map(function(k){ return p[k].ji; });
  var yang = 0, yin = 0;
  gans.forEach(function(g){ if (GAN_YANG[GAN.indexOf(g)]) yang++; else yin++; });
  jis.forEach(function(j){ if (JI.indexOf(j) % 2 === 0) yang++; else yin++; });

  var bj = [];
  for (var i = 0; i < 3; i++){
    if (gans[i] === gans[i+1]) bj.push(gans[i] + gans[i+1] + " 천간병존");
    if (jis[i]  === jis[i+1])  bj.push(jis[i]  + jis[i+1]  + " 지지병존");
  }

  var ilG = groupOf(p.il.ji), wolG = groupOf(p.wol.ji);
  var sal = { il:ilG, wol:wolG, same: !!(ilG && wolG && ilG.name === wolG.name) };

  // 네 지지가 어느 그룹에 몇 자씩 걸리는지
  var spread = JI_GROUP.map(function(gp){
    return { name:gp.name, trait:gp.trait,
             hits: jis.filter(function(j){ return gp.members.indexOf(j) >= 0; }) };
  });

  return { yang:yang, yin:yin, yangEight:(yang === 8), yinEight:(yin === 8),
           byeongjon:bj, sal:sal, spread:spread };
}

/* ── 기둥 세우기 ─────────────────────────────────────────── */
function computeChart(o){
  var lon = (o.lon == null ? 126.978 : o.lon);
  var tstMode = o.tstMode || "lon";
  var jasi = o.jasi || "early";
  var notes = [];

  var jdClock  = toJD(o.y, o.m, o.d, o.hour||0, o.min||0, 0);
  var meridian = standardMeridian(jdClock);
  var dst = (o.dstAuto !== false) && inDST(o.y, o.m, o.d);
  if (dst) notes.push("서머타임 시행 기간 — 시계 시각에서 1시간을 뺐습니다");
  if (meridian !== 135.0) notes.push("당시 한국 표준자오선 " + meridian + "°E 적용");

  // 서머타임 기간에는 시계가 표준시보다 1시간 앞서 있으므로 그만큼 되돌린다
  var jdUT = jdClock - (meridian/15)/24 - (dst ? 1/24 : 0);

  var tstMin = 0;
  if (tstMode === "lon" || tstMode === "full") tstMin += (lon - meridian) * 4;
  if (tstMode === "full") tstMin += equationOfTime(jdUT + deltaT(o.y)/86400);
  var jdLocalAdj = jdUT + (meridian/15)/24 + tstMin/1440;
  var tst = fromJD(jdLocalAdj);

  // 년주 — 입춘 경계
  var ipchun = solarTermUT(toJD(o.y, 2, 4, 12, 0, 0), 315);
  var sajuYear = (jdUT < ipchun) ? o.y - 1 : o.y;
  var yIdx = mod(sajuYear - 1984, 60);
  var nyeonGan = GAN[mod(yIdx, 10)], nyeonJi = JI[mod(yIdx, 12)];

  // 월주 — 절기
  var lonAtBirth = sunLonUT(jdUT);
  var k = Math.floor(mod(lonAtBirth - 315, 360) / 30);      // 0 = 寅월
  var wolJi = JI[mod(2 + k, 12)];
  var inGan = mod(mod(GAN.indexOf(nyeonGan), 5) * 2 + 2, 10);
  var wolGan = GAN[mod(inGan + k, 10)];

  var termStartLon = mod360(315 + k*30);
  var termStart = solarTermUT(jdUT - 15, termStartLon);
  var termEnd   = solarTermUT(jdUT + 15, mod360(termStartLon + 30));
  var nearest = Math.min((jdUT - termStart)*24, (termEnd - jdUT)*24);
  if (nearest < 6)
    notes.push("절입 경계에서 " + nearest.toFixed(1) + "시간 이내 — 월주를 만세력으로 확인하십시오");

  // 일주
  var dayShift = (jasi === "early" && tst.hh >= 23) ? 1 : 0;
  var dayNum = jdn(toJD(tst.y, tst.m, tst.d, 12, 0, 0)) + dayShift;
  var dIdx = mod(dayNum + 49, 60);
  var ilGan = GAN[mod(dIdx, 10)], ilJi = JI[mod(dIdx, 12)];

  // 시주
  var siJiIdx = Math.floor(mod(tst.hh*60 + tst.mm + 60, 1440) / 120) % 12;
  var siJi = JI[siJiIdx];
  var siGan = GAN[mod(mod(GAN.indexOf(ilGan), 5) * 2 + siJiIdx, 10)];

  return {
    pillars: { nyeon:{gan:nyeonGan,ji:nyeonJi}, wol:{gan:wolGan,ji:wolJi},
               il:{gan:ilGan,ji:ilJi}, si:{gan:siGan,ji:siJi} },
    sajuYear: sajuYear, ilganIdx: GAN.indexOf(ilGan), dayIdx60: dIdx,
    jdUT: jdUT, tst: tst, tstMinutes: tstMin, meridian: meridian, dst: dst,
    monthTermStart: termStart, monthTermEnd: termEnd, notes: notes
  };
}

/* ── 오행 분포 · 십성 세력 ───────────────────────────────── */
function elementProfile(p, ilganIdx){
  var counts = [0,0,0,0,0], scores = [0,0,0,0,0];
  var sip = { bigeop:0, siksang:0, jaeseong:0, gwanseong:0, inseong:0 };
  ["si","il","wol","nyeon"].forEach(function(pos){
    var q = p[pos];
    var gw = GAN_WX[GAN.indexOf(q.gan)], jw = JI_WX[JI.indexOf(q.ji)];
    counts[gw]++; scores[gw] += WEIGHT.gan[pos];
    counts[jw]++; scores[jw] += WEIGHT.ji[pos];
    sip[SIP_GROUP[sipseong(ilganIdx, GAN.indexOf(q.gan))]]++;
    sip[SIP_GROUP[sipseongOfJi(ilganIdx, q.ji)]]++;
  });
  return { counts: counts, scores: scores, sip: sip };
}

/* ── 강약 ────────────────────────────────────────────────── */
function strength(p, ilganIdx){
  var dw = GAN_WX[ilganIdx], ally = 0, foe = 0;
  function isAlly(wx){ return wx === dw || SAENG[wx] === dw; }   // 비겁 · 인성
  ["si","il","wol","nyeon"].forEach(function(pos){
    if (pos !== "il"){                                            // 일간 자신은 제외
      var gw = GAN_WX[GAN.indexOf(p[pos].gan)];
      if (isAlly(gw)) ally += WEIGHT.gan[pos]; else foe += WEIGHT.gan[pos];
    }
    var jw = JI_WX[JI.indexOf(p[pos].ji)];
    if (isAlly(jw)) ally += WEIGHT.ji[pos]; else foe += WEIGHT.ji[pos];
  });
  var pct = (ally + foe) ? Math.round(ally / (ally + foe) * 100) : 50;

  var n = 0;
  ["si","wol","nyeon"].forEach(function(pos){
    if (isAlly(GAN_WX[GAN.indexOf(p[pos].gan)])) n++;
    if (isAlly(JI_WX[JI.indexOf(p[pos].ji)])) n++;
  });
  if (isAlly(JI_WX[JI.indexOf(p.il.ji)])) n++;

  return {
    pct: pct,
    label: pct >= 75 ? "태왕" : pct >= 58 ? "신강" : pct > 42 ? "중화" : pct > 25 ? "신약" : "태약",
    ally: ally, foe: foe,
    deukRyeong: isAlly(JI_WX[JI.indexOf(p.wol.ji)]),
    deukJi:     isAlly(JI_WX[JI.indexOf(p.il.ji)]),
    deukSe:     n >= 3,
    allyCount:  n,
    strong: pct >= 58, weak: pct <= 42
  };
}

/* ── 조후 ────────────────────────────────────────────────── */
function johu(p, scores){
  var wj = p.wol.ji;
  var winter = ["亥","子","丑"].indexOf(wj) >= 0;
  var summer = ["巳","午","未"].indexOf(wj) >= 0;
  if (winter) return { need: scores[HWA] < 15 ? HWA : null, text: scores[HWA] < 15 ? "한습 · 화기 부족" : "한습" };
  if (summer) return { need: scores[SU]  < 15 ? SU  : null, text: scores[SU]  < 15 ? "조열 · 수기 부족" : "조열" };
  return { need: null, text: "온난 · 무난" };
}

/* ── 격국 ────────────────────────────────────────────────── */
function gyeokName(sip){
  if (sip === "비견") return "건록격";
  if (sip === "겁재") return "양인격";
  return sip + "격";
}
function gyeokguk(p, ilganIdx){
  var wj = p.wol.ji, others = [p.nyeon.gan, p.wol.gan, p.si.gan];
  var order = ["정기","중기","여기"], hidden = JIJANG[wj];
  for (var i = 0; i < order.length; i++){
    for (var j = 0; j < hidden.length; j++){
      if (hidden[j][1] !== order[i]) continue;
      var st = hidden[j][0];
      if (others.indexOf(st) >= 0)
        return { name: gyeokName(sipseong(ilganIdx, GAN.indexOf(st))),
                 basis: "월지 " + wj + " " + order[i] + " " + st + " 투출" };
    }
  }
  var jg = jiJeonggi(wj);
  return { name: gyeokName(sipseong(ilganIdx, GAN.indexOf(jg))),
           basis: "월지 " + wj + " 정기 " + jg + " (투출 없음)" };
}

/* ── 용신 ────────────────────────────────────────────────── */
function yongsin(ilganIdx, str, prof, jh){
  var scores = prof.scores;
  var dw = GAN_WX[ilganIdx];
  // 종격 — 일간을 돕는 비겁(자신 제외)·인성이 전혀 없으면 대세를 따른다
  if (prof.sip.bigeop <= 1 && prof.sip.inseong === 0){
    var dom = 0;
    for (var d2 = 1; d2 < 5; d2++) if (scores[d2] > scores[dom]) dom = d2;
    var hui2 = -1, gi2 = -1, gu2 = -1;
    for (var h2 = 0; h2 < 5; h2++) if (SAENG[h2] === dom) hui2 = h2;
    for (var g2 = 0; g2 < 5; g2++) if (GEUK[g2] === dom) gi2 = g2;
    for (var u2 = 0; u2 < 5; u2++) if (SAENG[u2] === gi2) gu2 = u2;
    return { yong:dom, hui:hui2, gi:gi2, gu:gu2, jong:true,
             reason:"종격 · 대세 " + WX_HANJA[dom] + "를 따름" };
  }
  var bigeop = dw, siksang = SAENG[dw], jaeseong = GEUK[dw], inseong = -1, gwanseong = -1;
  for (var w = 0; w < 5; w++){
    if (SAENG[w] === dw) inseong = w;
    if (GEUK[w]  === dw) gwanseong = w;
  }
  var pick, reason;
  function drain(){                                  // 덜어내는 쪽 — 관·재·식
    var c = [{wx:gwanseong,n:"관성",s:scores[gwanseong]},
             {wx:jaeseong, n:"재성",s:scores[jaeseong]},
             {wx:siksang,  n:"식상",s:scores[siksang]}].filter(function(x){ return x.s > 0; });
    if (!c.length) c = [{wx:gwanseong,n:"관성",s:0}];
    c.sort(function(a,b){ return b.s - a.s; });
    return c[0];
  }
  function boost(){                                  // 돕는 쪽 — 인·비. 모자란 쪽을 채운다
    var d = [{wx:inseong,n:"인성",s:scores[inseong]},{wx:bigeop,n:"비겁",s:scores[bigeop]}];
    d.sort(function(a,b){ return a.s - b.s; });
    return d[0];
  }
  if (str.strong){
    var c1 = drain(); pick = c1.wx; reason = "억부 · " + c1.n + "으로 설기";
  } else if (str.weak){
    if (scores[gwanseong] >= 25){ pick = inseong; reason = "억부 · 살인상생"; }
    else { var d1 = boost(); pick = d1.wx; reason = "억부 · " + d1.n + "으로 부조"; }
  } else {
    // 중화 — 억부의 연장선에서, 기운 쪽을 되돌린다
    if (str.pct < 50){ var d2 = boost(); pick = d2.wx; reason = "중화 · " + d2.n + "으로 보강"; }
    else if (str.pct > 50){ var c2 = drain(); pick = c2.wx; reason = "중화 · " + c2.n + "으로 설기"; }
    else {
      var min = 0;
      for (var i = 1; i < 5; i++) if (scores[i] < scores[min]) min = i;
      pick = min; reason = "중화 · 최약 오행 보완";
    }
  }
  if (jh.need != null && jh.need !== pick && scores[jh.need] <= 10){
    pick = jh.need; reason = "조후 · " + WX_HANJA[jh.need] + "기 보강";
  }
  var hui = -1, gi = -1, gu = -1;
  for (var a = 0; a < 5; a++) if (SAENG[a] === pick) hui = a;
  for (var b = 0; b < 5; b++) if (GEUK[b]  === pick) gi  = b;
  for (var c2 = 0; c2 < 5; c2++) if (SAENG[c2] === gi) gu = c2;
  return { yong: pick, hui: hui, gi: gi, gu: gu, jong: false, reason: reason };
}

/* ── 대운 ────────────────────────────────────────────────── */
function daeun(chart, sex, count){
  count = count || 8;
  var p = chart.pillars;
  var yangYear = GAN_YANG[GAN.indexOf(p.nyeon.gan)] === 1;
  var forward = (yangYear === (sex === "M"));          // 양남 · 음녀 순행
  var days = forward ? (chart.monthTermEnd - chart.jdUT) : (chart.jdUT - chart.monthTermStart);
  var startAge = Math.max(1, Math.round(days / 3));
  var gi = GAN.indexOf(p.wol.gan), ji = JI.indexOf(p.wol.ji), list = [];
  for (var i = 1; i <= count; i++){
    var g = mod(gi + (forward ? i : -i), 10), j = mod(ji + (forward ? i : -i), 12);
    list.push({ from: startAge + (i-1)*10, to: startAge + (i-1)*10 + 9,
                gan: GAN[g], ji: JI[j],
                sipGan: sipseong(chart.ilganIdx, g),
                sipJi:  sipseongOfJi(chart.ilganIdx, JI[j]) });
  }
  return { forward: forward, startAge: startAge, days: days, list: list };
}
/* 운 한 칸이 용신 쪽 기운을 데려오는지 기신 쪽을 데려오는지만 가린다.
   '대길·흉' 같은 등급은 매기지 않는다. 등급을 적어 두면 읽는 사람이 그 두 글자만
   보고 말기 때문에, 무엇이 어떻게 들어오는지 문장으로 푸는 쪽을 택했다. */
function unBearing(ganWx, jiWx, ys){
  function side(w){
    if (w === ys.yong || w === ys.hui) return 1;
    if (w === ys.gi   || w === ys.gu)  return -1;
    return 0;
  }
  var a = side(ganWx), b = side(jiWx);
  return { favor: (a > 0 || b > 0), block: (a < 0 || b < 0),
           gan: a, ji: b };
}

/* ── 개운 ────────────────────────────────────────────────── */
var REMEDY = [
  { color:"청색 · 녹색", dir:"동",   num:"3 · 8",  time:"봄 · 새벽",     job:"교육 · 기획 · 출판" },
  { color:"적색 · 자주", dir:"남",   num:"2 · 7",  time:"여름 · 한낮",   job:"홍보 · 문화 · 요식" },
  { color:"황색 · 갈색", dir:"중앙", num:"5 · 10", time:"환절기 · 사이", job:"부동산 · 중개 · 건축" },
  { color:"백색 · 은색", dir:"서",   num:"4 · 9",  time:"가을 · 저녁",   job:"금융 · 기계 · 의료" },
  { color:"흑색 · 남색", dir:"북",   num:"1 · 6",  time:"겨울 · 밤",     job:"유통 · 연구 · 무역" }
];

/* ── 음력 ────────────────────────────────────────────────── */
function newMoonJDE(k){
  var T = k/1236.85, T2 = T*T, T3 = T2*T, T4 = T3*T;
  var jde = 2451550.09766 + 29.530588861*k + 0.00015437*T2 - 0.000000150*T3 + 0.00000000073*T4;
  var E  = 1 - 0.002516*T - 0.0000074*T2;
  var M  = (2.5534 + 29.10535670*k - 0.0000014*T2 - 0.00000011*T3) * DEG;
  var Mp = (201.5643 + 385.81693528*k + 0.0107582*T2 + 0.00001238*T3 - 0.000000058*T4) * DEG;
  var F  = (160.7108 + 390.67050284*k - 0.0016118*T2 - 0.00000227*T3 + 0.000000011*T4) * DEG;
  var Om = (124.7746 - 1.56375588*k + 0.0020672*T2 + 0.00000215*T3) * DEG;
  var c = -0.40720*Math.sin(Mp) + 0.17241*E*Math.sin(M) + 0.01608*Math.sin(2*Mp)
        + 0.01039*Math.sin(2*F) + 0.00739*E*Math.sin(Mp-M) - 0.00514*E*Math.sin(Mp+M)
        + 0.00208*E*E*Math.sin(2*M) - 0.00111*Math.sin(Mp-2*F) - 0.00057*Math.sin(Mp+2*F)
        + 0.00056*E*Math.sin(2*Mp+M) - 0.00042*Math.sin(3*Mp) + 0.00042*E*Math.sin(M+2*F)
        + 0.00038*E*Math.sin(M-2*F) - 0.00024*E*Math.sin(2*Mp-M) - 0.00017*Math.sin(Om)
        - 0.00007*Math.sin(Mp+2*M);
  var A = 0.000325*Math.sin((299.77 + 0.107408*k - 0.009173*T2)*DEG)
        + 0.000165*Math.sin((251.88 + 0.016321*k)*DEG)
        + 0.000164*Math.sin((251.83 + 26.651886*k)*DEG)
        + 0.000126*Math.sin((349.42 + 36.412478*k)*DEG)
        + 0.000110*Math.sin((84.66 + 18.206239*k)*DEG)
        + 0.000062*Math.sin((141.74 + 53.303771*k)*DEG)
        + 0.000060*Math.sin((207.14 + 2.453732*k)*DEG)
        + 0.000056*Math.sin((154.84 + 7.306860*k)*DEG)
        + 0.000047*Math.sin((34.52 + 27.261239*k)*DEG)
        + 0.000042*Math.sin((207.19 + 0.121824*k)*DEG)
        + 0.000040*Math.sin((291.34 + 1.844379*k)*DEG)
        + 0.000037*Math.sin((161.72 + 24.198154*k)*DEG)
        + 0.000035*Math.sin((239.56 + 25.513099*k)*DEG)
        + 0.000023*Math.sin((331.55 + 3.592518*k)*DEG);
  return jde + c + A;
}
function nmDay(k){                                   // 그 삭이 드는 날(KST 일련번호)
  var jde = newMoonJDE(k);
  var ut  = jde - deltaT(fromJD(jde).y)/86400;
  return jdn(ut + 9/24);
}
function month11K(gYear){                            // 동지가 든 삭월 = 11월
  var ws = solarTermUT(toJD(gYear, 12, 21, 12, 0, 0), 270);
  var wsDay = jdn(ws + 9/24);
  var k = Math.floor((ws - 2451550.09766) / 29.530588861);
  while (nmDay(k) > wsDay) k--;
  while (nmDay(k+1) <= wsDay) k++;
  return k;
}
function hasZhongqi(k){                              // 중기(황경 30의 배수) 포함 여부
  var a = nmDay(k) - 0.5 - 9/24, b = nmDay(k+1) - 0.5 - 9/24;   // 월 시작·끝의 UT
  return Math.floor(sunLonUT(a)/30) !== Math.floor(sunLonUT(b)/30);
}
function lunarDate(y, m, d){
  var D = jdn(toJD(y, m, d, 12, 0, 0));
  var baseYear = y, base = month11K(baseYear);
  if (nmDay(base) > D){ baseYear = y - 1; base = month11K(baseYear); }
  var next = month11K(baseYear + 1);
  var span = next - base;
  var k = base;
  while (nmDay(k+1) <= D) k++;
  var n = k - base;
  var leapIdx = -1;
  if (span === 13) for (var i = 1; i <= 13; i++) if (!hasZhongqi(base + i)){ leapIdx = i; break; }
  var leap = false, num = n;
  if (leapIdx > 0){
    if (n === leapIdx){ leap = true; num = n - 1; }
    else if (n > leapIdx) num = n - 1;
  }
  var month = mod(num + 10, 12) + 1;
  return { year: num <= 1 ? baseYear : baseYear + 1, month: month, leap: leap,
           day: D - nmDay(k) + 1 };
}

/* ── 세운 ────────────────────────────────────────────────── */
function yearPillar(year){
  var i = mod(year - 1984, 60);
  return { gan: GAN[mod(i,10)], ji: JI[mod(i,12)] };
}

/* ── 월운 ────────────────────────────────────────────────────
   한 해 열두 달의 월주. 달력 월이 아니라 절기가 가른다 — 寅월은 입춘에서
   경칩까지다. 그래서 각 달의 시작을 태양황경으로 직접 구한다.
   해의 경계도 입춘이므로, 입춘 전에 드는 寅월 앞자락은 지난해 간지를 쓴다. */
var MONTH_TERM = ["입춘","경칩","청명","입하","망종","소서",
                  "입추","백로","한로","입동","대설","소한"];
function monthLuck(year, ilganIdx){
  var out = [];
  for (var k = 0; k < 12; k++){
    var lon = mod360(315 + k * 30);
    // k=0 은 입춘(315°), k=10 은 대설(255°), k=11 은 소한(285°) — 뒤 둘은 이듬해로 넘어간다
    var guess = toJD(year, 2, 4, 12, 0, 0) + k * 30.44;
    var jd = solarTermUT(guess, lon);
    var d  = fromJD(jd + 9/24);                       // 한국 시각으로 보여 준다
    var yi = mod(year - 1984, 60);
    var yGan = GAN[mod(yi, 10)];
    var inGan = mod(mod(GAN.indexOf(yGan), 5) * 2 + 2, 10);
    out.push({
      idx: k,
      ji: JI[mod(2 + k, 12)],
      gan: GAN[mod(inGan + k, 10)],
      term: MONTH_TERM[k],
      from: { y:d.y, m:d.m, d:d.d, hh:d.hh, mm:d.mm },
      sipGan: sipseong(ilganIdx, mod(inGan + k, 10)),
      sipJi:  sipseongOfJi(ilganIdx, JI[mod(2 + k, 12)])
    });
  }
  return out;
}

/* ── 궁합 ────────────────────────────────────────────────────
   두 명식을 나란히 놓고, 무엇이 서로 맞물리는지 사실만 모은다.
   점수는 그 사실들을 세어 낸 것일 뿐 길흉 판정이 아니다. */
function gunghap(a, b){
  var pa = a.pillars, pb = b.pillars;
  var facts = [], plus = 0, minus = 0;
  function add(kind, where, text, w){
    facts.push({ kind:kind, where:where, text:text, weight:w });
    if (w > 0) plus += w; else minus += -w;
  }
  // 한자로 적어도 조사는 한글 읽기를 따른다 — 金은 '금'이라 '을', 水는 '수'라 '를'
  function wxJ(w, withJong, without){
    return WX_HANJA[w] + ("목금".indexOf(WX_KO[w]) >= 0 ? withJong : without);
  }

  // 일간끼리 — 두 사람의 본질이 만나는 자리
  var ga = pa.il.gan, gb = pb.il.gan;
  var hap = GAN_HAP[ga+gb] || GAN_HAP[gb+ga];
  if (hap) add("합", "일간", ga + gb + " 천간합 → " + hap, 3);
  else if (GAN_CHUNG.indexOf(ga+gb) >= 0 || GAN_CHUNG.indexOf(gb+ga) >= 0)
    add("충", "일간", ga + gb + " 천간충", -3);
  var wa = GAN_WX[GAN.indexOf(ga)], wb = GAN_WX[GAN.indexOf(gb)];
  if (wa === wb) add("동", "일간", "두 일간이 같은 " + WX_HANJA[wa], 1);
  else if (SAENG[wa] === wb) add("생", "일간", wxJ(wa,"이","가") + " " + wxJ(wb,"을","를") + " 생함 (본인이 상대를 밀어 줌)", 2);
  else if (SAENG[wb] === wa) add("생", "일간", wxJ(wb,"이","가") + " " + wxJ(wa,"을","를") + " 생함 (상대가 본인을 밀어 줌)", 2);
  else if (GEUK[wa] === wb) add("극", "일간", wxJ(wa,"이","가") + " " + wxJ(wb,"을","를") + " 극함 (본인이 상대를 누름)", -2);
  else if (GEUK[wb] === wa) add("극", "일간", wxJ(wb,"이","가") + " " + wxJ(wa,"을","를") + " 극함 (상대가 본인을 누름)", -2);

  // 일지끼리 — 배우자 자리가 맞물리는 방식
  var ja = pa.il.ji, jb = pb.il.ji;
  var yh = YUKHAP[ja+jb] || YUKHAP[jb+ja];
  if (yh) add("합", "일지", ja + jb + " 육합 → " + yh, 3);
  for (var s = 0; s < SAMHAP.length; s++){
    var t = SAMHAP[s];
    if (t.indexOf(ja) >= 0 && t.indexOf(jb) >= 0 && ja !== jb)
      add("합", "일지", ja + jb + " 반합" + t[3], 3);
  }
  if (inPairs(JI_CHUNG, ja, jb)) add("충", "일지", ja + jb + " 충", -3);
  if (inPairs(WONJIN, ja, jb))   add("원진", "일지", ja + jb + " 원진", -2);
  if (inPairs(GWIMUN, ja, jb))   add("귀문", "일지", ja + jb + " 귀문", -1);
  if (inPairs(HAE, ja, jb))      add("해", "일지", ja + jb + " 해", -1);
  if (inPairs(PA, ja, jb))       add("파", "일지", ja + jb + " 파", -1);
  if (ja === jb)                 add("동", "일지", "일지가 " + ja + "로 같음", 1);

  // 띠(연지)끼리 — 집안과 바깥에서 보는 자리
  var na = pa.nyeon.ji, nb = pb.nyeon.ji;
  if (inPairs(JI_CHUNG, na, nb)) add("충", "연지", na + nb + " 충 (띠 충)", -1);
  else {
    var ny = YUKHAP[na+nb] || YUKHAP[nb+na];
    if (ny) add("합", "연지", na + nb + " 육합 (띠 합)", 1);
    for (var s2 = 0; s2 < SAMHAP.length; s2++){
      var t2 = SAMHAP[s2];
      if (t2.indexOf(na) >= 0 && t2.indexOf(nb) >= 0 && na !== nb)
        add("합", "연지", na + nb + " 반합 (띠 삼합)", 1);
    }
  }

  // 용신을 서로 채워 주는가 — 궁합에서 가장 무겁게 보는 대목
  function fills(one, two, who){
    var sc = two.profile.scores;
    var need = one.yongsin.yong, hui = one.yongsin.hui, gi = one.yongsin.gi;
    if (sc[need] >= 25) add("용신", who, wxJ(need,"이","가") + " " + sc[need] + "점으로 " + who + " 용신을 채워 줌", 4);
    else if (sc[hui] >= 25) add("용신", who, wxJ(hui,"이","가") + " " + sc[hui] + "점으로 " + who + " 희신을 채워 줌", 2);
    if (sc[gi] >= 50) add("기신", who, wxJ(gi,"이","가") + " " + sc[gi] + "점으로 " + who + " 기신을 더 키움", -2);
  }
  fills(a, b, "본인");
  fills(b, a, "상대");

  // 서로의 빈 오행을 메우는가
  var missA = [], missB = [];
  for (var w = 0; w < 5; w++){
    if (a.profile.counts[w] === 0 && b.profile.counts[w] > 0) missA.push(WX_HANJA[w]);
    if (b.profile.counts[w] === 0 && a.profile.counts[w] > 0) missB.push(WX_HANJA[w]);
  }
  if (missA.length) add("보완", "본인", "본인에게 없는 " + missA.join("·") + "를 상대가 가짐", missA.length);
  if (missB.length) add("보완", "상대", "상대에게 없는 " + missB.join("·") + "를 본인이 가짐", missB.length);

  // 상대의 일간이 나에게 무슨 십성인가 — 관계의 성격을 가른다
  var sipAB = sipseong(a.chart.ilganIdx, GAN.indexOf(gb));
  var sipBA = sipseong(b.chart.ilganIdx, GAN.indexOf(ga));

  var total = plus + minus;
  var score = total ? Math.round(plus / total * 100) : 50;
  return { facts:facts, plus:plus, minus:minus, score:score,
           sipAB:sipAB, sipBA:sipBA,
           ilgan:{ a:ga, b:gb }, ilji:{ a:ja, b:jb } };
}

/* ── 전체 분석 ───────────────────────────────────────────── */
function analyze(input){
  var chart = computeChart(input);
  var p = chart.pillars, ig = chart.ilganIdx;
  var gans = [p.si.gan, p.il.gan, p.wol.gan, p.nyeon.gan];
  var jis  = [p.si.ji,  p.il.ji,  p.wol.ji,  p.nyeon.ji];

  var prof = elementProfile(p, ig);
  var str  = strength(p, ig);
  var jh   = johu(p, prof.scores);
  var gg   = gyeokguk(p, ig);
  var ys   = yongsin(ig, str, prof, jh);
  var du   = daeun(chart, input.sex, 8);
  du.list.forEach(function(r){
    r.bearing = unBearing(GAN_WX[GAN.indexOf(r.gan)], JI_WX[JI.indexOf(r.ji)], ys);
  });

  var gm = gongmang(chart.dayIdx60);
  var sinsal = findSinsal(p);
  if (jis.indexOf(gm[0]) >= 0 || jis.indexOf(gm[1]) >= 0) sinsal.push("공망 " + gm.join(""));

  var sp = specials(p);
  sp.grades = prof.scores.map(gradeOf);

  return {
    chart: chart, pillars: p, sex: input.sex, profile: prof, strength: str, johu: jh,
    gyeokguk: gg, yongsin: ys, daeun: du, sinsal: sinsal, gongmang: gm, special: sp,
    sibiSinsal: twelveSinsal(p),
    relations: findRelations(gans, jis),
    remedy: {
      wx: WX_HANJA[ys.yong] + " · " + WX_HANJA[ys.hui],
      color: REMEDY[ys.yong].color, dir: REMEDY[ys.yong].dir,
      num: REMEDY[ys.yong].num, time: REMEDY[ys.yong].time,
      job: REMEDY[ys.yong].job + " · " + REMEDY[ys.hui].job
    },
    sipseong: {
      gan: { si: sipseong(ig, GAN.indexOf(p.si.gan)), il: "日元",
             wol: sipseong(ig, GAN.indexOf(p.wol.gan)),
             nyeon: sipseong(ig, GAN.indexOf(p.nyeon.gan)) },
      ji:  { si: sipseongOfJi(ig, p.si.ji), il: sipseongOfJi(ig, p.il.ji),
             wol: sipseongOfJi(ig, p.wol.ji), nyeon: sipseongOfJi(ig, p.nyeon.ji) }
    },
    jijang: {
      si: JIJANG[p.si.ji].map(function(x){ return x[0]; }).join(""),
      il: JIJANG[p.il.ji].map(function(x){ return x[0]; }).join(""),
      wol: JIJANG[p.wol.ji].map(function(x){ return x[0]; }).join(""),
      nyeon: JIJANG[p.nyeon.ji].map(function(x){ return x[0]; }).join("")
    },
    unseong: {
      si: unseong(p.il.gan, p.si.ji), il: unseong(p.il.gan, p.il.ji),
      wol: unseong(p.il.gan, p.wol.ji), nyeon: unseong(p.il.gan, p.nyeon.ji)
    }
  };
}

return {
  GAN:GAN, JI:JI, GAN_KO:GAN_KO, JI_KO:JI_KO,
  WX_KEY:WX_KEY, WX_HANJA:WX_HANJA, WX_KO:WX_KO,
  GAN_WX:GAN_WX, JI_WX:JI_WX, JIJANG:JIJANG, WEIGHT:WEIGHT,
  toJD:toJD, fromJD:fromJD, jdn:jdn, sunLonUT:sunLonUT, solarTermUT:solarTermUT,
  deltaT:deltaT, equationOfTime:equationOfTime, standardMeridian:standardMeridian, inDST:inDST,
  computeChart:computeChart, analyze:analyze,
  sipseong:sipseong, sipseongOfJi:sipseongOfJi, unseong:unseong,
  findRelations:findRelations, findSinsal:findSinsal, gongmang:gongmang,
  SIBI_SINSAL:SIBI_SINSAL, sibiSinsal:sibiSinsal, twelveSinsal:twelveSinsal,
  HONGYEOM:HONGYEOM, CHEONEUL:CHEONEUL, BAEKHO:BAEKHO, GWAEGANG:GWAEGANG,
  lunarDate:lunarDate, yearPillar:yearPillar, unBearing:unBearing, REMEDY:REMEDY,
  monthLuck:monthLuck, gunghap:gunghap, MONTH_TERM:MONTH_TERM,
  JI_GROUP:JI_GROUP, groupOf:groupOf, gradeOf:gradeOf, specials:specials,
  interactWith:interactWith
};
});
