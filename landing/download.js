(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const releasePageUrl = 'https://github.com/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest';
  const latestReleaseApiUrl = 'https://api.github.com/repos/Exifs/Hackaton-Engie-E-Grid-2045/releases/latest';
  const ceremonyDelayMs = prefersReduced ? 450 : 2300;

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
  let latestReleasePromise = null;

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
      'initialisation du réseau européen...',
      'chargement des régions...',
      'synchronisation GitHub Releases...',
      'en attente du build sélectionné...'
    ], 210);
  }

  function setupDownloads() {
    buttons.forEach((button) => {
      button.setAttribute('target', '_blank');
      button.setAttribute('rel', 'noreferrer');
      button.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();

        const platform = button.dataset.platform || 'Desktop';
        const expectedFile = button.dataset.file || 'build.zip';
        const targetPromise = resolveDownloadTarget(button);
        startDownloadCeremony(platform, expectedFile, targetPromise);
      });
    });
  }

  async function resolveDownloadTarget(button) {
    const fallbackUrl = button.getAttribute('href') || releasePageUrl;
    const prefix = button.dataset.assetPrefix || '';
    const expectedFile = button.dataset.file || 'build.zip';

    if (!prefix || !window.fetch) {
      return { url: fallbackUrl, file: expectedFile, resolved: false };
    }

    try {
      const release = await fetchLatestRelease();
      const asset = (release.assets || []).find((candidate) => {
        const name = String(candidate.name || '');
        return name.startsWith(prefix) && name.endsWith('.zip') && candidate.browser_download_url;
      });

      if (asset) {
        return {
          url: asset.browser_download_url,
          file: asset.name,
          resolved: true
        };
      }
    } catch (error) {
      console.warn('Impossible de résoudre l’asset GitHub Release.', error);
    }

    return { url: fallbackUrl, file: expectedFile, resolved: false };
  }

  function fetchLatestRelease() {
    if (!latestReleasePromise) {
      latestReleasePromise = fetch(latestReleaseApiUrl, {
        headers: { Accept: 'application/vnd.github+json' }
      }).then((response) => {
        if (!response.ok) throw new Error(`GitHub Releases API HTTP ${response.status}`);
        return response.json();
      });
    }
    return latestReleasePromise;
  }

  function startDownloadCeremony(platform, expectedFile, targetPromise) {
    window.clearTimeout(redirectTimer);
    window.cancelAnimationFrame(confettiRaf);

    if (ceremonyTitle) ceremonyTitle.textContent = `${platform} déverrouillé`;
    if (ceremonyCopy) ceremonyCopy.textContent = `Séquence de lancement : recherche de ${expectedFile} dans GitHub Releases…`;

    writeLog([
      `selected platform: ${platform}`,
      `expected asset prefix: ${expectedFile}`,
      'routing through GitHub Releases...',
      'countdown armed...',
      'opening release tab after ceremony...'
    ], 170);

    if (!overlay) {
      openAfterCeremony(targetPromise);
      return;
    }

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    if (!prefersReduced) {
      startConfetti(platform);
      pulseCards(platform);
    }

    redirectTimer = window.setTimeout(() => {
      openAfterCeremony(targetPromise);
    }, ceremonyDelayMs);
  }

  async function openAfterCeremony(targetPromise) {
    const target = await targetPromise.catch(() => ({ url: releasePageUrl, file: 'GitHub Releases', resolved: false }));

    if (ceremonyCopy) {
      ceremonyCopy.textContent = target.resolved
        ? `Téléchargement prêt : ${target.file}`
        : 'Asset non résolu automatiquement : ouverture de la page GitHub Releases.';
    }

    writeLog([
      target.resolved ? `resolved asset: ${target.file}` : 'asset fallback: latest release page',
      'ceremony complete.',
      'opening GitHub release tab now...'
    ], 100);

    openDownloadUrl(target.url);
  }

  function openDownloadUrl(url) {
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
