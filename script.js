/* =========================================================
   1. GERAÇÃO DE ESTRELAS NO CÉU NOTURNO
   ========================================================= */
(function createStars() {
  const sky = document.getElementById("sky-layer");
  if (!sky) return;

  const starCount = 75;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";

    const size = Math.random() * 2.6 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.top = `${Math.random() * 68}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.setProperty("--duration", `${(Math.random() * 3 + 2).toFixed(1)}s`);
    star.style.animationDelay = `${(Math.random() * 4).toFixed(1)}s`;

    sky.appendChild(star);
  }
})();

/* =========================================================
   2. ANIMAÇÃO DE NEVE CONTÍNUA NO CANVAS
   ========================================================= */
(function initSnowfall() {
  const canvas = document.getElementById("snow-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let flakes = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createFlakes() {
    const flakeCount = Math.min(160, Math.floor((width * height) / 8500));

    flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3.2 + 1.2,
      speedY: Math.random() * 1.3 + 0.5,
      speedX: Math.random() * 0.6 - 0.3,
      wobble: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.65 + 0.35
    }));
  }

  function renderSnow() {
    ctx.clearRect(0, 0, width, height);

    for (const flake of flakes) {
      flake.wobble += 0.018;
      flake.y += flake.speedY;
      flake.x += flake.speedX + Math.sin(flake.wobble) * 0.45;

      // Reinicia o floco no topo ao sair pela parte inferior
      if (flake.y > height + 5) {
        flake.y = -5;
        flake.x = Math.random() * width;
      }

      // Mantém os flocos dentro das bordas laterais
      if (flake.x > width + 5) {
        flake.x = -5;
      } else if (flake.x < -5) {
        flake.x = width + 5;
      }

      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(renderSnow);
  }

  resizeCanvas();
  createFlakes();
  renderSnow();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createFlakes();
  });
})();

/* =========================================================
   3. MÚSICA NATALINA SINTETIZADA (WEB AUDIO API)
   ========================================================= */
(function initChristmasMusic() {
  const toggleBtn = document.getElementById("audio-toggle-btn");
  const statusText = document.getElementById("audio-status-text");
  const audioIcon = document.getElementById("audio-icon");
  const eqBars = document.getElementById("eq-bars");

  if (!toggleBtn || !statusText || !audioIcon || !eqBars) return;

  let audioCtx = null;
  let isPlaying = false;
  let timerId = null;
  let stepIndex = 0;

  // Frequências das notas em Hertz (Hz)
  const NOTES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    REST: 0
  };

  // Sequência da melodia "Jingle Bells": [frequência, duração em batidas]
  const melody = [
    [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 2],
    [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 2],
    [NOTES.E4, 1], [NOTES.G4, 1], [NOTES.C4, 1.5], [NOTES.D4, 0.5], [NOTES.E4, 4],

    [NOTES.F4, 1], [NOTES.F4, 1], [NOTES.F4, 1.5], [NOTES.F4, 0.5],
    [NOTES.F4, 1], [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 0.5], [NOTES.E4, 0.5],
    [NOTES.E4, 1], [NOTES.D4, 1], [NOTES.D4, 1], [NOTES.E4, 1], [NOTES.D4, 2], [NOTES.G4, 2],

    [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 2],
    [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 2],
    [NOTES.E4, 1], [NOTES.G4, 1], [NOTES.C4, 1.5], [NOTES.D4, 0.5], [NOTES.E4, 4],

    [NOTES.F4, 1], [NOTES.F4, 1], [NOTES.F4, 1.5], [NOTES.F4, 0.5],
    [NOTES.F4, 1], [NOTES.E4, 1], [NOTES.E4, 1], [NOTES.E4, 0.5], [NOTES.E4, 0.5],
    [NOTES.G4, 1], [NOTES.G4, 1], [NOTES.F4, 1], [NOTES.D4, 1], [NOTES.C4, 4]
  ];

  const beatDurationMs = 340;

  function playBellNote(freq, durationSec) {
    if (!audioCtx || freq === 0) return;

    const now = audioCtx.currentTime;

    // Oscilador principal com onda senoidal para timbre suave
    const osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    // Harmônico uma oitava acima para efeito de caixinha de música
    const osc2 = audioCtx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now);

    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.setValueAtTime(0.06, now);

    // Controle de volume (ataque rápido e decaimento suave)
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0008, now + durationSec * 1.15);

    osc1.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec * 1.2);
    osc2.stop(now + durationSec * 1.2);
  }

  function scheduleNextNote() {
    if (!isPlaying) return;

    const [freq, beats] = melody[stepIndex];
    const durationMs = beats * beatDurationMs;

    playBellNote(freq, durationMs / 1000);

    stepIndex = (stepIndex + 1) % melody.length;
    timerId = setTimeout(scheduleNextNote, durationMs);
  }

  function updateUI() {
    if (isPlaying) {
      statusText.textContent = "Pausar Música";
      audioIcon.textContent = "❚❚";
      eqBars.classList.add("playing");
      toggleBtn.classList.add("ring-2", "ring-amber-300/60");
    } else {
      statusText.textContent = "Tocar Música";
      audioIcon.textContent = "▶";
      eqBars.classList.remove("playing");
      toggleBtn.classList.remove("ring-2", "ring-amber-300/60");
    }
  }

  toggleBtn.addEventListener("click", () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    isPlaying = !isPlaying;
    updateUI();

    if (isPlaying) {
      scheduleNextNote();
    } else {
      clearTimeout(timerId);
    }
  });
})();

/* =========================================================
   4. MENSAGENS DE NATAL E LUZES DOS PINHEIROS
   ========================================================= */
(function initInteractions() {
  const wishBtn = document.getElementById("wish-btn");
  const wishCard = document.getElementById("wish-card");
  const wishText = document.getElementById("wish-text");
  const wishAuthor = document.getElementById("wish-author");

  const lightsBtn = document.getElementById("lights-btn");
  const lightsBtnLabel = document.getElementById("lights-btn-label");

  const wishes = [
    {
      text: "“O Natal não é uma data no calendário, mas um estado de espírito feito de generosidade, perdão e esperança.”",
      author: "Boas Festas e muita paz no seu lar!"
    },
    {
      text: "“Que cada floco de neve traga uma nova razão para sorrir e cada estrela ilumine seus passos no novo ano.”",
      author: "Com carinho, Espírito Natalino ✨"
    },
    {
      text: "“O melhor presente debaixo da árvore é a presença de quem torna a nossa vida mais doce e cheia de sentido.”",
      author: "Feliz Natal para você e sua família!"
    },
    {
      text: "“Que a esperança renasça hoje no seu coração e permaneça acesa durante todos os dias do próximo ano.”",
      author: "Luz, saúde e prosperidade!"
    }
  ];

  let lastWishIndex = -1;

  if (wishBtn && wishCard && wishText && wishAuthor) {
    wishBtn.addEventListener("click", () => {
      let nextIndex;

      // Evita repetir exatamente a mesma mensagem em cliques seguidos
      do {
        nextIndex = Math.floor(Math.random() * wishes.length);
      } while (nextIndex === lastWishIndex && wishes.length > 1);

      lastWishIndex = nextIndex;
      const selected = wishes[nextIndex];

      wishText.textContent = selected.text;
      wishAuthor.textContent = selected.author;
      wishCard.classList.remove("hidden");
    });
  }

  if (lightsBtn && lightsBtnLabel) {
    lightsBtn.addEventListener("click", () => {
      const isLit = document.body.classList.toggle("lights-on");
      lightsBtnLabel.textContent = isLit
        ? "Apagar Luzes da Floresta"
        : "Acender Luzes da Floresta";
    });
  }
})();