/* public/assets/usage.js
   Usage dashboard with Chart.js on a dark theme.
   - Fetches /api/billing/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
   - Populates KPIs (EUR) using totals.byKind
   - Draws animated Chart.js charts with tooltips
   - Renders a day-by-day EUR table (Date / Total / Images / Text) using days[].byKind
*/

(function () {
  const $ = (id) => document.getElementById(id);

  // EUR formatters
  const fmtEUR2 = (n) => "€" + (Number(n || 0)).toFixed(2);
  const fmtEUR3 = (n) => "€" + (Number(n || 0)).toFixed(3);

  // UI elements
  const kpiTotal = $("kpiTotal");
  const kpiText = $("kpiText");
  const kpiImage = $("kpiImage");
  const inputFrom = $("from");
  const inputTo = $("to");
  const btnApply = $("apply");
  const btnFrom = $("fromBtn");
  const btnTo = $("toBtn");
  const tableWrap = $("table");

  // Charts
  let dailyChart = null;
  let usageChart = null;
  const cDaily = $("cDaily");
  const cUsage = $("cUsage");

  // Rough EUR display factor (dev only; real FX not wired here)
  const FX_EUR = 0.92;

  // Default range: last 14 days
  const todayISO = new Date().toISOString().slice(0, 10);
  const fromISO = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
  inputFrom.value = fromISO;
  inputTo.value = todayISO;

  // Quick ranges
  document.querySelectorAll("[data-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.getAttribute("data-range");
      const now = new Date();
      if (k === "today") {
        inputFrom.value = now.toISOString().slice(0, 10);
        inputTo.value = inputFrom.value;
      } else if (k === "last7") {
        inputFrom.value = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
        inputTo.value = todayISO;
      } else if (k === "month") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        inputFrom.value = d.toISOString().slice(0, 10);
        inputTo.value = todayISO;
      } else if (k === "year") {
        const d = new Date(now.getFullYear(), 0, 1);
        inputFrom.value = d.toISOString().slice(0, 10);
        inputTo.value = todayISO;
      }
      load();
    });
  });

  btnApply.addEventListener("click", load);

  // Date buttons (simple white arrow) — open the picker programmatically
  function openPickerFor(input) {
    if (input && typeof input.showPicker === "function") {
      input.showPicker();
    } else if (input) {
      input.focus();
      try {
        input.blur();
        const t = input.type;
        input.type = "text";
        input.type = t;
        input.focus();
      } catch {}
    }
  }
  if (btnFrom) btnFrom.addEventListener("click", () => openPickerFor(inputFrom));
  if (btnTo) btnTo.addEventListener("click", () => openPickerFor(inputTo));

  /* -------------------- Fetch -------------------- */
  async function fetchSummary() {
    const url = new URL("/api/billing/summary", location.origin);
    if (inputFrom.value) url.searchParams.set("from", inputFrom.value);
    if (inputTo.value) url.searchParams.set("to", inputTo.value);
    const r = await fetch(url.toString());
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Failed");
    return j;
  }

  /* -------------------- Helpers -------------------- */
  function shortDateLabel(yyyy_mm_dd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyy_mm_dd)) return yyyy_mm_dd || "";
    const m = Number(yyyy_mm_dd.slice(5, 7));
    const d = Number(yyyy_mm_dd.slice(8, 10));
    return `${d}.${m}.`;
  }
  function shortDateLabelWithYear(yyyy_mm_dd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyy_mm_dd)) return yyyy_mm_dd || "";
    const y = Number(yyyy_mm_dd.slice(0, 4));
    const m = Number(yyyy_mm_dd.slice(5, 7));
    const d = Number(yyyy_mm_dd.slice(8, 10));
    return `${d}.${m}.${y}`;
  }

  /* -------------------- KPIs (EUR via byKind) -------------------- */
  function setKPIs(data) {
    const grandUsd = Number(data?.totals?.grandTotalUsd || 0);
    const byKind = data?.totals?.byKind || {};
    const imageUsd = Number(byKind.image || 0);
    const textUsd  = Number(byKind.text  || 0);

    kpiTotal.textContent = fmtEUR2(grandUsd * FX_EUR);
    kpiText.textContent  = fmtEUR3(textUsd  * FX_EUR);
    kpiImage.textContent = fmtEUR2(imageUsd * FX_EUR);
  }

  /* -------------------- Table (EUR; using byKind per day) -------------------- */
  function renderTable(days) {
    const el = (t, c) => {
      const n = document.createElement(t);
      if (c) n.className = c;
      return n;
    };

    const tbl = el("table");
    const thead = el("thead");
    const trh = el("tr");
    ["Date", "Total", "Images", "Text"].forEach((h) => {
      const th = el("th");
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tb = el("tbody");
    days.forEach((d) => {
      const totalUsd = Number(d.total || 0);
      const bk = d.byKind || {};
      const imageUsd = Number(bk.image || 0);
      const textUsd  = Number(bk.text  || 0);

      const tr = el("tr");
      const cells = [
        shortDateLabelWithYear(d.date || ""),
        fmtEUR2(totalUsd * FX_EUR),
        fmtEUR2(imageUsd * FX_EUR),
        fmtEUR3(textUsd  * FX_EUR),
      ];
      cells.forEach((v) => {
        const td = el("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);

    tableWrap.innerHTML = "";
    tableWrap.appendChild(tbl);
  }

  /* -------------------- Chart.js Theme -------------------- */
  function toRGBA(hex, a) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return `rgba(158,173,255,${a})`;
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function makeGradient(ctx, area, startHex, endHex, alphaTop = 0.35, alphaBottom = 0.02) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, toRGBA(startHex, alphaTop));
    g.addColorStop(1, toRGBA(endHex, alphaBottom));
    return g;
  }

  const COLORS = {
    ink: "#EEF3FF",
    axis: "#cfd6f3",
    grid: "rgba(152,170,210,0.15)",
    line: "#9db5ff",
    fillTop: "#4F8DFD",
    fillBottom: "#1E68F8",
    barBorder: "#9db5ff",
  };

  function labelFromScaleContext(scale, value, ticks, index) {
    try {
      if (scale && typeof scale.getLabelForValue === "function") {
        return scale.getLabelForValue(value);
      }
    } catch {}
    const t = ticks && ticks[index] ? (ticks[index].label ?? ticks[index].value) : value;
    return String(t);
  }

  // Stroke widths (bars intentionally thinner than the line)
  const LINE_STROKE_WIDTH = 1.2;
  const BAR_STROKE_WIDTH = 0.6;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: COLORS.axis,
          font: { size: 11 },
          autoSkip: true,
          maxRotation: 0,
          display: true,
          callback: function (value, index, ticks) {
            const raw = labelFromScaleContext(this, value, ticks, index);
            return shortDateLabel(String(raw));
          },
        },
      },
      y: {
        grid: { display: true, color: COLORS.grid, lineWidth: 0.5 },
        ticks: { color: COLORS.axis, font: { size: 11 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(9,12,24,.95)",
        borderColor: "#2f375a",
        borderWidth: 1,
        titleColor: COLORS.ink,
        bodyColor: COLORS.ink,
        padding: 10,
        displayColors: false,
      },
    },
    layout: { padding: { bottom: 8 } },
  };

  /* -------------------- Charts -------------------- */
  function renderDailyChart(labels, usdSeries) {
    // EUR only
    const eurSeries = (usdSeries || []).map((v) => (Number(v || 0) * FX_EUR));

    if (dailyChart) {
      dailyChart.destroy();
      dailyChart = null;
    }
    const ctx = cDaily.getContext("2d");
    dailyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Daily spend (EUR)",
            data: eurSeries,
            borderColor: COLORS.line,
            borderWidth: LINE_STROKE_WIDTH,
            pointRadius: 2,
            pointHoverRadius: 3.5,
            tension: 0.25,
            fill: true,
            backgroundColor: (c) => {
              const { chart } = c;
              const { ctx: cg, chartArea } = chart;
              if (!chartArea) return toRGBA(COLORS.fillTop, 0.2);
              return makeGradient(cg, chartArea, COLORS.fillTop, COLORS.fillBottom);
            },
          },
        ],
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed.y || 0);
                return " " + fmtEUR2(v);
              },
            },
          },
        },
        scales: {
          ...commonOptions.scales,
          x: { ...commonOptions.scales.x },
          y: {
            ...commonOptions.scales.y,
            beginAtZero: true,
            ticks: {
              ...commonOptions.scales.y.ticks,
              callback: (value) => fmtEUR2(value),
            },
          },
        },
      },
    });
  }

  function renderUsageChart(counts) {
    if (usageChart) {
      usageChart.destroy();
      usageChart = null;
    }
    const labels = ["Images", "Text"];
    const data = [Number(counts.images || 0), Number(counts.prompts || 0)];
    const ctx = cUsage.getContext("2d");

    usageChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            borderWidth: BAR_STROKE_WIDTH, // thinner than the line chart
            borderColor: COLORS.barBorder,
            backgroundColor: (c) => {
              const { chart } = c;
              const { ctx: cg, chartArea } = chart;
              if (!chartArea) return toRGBA(COLORS.fillTop, 0.4);
              return makeGradient(cg, chartArea, COLORS.fillTop, COLORS.fillBottom, 0.45, 0.15);
            },
            borderRadius: 10,
            barThickness: "flex",
            maxBarThickness: 64,
          },
        ],
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonOptions.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y}`, // counts only
              title: (items) => (items && items[0] ? items[0].label : ""),
            },
          },
        },
        scales: {
          x: { ...commonOptions.scales.x },
          y: {
            ...commonOptions.scales.y,
            beginAtZero: true,
            precision: 0,
            ticks: { ...commonOptions.scales.y.ticks, callback: (v) => String(v) },
          },
        },
      },
    });
  }

  /* -------------------- Load -------------------- */
  async function load() {
    try {
      const data = await fetchSummary();
      setKPIs(data);

      const days = data.days || [];
      const labels = days.map((d) => d.date);
      const seriesUsd = days.map((d) => Number(d.total || 0));

      renderDailyChart(labels, seriesUsd);
      renderUsageChart(data.counts || { images: 0, prompts: 0 });
      renderTable(days);
    } catch (e) {
      console.error(e);
      kpiTotal.textContent = "€0.00";
      if (dailyChart) dailyChart.destroy();
      if (usageChart) usageChart.destroy();
      tableWrap.innerHTML = "<div class='hint'>Failed to load usage.</div>";
    }
  }

  load();
})();
