const animationLib = window.gsap || null;
const scrollPlugin = window.ScrollTrigger || null;

if (animationLib && scrollPlugin) {
  animationLib.registerPlugin(scrollPlugin);
}

const siteData = window.PORTFOLIO_DATA || { tools: [], experiences: [], projects: [] };

const spriteButton = document.getElementById("spriteButton");
const pixelSprite = document.getElementById("pixelSprite");
const spriteShadow = document.getElementById("spriteShadow");
const landing = document.getElementById("landing");
const siteMain = document.getElementById("siteMain");
const langToggle = document.getElementById("langToggle");
const audioToggle = document.getElementById("audioToggle");
const toolRow = document.getElementById("toolRow");
const experienceCards = document.getElementById("experienceCards");
const projectsGallery = document.getElementById("projectsGallery");
const langButtons = document.querySelectorAll("[data-lang-btn]");
const bgmAudio = document.getElementById("bgmAudio");
const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas.getContext("2d");
const rainCanvas = document.getElementById("pixelRain");
const rainCtx = rainCanvas.getContext("2d");
const searchParams = new URLSearchParams(window.location.search);

let burstPlayed = false;
let particles = [];
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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resizeCanvases() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
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

function renderExperience() {
  if (!experienceCards) return;
  experienceCards.innerHTML = siteData.experiences.map((item) => `
    <article class="content-card">
      <span class="card-time" data-lang="zh">${item.timeZh}</span>
      <span class="card-time" data-lang="en">${item.timeEn}</span>
      <h3 data-lang="zh">${item.titleZh}</h3>
      <h3 data-lang="en">${item.titleEn}</h3>
      <p data-lang="zh">${item.detailZh}</p>
      <p data-lang="en">${item.detailEn}</p>
    </article>
  `).join("");
}

function renderTools() {
  if (!toolRow) return;
  toolRow.innerHTML = siteData.tools.map((tool) => `<span class="tool-pill">${tool}</span>`).join("");
}

function getProjectHref(project) {
  return `./project-detail.html?project=${encodeURIComponent(project.slug)}`;
}

function renderProjects() {
  if (!projectsGallery) return;
  projectsGallery.innerHTML = siteData.projects.map((project, index) => {
    const cardTag = project.isPlaceholder ? "article" : "a";
    const hrefAttr = project.isPlaceholder ? "" : `href="${getProjectHref(project)}"`;
    const extraClass = project.isPlaceholder ? "gallery-card--placeholder" : "gallery-card--link";
    const availabilityLabel = project.isPlaceholder ? "Coming Soon" : "View Detail";

    return `
      <${cardTag} class="gallery-card ${extraClass}" data-gallery-card data-index="${index}" ${hrefAttr}>
        <div class="gallery-screen">
          ${project.cover ? `<img class="gallery-image" src="${project.cover}" alt="${project.titleEn}" loading="lazy" decoding="async">` : `<div class="gallery-placeholder" aria-hidden="true"></div>`}
        </div>
        <div class="gallery-meta">
          <span class="gallery-stage">Stage ${project.stage}</span>
          <span class="gallery-stage">${availabilityLabel}</span>
        </div>
        <div class="gallery-title-wrap">
          <h3 class="gallery-title" data-lang="zh">${project.titleZh}</h3>
          <h3 class="gallery-title" data-lang="en">${project.titleEn}</h3>
          <p class="gallery-subtitle" data-lang="zh">${project.subtitleZh || project.titleEn}</p>
          <p class="gallery-subtitle" data-lang="en">${project.subtitleEn || project.titleZh}</p>
        </div>
        <p class="gallery-desc" data-lang="zh">${project.overviewZh}</p>
        <p class="gallery-desc" data-lang="en">${project.overviewEn}</p>
        <div class="gallery-tags" data-lang-flex="zh">${project.tagsZh.map((tag) => `<span class="gallery-chip">${tag}</span>`).join("")}</div>
        <div class="gallery-tags" data-lang-flex="en">${project.tagsEn.map((tag) => `<span class="gallery-chip">${tag}</span>`).join("")}</div>
      </${cardTag}>
    `;
  }).join("");
}

function renderData() {
  renderTools();
  renderExperience();
  renderProjects();
}

function setLanguage(lang) {
  document.body.classList.remove("lang-zh", "lang-en");
  document.body.classList.add(`lang-${lang}`);
  langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.langBtn === lang);
  });
}

function createBreathingLoop() {
  if (!pixelSprite || !spriteShadow || !animationLib) return;
  animationLib.timeline({ repeat: -1, yoyo: true, defaults: { duration: 1.8, ease: "sine.inOut" } })
    .to(pixelSprite, { scaleX: 1.04, scaleY: 0.96, transformOrigin: "center bottom" })
    .to(spriteShadow, { scaleX: 0.92, opacity: 0.18 }, 0);
}

function createParticles(rect) {
  const pixelSize = 8;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  particles = [];

  for (let y = 0; y < 14; y += 1) {
    for (let x = 0; x < 14; x += 1) {
      const offsetX = (x - 7) * pixelSize;
      const offsetY = (y - 7) * pixelSize;
      const distance = Math.hypot(offsetX, offsetY);
      if (distance > 62) continue;
      const isEyePixel = ((x === 5 || x === 6 || x === 9 || x === 10) && (y === 5 || y === 6));
      particles.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
        size: pixelSize,
        color: isEyePixel ? "#ffffff" : "#111111",
        vx: offsetX * 0.08 + randomBetween(-3, 3),
        vy: offsetY * 0.08 + randomBetween(-6, -2),
        gravity: randomBetween(0.12, 0.22),
        alpha: 1,
        decay: randomBetween(0.012, 0.024)
      });
    }
  }
}

function drawParticles() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.alpha -= particle.decay;
    particleCtx.globalAlpha = Math.max(particle.alpha, 0);
    particleCtx.fillStyle = particle.color;
    particleCtx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });

  particles = particles.filter((particle) => particle.alpha > 0);
  if (particles.length > 0) {
    requestAnimationFrame(drawParticles);
  } else {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  }
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

function revealMainContent() {
  if (!siteMain || !langToggle || !landing || !audioToggle) return;
  siteMain.classList.add("is-visible");
  langToggle.classList.add("is-visible");
  audioToggle.classList.add("is-visible");
  document.body.classList.add("is-ready");
  landing.style.display = "none";
  if (scrollPlugin) {
    scrollPlugin.refresh();
  }
}

function enterWithoutLanding() {
  if (!landing || !langToggle || !siteMain || !pixelSprite || !spriteShadow) return;
  landing.classList.add("is-hidden");
  landing.style.display = "none";
  if (animationLib) {
    animationLib.set(pixelSprite, { autoAlpha: 0 });
    animationLib.set(spriteShadow, { autoAlpha: 0 });
  } else {
    pixelSprite.style.opacity = "0";
    spriteShadow.style.opacity = "0";
  }
  revealMainContent();
}

function playEntrance() {
  if (burstPlayed || !spriteButton || !pixelSprite || !spriteShadow || !landing) return;
  if (bgmAudio && bgmAudio.paused) {
    bgmAudio.play().then(() => {
      localStorage.setItem(BGM_STATE_KEY, "on");
      setAudioButtonState("playing");
    }).catch(() => {
      setAudioButtonState("missing");
    });
  }
  burstPlayed = true;
  createParticles(pixelSprite.getBoundingClientRect());

  if (!animationLib) {
    drawParticles();
    revealMainContent();
    return;
  }

  animationLib.timeline()
    .to(spriteButton, { y: -26, scaleX: 0.96, scaleY: 1.05, duration: 0.22, ease: "power2.out" })
    .to(spriteShadow, { scaleX: 0.78, opacity: 0.08, duration: 0.22, ease: "power2.out" }, "<")
    .to(spriteButton, { y: 0, scaleX: 1.04, scaleY: 0.96, duration: 1.1, ease: "elastic.out(1, 0.45)" })
    .to(spriteShadow, { scaleX: 1.05, opacity: 0.16, duration: 1.1, ease: "elastic.out(1, 0.45)" }, "<")
    .add(() => {
      gsap.set(pixelSprite, { autoAlpha: 0 });
      drawParticles();
    })
    .to(".landing-text", { y: 20, autoAlpha: 0, duration: 0.35, ease: "power2.out" }, "-=0.85")
    .to(spriteShadow, { autoAlpha: 0, duration: 0.2 }, "<")
    .to(landing, { autoAlpha: 0, duration: 0.55, ease: "power2.inOut" }, "-=0.25")
    .add(() => {
      landing.classList.add("is-hidden");
      revealMainContent();
    });
}

function initScrollAnimations() {
  if (!animationLib || !scrollPlugin) {
    document.querySelectorAll(".content-card").forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    });
    return;
  }

  animationLib.utils.toArray(".content-card").forEach((card) => {
    animationLib.fromTo(card, {
      y: 28,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 82%"
      }
    });
  });
}

function setProjectStack() {
  const cards = [...document.querySelectorAll("[data-gallery-card]")];
  cards.forEach((card, index) => {
    const rotation = index % 2 === 0 ? -0.65 : 0.65;
    if (animationLib) {
      animationLib.set(card, {
        rotation,
        transformOrigin: "center bottom"
      });
    } else {
      card.style.transformOrigin = "center bottom";
      card.style.transform = `rotate(${rotation}deg)`;
    }
  });
}

function bindProjectStack() {
  if (!animationLib) return;
  const cards = [...document.querySelectorAll("[data-gallery-card]")];
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      animationLib.to(card, {
        y: -10,
        rotation: 0,
        duration: 0.22,
        ease: "power2.out"
      });
    });

    card.addEventListener("mouseleave", () => {
      const index = Number(card.dataset.index || 0);
      animationLib.to(card, {
        y: 0,
        rotation: index % 2 === 0 ? -0.65 : 0.65,
        duration: 0.22,
        ease: "power2.out"
      });
    });
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

renderData();
resizeCanvases();
setLanguage("zh");
createBreathingLoop();
animateRain();
initScrollAnimations();
setProjectStack();
bindProjectStack();
initBgm();

if (searchParams.get("entered") === "1") {
  burstPlayed = true;
  enterWithoutLanding();
}

window.addEventListener("resize", () => {
  resizeCanvases();
  setProjectStack();
  if (scrollPlugin) {
    scrollPlugin.refresh();
  }
});

if (spriteButton) {
  spriteButton.addEventListener("click", playEntrance);
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.langBtn));
});
