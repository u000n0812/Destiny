#!/usr/bin/env node
/* ============================================================
   build.js — 흩어진 세 파일을 한 파일로 묶는다

     page.html + saju.js + interpret.js  →  index.html

   휴대폰에 옮길 때 파일 셋을 같은 폴더에 두는 일이 번거롭고,
   하나라도 빠지면 계산이 조용히 멈춘다. 그래서 배포본은 한 파일로 만든다.

   고칠 때는 언제나 page.html · saju.js · interpret.js 를 고치고
   `node build.js` 를 다시 돌린다. index.html 은 만들어지는 파일이라
   직접 고쳐도 다음 빌드에 지워진다.
   ============================================================ */
"use strict";

var fs = require("fs");
var path = require("path");

var DIR = __dirname;
var SRC = "page.html";
var OUT = "index.html";
var SCRIPTS = ["saju.js", "interpret.js"];

function read(f){ return fs.readFileSync(path.join(DIR, f), "utf8"); }

// 자바스크립트 안에 </script> 가 그대로 들어가면 태그가 거기서 닫힌다.
// 문자열 안이든 주석 안이든 마찬가지라 한 번 걸러 준다.
function safeInline(code){ return code.replace(/<\/script/gi, "<\\/script"); }

var html = read(SRC);
var missing = [];

SCRIPTS.forEach(function(f){
  var tag = '<script src="' + f + '"></script>';
  if (html.indexOf(tag) < 0){ missing.push(f); return; }
  var code = safeInline(read(f)).replace(/\s+$/, "");
  html = html.replace(tag,
    '<script>\n/* ── ' + f + ' ' + Array(60 - f.length).join("─") + ' */\n' +
    code + '\n</script>');
});

if (missing.length){
  console.error("page.html 에서 다음 script 태그를 찾지 못했습니다: " + missing.join(", "));
  process.exit(1);
}

// 만들어진 파일임을 파일 첫머리에 남긴다
var banner = "<!--\n" +
  "  이 파일은 page.html · saju.js · interpret.js 를 한 파일로 묶은 결과입니다.\n" +
  "  직접 고치지 마십시오. 고칠 곳은 저 세 파일이고, `node build.js` 로 다시 만듭니다.\n" +
  "\n" +
  "  이 파일 하나만 있으면 됩니다. 다른 파일도, 인터넷 연결도 필요 없습니다.\n" +
  "-->\n";
html = html.replace(/^(<!doctype html>\s*\n?)/i, function(m){ return m + banner; });
if (html.indexOf(banner) < 0) html = banner + html;

fs.writeFileSync(path.join(DIR, OUT), html);

var kb = function(n){ return (n / 1024).toFixed(0) + "KB"; };
console.log("index.html 을 만들었습니다 — " + kb(Buffer.byteLength(html)) +
  " (page.html " + kb(fs.statSync(path.join(DIR, SRC)).size) +
  " + " + SCRIPTS.map(function(f){
    return f.replace(".js", "") + " " + kb(fs.statSync(path.join(DIR, f)).size);
  }).join(" + ") + ")");

// 묶은 뒤에도 밖으로 나가는 것이 없는지 확인한다
var external = (html.match(/(?:src|href)\s*=\s*["'](?!#|mailto:)([^"']+)/gi) || [])
  .map(function(m){ return m.replace(/^.*["']/, ""); })
  .filter(function(u){ return !/^https:\/\/(ko\.wikipedia\.org|www\.sazasaju\.com|sajuchunmyung\.com|platform\.openai\.com|namu\.wiki|doc\.8-codes\.com|sajuabc\.com)/.test(u); });
if (external.length) console.log("확인 필요 — 바깥을 가리키는 주소: " + external.join(", "));
else console.log("바깥에서 받아 오는 파일 없음 — 이 파일 하나로 실행됩니다.");
