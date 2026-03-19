const siteData = window.PORTFOLIO_DATA || { projects: [] };
const langButtons = document.querySelectorAll("[data-lang-btn]");
const audioToggle = document.getElementById("audioToggle");
const bgmAudio = document.getElementById("bgmAudio");
const rainCanvas = document.getElementById("pixelRain");
const rainCtx = rainCanvas.getContext("2d");

let rainDrops = [];
let settledSnow = [];
let snowCols = 0;
let snowRows = 10;
let snowCell = 14;
let clearingSnow = false;
const snowPalette = ["255, 255, 255", "244, 244, 244", "232, 232, 232", "218, 218, 218", "198, 198, 198"];
const BGM_SRC = "./audio/stardew-valley.mp3";
const BGM_STATE_KEY = "portfolio-bgm";
const BGM_TIME_KEY = "portfolio-bgm-time";
const DETAIL_BATCH_SIZE = 3;
const animationLib = window.gsap || null;

let activeProject = null;
let renderedPageCount = 0;
let loadMoreObserver = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resizeCanvas() {
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  snowCell = Math.max(12, Math.round(window.innerWidth / 120));
  snowCols = Math.max(16, Math.floor(rainCanvas.width / snowCell));
  settledSnow = Array.from({ length: snowCols }, () => []);
  clearingSnow = false;
  rainDrops = Array.from({ length: Math.max(24, Math.floor(window.innerWidth / 50)) }, () => ({
    x: randomBetween(0, rainCanvas.width),
    y: randomBetween(-rainCanvas.height, rainCanvas.height),
    size: snowCell,
    speed: randomBetween(0.45, 2.9),
    alpha: randomBetween(0.08, 0.18),
    color: pickRandom(["255, 255, 255", "188, 188, 188", "124, 124, 124", "68, 68, 68"])
  }));
}

function animateRain() {
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  rainDrops.forEach((drop) => {
    const col = Math.min(snowCols - 1, Math.max(0, Math.floor(drop.x / snowCell)));
    const stackHeight = settledSnow[col].length * snowCell;
    const targetY = rainCanvas.height - stackHeight - drop.size;

    drop.y += drop.speed;
    if (drop.y >= targetY) {
      drop.y = targetY;
      if (settledSnow[col].length < snowRows) {
        settledSnow[col].push({
          color: pickRandom(snowPalette),
          alpha: randomBetween(0.16, 0.28)
        });
      }
      drop.y = -drop.size - randomBetween(0, rainCanvas.height * 0.2);
      drop.x = randomBetween(0, rainCanvas.width);
      drop.alpha = randomBetween(0.08, 0.18);
      drop.color = pickRandom(["255, 255, 255", "188, 188, 188", "124, 124, 124", "68, 68, 68"]);
    }

    rainCtx.fillStyle = `rgba(${drop.color}, ${drop.alpha})`;
    rainCtx.fillRect(Math.round(drop.x), Math.round(drop.y), drop.size - 1, drop.size - 1);
  });

  settledSnow.forEach((stack, col) => {
    stack.forEach((cell, row) => {
      const x = col * snowCell;
      const y = rainCanvas.height - (row + 1) * snowCell;
      rainCtx.fillStyle = `rgba(${cell.color}, ${cell.alpha})`;
      rainCtx.fillRect(x, y, snowCell - 1, snowCell - 1);
    });
  });

  const tallestStack = settledSnow.length ? Math.max(...settledSnow.map((stack) => stack.length)) : 0;
  if (!clearingSnow && tallestStack >= snowRows) {
    clearingSnow = true;
    window.setTimeout(() => {
      settledSnow = Array.from({ length: snowCols }, () => []);
      clearingSnow = false;
    }, 350);
  }

  requestAnimationFrame(animateRain);
}

function setLanguage(lang) {
  document.body.classList.remove("lang-zh", "lang-en");
  document.body.classList.add(`lang-${lang}`);
  langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.langBtn === lang);
  });
}

function getProject() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("project");
  const realProjects = siteData.projects.filter((item) => !item.isPlaceholder);
  return realProjects.find((item) => item.slug === slug) || realProjects[0];
}

function renderProject(project) {
  activeProject = project;
  renderedPageCount = 0;

  const detailCover = document.getElementById("detailCover");
  const detailMarquee = document.getElementById("detailMarquee");
  const detailStageChip = document.getElementById("detailStageChip");

  document.title = `${project.titleEn} | Wang Yihan`;
  detailMarquee.textContent = `${project.titleEn} / Stage ${project.stage}`;
  detailStageChip.textContent = `Stage ${project.stage}`;

  document.getElementById("detailTitleZh").textContent = project.titleZh;
  document.getElementById("detailTitleEn").textContent = project.titleEn;
  document.getElementById("detailSubtitleZh").textContent = project.subtitleZh || project.titleEn;
  document.getElementById("detailSubtitleEn").textContent = project.subtitleEn || project.titleZh;
  document.getElementById("detailSummaryZh").textContent = project.summaryZh || project.overviewZh;
  document.getElementById("detailSummaryEn").textContent = project.summaryEn || project.overviewEn;
  document.getElementById("detailChallengeZh").textContent = project.challengeZh || project.overviewZh;
  document.getElementById("detailChallengeEn").textContent = project.challengeEn || project.overviewEn;
  document.getElementById("detailSolutionZh").textContent = project.solutionZh || project.overviewZh;
  document.getElementById("detailSolutionEn").textContent = project.solutionEn || project.overviewEn;
  document.getElementById("detailRoleZh").textContent = project.roleZh || "UI / 浜や簰璁捐";
  document.getElementById("detailRoleEn").textContent = project.roleEn || "UI / Interaction Design";
  document.getElementById("detailDurationZh").textContent = project.durationZh || "-";
  document.getElementById("detailDurationEn").textContent = project.durationEn || "-";

  detailCover.src = project.cover;
  detailCover.alt = project.titleEn;
  detailCover.decoding = "async";
  detailCover.fetchPriority = "high";

  document.getElementById("detailTagsZh").innerHTML = (project.tagsZh || []).map((tag) => `<span class="gallery-chip">${tag}</span>`).join("");
  document.getElementById("detailTagsEn").innerHTML = (project.tagsEn || []).map((tag) => `<span class="gallery-chip">${tag}</span>`).join("");
  document.getElementById("detailOutcomeZh").innerHTML = (project.outcomeZh || []).map((item) => `<li>${item}</li>`).join("");
  document.getElementById("detailOutcomeEn").innerHTML = (project.outcomeEn || []).map((item) => `<li>${item}</li>`).join("");
  document.getElementById("detailPagesFlow").innerHTML = "";
  renderNextPageBatch();
  syncLoadMoreButton();
  initLoadMoreObserver();
}

function renderNav(currentProject) {
  const nav = document.getElementById("detailNav");
  const projects = siteData.projects.filter((item) => !item.isPlaceholder);
  nav.innerHTML = projects.map((project) => `
    <a class="detail-nav-link" href="./project-detail.html?project=${encodeURIComponent(project.slug)}" ${project.slug === currentProject.slug ? 'aria-current="page"' : ""}>
      Stage ${project.stage}
    </a>
  `).join("");
}

function createDetailShot(src, index, project) {
  const figure = document.createElement("figure");
  figure.className = "detail-page-shot is-loading";

  const skeleton = document.createElement("div");
  skeleton.className = "detail-page-skeleton";
  figure.appendChild(skeleton);

  const errorMarkup = `
      <strong>Image unavailable</strong>
      <span data-lang="zh">当前图片加载失败，请刷新或稍后重试。</span>
      <span data-lang="en">This image could not be loaded. Please refresh and try again.</span>
    `;

  const img = document.createElement("img");
  img.alt = `${project.titleEn} page ${index + 1}`;
  img.loading = "lazy";
  img.decoding = "async";
  img.fetchPriority = index < DETAIL_BATCH_SIZE ? "high" : "low";
  img.style.opacity = "0";
  img.style.transition = "opacity .24s ease";
  figure.appendChild(img);

  img.addEventListener("load", () => {
    figure.classList.remove("is-loading", "is-error");
    skeleton.remove();
    img.style.opacity = "1";
  }, { once: true });

  img.addEventListener("error", () => {
    figure.classList.remove("is-loading");
    figure.classList.add("is-error");
    skeleton.innerHTML = errorMarkup;
  }, { once: true });

  img.src = src;

  if (img.complete) {
    if (img.naturalWidth > 0) {
      figure.classList.remove("is-loading", "is-error");
      skeleton.remove();
      img.style.opacity = "1";
    } else {
      figure.classList.remove("is-loading");
      figure.classList.add("is-error");
      skeleton.innerHTML = errorMarkup;
    }
  }

  return figure;
}

function renderNextPageBatch() {
  if (!activeProject) return;
  const flow = document.getElementById("detailPagesFlow");
  const pages = activeProject.pages || [];
  const nextPages = pages.slice(renderedPageCount, renderedPageCount + DETAIL_BATCH_SIZE);

  nextPages.forEach((src, index) => {
    flow.appendChild(createDetailShot(src, renderedPageCount + index, activeProject));
  });

  renderedPageCount += nextPages.length;
  syncLoadMoreButton();
}

function hasMorePages() {
  if (!activeProject) return false;
  return renderedPageCount < (activeProject.pages || []).length;
}

function syncLoadMoreButton() {
  const button = document.getElementById("detailLoadMore");
  const counters = document.querySelectorAll(".detail-load-more-count");
  if (!button || !counters.length || !activeProject) return;

  const remaining = Math.max(0, (activeProject.pages || []).length - renderedPageCount);
  counters.forEach((counter) => {
    counter.textContent = String(remaining);
  });
  button.hidden = remaining === 0;
}

function initLoadMoreObserver() {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
  }

  const sentinel = document.getElementById("detailLoadSentinel");
  if (!sentinel) return;

  loadMoreObserver = new IntersectionObserver((entries) => {
    const shouldLoad = entries.some((entry) => entry.isIntersecting);
    if (!shouldLoad || !hasMorePages()) return;
    renderNextPageBatch();
  }, {
    rootMargin: "800px 0px"
  });

  loadMoreObserver.observe(sentinel);
}

function introAnimation() {
  if (!animationLib) return;

  animationLib.from(".detail-marquee, .detail-bezel, .detail-controls", {
    y: 18,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.08
  });

  animationLib.from(".detail-primary, .detail-sidebar-panel", {
    y: 24,
    opacity: 0,
    duration: 0.7,
    ease: "power2.out",
    stagger: 0.08,
    delay: 0.15
  });
}

function setAudioButtonState(state) {
  if (!audioToggle) return;
  audioToggle.classList.toggle("is-playing", state === "playing");
  audioToggle.dataset.audioState = state;
  const label = state === "playing" ? "Background music on" : state === "missing" ? "Background music unavailable" : "Background music off";
  audioToggle.setAttribute("aria-label", label);
  audioToggle.setAttribute("title", label);
}

function persistBgmTime() {
  if (!bgmAudio || Number.isNaN(bgmAudio.currentTime)) return;
  sessionStorage.setItem(BGM_TIME_KEY, String(bgmAudio.currentTime));
}

function restoreBgmTime() {
  if (!bgmAudio) return;
  const saved = Number(sessionStorage.getItem(BGM_TIME_KEY) || "0");
  if (!Number.isFinite(saved) || saved <= 0) return;

  const applyTime = () => {
    try {
      bgmAudio.currentTime = saved;
    } catch (error) {
      return;
    }
  };

  if (bgmAudio.readyState >= 1) {
    applyTime();
  } else {
    bgmAudio.addEventListener("loadedmetadata", applyTime, { once: true });
  }
}

async function toggleBgm() {
  if (!bgmAudio || !audioToggle) return;

  if (!bgmAudio.paused) {
    bgmAudio.pause();
    localStorage.setItem(BGM_STATE_KEY, "off");
    persistBgmTime();
    return;
  }

  try {
    if (!bgmAudio.src) {
      bgmAudio.src = BGM_SRC;
    }
    restoreBgmTime();
    await bgmAudio.play();
    localStorage.setItem(BGM_STATE_KEY, "on");
  } catch (error) {
    localStorage.setItem(BGM_STATE_KEY, "off");
    setAudioButtonState(bgmAudio.error ? "missing" : "off");
  }
}

async function ensureBgmPlayback() {
  if (!bgmAudio) return;
  try {
    if (!bgmAudio.src) {
      bgmAudio.src = BGM_SRC;
    }
    restoreBgmTime();
    await bgmAudio.play();
    localStorage.setItem(BGM_STATE_KEY, "on");
  } catch (error) {
    setAudioButtonState("off");
  }
}

function initBgm() {
  if (!bgmAudio || !audioToggle) return;
  bgmAudio.volume = 0.35;
  const preferredState = localStorage.getItem(BGM_STATE_KEY) || "on";
  setAudioButtonState("off");
  bgmAudio.addEventListener("play", () => setAudioButtonState("playing"));
  bgmAudio.addEventListener("pause", () => {
    setAudioButtonState("off");
    persistBgmTime();
  });
  bgmAudio.addEventListener("error", () => setAudioButtonState("missing"));
  bgmAudio.addEventListener("timeupdate", persistBgmTime);
  audioToggle.addEventListener("click", toggleBgm);
  if (preferredState !== "off") {
    ensureBgmPlayback();
  }
  window.addEventListener("pointerdown", ensureBgmPlayback, { once: true });
  window.addEventListener("beforeunload", persistBgmTime);
}

const currentProject = getProject();
renderProject(currentProject);
renderNav(currentProject);
resizeCanvas();
animateRain();
setLanguage("zh");
introAnimation();
initBgm();

document.getElementById("detailLoadMore")?.addEventListener("click", renderNextPageBatch);

window.addEventListener("resize", resizeCanvas);
langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.langBtn));
});

