import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const html = read("index.html");
const app = read("app.js");
const css = read("style.css");
const sw = read("sw.js");

for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target = match[1];
  if (!/^(?:https?:|#|mailto:|javascript:)/.test(target)) {
    assert(exists(target), `Missing HTML asset: ${target}`);
  }
}

for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  const target = match[1];
  if (!/^(?:https?:|data:|#)/.test(target)) {
    assert(exists(target), `Missing CSS asset: ${target}`);
  }
}

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
for (const match of app.matchAll(/#([A-Za-z][\w-]*)/g)) {
  assert(ids.has(match[1]) || match[1] === "icon-arrow", `Missing app DOM id: #${match[1]}`);
}

const i18nKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
const context = { window: {} };
vm.runInNewContext(read("novel-data.js"), context);
const data = context.window.LUNCH_TIME_DATA;
assert(data, "LUNCH_TIME_DATA was not exposed");

for (const key of i18nKeys) {
  for (const language of data.meta.supportedLanguages) {
    assert(Object.hasOwn(data.ui[language], key), `Missing translation: ${language}.${key}`);
  }
}

for (const asset of sw.matchAll(/"(\.\/[^"]+)"/g)) {
  assert(exists(asset[1].replace(/^\.\//, "")), `Missing Service Worker asset: ${asset[1]}`);
}

for (const language of data.meta.supportedLanguages) {
  assert(data.novel.title[language], `Missing novel title: ${language}`);
  assert(data.novel.author[language], `Missing novel author: ${language}`);
  for (const chapter of data.novel.chapters) {
    assert(chapter.title[language], `Missing chapter title: ${chapter.id}.${language}`);
    assert(Array.isArray(chapter.paragraphs[language]), `Missing chapter paragraphs: ${chapter.id}.${language}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join("\n"));
  process.exit(1);
}

console.log("✓ All HTML, CSS, JavaScript, translation, and Service Worker references are valid.");
