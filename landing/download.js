(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const releasePageUrl = 'https://github.com/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest';

  const cards = [...document.querySelectorAll('.download-card[data-os]')];
  const buttons = [...document.querySelectorAll('.download-button')];
  const detected = document.getElementById('detected-platform');
  const overlay = document.getElementById('downloadCeremony');
  const closeButton = overlay?.querySelector('.ceremony-close');
  const ceremonyTitle = document.getElementById('ceremony-title');
  const ceremonyCopy = document.getElementById('ceremony-copy');
  const log = document.getElementById('download-log');
  const confettiCanvas = document.getElementById('confettiCanvas');

  let redirectTimer = 0;
  let confettiRaf = 0;
  let pendingDownloadTab = null;

  function detectPlatform() {
    const raw = `${navigator.userAgentData?.platform || ''} ${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();
    if (/win/.test(raw)) return { key: 'windows', label: 'Windows' };
    if (/mac|iphone|ipad/.test(raw)) return { key: 'macos', label: 'macOS' };
    if (/linux|x11|ubuntu|fedora|debian/.test(raw)) return { key: 'linux', label: 'Linux' };
    return { key: '', label: 'plateforme non reconnue' };
  }

  function markRecommended() {
    const platform = detectPlatform();
    if (detected) {
      detected.textContent = platform.key
        ? `Plateforme détectée : ${platform.label}. Le build recommandé est mis en surbrillance.`
        : 'Plateforme non reconnue : choisis le build qui correspond à ta machine.';
    }

    cards.forEach((card) => {
      const isRecommended = platform.key && card.dataset.os === platform.key;
      card.classList.toggle('is-recommended', Boolean(isRecommended));
    });
  }

  function writeLog(lines, delay = 260) {
    if (!log) return;
    log.textContent = '';
    lines.forEach((line, index) => {
      window.setTimeout(() => {
        log.textContent += `${line}\n`;
      }, delay * index);
    });
  }

  function bootTerminal() {
    writeLog([
      'booting download bus...',
      'checking platform matrix...',
      'arming release channels...',
      'loading build manifest...',
      'waiting for player input...'
    ], 210);
  }

  function setupDownloads() {
    buttons.forEach((button) => {
      button.setAttribute('target', '_blank');
      button.setAttribute('rel', 'noreferrer');
      button.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        const url = button.href || releasePageUrl;
        const platform = button.dataset.platform || 'Desktop';
        const file = button.dataset.file || 'E-Grid-2045.zip';
        const downloadTab = openPendingDownloadTab(platform, file);
        startDownloadCeremony(platform, file, url, downloadTab);
      });
    });
  }

  function openPendingDownloadTab(platform, file) {
    const tab = window.open('', '_blank');
    if (!tab) return null;
    pendingDownloadTab = tab;
    try {
      tab.opener = null;
      tab.document.title = `Téléchargement ${platform} · E-Grid 2045`;
      tab.document.body.style.margin = '0';
      tab.document.body.style.minHeight = '100vh';
      tab.document.body.style.display = 'grid';
      tab.document.body.style.placeItems = 'center';
      tab.document.body.style.background = '#03080f';
      tab.document.body.style.color = '#edfaff';
      tab.document.body.style.fontFamily = 'system-ui, sans-serif';
      tab.document.body.innerHTML = `
        <main style="max-width: 560px; padding: 32px; text-align: center;">
          <h1 style="margin: 0 0 12px; font-size: 34px; letter-spacing: -0.04em;">E-Grid 2045</h1>
          <p style="margin: 0; color: #9cb8c6; line-height: 1.6;">Préparation de ${file} depuis GitHub Releases…</p>
        </main>
      `;
    } catch (_) {
      // Some browsers restrict access to the new tab. The redirect still works below.
    }
    return tab;
  }

  function startDownloadCeremony(platform, file, url, downloadTab) {
    window.clearTimeout(redirectTimer);
    window.cancelAnimationFrame(confettiRaf);

    if (ceremonyTitle) ceremonyTitle.textContent = `${platform} déverrouillé`;
    if (ceremonyCopy) ceremonyCopy.textContent = `Charge du cœur énergétique, préparation de ${file}…`;

    writeLog([
      `selected platform: ${platform}`,
      `asset target: ${file}`,
      'energizing download core...',
      'routing through GitHub Releases...',
      'opening release asset in a new tab...'
    ], 170);

    if (!overlay) {
      openDownloadUrl(url, downloadTab);
      return;
    }

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    if (!prefersReduced) {
      startConfetti(platform);
      pulseCards(platform);
    }

    redirectTimer = window.setTimeout(() => {
      openDownloadUrl(url, downloadTab);
    }, prefersReduced ? 450 : 1650);
  }

  function openDownloadUrl(url, downloadTab) {
    if (downloadTab && !downloadTab.closed) {
      downloadTab.location.href = url;
      return;
    }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = url;
  }

  function pulseCards(platform) {
    const target = platform.toLowerCase().includes('win') ? 'windows'
      : platform.toLowerCase().includes('mac') ? 'macos'
        : platform.toLowerCase().includes('linux') ? 'linux'
          : '';
    cards.forEach((card) => {
      if (target && card.dataset.os === target) {
        card.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.035)' },
          { transform: 'scale(1)' }
        ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  }

  function closeCeremony() {
    window.clearTimeout(redirectTimer);
    if (pendingDownloadTab && !pendingDownloadTab.closed) pendingDownloadTab.close();
    pendingDownloadTab = null;
    if (!overlay) return;
    overlay.classList.remove('is-open');
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 260);
  }

  function startConfetti(platform) {
    const canvas = confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = platform.toLowerCase().includes('linux')
      ? ['#41f3ff', '#78ffb7', '#ffffff', '#ff9b54']
      : platform.toLowerCase().includes('mac')
        ? ['#41f3ff', '#b86cff', '#ffffff', '#ff4fd8']
        : ['#41f3ff', '#78ffb7', '#ffffff', '#b86cff'];

    const particles = Array.from({ length: 150 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.45;
      const speed = 6 + Math.random() * 10;
      return {
        x: width / 2 + (Math.random() - 0.5) * 120,
        y: height * 0.52 + (Math.random() - 0.5) * 70,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed,
        gravity: 0.22 + Math.random() * 0.12,
        drag: 0.985,
        size: 4 + Math.random() * 8,
        spin: Math.random() * Math.PI,
        rotation: Math.random() * Math.PI,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 1,
        decay: 0.008 + Math.random() * 0.008
      };
    });

    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      particles.forEach((particle) => {
        particle.vx *= particle.drag;
        particle.vy = particle.vy * particle.drag + particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.spin * 0.06;
        particle.life -= particle.decay;

        if (particle.life <= 0) return;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
        ctx.restore();
      });

      if (elapsed < 1900 && particles.some((particle) => particle.life > 0)) {
        confettiRaf = requestAnimationFrame(frame);
      }
    }

    confettiRaf = requestAnimationFrame(frame);
  }

  closeButton?.addEventListener('click', closeCeremony);
  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) closeCeremony();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCeremony();
  });

  markRecommended();
  setupDownloads();
  bootTerminal();
})();
