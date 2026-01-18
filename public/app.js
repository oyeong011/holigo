const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const q = $("#q");
const range = $("#range");
const moreBtn = $("#more");
const statusEl = $("#status");
const feedMeta = $("#feedMeta");
const openAllBtn = $("#openAll");

let all = [];
let filtered = [];
let page = 0;
const PAGE_SIZE = 18;
let focusedIndex = -1;

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit" });
}

function inDays(item, days) {
  if (days === "all") return true;
  const n = Number(days);
  if (!n) return true;
  const t = new Date(item.isoDate || item.pubDate || 0).getTime();
  if (!t) return true;
  const now = Date.now();
  return (now - t) <= n * 86400000;
}

function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, (m) =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])
  );
}

function applyFilter() {
  const keyword = (q.value || "").trim().toLowerCase();
  const r = range.value;

  filtered = all.filter(it => {
    if (!inDays(it, r)) return false;
    if (!keyword) return true;
    const hay = `${it.title||""}\n${it.content||""}`.toLowerCase();
    return hay.includes(keyword);
  });

  page = 0;
  focusedIndex = -1;
  grid.innerHTML = "";
  renderNext();
  statusEl.textContent = `${filtered.length.toLocaleString()}개 매칭`;
}

function cardHtml(it, idx) {
  const date = fmtDate(it.isoDate);
  const title = it.title ? escapeHtml(it.title) : "게시물";
  const content = escapeHtml(it.content || "");
  const link = it.link || "#";

  const media = it.image
    ? `<div class="media"><img loading="lazy" src="${escapeHtml(it.image)}" alt=""></div>`
    : `<div class="media" aria-hidden="true"></div>`;

  return `
  <article class="card" tabindex="0" data-idx="${idx}" data-link="${escapeHtml(link)}">
    ${media}
    <div class="body">
      <div class="meta">
        <span>${date}</span>
        <span>#${idx+1}</span>
      </div>
      <div class="title2">${title}</div>
      <div class="content">${content}</div>
    </div>
    <div class="actions">
      <a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Threads에서 열기</a>
      <a href="#" data-copy="${escapeHtml(link)}">링크 복사</a>
    </div>
  </article>`;
}

function renderNext() {
  const start = page * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  if (!slice.length) {
    moreBtn.disabled = true;
    moreBtn.textContent = "끝";
    return;
  }
  moreBtn.disabled = false;
  moreBtn.textContent = "더 불러오기";
  grid.insertAdjacentHTML("beforeend", slice.map((it, i) => cardHtml(it, start + i)).join(""));
  page += 1;
}

function focusCard(nextIdx) {
  const cards = [...grid.querySelectorAll(".card")];
  if (!cards.length) return;

  nextIdx = Math.max(0, Math.min(nextIdx, cards.length - 1));
  focusedIndex = nextIdx;
  cards[nextIdx].focus({ preventScroll: false });
  cards[nextIdx].scrollIntoView({ block: "nearest" });
}

async function load() {
  statusEl.textContent = "피드 불러오는 중…";
  const res = await fetch("/api/feed");
  const data = await res.json();

  if (data.error) {
    statusEl.textContent = "피드 로드 실패";
    feedMeta.textContent = data.detail || data.error;
    return;
  }

  all = (data.items || [])
    .filter(it => it.link)
    // 날짜 내림차순 정렬(가능할 때)
    .sort((a,b) => new Date(b.isoDate||0).getTime() - new Date(a.isoDate||0).getTime());

  feedMeta.textContent = `${data.title || "Feed"} · ${all.length.toLocaleString()}개`;
  applyFilter();
}

moreBtn.addEventListener("click", renderNext);

q.addEventListener("input", () => {
  // 너무 자주 렌더링되는 것 방지 (간단 디바운스)
  window.clearTimeout(q._t);
  q._t = window.setTimeout(applyFilter, 120);
});
range.addEventListener("change", applyFilter);

grid.addEventListener("click", async (e) => {
  const a = e.target.closest("a[data-copy]");
  if (a) {
    e.preventDefault();
    const url = a.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(url);
      statusEl.textContent = "링크 복사됨";
    } catch {
      statusEl.textContent = "복사 실패(권한 확인)";
    }
  }
});

grid.addEventListener("dblclick", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const link = card.getAttribute("data-link");
  if (link && link !== "#") window.open(link, "_blank", "noreferrer");
});

openAllBtn.addEventListener("click", () => {
  // 브라우저 팝업 제한 때문에 "많이"는 막힐 수 있음 → 상위 N개만
  const top = filtered.slice(0, 10);
  top.forEach(it => window.open(it.link, "_blank", "noreferrer"));
  statusEl.textContent = `상위 ${top.length}개를 새 탭으로 열었음(팝업 제한 시 일부 실패 가능)`;
});

// 키보드 단축키
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== q) {
    e.preventDefault();
    q.focus();
    return;
  }
  if (document.activeElement === q) {
    if (e.key === "Escape") q.blur();
    return;
  }
  if (e.key === "j") focusCard(focusedIndex + 1);
  if (e.key === "k") focusCard(focusedIndex - 1);
  if (e.key === "g" && !e.shiftKey) window.scrollTo({ top: 0, behavior: "smooth" });
  if ((e.key === "G") || (e.key === "g" && e.shiftKey)) window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  if (e.key === "Enter") {
    const card = grid.querySelector(`.card[data-idx="${focusedIndex}"]`);
    if (!card) return;
    const link = card.getAttribute("data-link");
    if (link && link !== "#") window.open(link, "_blank", "noreferrer");
  }
});

load();
