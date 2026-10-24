(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ---------- 存储 ---------- */
const KEY = 'pawmath-v1';
const defaults = { settings: { max: 'auto', round: 5, voice: true, frame: true }, stars: 0, level: 5, streak: 0 };
let store;
try { store = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); store.settings = Object.assign({}, defaults.settings, store.settings); }
catch { store = structuredClone(defaults); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
const maxNum = () => store.settings.max === 'auto' ? store.level : Number(store.settings.max);
const unlockedCount = () => Math.min(PUPS.length, 1 + Math.floor(store.stars / 5));
const team = () => PUPS.slice(0, Math.max(unlockedCount(), 3));

/* ---------- 声音 ---------- */
let ac;
const audio = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
function tone(freq, dur, type = 'sine', vol = .25, when = 0, slideTo) {
  const c = audio(); if (!c) return;
  const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
}
const sfx = {
  bark() { tone(620, .12, 'sawtooth', .18, 0, 300); tone(700, .14, 'sawtooth', .18, .18, 320); },
  pop(i = 0) { tone(500 + i * 70, .12, 'triangle', .3); },
  ding() { [784, 988, 1319].forEach((f, i) => tone(f, .25, 'triangle', .25, i * .09)); },
  boing() { tone(300, .35, 'sine', .3, 0, 140); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? .6 : .18, 'square', .12, i * .15)); },
  whoosh() { tone(900, .5, 'sine', .15, 0, 200); },
};

/* ---------- 朗读 ---------- */
let zhVoice = null;
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang) && /Ting|Xiaoxiao|female|女/i.test(v.name)) || vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function say(text, { rate = .92, pitch = 1.25 } = {}) {
  return new Promise(resolve => {
    if (!store.settings.voice || !('speechSynthesis' in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[−-]/g, '减').replace(/\+/g, '加').replace(/=/g, '等于'));
    u.lang = 'zh-CN'; if (zhVoice) u.voice = zhVoice; u.rate = rate; u.pitch = pitch;
    const done = () => { clearTimeout(t); resolve(); };
    const t = setTimeout(resolve, 600 + text.length * 320);
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  });
}

/* ---------- 彩纸 ---------- */
const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], animating = false;
function confetti(n = 80) {
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#1f4fa8', '#e63946', '#ffc300', '#2aa35a', '#ff5fa2', '#ff8c1a'];
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 4,
    r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, s: 8 + Math.random() * 10, c: pick(colors), paw: Math.random() < .25, life: 0 });
  if (!animating) { animating = true; requestAnimationFrame(tick); }
}
function tick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach(p => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    if (p.paw) { cx.font = `${p.s * 2}px serif`; cx.fillText('🐾', 0, 0); } else { cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
    cx.restore(); });
  parts = parts.filter(p => p.y < cv.height + 40 && p.life < 240);
  if (parts.length) requestAnimationFrame(tick); else { animating = false; cx.clearRect(0, 0, cv.width, cv.height); }
}

/* ---------- 页面切换 ---------- */
function show(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
  $('#topbar').classList.toggle('hidden', id === 'start');
  $('#stars').style.visibility = id === 'game' ? 'visible' : 'hidden';
  if (id !== 'game' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

/* ---------- 题目生成 ---------- */
let round = null, q = null, busy = false, countTap = 0;

function makeQuestion(mode, prev) {
  const M = maxNum(); let type = mode === 'mix' ? pick(['add', 'sub', 'add', 'sub', 'count']) : mode, a, b, ans, tries = 0;
  do {
    if (type === 'count') { a = rand(1, M); b = 0; ans = a; }
    else if (type === 'add') { a = rand(1, M - 1); b = rand(1, M - a); ans = a + b; }
    else { a = rand(2, M); b = rand(1, a - 1 > 0 && Math.random() < .85 ? a - 1 : a); ans = a - b; }
  } while (prev && prev.a === a && prev.b === b && prev.type === type && ++tries < 10);
  const host = pick(team()), helper = pick(team().filter(p => p !== host)) || host;
  const usePups = type === 'add' ? Math.random() < .55 : type === 'sub' ? Math.random() < .35 : Math.random() < .3;
  const unit = usePups ? '只' : '块', thing = usePups ? '狗狗' : '骨头';
  let story, speak;
  if (type === 'count') {
    story = `数一数，这里有几${unit}${thing}？用小手指点一点哦！`;
  } else if (type === 'add') {
    story = usePups
      ? `瞭望塔前有 ${a} 只狗狗，${helper.name}又带来了 ${b} 只狗狗。现在一共有几只？`
      : `${host.name}有 ${a} 块骨头，莱德队长又给了 ${b} 块。现在一共有几块？`;
  } else {
    story = usePups
      ? `有 ${a} 只狗狗在玩，${b} 只去执行任务了。还剩几只？`
      : `盘子里有 ${a} 块骨头，${helper.name}吃掉了 ${b} 块。还剩几块？`;
  }
  // 选项
  const opts = new Set([ans]);
  const near = shuffle([ans - 1, ans + 1, ans - 2, ans + 2, type === 'sub' ? a : a + b + 1, type === 'add' ? a : b]);
  for (const n of near) { if (opts.size >= 3) break; if (n >= 0 && n <= Math.max(M, 10) && n !== ans && !(n === 0 && type !== 'sub')) opts.add(n); }
  while (opts.size < 3) opts.add(rand(0, 10));
  const pupsSeq = usePups ? Array.from({ length: a + b }, (_, i) => PUPS[i % PUPS.length]) : null;
  if (pupsSeq) shuffle(pupsSeq);
  return { type, a, b, ans, story, unit, thing, usePups, host, helper, pupsSeq, choices: shuffle([...opts]), tries: 0 };
}

/* ---------- 渲染 ---------- */
function itemHTML(i, group) {
  const inner = q.usePups ? pupSVG(q.pupsSeq[i]) : boneSVG(group === 'b' ? '#ffe9a8' : '#fff6e0');
  return `<div class="item ${q.usePups ? 'pup' : 'bone'}" data-i="${i}" style="animation-delay:${(group === 'b' ? q.a + i * 1 : i) * 0.08 + (group === 'b' ? .4 : 0)}s">${inner}</div>`;
}
function renderScene() {
  const sc = $('#scene'); let html = '';
  if (q.type === 'add') {
    html = `<div class="group a">${Array.from({ length: q.a }, (_, i) => itemHTML(i, 'a')).join('')}</div>
      <div class="op">+</div>
      <div class="group b">${Array.from({ length: q.b }, (_, i) => itemHTML(q.a + i, 'b')).join('')}</div>`;
  } else {
    html = `<div class="group a">${Array.from({ length: q.a }, (_, i) => itemHTML(i, 'a')).join('')}</div>`;
  }
  sc.innerHTML = html;
  $$('#scene .item').forEach(el => el.addEventListener('click', () => tapItem(el)));
  // 算式
  const eq = $('#equation');
  eq.innerHTML = q.type === 'count' ? `<span>一共</span><span class="q">?</span><span>${q.unit}</span>`
    : `<span>${q.a}</span><span>${q.type === 'add' ? '+' : '−'}</span><span>${q.b}</span><span>=</span><span class="q">?</span>`;
  renderFrame(false);
  // 选项
  $('#choices').innerHTML = q.choices.map(n => `<button class="choice" data-n="${n}"><span>${n}</span><span class="dots">${'<i></i>'.repeat(n)}</span></button>`).join('');
  $$('.choice').forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.n), b)));
}
function renderFrame(showGone) {
  const f = $('#frame'); f.classList.toggle('hidden', !store.settings.frame);
  let cells = '';
  for (let i = 0; i < 10; i++) {
    let dot = '';
    if (q.type === 'add') { if (i < q.a) dot = 'a'; else if (i < q.a + q.b) dot = 'b'; }
    else if (q.type === 'sub') { if (i < q.a) dot = (showGone && i >= q.a - q.b) ? 'x' : 'a'; }
    else if (i < q.a) dot = 'a';
    cells += `<div class="cell">${dot ? `<div class="dot ${dot}" style="animation-delay:${i * .05}s"></div>` : ''}</div>`;
  }
  f.innerHTML = cells;
}
function renderStars() {
  $('#stars').innerHTML = Array.from({ length: round.total }, (_, i) => `<span class="s ${i < round.earned ? 'on' : ''}">⭐</span>`).join('');
}

/* ---------- 互动 ---------- */
function tapItem(el) {
  if (el.classList.contains('gone') || el.querySelector('.num')) { el.classList.add('jump'); setTimeout(() => el.classList.remove('jump'), 1000); return; }
  countTap++;
  el.insertAdjacentHTML('beforeend', `<span class="num">${countTap}</span>`);
  el.classList.add('counted'); sfx.pop(countTap); say(String(countTap), { rate: 1.1 });
}
function clearCounts() { countTap = 0; $$('#scene .num').forEach(n => n.remove()); $$('#scene .item').forEach(i => i.classList.remove('counted')); }

async function autoCount() {
  if (busy) return; busy = true; clearCounts();
  const items = $$('#scene .item').filter(i => !i.classList.contains('gone'));
  if (q.type === 'sub') await say(`先拿走 ${q.b} ${q.unit}，再数一数剩下的。`);
  else if (q.type === 'add') await say(`把两边合在一起，从一开始数！`);
  else await say('我们一起数！');
  for (const el of items) {
    countTap++; el.insertAdjacentHTML('beforeend', `<span class="num">${countTap}</span>`); el.classList.add('counted'); sfx.pop(countTap);
    await say(String(countTap), { rate: 1.05 }); await sleep(150);
  }
  busy = false;
}

async function doSubtractAnim() {
  await sleep(900);
  const items = $$('#scene .item');
  for (let i = q.a - q.b; i < q.a; i++) { items[i].classList.add('gone'); sfx.whoosh(); await sleep(260); }
  renderFrame(true);
}

async function answer(n, btn) {
  if (busy || round.locked) return;
  if (n === q.ans) {
    round.locked = true;
    $$('.choice').forEach(b => b !== btn && (b.style.opacity = .3)); btn.classList.add('right');
    const qq = $('#equation .q'); qq.textContent = n; qq.classList.add('ok');
    sfx.ding(); confetti(60); $$('#scene .item:not(.gone)').forEach((el, i) => setTimeout(() => el.classList.add('jump'), i * 60));
    const first = q.tries === 0;
    if (first) { round.earned++; renderStars(); store.streak++; } else store.streak = 0;
    const praise = pick(['太棒了！', '答对啦！', '真厉害！', '汪汪！好样的！', '任务成功！']);
    const explain = q.type === 'count' ? `一共有 ${n} ${q.unit}！` : q.type === 'add' ? `${q.a} 加 ${q.b} 等于 ${n}，合在一起变多啦！` : `${q.a} 减 ${q.b} 等于 ${n}，拿走以后变少啦！`;
    $('#story').textContent = praise + ' ' + explain; hostTalk(true);
    await say(praise + explain);
    // 自动升级
    if (store.settings.max === 'auto' && store.level === 5 && store.streak >= 6) {
      store.level = 10; store.streak = 0; save();
      await overlay(PUPS[0], '升级啦！', '你太厉害了，现在挑战 10 以内的数字！');
    }
    save(); await sleep(500); nextQuestion();
  } else {
    q.tries++; btn.classList.add('wrong'); btn.disabled = true; sfx.boing(); store.streak = 0;
    const msg = q.tries === 1 ? '差一点点！我们一起数一数吧。' : '没关系，再试一次！';
    $('#story').textContent = msg; hostTalk();
    await say(msg);
    if (q.tries === 1) await autoCount();
  }
}

function hostTalk(happy) { const h = $('#hostPup'); h.innerHTML = pupSVG(q.host, { happy }); h.classList.remove('talk'); void h.offsetWidth; h.classList.add('talk'); }

async function nextQuestion() {
  if (round.idx >= round.total) return endRound();
  q = makeQuestion(round.mode, q); round.idx++; round.locked = false; countTap = 0; busy = false;
  $('#story').textContent = q.story; hostTalk(); renderScene();
  if (q.type === 'sub') { busy = true; const p = say(q.story); await doSubtractAnim(); busy = false; await p; }
  else { sfx.bark(); await say(q.story); }
}

function startRound(mode) {
  round = { mode, total: Number(store.settings.round), idx: 0, earned: 0, locked: false }; q = null;
  show('game'); renderStars(); nextQuestion();
}

async function endRound() {
  const before = unlockedCount();
  store.stars += round.earned; save();
  const after = unlockedCount();
  const p = pick(team());
  $('#endPup').innerHTML = pupSVG(p, { happy: true });
  $('#endStars').textContent = '⭐'.repeat(round.earned) + '☆'.repeat(round.total - round.earned);
  const msg = round.earned === round.total ? '满分！你是最棒的救援队员！' : round.earned >= round.total / 2 ? '任务完成！做得真好！' : '任务完成！多练习会越来越棒！';
  $('#endTalk').textContent = `${msg} 得到 ${round.earned} 颗星！`;
  show('end'); sfx.fanfare(); confetti(140);
  await say(`${msg} 你得到了 ${round.earned} 颗星星！`);
  if (after > before) for (let i = before; i < after; i++) await overlay(PUPS[i], `${PUPS[i].name}加入队伍！`, `${PUPS[i].job}：“${PUPS[i].line}”`);
}

function overlay(p, title, text) {
  return new Promise(resolve => {
    $('#overlayCard').innerHTML = `${pupSVG(p, { happy: true })}<h2>${title}</h2><p>${text}</p><button class="big-btn go" id="ovOk">耶！🐾</button>`;
    $('#overlay').classList.remove('hidden'); sfx.fanfare(); confetti(120); say(title + text.replace(/[“”]/g, ''));
    $('#ovOk').onclick = () => { $('#overlay').classList.add('hidden'); sfx.bark(); resolve(); };
  });
}

function renderBadges() {
  const u = unlockedCount();
  $('#badgeGrid').innerHTML = PUPS.map((p, i) => badgeSVG(p, i >= u)).join('');
  const toNext = u < PUPS.length ? `，再得 ${5 - store.stars % 5} 颗星解锁下一位！` : '，全部队员都到齐啦！';
  $('#totalStars').textContent = `一共 ${store.stars} 颗 ⭐${toNext}`;
}

/* ---------- 绑定 ---------- */
$('#startPups').innerHTML = PUPS.slice(0, 6).map(p => pupSVG(p)).join('');
$('#btnStart').onclick = async () => { audio(); sfx.bark(); show('menu'); await say('汪汪队，出发！选一个任务吧！'); };
$$('.mission').forEach(b => b.onclick = () => { sfx.pop(2); startRound(b.dataset.mode); });
$('#btnHome').onclick = () => { sfx.pop(); show('menu'); };
$('#btnReplay').onclick = () => q && say(q.story);
$('#btnHint').onclick = () => q && !round.locked && autoCount();
$('#btnBadges').onclick = () => { renderBadges(); show('badges'); say('看看你的救援队员！'); };
$('#btnBackMenu').onclick = () => show('menu');
$('#btnAgain').onclick = () => startRound(round.mode);
$('#btnEndMenu').onclick = () => show('menu');
const syncVoiceBtn = () => $('#btnVoice').textContent = store.settings.voice ? '🔊' : '🔇';
$('#btnVoice').onclick = () => { store.settings.voice = !store.settings.voice; $('#setVoice').checked = store.settings.voice; save(); syncVoiceBtn(); };
$('#btnParent').onclick = () => {
  const a = rand(3, 9), b = rand(2, 9), r = prompt(`家长验证：${a} × ${b} = ?`);
  if (r === null) return; if (Number(r) !== a * b) { alert('答案不对哦～'); return; }
  $('#setMax').value = store.settings.max; $('#setRound').value = String(store.settings.round);
  $('#setVoice').checked = store.settings.voice; $('#setFrame').checked = store.settings.frame; show('parent');
};
$('#btnParentBack').onclick = () => {
  store.settings.max = $('#setMax').value; store.settings.round = Number($('#setRound').value);
  store.settings.voice = $('#setVoice').checked; store.settings.frame = $('#setFrame').checked; save(); syncVoiceBtn(); show('menu');
};
$('#btnReset').onclick = () => { if (confirm('确定清空所有星星和队员吗？')) { store.stars = 0; store.level = 5; store.streak = 0; save(); alert('已清空'); } };
syncVoiceBtn();

// 测试钩子
window.__paw = { store, startRound, show, get q() { return q; } };
})();
