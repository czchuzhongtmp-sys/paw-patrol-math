// 原创绘制的救援小狗（SVG），配色致敬汪汪队，不使用任何官方素材
const PUPS = [
  { id:'chase',   name:'阿奇', job:'警察狗狗', fur:'#b97f4e', ear:'#7a4a28', face:'#f3d9b5', hat:'#1f4fa8', icon:'⭐', spots:false, line:'阿奇出动！' },
  { id:'marshall',name:'毛毛', job:'消防狗狗', fur:'#ffffff', ear:'#ffffff', face:'#ffffff', hat:'#e63946', icon:'🔥', spots:true,  line:'我准备好了！' },
  { id:'skye',    name:'天天', job:'飞行狗狗', fur:'#e2b98a', ear:'#a8774a', face:'#fbe7cf', hat:'#ff5fa2', icon:'✈️', spots:false, line:'天天飞上天！' },
  { id:'rubble',  name:'小砾', job:'工程狗狗', fur:'#d9a566', ear:'#9b6a35', face:'#f6dfb9', hat:'#ffc300', icon:'🔧', spots:false, line:'小砾来帮忙！' },
  { id:'rocky',   name:'灰灰', job:'环保狗狗', fur:'#a3a9b0', ear:'#6c7279', face:'#e4e7ea', hat:'#2aa35a', icon:'♻️', spots:false, line:'不要扔，要回收！' },
  { id:'zuma',    name:'路马', job:'水上狗狗', fur:'#6b4226', ear:'#4a2c17', face:'#c79a6e', hat:'#ff8c1a', icon:'⚓', spots:false, line:'下水救援啦！' },
  { id:'everest', name:'珠珠', job:'雪地狗狗', fur:'#c9ccd6', ear:'#7f8597', face:'#ffffff', hat:'#14b8b0', icon:'❄️', spots:false, line:'雪地救援！' },
  { id:'tracker', name:'小克', job:'丛林狗狗', fur:'#d8a76b', ear:'#8a5a2b', face:'#fbe3c2', hat:'#2f7d32', icon:'🌿', spots:false, line:'我听得到！' },
];

function pupSVG(p, opts = {}) {
  const spots = p.spots ? `
    <circle cx="30" cy="48" r="4" fill="#222"/><circle cx="70" cy="60" r="3.5" fill="#222"/>
    <circle cx="66" cy="44" r="2.6" fill="#222"/><circle cx="34" cy="64" r="2.4" fill="#222"/>` : '';
  const stroke = p.fur === '#ffffff' ? '#cfcfcf' : 'rgba(0,0,0,.15)';
  const wink = opts.happy;
  const eye = (x) => wink
    ? `<path d="M${x-6} 54 q6 -7 12 0" stroke="#3b2412" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${x}" cy="53" r="6.8" fill="#3b2412"/><circle cx="${x+2.2}" cy="50.6" r="2.4" fill="#fff"/><circle cx="${x-2}" cy="55.5" r="1" fill="#fff"/>`;
  return `<svg viewBox="0 0 100 100" class="pup-svg" aria-label="${p.name}">
    <g class="ears">
      <ellipse cx="20" cy="46" rx="11" ry="20" fill="${p.ear}" stroke="${stroke}" stroke-width="1.5" transform="rotate(20 20 46)"/>
      <ellipse cx="80" cy="46" rx="11" ry="20" fill="${p.ear}" stroke="${stroke}" stroke-width="1.5" transform="rotate(-20 80 46)"/>
    </g>
    <ellipse cx="50" cy="56" rx="32" ry="30" fill="${p.fur}" stroke="${stroke}" stroke-width="1.5"/>
    ${spots}
    <ellipse cx="50" cy="71" rx="19" ry="13.5" fill="${p.face}" stroke="${stroke}" stroke-width="1"/>
    <circle cx="30" cy="66" r="4.5" fill="#ff9eb5" opacity=".55"/><circle cx="70" cy="66" r="4.5" fill="#ff9eb5" opacity=".55"/>
    ${eye(38)}${eye(62)}
    <ellipse cx="50" cy="64" rx="6.5" ry="4.8" fill="#2b2b2b"/><ellipse cx="48" cy="62.6" rx="2" ry="1.2" fill="#fff" opacity=".7"/>
    <path d="M42 72 q8 8 16 0" stroke="#3b2412" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M47 75 q3 7 6 0 z" fill="#ff6b8a"/>
    <!-- 帽子 -->
    <path d="M24 33 Q50 6 76 33 Z" fill="${p.hat}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>
    <rect x="20" y="30" width="60" height="8" rx="4" fill="${p.hat}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>
    <circle cx="50" cy="24" r="8" fill="#fff" stroke="rgba(0,0,0,.15)"/>
    <text x="50" y="27.5" font-size="10" text-anchor="middle">${p.icon}</text>
  </svg>`;
}

function boneSVG(color = '#fff6e0') {
  const shape = (dx, dy, fill) => `<g transform="translate(${dx},${dy})" fill="${fill}">
      <circle cx="20" cy="18" r="12"/><circle cx="20" cy="42" r="12"/>
      <circle cx="80" cy="18" r="12"/><circle cx="80" cy="42" r="12"/>
      <rect x="18" y="17" width="64" height="26" rx="6"/></g>`;
  return `<svg viewBox="0 0 100 64" class="bone-svg">${shape(0,3,'#c9a46a')}${shape(0,0,color)}
    <path d="M30 26 h40" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`;
}

function badgeSVG(p, locked) {
  return `<div class="badge ${locked ? 'locked' : ''}" style="--c:${p.hat}">
    <div class="badge-ring">${locked ? '<span class="q">?</span>' : pupSVG(p)}</div>
    <div class="badge-name">${locked ? '待解锁' : p.name}</div>
    <div class="badge-job">${locked ? '' : p.job}</div>
  </div>`;
}
