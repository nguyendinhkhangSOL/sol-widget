/**
 * sol-flow.js — P1→P2→P3 Interconnection Module
 * huongdi.sol.vn
 *
 * Include this at the bottom of p1.html, p2.html, p3.html
 * Provides: progress strip, result summary cards, reset functions
 */

(function(){
'use strict';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
/* ── Sol Flow Global Styles ── */
#sol-progress-strip {
  background:#fff;
  border-bottom:1px solid #e5e7eb;
  padding:8px 20px;
  display:flex;
  align-items:center;
  gap:6px;
  font-size:12px;
  flex-wrap:wrap;
}
.sol-step {
  display:flex;
  align-items:center;
  gap:5px;
  color:#9ca3af;
  font-weight:500;
  white-space:nowrap;
}
.sol-step.done { color:#1a6b4a; }
.sol-step.active { color:#1a6b4a; font-weight:700; }
.sol-step-dot {
  width:20px; height:20px;
  border-radius:50%;
  background:#e5e7eb;
  color:#9ca3af;
  font-size:10px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  flex-shrink:0;
}
.sol-step.done .sol-step-dot {
  background:#1a6b4a;
  color:#fff;
}
.sol-step.active .sol-step-dot {
  background:#f59e0b;
  color:#fff;
}
.sol-arrow { color:#d1d5db; font-size:12px; margin:0 2px; }

/* ── P1 Summary Card ── */
.sol-p1-card {
  background:linear-gradient(135deg,#e8f5ee 0%,#f0fdf4 100%);
  border:1px solid #86efac;
  border-radius:14px;
  padding:18px 20px;
  margin-bottom:20px;
  position:relative;
}
.sol-p1-card .sol-card-hd {
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:12px;
  flex-wrap:wrap;
  gap:8px;
}
.sol-p1-card .sol-card-badge {
  display:flex;
  align-items:center;
  gap:8px;
}
.sol-p1-card .sol-card-badge .ico { font-size:20px; }
.sol-p1-card .sol-card-badge strong {
  font-size:14px;
  color:#1a6b4a;
  font-weight:700;
  display:block;
  line-height:1.2;
}
.sol-p1-card .sol-card-badge span {
  font-size:12px;
  color:#4b7a5f;
}
.sol-card-actions {
  display:flex;
  gap:8px;
  align-items:center;
}
.sol-btn-view {
  font-size:12px;
  color:#1a6b4a;
  background:transparent;
  border:1px solid #86efac;
  border-radius:8px;
  padding:5px 11px;
  cursor:pointer;
  text-decoration:none;
  font-weight:600;
  white-space:nowrap;
}
.sol-btn-view:hover { background:#d1fae5; }
.sol-btn-reset {
  font-size:12px;
  color:#ef4444;
  background:transparent;
  border:1px solid #fca5a5;
  border-radius:8px;
  padding:5px 11px;
  cursor:pointer;
  font-weight:600;
  white-space:nowrap;
}
.sol-btn-reset:hover { background:#fee2e2; }

/* DNA mini bars */
.sol-dna-bars { display:grid; gap:5px; }
.sol-dna-row {
  display:flex;
  align-items:center;
  gap:8px;
}
.sol-dna-label {
  font-size:11px;
  color:#374151;
  width:86px;
  flex-shrink:0;
  font-weight:500;
}
.sol-dna-track {
  flex:1;
  height:7px;
  background:#d1fae5;
  border-radius:99px;
  overflow:hidden;
}
.sol-dna-fill {
  height:100%;
  background:#1a6b4a;
  border-radius:99px;
  transition:width .6s ease;
}
.sol-dna-fill.rank-1 { background:#1a6b4a; }
.sol-dna-fill.rank-2 { background:#2e8b63; }
.sol-dna-fill.rank-3 { background:#6fcfa0; }
.sol-dna-fill.rank-4 { background:#a7f3d0; }
.sol-dna-val {
  font-size:11px;
  color:#6b7280;
  width:30px;
  text-align:right;
  flex-shrink:0;
  font-weight:600;
}

/* ── P2 Summary Card ── */
.sol-p2-card {
  background:linear-gradient(135deg,#fef3c7 0%,#fffbeb 100%);
  border:1px solid #fcd34d;
  border-radius:14px;
  padding:18px 20px;
  margin-bottom:20px;
  position:relative;
}
.sol-p2-card .sol-card-hd {
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:12px;
  flex-wrap:wrap;
  gap:8px;
}
.sol-p2-card .sol-card-badge strong { color:#92400e; }
.sol-p2-card .sol-card-badge span { color:#a16207; }
.sol-p2-card .sol-btn-view { color:#92400e; border-color:#fcd34d; }
.sol-p2-card .sol-btn-view:hover { background:#fef3c7; }
.sol-p2-chips {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.sol-chip {
  display:flex;
  align-items:center;
  gap:5px;
  background:rgba(255,255,255,.7);
  border:1px solid #fcd34d;
  border-radius:20px;
  padding:3px 10px;
  font-size:11px;
  color:#92400e;
  font-weight:600;
}
.sol-chip .chip-bar {
  width:28px;
  height:5px;
  background:#fde68a;
  border-radius:99px;
  overflow:hidden;
  display:inline-block;
}
.sol-chip .chip-fill {
  height:100%;
  background:#f59e0b;
  border-radius:99px;
}

/* ── Collapse toggle ── */
.sol-collapse-btn {
  font-size:11px;
  color:#6b7280;
  background:none;
  border:none;
  cursor:pointer;
  padding:0;
  margin-top:6px;
  display:flex;
  align-items:center;
  gap:4px;
}
.sol-collapse-btn:hover { color:#374151; }
.sol-collapsible { overflow:hidden; transition:max-height .3s ease; }

@media(max-width:480px){
  .sol-p1-card .sol-card-hd,
  .sol-p2-card .sol-card-hd { flex-direction:column; align-items:flex-start; }
  .sol-card-actions { flex-wrap:wrap; }
}
`;

// ─── Inject CSS once ─────────────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('sol-flow-css')) return;
  const s = document.createElement('style');
  s.id = 'sol-flow-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
function getP1(){
  try {
    const d = JSON.parse(localStorage.getItem('p1_result')||'null');
    if(!d || !d.scores) return null;
    // Normalize scores to 0-100
    const norm = d.scores_normalized ? {...d.scores_normalized} : {};
    if(!norm.people){
      Object.entries(d.scores).forEach(([k,v])=>{
        norm[k] = Math.round(Math.max(0,Math.min(100,(v-20)/80*100)));
      });
    }
    return { raw:d.scores, norm, ranking:d.ranking||d.p1Rank||[], title:d.title||'', meta:d };
  } catch(e){ return null; }
}

function getP2(){
  try {
    const d = JSON.parse(localStorage.getItem('p2_result')||'null');
    if(!d || !d.scores) return null;
    const sc = d.scores;
    return {
      capital: sc.capScore||0,
      time: sc.timeScore||0,
      technology: sc.techScore||0,
      network: sc.netScore||0,
      risk: sc.riskScore||0,
      energy: sc.energyScore||0,
      experience: sc.expScore||0,
      incomeGoal: (d.S&&d.S.incIdeal) ? d.S.incIdeal : 10,
      meta: d
    };
  } catch(e){ return null; }
}

// ─── Reset functions ──────────────────────────────────────────────────────────
function resetP1(){
  if(confirm('Xóa kết quả P1 và làm lại bài trắc nghiệm DNA?')){
    localStorage.removeItem('p1_result');
    window.location.href='/p1.html';
  }
}
function resetP2(){
  if(confirm('Xóa kết quả P2 và khai báo lại nguồn lực?')){
    localStorage.removeItem('p2_result');
    window.location.href='/p2.html';
  }
}
function resetAll(){
  if(confirm('Xóa tất cả kết quả P1 + P2 và bắt đầu lại từ đầu?')){
    localStorage.removeItem('p1_result');
    localStorage.removeItem('p2_result');
    localStorage.removeItem('p3_saved');
    window.location.href='/p1.html';
  }
}

// ─── Progress strip ───────────────────────────────────────────────────────────
function injectProgressStrip(){
  const p1 = getP1();
  const p2 = getP2();
  const path = window.location.pathname;
  const onP1 = /\/p1(\.html)?$/.test(path) || path === '/';
  const onP2 = /\/p2(\.html)?$/.test(path);
  const onP3 = /\/p3/.test(path);

  const stepData = [
    { n:1, label:'P1 · DNA', done:!!p1, active:onP1, href:'/p1.html' },
    { n:2, label:'P2 · Nguồn lực', done:!!p2, active:onP2, href:'/p2.html' },
    { n:3, label:'P3 · Hướng đi', done:false, active:onP3, href:'/p3.html' },
  ];

  const stepsHtml = stepData.map((s,i) => `
    <div class="sol-step${s.done?' done':''}${s.active?' active':''}">
      <span class="sol-step-dot">${s.done?'✓':s.n}</span>
      <a href="${s.href}" style="color:inherit;text-decoration:none">${s.label}</a>
      ${i<2?'<span class="sol-arrow">→</span>':''}
    </div>
  `).join('');

  const strip = document.createElement('div');
  strip.id = 'sol-progress-strip';
  strip.innerHTML = stepsHtml;

  // Insert after .hdr (sticky header)
  const hdr = document.querySelector('.hdr');
  if(hdr && hdr.nextSibling){
    hdr.parentNode.insertBefore(strip, hdr.nextSibling);
  } else if(document.body.firstChild){
    document.body.insertBefore(strip, document.body.firstChild);
  }
}

// ─── P1 Summary Card ─────────────────────────────────────────────────────────
function renderP1Card(container, opts){
  opts = opts||{};
  const p1 = getP1();
  if(!p1){
    container.innerHTML = `
      <div class="sol-p1-card" style="border-style:dashed;background:#f9fafb;">
        <div class="sol-card-hd">
          <div class="sol-card-badge">
            <span class="ico">⭕</span>
            <div>
              <strong style="color:#6b7280">P1 chưa hoàn thành</strong>
              <span style="color:#9ca3af">Bạn cần hoàn thành bài P1 trước</span>
            </div>
          </div>
          <a href="/p1.html" class="sol-btn-view" style="background:#1a6b4a;color:#fff;border-color:#1a6b4a;">Làm P1 ngay →</a>
        </div>
      </div>`;
    return;
  }

  const dimNames = {people:'Kết Nối',expert:'Chuyên Môn',builder:'Xây Dựng',independent:'Tự Chủ'};
  const order = p1.ranking.length ? p1.ranking : ['expert','independent','builder','people'];
  const barsHtml = order.map((k,i) => `
    <div class="sol-dna-row">
      <span class="sol-dna-label">${dimNames[k]||k}</span>
      <div class="sol-dna-track">
        <div class="sol-dna-fill rank-${i+1}" style="width:${p1.norm[k]||0}%"></div>
      </div>
      <span class="sol-dna-val">${p1.norm[k]||0}</span>
    </div>
  `).join('');

  const primary = dimNames[order[0]]||order[0];

  container.innerHTML = `
    <div class="sol-p1-card">
      <div class="sol-card-hd">
        <div class="sol-card-badge">
          <span class="ico">✅</span>
          <div>
            <strong>P1 hoàn thành · Năng lực chính: ${primary}</strong>
            <span>${p1.title||'DNA Hướng Đi đã xác định'}</span>
          </div>
        </div>
        <div class="sol-card-actions">
          <a href="/p1.html" class="sol-btn-view">Xem lại</a>
          <button class="sol-btn-reset" onclick="SOL.resetP1()">↺ Làm lại P1</button>
        </div>
      </div>
      <div class="sol-collapsible" id="sol-p1-detail">
        <div class="sol-dna-bars">${barsHtml}</div>
      </div>
      <button class="sol-collapse-btn" onclick="SOL._toggle('sol-p1-detail',this)">
        <span>▲</span> Thu gọn
      </button>
    </div>`;
}

// ─── P2 Summary Card ─────────────────────────────────────────────────────────
function renderP2Card(container, opts){
  opts = opts||{};
  const p2 = getP2();
  if(!p2){
    container.innerHTML = `
      <div class="sol-p2-card" style="border-style:dashed;background:#f9fafb;">
        <div class="sol-card-hd">
          <div class="sol-card-badge">
            <span class="ico">⭕</span>
            <div>
              <strong style="color:#6b7280">P2 chưa hoàn thành</strong>
              <span style="color:#9ca3af">Cần khai báo nguồn lực để xem khớp chính xác</span>
            </div>
          </div>
          <a href="/p2.html" class="sol-btn-view" style="background:#f59e0b;color:#fff;border-color:#f59e0b;">Làm P2 ngay →</a>
        </div>
      </div>`;
    return;
  }

  const resLabels = {
    experience:'Kinh nghiệm', capital:'Vốn', time:'Thời gian',
    energy:'Năng lượng', network:'Mạng lưới', technology:'Công nghệ'
  };
  const incomeLabels = {5:'< 5 tr',10:'5-10 tr',20:'10-20 tr',40:'20-40 tr',80:'> 40 tr'};
  const incomeText = incomeLabels[p2.incomeGoal] || `${p2.incomeGoal} tr/tháng`;

  const topResources = ['experience','capital','time','energy','network','technology']
    .map(k=>({k, v:p2[k]||0}))
    .sort((a,b)=>b.v-a.v)
    .slice(0,4);

  const chipsHtml = topResources.map(r=>`
    <div class="sol-chip">
      ${resLabels[r.k]||r.k}
      <div class="chip-bar"><div class="chip-fill" style="width:${r.v}%"></div></div>
      <span>${r.v}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="sol-p2-card">
      <div class="sol-card-hd">
        <div class="sol-card-badge">
          <span class="ico">✅</span>
          <div>
            <strong>P2 hoàn thành · Mục tiêu: ${incomeText}/tháng</strong>
            <span>Nguồn lực mạnh nhất: ${resLabels[topResources[0].k]} (${topResources[0].v})</span>
          </div>
        </div>
        <div class="sol-card-actions">
          <a href="/p2.html" class="sol-btn-view">Xem lại</a>
          <button class="sol-btn-reset" onclick="SOL.resetP2()">↺ Làm lại P2</button>
        </div>
      </div>
      <div class="sol-p2-chips">${chipsHtml}</div>
    </div>`;
}

// ─── Collapse toggle helper ───────────────────────────────────────────────────
function toggleCollapse(id, btn){
  const el = document.getElementById(id);
  if(!el) return;
  const isOpen = el.style.maxHeight !== '0px' && el.style.maxHeight !== '';
  if(isOpen){
    el.style.maxHeight = '0px';
    if(btn) btn.innerHTML = '<span>▼</span> Xem chi tiết';
  } else {
    el.style.maxHeight = el.scrollHeight + 'px';
    if(btn) btn.innerHTML = '<span>▲</span> Thu gọn';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
window.SOL = {
  getP1, getP2,
  resetP1, resetP2, resetAll,
  renderP1Card, renderP2Card,
  injectProgressStrip,
  _toggle: toggleCollapse
};

// ─── Auto-init on DOM ready ───────────────────────────────────────────────────
function init(){
  injectCSS();
  injectProgressStrip();

  // Auto-render P1 summary card on P2 page
  const p1Sum = document.getElementById('sol-p1-summary');
  if(p1Sum) renderP1Card(p1Sum);

  // Auto-render P2 summary card on P3 page (if container exists)
  const p2Sum = document.getElementById('sol-p2-summary');
  if(p2Sum) renderP2Card(p2Sum);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
