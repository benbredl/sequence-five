/* functions/client/dashboard.js
   Client bundle for /dashboard
   - Fetches /api/billing/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
   - Populates KPIs
   - Draws very lightweight canvas charts (no external libs)
   - Renders a simple table of daily totals
*/

(function () {
  const $ = (id) => document.getElementById(id);

  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };
  const fmtEUR = (n) => '€' + (Number(n || 0)).toFixed(2);

  const kpiTotal = $('kpiTotal');
  const kpiText = $('kpiText');
  const kpiImage = $('kpiImage');

  const inputFrom = $('from');
  const inputTo = $('to');
  const btnApply = $('apply');

  const cDaily = $('cDaily');
  const cUsage = $('cUsage');
  const tableWrap = $('table');

  // Default range: last 14 days
  const todayISO = new Date().toISOString().slice(0, 10);
  const fromISO = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
  inputFrom.value = fromISO;
  inputTo.value = todayISO;

  // Quick ranges
  document.querySelectorAll('[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-range');
      const now = new Date();
      if (k === 'today') { inputFrom.value = now.toISOString().slice(0, 10); inputTo.value = inputFrom.value; }
      else if (k === 'last7') { inputFrom.value = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10); inputTo.value = todayISO; }
      else if (k === 'month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); inputFrom.value = d.toISOString().slice(0, 10); inputTo.value = todayISO; }
      else if (k === 'year') { const d = new Date(now.getFullYear(), 0, 1); inputFrom.value = d.toISOString().slice(0, 10); inputTo.value = todayISO; }
      load();
    });
  });

  btnApply.addEventListener('click', load);

  async function fetchSummary() {
    const url = new URL('/api/billing/summary', location.origin);
    if (inputFrom.value) url.searchParams.set('from', inputFrom.value);
    if (inputTo.value) url.searchParams.set('to', inputTo.value);
    const r = await fetch(url.toString());
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed');
    return j;
  }

  function setKPIs(data) {
    const grand = Number(data?.totals?.grandTotalUsd || 0);
    const byService = data?.totals?.byService || {};
    const txt = Number(byService.openai || 0); // enhancer text cost
    const img = Number(byService.gemini || 0);
    kpiTotal.textContent = fmtEUR(grand * 0.92); // rough EUR display without FX API
    kpiText.textContent = fmtEUR(txt * 0.92);
    kpiImage.textContent = fmtEUR(img * 0.92);
  }

  function drawLineChart(canvas, labels, series) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;

    const pad = 24;
    const min = 0;
    const max = Math.max(1, Math.max(...series));
    const scaleX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, labels.length - 1);
    const scaleY = (v) => h - pad - ((v - min) * (h - pad * 2)) / (max - min);

    // grid
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#5b648c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = pad + (i * (h - pad * 2)) / 4;
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // line
    ctx.strokeStyle = '#9db5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach((v, i) => {
      const x = scaleX(i);
      const y = scaleY(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // dots
    ctx.fillStyle = '#dfe7ff';
    series.forEach((v, i) => {
      const x = scaleX(i), y = scaleY(v);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawBarChart(canvas, labels, series) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;

    const pad = 24;
    const max = Math.max(1, Math.max(...series));
    const bw = (w - pad * 2) / series.length * 0.6;
    ctx.fillStyle = '#9db5ff';
    ctx.strokeStyle = '#5b648c';
    ctx.globalAlpha = 1;

    series.forEach((v, i) => {
      const x = pad + i * ((w - pad * 2) / series.length) + ((w - pad * 2) / series.length - bw) / 2;
      const hVal = (v / max) * (h - pad * 2);
      ctx.fillRect(x, h - pad - hVal, bw, hVal);
    });
  }

  function renderTable(days) {
    const tbl = el('table');
    const thead = el('thead');
    const trh = el('tr');
    ['Date', 'Total (USD)', 'OpenAI (USD)', 'Gemini (USD)'].forEach((h) => {
      const th = el('th'); th.textContent = h; trh.appendChild(th);
    });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tb = el('tbody');
    days.forEach((d) => {
      const tr = el('tr');
      const tds = [
        d.date,
        (d.total || 0).toFixed(4),
        (d.services?.openai || 0).toFixed(4),
        (d.services?.gemini || 0).toFixed(4)
      ];
      tds.forEach((v) => { const td = el('td'); td.textContent = v; tr.appendChild(td); });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);

    tableWrap.innerHTML = '';
    tableWrap.appendChild(tbl);
  }

  async function load() {
    try {
      const data = await fetchSummary();
      setKPIs(data);

      const days = data.days || [];
      const labels = days.map((d) => d.date);
      const series = days.map((d) => Number(d.total || 0));
      drawLineChart(cDaily, labels, series);

      const counts = data.counts || { images: 0, prompts: 0 };
      drawBarChart(cUsage, ['Images', 'Prompts'], [counts.images || 0, counts.prompts || 0]);

      renderTable(days);
    } catch (e) {
      console.error(e);
      kpiTotal.textContent = '€0.00';
    }
  }

  load();
})();
