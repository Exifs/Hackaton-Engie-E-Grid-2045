(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  function updateScrollProgress() {
    const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const progress = clamp(window.scrollY / max, 0, 1);
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();

  function setupReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
      observer.observe(node);
    });
  }

  function setupTilt() {
    const tiltNodes = document.querySelectorAll('[data-tilt]');
    if (prefersReduced) return;

    tiltNodes.forEach((node) => {
      node.addEventListener('pointermove', (event) => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const ry = (x - 0.5) * 10;
        const rx = (0.5 - y) * 10;
        node.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        node.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      });

      node.addEventListener('pointerleave', () => {
        node.style.setProperty('--rx', '0deg');
        node.style.setProperty('--ry', '0deg');
      });
    });
  }

  function setupParallax() {
    const layers = [...document.querySelectorAll('[data-depth]')];
    const magnetic = [...document.querySelectorAll('.magnetic')];
    if (prefersReduced || (!layers.length && !magnetic.length)) return;

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    window.addEventListener('pointermove', (event) => {
      pointer.targetX = event.clientX / window.innerWidth - 0.5;
      pointer.targetY = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    function tick() {
      pointer.x = lerp(pointer.x, pointer.targetX, 0.08);
      pointer.y = lerp(pointer.y, pointer.targetY, 0.08);

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0.1);
        const x = pointer.x * depth * -80;
        const y = pointer.y * depth * -60;
        layer.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      });

      requestAnimationFrame(tick);
    }

    tick();

    magnetic.forEach((node) => {
      node.addEventListener('pointermove', (event) => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        node.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });

      node.addEventListener('pointerleave', () => {
        node.style.translate = '0 0';
      });
    });
  }

  function setupSmoothAnchors() {
    document.querySelectorAll(`a[href^='#']`).forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function setupScreenshotDeckLayout() {
    if (!document.querySelector('.screenshot-deck')) return;
    const style = document.createElement('style');
    style.textContent = `
      .screenshot-deck {
        align-items: stretch;
        gap: 28px;
      }

      .screenshot-card,
      .screenshot-card:nth-child(2n) {
        display: flex;
        flex-direction: column;
        margin-top: 0;
        overflow: hidden;
      }

      .screenshot-card img {
        flex: 0 0 auto;
        transform: none;
      }

      .screenshot-card:hover img {
        transform: scale(1.035);
      }

      .shot-caption {
        position: relative;
        left: auto;
        right: auto;
        bottom: auto;
        margin: 0;
        min-height: 136px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-left: 0;
        border-right: 0;
        border-bottom: 0;
        border-radius: 0;
        background: rgba(3, 10, 17, 0.84);
      }

      .shot-caption h3 {
        margin-bottom: 8px;
      }

      .shot-caption p {
        max-width: 60ch;
      }

      @media (max-width: 760px) {
        .screenshot-deck {
          gap: 18px;
        }

        .shot-caption {
          min-height: auto;
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setupEnergyCanvas() {
    const canvas = document.getElementById('energy-canvas');
    if (!canvas || prefersReduced) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const pointer = { x: -9999, y: -9999, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    let raf = 0;

    function resize() {
      dpr = clamp(window.devicePixelRatio || 1, 1, 1.7);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function seedNodes() {
      const density = width < 760 ? 42 : 76;
      nodes = Array.from({ length: density }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 1.8 + 0.7,
        phase: Math.random() * Math.PI * 2,
        kind: i % 7 === 0 ? 'hot' : i % 5 === 0 ? 'violet' : 'cold'
      }));
    }

    function drawNode(node, time) {
      const pulse = 0.6 + Math.sin(time * 0.002 + node.phase) * 0.4;
      const radius = node.size + pulse * 1.2;
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 7);
      const color = node.kind === 'hot' ? '255, 155, 84' : node.kind === 'violet' ? '184, 108, 255' : '65, 243, 255';
      gradient.addColorStop(0, `rgba(${color}, 0.55)`);
      gradient.addColorStop(0.35, `rgba(${color}, 0.14)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 7, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawLine(a, b, distance, maxDistance) {
      const alpha = (1 - distance / maxDistance) * 0.18;
      if (alpha <= 0.01) return;
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, `rgba(65, 243, 255, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(120, 255, 183, ${alpha * 0.9})`);
      gradient.addColorStop(1, `rgba(184, 108, 255, ${alpha})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      const maxDistance = width < 760 ? 132 : 168;

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180 && dist > 0.001) {
            const force = (1 - dist / 180) * 0.018;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        node.vx = clamp(node.vx, -0.52, 0.52);
        node.vy = clamp(node.vy, -0.52, 0.52);
        node.vx *= 0.995;
        node.vy *= 0.995;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < maxDistance) drawLine(a, b, distance, maxDistance);
        }
      }

      nodes.forEach((node) => drawNode(node, time));
      raf = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      pointer.active = false;
    }, { passive: true });

    resize();
    raf = requestAnimationFrame(animate);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(animate);
      }
    });
  }

  setupReveal();
  setupTilt();
  setupParallax();
  setupSmoothAnchors();
  setupScreenshotDeckLayout();
  setupEnergyCanvas();
})();
