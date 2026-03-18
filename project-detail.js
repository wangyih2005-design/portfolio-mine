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
const BGM_SRC = "./audio/stardew-valley.mp4";
const BGM_STATE_KEY = "portfolio-bgm";
const BGM_TIME_KEY = "portfolio-bgm-time";

function resizeCanvas() {
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  snowCell = Math.max(12, Math.round(window.innerWidth / 120));
  snowCols = Math.max(16, Math.floor(rainCanvas.width / snowCell));
  settledSnow = Array.from({ length: snowCols }, () => []);
  clearingSnow = false;
  rainDrops = Array.from({ length: Math.max(24, Math.floor(window.innerWidth / 50)) }, () => ({
    x: gsap.utils.random(0, rainCanvas.width),
    y: gsap.utils.random(-rainCanvas.height, rainCanvas.height),
    size: snowCell,
    speed: gsap.utils.random(0.45, 2.9),
    alpha: gsap.utils.random(0.08, 0.18),
    color: gsap.utils.random(["255, 255, 255", "188, 188, 188", "124, 124, 124", "68, 68, 68"])
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
          color: gsap.utils.random(snowPalette),
          alpha: gsap.utils.random(0.16, 0.28)
        });
      }
      drop.y = -drop.size - gsap.utils.random(0, rainCanvas.height * 0.2);
      drop.x = gsap.utils.random(0, rainCanvas.width);
      drop.alpha = gsap.utils.random(0.08, 0.18);
      drop.color = gsap.utils.random(["255, 255, 255", "188, 188, 188", "124, 124, 124", "68, 68, 68"]);
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
    gsap.delayedCall(0.35, () => {
      settledSnow = Array.from({ length: snowCols }, () => []);
      clearingSnow = false;
    });
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
  document.getElementById("detailRoleZh").textContent = project.roleZh || "UI / 交互设计";
  document.getElementById("detailRoleEn").textContent = project.roleEn || "UI / Interaction Design";
  document.getElementById("detailDurationZh").textContent = project.durationZh || "-";
  document.getElementById("detailDurationEn").textContent = project.durationEn || "-";

  detailCover.src = project.cover;
  detailCover.alt = project.titleEn;

  document.getElementById("detailTagsZh").innerHTML = (project.tagsZh || []).map((tag) => `<span class="gallery-chip">${tag}</span>`).join("");
  document.getElementById("detailTagsEn").innerHTML = (project.tagsEn || []).map((tag) => `<span class="gallery-chip">${tag}</span>`).join("");
  document.getElementById("detailOutcomeZh").innerHTML = (project.outcomeZh || []).map((item) => `<li>${item}</li>`).join("");
  document.getElementById("detailOutcomeEn").innerHTML = (project.outcomeEn || []).map((item) => `<li>${item}</li>`).join("");
  document.getElementById("detailPagesFlow").innerHTML = (project.pages || []).map((src, index) => `
    <figure class="detail-page-shot">
      <img src="${src}" alt="${project.titleEn} page ${index + 1}" loading="lazy">
    </figure>
  `).join("");
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

function introAnimation() {
  gsap.from(".detail-marquee, .detail-bezel, .detail-controls", {
    y: 18,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.08
  });

  gsap.from(".detail-primary, .detail-sidebar-panel", {
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

window.addEventListener("resize", resizeCanvas);
langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.langBtn));
});
