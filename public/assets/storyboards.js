// public/assets/storyboards.js
// Client bundle for /storyboards (list page)
// - Toggles creator card
// - Lists storyboards
// - Lazily hydrates a cover thumbnail using the first-added image (oldest item)
// - Entire card is clickable (no separate "Open" button)
// - No thumbnail "jump": we don't set an initial src; we assign exactly once after hydration.

(function () {
  const $ = (id) => document.getElementById(id);

  // Month+ordinal + 24h time, e.g., "October 12th, 21:16"
  function formatNice(dtStr) {
    try {
      const d = new Date(dtStr);
      if (isNaN(+d)) return "";
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const day = d.getDate();
      const ord = (n) => {
        const j = n % 10, k = n % 100;
        if (j === 1 && k !== 11) return "st";
        if (j === 2 && k !== 12) return "nd";
        if (j === 3 && k !== 13) return "rd";
        return "th";
      };
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      return `${months[d.getMonth()]} ${day}${ord(day)}, ${hh}:${mm}`;
    } catch { return ""; }
  }

  function boardCard(sb) {
    const wrap = document.createElement("div");
    wrap.className = "sb-card";
    wrap.dataset.boardId = sb.id || "";

    // Entire card behaves like a link
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "link");
    wrap.setAttribute("aria-label", (sb.title ? `Open storyboard ${sb.title}` : "Open storyboard"));
    wrap.style.cursor = "pointer";
    const go = () => { if (sb.id) location.href = "/storyboard?id=" + sb.id; };
    wrap.addEventListener("click", go);
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });

    // Thumb (no initial src to avoid "jump")
    const thWrap = document.createElement("div");
    thWrap.className = "sb-thumb";
    const img = document.createElement("img");
    img.alt = "Storyboard cover";
    img.decoding = "async";
    img.loading = "lazy";
    // visual placeholder (keeps layout stable without swapping an image later)
    img.style.opacity = "0";
    img.style.transition = "opacity .25s ease";
    // do NOT set img.src here; we will set it exactly once after hydration
    thWrap.appendChild(img);

    // Right meta
    const right = document.createElement("div");
    const title = document.createElement("div");
    title.className = "sb-meta-title";
    title.textContent = sb.title || "";

    const desc = document.createElement("div");
    desc.className = "sb-meta-desc";
    desc.textContent = sb.description || "";

    const foot = document.createElement("div");
    foot.className = "sb-meta-foot";

    const created = document.createElement("span");
    created.textContent = formatNice(sb.createdAt) || "";

    foot.appendChild(created);
    right.appendChild(title);
    right.appendChild(desc);
    right.appendChild(foot);

    wrap.appendChild(thWrap);
    wrap.appendChild(right);
    return wrap;
  }

  async function load() {
    const list = $("list");
    list.innerHTML = '<div class="hint"><span class="spinner"></span> Loading…</div>';
    try {
      const r = await fetch("/api/storyboards");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      const arr = j.storyboards || [];
      if (!arr.length) {
        $("empty").style.display = "block";
        list.innerHTML = "";
        return;
      }
      $("empty").style.display = "none";
      list.innerHTML = "";
      const frag = document.createDocumentFragment();
      arr.forEach((sb) => frag.appendChild(boardCard(sb)));
      list.appendChild(frag);

      // Lazy cover: fetch FIRST-ADDED item (oldest). Server returns items in DESC (newest first),
      // so we pick the LAST element in the array. Assign exactly once per card.
      arr.forEach((sb) => {
        if (!sb || !sb.id || !sb.itemCount) return;

        fetch("/api/storyboard?id=" + encodeURIComponent(sb.id))
          .then((rr) => rr.json().then((b) => ({ ok: rr.ok, body: b })))
          .then((x) => {
            if (!x.ok) return;
            const items = Array.isArray(x.body?.items) ? x.body.items : [];
            if (!items.length) return;

            const oldest = items[items.length - 1];
            const url = oldest ? (oldest.thumbUrl || oldest.url || "") : "";
            if (!url) return;

            const card = list.querySelector('[data-board-id="' + sb.id + '"]');
            if (!card) return;
            const img = card.querySelector(".sb-thumb img");
            if (!img) return;

            // Assign only once; ignore any future attempts
            if (img.dataset.coverSet === "1") return;

            // Preload, then fade in to avoid flashes
            const temp = new Image();
            temp.decoding = "async";
            temp.loading = "eager";
            temp.onload = () => {
              // Safety: bail if already set by a racing call (shouldn't happen with the guard, but safe)
              if (img.dataset.coverSet === "1") return;
              img.src = url;
              img.dataset.coverSet = "1";
              requestAnimationFrame(() => { img.style.opacity = "1"; });
            };
            temp.onerror = () => {
              // mark as set to avoid repeated attempts
              img.dataset.coverSet = "1";
              // keep transparent (no flicker)
            };
            temp.src = url;
          })
          .catch(() => {});
      });
    } catch (e) {
      list.innerHTML = '<div class="hint">' + (e.message || e) + "</div>";
    }
  }

  // Toggle creator card
  const showBtn = $("showCreator");
  const creator = $("creator");
  if (showBtn && creator) {
    showBtn.addEventListener("click", () => {
      const visible = creator.style.display === "block";
      creator.style.display = visible ? "none" : "block";
    });
  }

  // Create storyboard
  const createBtn = $("create");
  if (createBtn) {
    createBtn.addEventListener("click", async function () {
      const btn = this;
      const title = ($("title").value || "").trim();
      const desc = ($("desc").value || "").trim();
      if (!title) { alert("Please enter a title"); return; }
      btn.disabled = true; btn.textContent = "Creating…";
      try {
        const r = await fetch("/api/storyboards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: desc })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        location.href = "/storyboard?id=" + encodeURIComponent(j.id);
      } catch (e) {
        alert(e.message || e);
      } finally {
        btn.disabled = false; btn.textContent = "Create";
      }
    });
  }

  load();
})();
