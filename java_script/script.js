const carousel = document.getElementById("carousel");
const fitShell = document.getElementById("fitShell");
const carouselStage = document.getElementById("carouselStage");

const cards = document.querySelectorAll(".card");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const chooseButtons = document.querySelectorAll(".choose-btn");

const total = cards.length;
const angle = 360 / total;

let current = 0;

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */
function getRootNumber(variableName) {
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(variableName).trim();
  return parseFloat(value);
}

function getRootValue(variableName) {
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(variableName).trim();
}

function getActiveIndex() {
  return ((current % total) + total) % total;
}

function getShortestDistance(index, activeIndex) {
  let distance = index - activeIndex;

  if (distance > total / 2) {
    distance -= total;
  }

  if (distance < -total / 2) {
    distance += total;
  }

  return distance;
}

/* =========================================================
   RAIO ADAPTATIVO
   - Faz o círculo encolher em telas menores
   - Ajuda a não cortar lateralmente
========================================================= */
function getAdaptiveRadius() {
  const cardWidth = getRootNumber("--card-width-base");
  const radiusFactor = parseFloat(getRootValue("--radius-factor")) || 1.02;

  const baseRadius = cardWidth * radiusFactor;

  // Limites por tela
  const maxByWidth = window.innerWidth * 0.22;
  const maxByHeight = window.innerHeight * 0.24;
  const minRadius = cardWidth * 0.72;

  return Math.max(minRadius, Math.min(baseRadius, maxByWidth, maxByHeight));
}

/* =========================================================
   POSICIONAMENTO DOS CARDS
========================================================= */
function updateCards() {
  const activeIndex = getActiveIndex();
  const radius = getAdaptiveRadius();

  cards.forEach((card, index) => {
    const distance = getShortestDistance(index, activeIndex);
    const absDistance = Math.abs(distance);

    let scale = 0.84;
    let opacity = 0.34;
    let blur = 2.8;
    let brightness = 0.60;

    if (absDistance === 0) {
      scale = 1.05;
      opacity = 1;
      blur = 0;
      brightness = 1;
    } else if (absDistance === 1) {
      scale = 0.93;
      opacity = 0.72;
      blur = 1;
      brightness = 0.84;
    } else {
      scale = 0.84;
      opacity = 0.38;
      blur = 2.8;
      brightness = 0.60;
    }

    card.style.transform = `rotateY(${angle * index}deg) translateZ(${radius}px) scale(${scale})`;
    card.style.opacity = opacity;
    card.style.filter = `blur(${blur}px) brightness(${brightness})`;

    card.classList.toggle("active", absDistance === 0);
    card.classList.toggle("near", absDistance === 1);
  });

  carousel.style.transform = `rotateY(${current * -angle}deg)`;
}

/* =========================================================
   FIT AUTOMÁTICO MAIS FORTE
   - Calcula o espaço do conjunto inteiro
   - Reduz a escala se necessário
========================================================= */
function fitCarouselToViewport() {
  const cardWidth = getRootNumber("--card-width-base");
  const cardHeight = getRootNumber("--card-height-base");
  const navSize = getRootNumber("--nav-size");
  const controlsMarginTop = getRootNumber("--controls-margin-top");
  const manualScale = parseFloat(getRootValue("--manual-scale")) || 1;

  const radius = getAdaptiveRadius();

  // Medida mais conservadora para nunca cortar
  const estimatedWidth =
    (radius * 2) + (cardWidth * 1.35);

  const estimatedHeight =
    (cardHeight * 1.14) +
    controlsMarginTop +
    navSize +
    26;

  const safeWidth = window.innerWidth - 20;
  const safeHeight = window.innerHeight - 20;

  const scaleX = safeWidth / (estimatedWidth * manualScale);
  const scaleY = safeHeight / (estimatedHeight * manualScale);

  const finalScale = Math.min(scaleX, scaleY, 1);

  fitShell.style.setProperty("--fit-scale", finalScale.toFixed(3));
}

/* =========================================================
   ROTAÇÃO
========================================================= */
function rotate(direction) {
  current += direction;
  updateCards();
  fitCarouselToViewport();
}

/* =========================================================
   BOTÕES DE NAVEGAÇÃO
========================================================= */
prevBtn.addEventListener("click", () => rotate(-1));
nextBtn.addEventListener("click", () => rotate(1));

/* =========================================================
   CLICAR NO CARD TRAZ PARA FRENTE
========================================================= */
cards.forEach((card, index) => {
  card.addEventListener("click", (event) => {
    if (event.target.classList.contains("choose-btn")) {
      return;
    }

    const activeIndex = getActiveIndex();
    const distance = getShortestDistance(index, activeIndex);

    current += distance;
    updateCards();
    fitCarouselToViewport();
  });
});

/* =========================================================
   SELECIONAR / DESSELECIONAR BARBEIRO
   - Clicou uma vez: Selecionado
   - Clicou de novo no mesmo: desseleciona
   - Clicou em outro: troca a seleção
========================================================= */
function clearSelection() {
  cards.forEach((card) => {
    card.classList.remove("selected");

    const button = card.querySelector(".choose-btn");
    if (button) {
      button.textContent = "Escolher";
      button.setAttribute("aria-pressed", "false");
    }
  });
}

chooseButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const clickedCard = event.target.closest(".card");
    const isAlreadySelected = clickedCard.classList.contains("selected");

    if (isAlreadySelected) {
      // Se clicou de novo no mesmo, remove a seleção
      clickedCard.classList.remove("selected");
      button.textContent = "Escolher";
      button.setAttribute("aria-pressed", "false");
      return;
    }

    // Limpa os outros e seleciona este
    clearSelection();

    clickedCard.classList.add("selected");
    button.textContent = "Selecionado";
    button.setAttribute("aria-pressed", "true");
  });
});

/* =========================================================
   SWIPE NO CELULAR
========================================================= */
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

carousel.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  },
  { passive: true }
);

carousel.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];
    endX = touch.clientX;
    endY = touch.clientY;

    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        rotate(1);
      } else {
        rotate(-1);
      }
    }
  },
  { passive: true }
);

/* =========================================================
   TECLADO
========================================================= */
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    rotate(-1);
  }

  if (event.key === "ArrowRight") {
    rotate(1);
  }
});

/* =========================================================
   INICIALIZAÇÃO
========================================================= */
function initializeCarousel() {
  updateCards();
  fitCarouselToViewport();
}

initializeCarousel();

window.addEventListener("resize", () => {
  updateCards();
  fitCarouselToViewport();
});

window.addEventListener("orientationchange", () => {
  updateCards();
  fitCarouselToViewport();
});