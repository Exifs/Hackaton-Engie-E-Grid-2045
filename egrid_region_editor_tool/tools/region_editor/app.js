'use strict';

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';
  const EDITOR_VERSION = '0.2.0';
  const LOCAL_STORAGE_KEY = 'egrid_region_shape_editor_v1';

  const state = {
    regionIds: null,
    contours: null,
    imageSize: [1672, 941],
    backgroundUrl: window.INITIAL_BACKGROUND_DATA_URL || '',
    selectedSlug: 'fr_nord',
    selectedComponent: 0,
    selectedPoint: -1,
    hiddenRegions: new Set(),
    mode: 'select',
    drag: null,
    history: [],
    redo: [],
    dirty: false,
    spaceDown: false,
    autoSaveTimer: null,
    viewBox: { x: 0, y: 0, w: 1672, h: 941 },
    polygonEls: new Map(),
    handleEls: [],
    labelEls: [],
  };

  const el = {};

  function boot() {
    collectElements();
    state.regionIds = parseJsonScript('initial-region-ids');
    state.contours = normalizeContours(parseJsonScript('initial-contours'));
    state.imageSize = state.contours.image_size || state.imageSize;
    state.viewBox = { x: 0, y: 0, w: state.imageSize[0], h: state.imageSize[1] };
    wireUi();
    refreshMetrics();
    renderAll();
    setStatus('Éditeur prêt. Sélectionne une région, puis déplace ses sommets.', 'ok');
  }

  function collectElements() {
    const ids = [
      'mapSvg', 'regionList', 'regionSearch', 'selectedInfo', 'pointInfo', 'statusLine', 'modeSelect',
      'modeAdd', 'modeMove', 'modePan', 'fillOpacity', 'strokeOpacity', 'backgroundOpacity', 'handleSize',
      'snapLinked', 'snapRadius', 'snapGrid', 'showLabels', 'soloSelected', 'showVertices', 'btnUndo',
      'btnRedo', 'btnDeletePoint', 'btnAddComponent', 'btnDeleteComponent', 'btnSimplifySelected',
      'simplifyTolerance', 'btnExportEditor', 'btnExportContours', 'btnExportSvg', 'btnSaveLocal',
      'btnLoadLocal', 'btnClearLocal', 'btnResetView', 'btnPrevRegion', 'btnNextRegion', 'fileImportJson',
      'fileImportBackground', 'pointBudget', 'viewInfo', 'autoSave', 'btnDownloadCodexNote'
    ];
    for (const id of ids) {
      el[id] = document.getElementById(id);
    }
  }

  function parseJsonScript(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error('Script JSON manquant: ' + id);
    return JSON.parse(node.textContent);
  }

  function wireUi() {
    el.mapSvg.addEventListener('wheel', onWheel, { passive: false });
    el.mapSvg.addEventListener('pointerdown', onSvgPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('beforeunload', (event) => {
      if (state.dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    });

    el.regionSearch.addEventListener('input', renderRegionList);
    for (const [id, mode] of [['modeSelect', 'select'], ['modeAdd', 'add'], ['modeMove', 'move'], ['modePan', 'pan']]) {
      el[id].addEventListener('click', () => setMode(mode));
    }

    for (const control of ['fillOpacity', 'strokeOpacity', 'backgroundOpacity', 'handleSize', 'snapRadius', 'showLabels', 'soloSelected', 'showVertices']) {
      el[control].addEventListener('input', renderAll);
      el[control].addEventListener('change', renderAll);
    }
    el.snapGrid.addEventListener('change', () => setStatus(el.snapGrid.checked ? 'Snap grille activé.' : 'Snap grille désactivé.', 'info'));
    el.snapLinked.addEventListener('change', () => setStatus(el.snapLinked.checked ? 'Édition liée activée : les sommets voisins sont déplacés ensemble.' : 'Édition liée désactivée.', 'info'));

    el.btnUndo.addEventListener('click', undo);
    el.btnRedo.addEventListener('click', redo);
    el.btnDeletePoint.addEventListener('click', deleteSelectedPoint);
    el.btnAddComponent.addEventListener('click', addComponentToSelectedRegion);
    el.btnDeleteComponent.addEventListener('click', deleteSelectedComponent);
    el.btnSimplifySelected.addEventListener('click', simplifySelectedRegion);
    el.btnExportEditor.addEventListener('click', () => downloadJson(buildEditorExport(), timestampedName('egrid_region_editor_shapes', 'json')));
    el.btnExportContours.addEventListener('click', () => downloadJson(buildContoursExport(), 'regions_contours_edited.json'));
    el.btnExportSvg.addEventListener('click', () => downloadText(buildSvgExport(), 'regions_master_template_edited.svg', 'image/svg+xml'));
    el.btnSaveLocal.addEventListener('click', () => saveLocal(true));
    el.btnLoadLocal.addEventListener('click', loadLocal);
    el.btnClearLocal.addEventListener('click', clearLocal);
    el.btnResetView.addEventListener('click', resetView);
    el.btnPrevRegion.addEventListener('click', () => selectRelativeRegion(-1));
    el.btnNextRegion.addEventListener('click', () => selectRelativeRegion(1));
    el.btnDownloadCodexNote.addEventListener('click', downloadCodexNote);
    el.fileImportJson.addEventListener('change', importJsonFile);
    el.fileImportBackground.addEventListener('change', importBackgroundFile);
  }

  function normalizeContours(input) {
    let contours = input;
    if (input && input.schema_version === 'region_editor_shapes_v1') {
      contours = input.contours || input.region_contours || input;
      if (input.region_ids) state.regionIds = input.region_ids;
    }
    if (!contours || !contours.regions) throw new Error('Format de contours invalide.');
    const out = JSON.parse(JSON.stringify(contours));
    out.schema_version = 'region_contours_v1';
    out.coordinate_system = out.coordinate_system || 'image_pixels_top_left';
    out.image_size = out.image_size || state.imageSize;
    out.source_image = out.source_image || 'europe_map_backdrop_generated_clean_v1.png';
    if (state.regionIds && state.regionIds.regions) {
      for (const meta of state.regionIds.regions) {
        if (!out.regions[meta.slug]) {
          out.regions[meta.slug] = {
            id: meta.id,
            display_name: meta.display_name,
            components: [],
            centroid: [0, 0],
            label_point: [0, 0],
            slot_anchor: [0, 0],
            bounds: [0, 0, 0, 0],
            point_count: 0
          };
        }
        const region = out.regions[meta.slug];
        region.id = meta.id;
        region.display_name = meta.display_name;
        region.components = sanitizeComponents(region.components || []);
      }
    }
    return out;
  }

  function sanitizeComponents(components) {
    const clean = [];
    for (const component of components) {
      if (!Array.isArray(component)) continue;
      const pts = [];
      for (const p of component) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const x = Number(p[0]);
        const y = Number(p[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) pts.push([round2(x), round2(y)]);
      }
      if (pts.length >= 3) clean.push(pts);
    }
    return clean;
  }

  function refreshMetrics() {
    const imageSize = state.contours.image_size || state.imageSize;
    state.imageSize = imageSize;
    let total = 0;
    for (const meta of state.regionIds.regions) {
      const region = state.contours.regions[meta.slug];
      if (!region) continue;
      region.id = meta.id;
      region.display_name = meta.display_name;
      region.components = sanitizeComponents(region.components || []);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let pointCount = 0;
      let weightedCx = 0, weightedCy = 0, weight = 0;
      let fallbackX = 0, fallbackY = 0;
      for (const component of region.components) {
        pointCount += component.length;
        for (const [x, y] of component) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          fallbackX += x; fallbackY += y;
        }
        const pc = polygonCentroid(component);
        if (pc.weight > 0) {
          weightedCx += pc.x * pc.weight;
          weightedCy += pc.y * pc.weight;
          weight += pc.weight;
        }
      }
      if (pointCount === 0) {
        region.bounds = [0, 0, 0, 0];
        region.centroid = [0, 0];
        region.label_point = [0, 0];
        region.slot_anchor = [0, 0];
        region.point_count = 0;
        continue;
      }
      const centroid = weight > 0
        ? [round2(weightedCx / weight), round2(weightedCy / weight)]
        : [round2(fallbackX / pointCount), round2(fallbackY / pointCount)];
      region.bounds = [round2(minX), round2(minY), round2(maxX), round2(maxY)];
      region.centroid = centroid;
      region.label_point = centroid;
      region.slot_anchor = centroid;
      region.point_count = pointCount;
      total += pointCount;
    }
    state.contours.total_point_count = total;
    state.contours.point_budget = { target_max: 5000, warning_max: 5000, critical_max: 8000 };
    state.contours.performance_warning = total > 8000 ? 'critical_point_budget_exceeded' : (total > 5000 ? 'point_budget_warning' : 'ok');
  }

  function polygonCentroid(points) {
    let area2 = 0;
    let cx = 0;
    let cy = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % n];
      const cross = x0 * y1 - x1 * y0;
      area2 += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    if (Math.abs(area2) < 0.001) return { x: 0, y: 0, weight: 0 };
    return { x: cx / (3 * area2), y: cy / (3 * area2), weight: Math.abs(area2) / 2 };
  }

  function renderAll() {
    refreshMetrics();
    applyViewBox();
    state.polygonEls.clear();
    state.handleEls = [];
    state.labelEls = [];
    el.mapSvg.innerHTML = '';
    el.mapSvg.setAttribute('width', state.imageSize[0]);
    el.mapSvg.setAttribute('height', state.imageSize[1]);

    const defs = svgEl('defs');
    const glow = svgEl('filter', { id: 'selectedGlow', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    glow.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2.2', result: 'blur' }));
    const merge = svgEl('feMerge');
    merge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
    merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    glow.appendChild(merge);
    defs.appendChild(glow);
    el.mapSvg.appendChild(defs);

    const bg = svgEl('image', {
      x: 0, y: 0,
      width: state.imageSize[0], height: state.imageSize[1],
      preserveAspectRatio: 'none', opacity: Number(el.backgroundOpacity.value)
    });
    bg.setAttribute('href', state.backgroundUrl);
    bg.setAttributeNS(XLINK_NS, 'xlink:href', state.backgroundUrl);
    bg.style.pointerEvents = 'none';
    el.mapSvg.appendChild(bg);

    const regionGroup = svgEl('g', { id: 'regionLayer' });
    el.mapSvg.appendChild(regionGroup);
    const labelGroup = svgEl('g', { id: 'labelLayer' });
    const handleGroup = svgEl('g', { id: 'handleLayer' });

    const solo = el.soloSelected.checked;
    for (const meta of state.regionIds.regions) {
      const slug = meta.slug;
      if (state.hiddenRegions.has(slug)) continue;
      if (solo && slug !== state.selectedSlug) continue;
      const region = state.contours.regions[slug];
      if (!region || !region.components) continue;
      const selected = slug === state.selectedSlug;
      region.components.forEach((component, ci) => {
        const poly = svgEl('polygon', {
          points: pointsAttr(component),
          'data-slug': slug,
          'data-component': String(ci),
          fill: colorForId(meta.id),
          'fill-opacity': selected ? Math.min(0.62, Number(el.fillOpacity.value) + 0.12) : Number(el.fillOpacity.value),
          stroke: selected ? '#8ff7ff' : '#31e6ff',
          'stroke-opacity': selected ? 0.95 : Number(el.strokeOpacity.value),
          'stroke-width': selected ? 2.3 : 1.35,
          'vector-effect': 'non-scaling-stroke',
          filter: selected ? 'url(#selectedGlow)' : ''
        });
        poly.classList.add('region-polygon');
        if (selected) poly.classList.add('is-selected');
        poly.addEventListener('pointerdown', onPolygonPointerDown);
        regionGroup.appendChild(poly);
        state.polygonEls.set(componentKey(slug, ci), poly);
      });
      if (el.showLabels.checked && region.label_point && region.point_count > 0) {
        const label = svgEl('text', {
          x: region.label_point[0], y: region.label_point[1],
          'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': selected ? 16 : 12,
          'font-family': 'system-ui, sans-serif',
          'font-weight': selected ? 800 : 700,
          fill: selected ? '#ffffff' : '#aeeeff',
          stroke: '#00131c', 'stroke-width': 3.8, 'paint-order': 'stroke fill',
          'pointer-events': 'none', opacity: selected ? 1 : 0.82
        });
        label.textContent = selected ? `${meta.id} · ${meta.display_name}` : String(meta.id);
        labelGroup.appendChild(label);
        state.labelEls.push(label);
      }
    }

    el.mapSvg.appendChild(labelGroup);
    el.mapSvg.appendChild(handleGroup);
    renderHandles(handleGroup);
    renderRegionList();
    updateInfoPanels();
    updateModeButtons();
  }

  function renderHandles(parent) {
    if (!el.showVertices.checked) return;
    const region = state.contours.regions[state.selectedSlug];
    if (!region || !region.components) return;
    const size = Number(el.handleSize.value);
    region.components.forEach((component, ci) => {
      component.forEach((point, pi) => {
        const selected = ci === state.selectedComponent && pi === state.selectedPoint;
        const handle = svgEl('circle', {
          cx: point[0], cy: point[1], r: selected ? size * 1.35 : size,
          fill: selected ? '#fff7c2' : '#00e6ff',
          stroke: selected ? '#ffbf3d' : '#002a38',
          'stroke-width': selected ? 2.2 : 1.4,
          'vector-effect': 'non-scaling-stroke',
          'data-slug': state.selectedSlug,
          'data-component': String(ci),
          'data-point': String(pi),
          class: 'vertex-handle'
        });
        handle.addEventListener('pointerdown', onHandlePointerDown);
        parent.appendChild(handle);
        state.handleEls.push(handle);
      });
    });
  }

  function renderRegionList() {
    const filter = (el.regionSearch.value || '').trim().toLowerCase();
    el.regionList.innerHTML = '';
    for (const meta of state.regionIds.regions) {
      const hay = `${meta.id} ${meta.slug} ${meta.display_name}`.toLowerCase();
      if (filter && !hay.includes(filter)) continue;
      const region = state.contours.regions[meta.slug];
      const row = document.createElement('div');
      row.className = 'region-row' + (meta.slug === state.selectedSlug ? ' selected' : '');
      row.title = `${meta.id} · ${meta.slug}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !state.hiddenRegions.has(meta.slug);
      checkbox.addEventListener('change', (event) => {
        event.stopPropagation();
        if (checkbox.checked) state.hiddenRegions.delete(meta.slug);
        else state.hiddenRegions.add(meta.slug);
        renderAll();
      });
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = colorForId(meta.id);
      const label = document.createElement('button');
      label.className = 'region-label';
      label.type = 'button';
      label.innerHTML = `<strong>${meta.id}</strong><span>${escapeHtml(meta.display_name)}</span><small>${escapeHtml(meta.slug)}</small>`;
      label.addEventListener('click', () => {
        selectRegion(meta.slug, 0, -1);
        focusSelectedRegion(false);
      });
      row.appendChild(checkbox);
      row.appendChild(swatch);
      row.appendChild(label);
      el.regionList.appendChild(row);
    }
  }

  function updateInfoPanels() {
    const meta = getMeta(state.selectedSlug);
    const region = state.contours.regions[state.selectedSlug];
    if (!meta || !region) {
      el.selectedInfo.textContent = 'Aucune région sélectionnée.';
      return;
    }
    const bounds = region.bounds || [0, 0, 0, 0];
    const componentCount = region.components ? region.components.length : 0;
    el.selectedInfo.innerHTML = `
      <div><b>${meta.id} · ${escapeHtml(meta.display_name)}</b></div>
      <div class="muted">slug: <code>${escapeHtml(meta.slug)}</code></div>
      <div>Composants: <b>${componentCount}</b> · Points: <b>${region.point_count || 0}</b></div>
      <div class="muted">bounds: ${fmt(bounds[0])}, ${fmt(bounds[1])} → ${fmt(bounds[2])}, ${fmt(bounds[3])}</div>
    `;
    if (state.selectedPoint >= 0 && region.components[state.selectedComponent] && region.components[state.selectedComponent][state.selectedPoint]) {
      const p = region.components[state.selectedComponent][state.selectedPoint];
      el.pointInfo.innerHTML = `Point sélectionné: composant <b>${state.selectedComponent + 1}</b>, sommet <b>${state.selectedPoint + 1}</b><br><code>x=${fmt(p[0])}, y=${fmt(p[1])}</code>`;
    } else {
      el.pointInfo.textContent = 'Aucun sommet sélectionné.';
    }
    const total = state.contours.total_point_count || 0;
    const budgetClass = total > 8000 ? 'bad' : (total > 5000 ? 'warn' : 'ok');
    el.pointBudget.innerHTML = `<span class="${budgetClass}">${total}</span> points au total · cible ≤ 5000 · critique > 8000`;
    const zoom = Math.round((state.imageSize[0] / state.viewBox.w) * 100);
    el.viewInfo.textContent = `viewBox ${fmt(state.viewBox.x)},${fmt(state.viewBox.y)},${fmt(state.viewBox.w)},${fmt(state.viewBox.h)} · zoom ${zoom}%`;
    el.btnUndo.disabled = state.history.length === 0;
    el.btnRedo.disabled = state.redo.length === 0;
  }

  function updateModeButtons() {
    for (const [id, mode] of [['modeSelect', 'select'], ['modeAdd', 'add'], ['modeMove', 'move'], ['modePan', 'pan']]) {
      el[id].classList.toggle('active', state.mode === mode);
    }
  }

  function setMode(mode) {
    state.mode = mode;
    updateModeButtons();
    const messages = {
      select: 'Mode sélection: clique une région ou déplace ses sommets.',
      add: 'Mode ajout: clique un segment de la région sélectionnée pour insérer un sommet.',
      move: 'Mode déplacement: glisse une région pour déplacer tous ses sommets.',
      pan: 'Mode navigation: glisse pour te déplacer, molette pour zoomer.'
    };
    setStatus(messages[mode] || 'Mode changé.', 'info');
  }

  function selectRegion(slug, component = 0, point = -1) {
    if (!state.contours.regions[slug]) return;
    state.selectedSlug = slug;
    state.selectedComponent = Math.max(0, component);
    state.selectedPoint = point;
    if (state.hiddenRegions.has(slug)) state.hiddenRegions.delete(slug);
    renderAll();
  }

  function selectRelativeRegion(delta) {
    const list = state.regionIds.regions.map(r => r.slug);
    const idx = Math.max(0, list.indexOf(state.selectedSlug));
    const next = (idx + delta + list.length) % list.length;
    selectRegion(list[next], 0, -1);
    focusSelectedRegion(false);
  }

  function focusSelectedRegion(animate) {
    const region = state.contours.regions[state.selectedSlug];
    if (!region || !region.bounds) return;
    const [minX, minY, maxX, maxY] = region.bounds;
    const margin = 90;
    const target = {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      w: Math.min(state.imageSize[0], Math.max(120, maxX - minX + margin * 2)),
      h: Math.min(state.imageSize[1], Math.max(120, maxY - minY + margin * 2)),
    };
    const aspect = el.mapSvg.clientWidth / Math.max(1, el.mapSvg.clientHeight);
    if (target.w / target.h > aspect) target.h = target.w / aspect;
    else target.w = target.h * aspect;
    state.viewBox = clampViewBox(target);
    applyViewBox();
    updateInfoPanels();
  }

  function resetView() {
    state.viewBox = { x: 0, y: 0, w: state.imageSize[0], h: state.imageSize[1] };
    applyViewBox();
    updateInfoPanels();
  }

  function onPolygonPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const slug = event.currentTarget.dataset.slug;
    const component = Number(event.currentTarget.dataset.component || 0);
    if (state.mode === 'pan' || event.button === 1 || state.spaceDown) {
      startPan(event);
      return;
    }
    if (state.mode === 'move' || event.shiftKey) {
      if (slug !== state.selectedSlug) {
        state.selectedSlug = slug;
        state.selectedComponent = component;
        state.selectedPoint = -1;
        renderAll();
      }
      startMoveRegion(event, slug, event.ctrlKey || event.metaKey ? component : null);
      return;
    }
    if (state.mode === 'add') {
      if (slug !== state.selectedSlug) {
        selectRegion(slug, component, -1);
        return;
      }
      addPointAtEvent(event);
      return;
    }
    selectRegion(slug, component, -1);
  }

  function onHandlePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const slug = event.currentTarget.dataset.slug;
    const ci = Number(event.currentTarget.dataset.component);
    const pi = Number(event.currentTarget.dataset.point);
    state.selectedSlug = slug;
    state.selectedComponent = ci;
    state.selectedPoint = pi;
    pushHistory('move-point');
    const start = eventToSvgPoint(event);
    const targets = findLinkedTargets(slug, ci, pi).map(t => ({
      slug: t.slug,
      ci: t.ci,
      pi: t.pi,
      original: [...state.contours.regions[t.slug].components[t.ci][t.pi]]
    }));
    state.drag = { type: 'point', pointerId: event.pointerId, start, targets };
    el.mapSvg.setPointerCapture?.(event.pointerId);
    updateInfoPanels();
  }

  function onSvgPointerDown(event) {
    if (event.target !== el.mapSvg && event.target.tagName.toLowerCase() !== 'image') return;
    if (state.mode === 'pan' || event.button === 1 || state.spaceDown) {
      event.preventDefault();
      startPan(event);
    }
  }

  function startPan(event) {
    state.drag = {
      type: 'pan',
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startViewBox: { ...state.viewBox }
    };
    el.mapSvg.classList.add('panning');
    el.mapSvg.setPointerCapture?.(event.pointerId);
  }

  function startMoveRegion(event, slug, componentIndexOrNull) {
    pushHistory('move-region');
    const start = eventToSvgPoint(event);
    const targets = [];
    const region = state.contours.regions[slug];
    region.components.forEach((component, ci) => {
      if (componentIndexOrNull !== null && ci !== componentIndexOrNull) return;
      component.forEach((point, pi) => targets.push({ slug, ci, pi, original: [...point] }));
    });
    state.drag = { type: 'move-region', pointerId: event.pointerId, start, targets };
    el.mapSvg.setPointerCapture?.(event.pointerId);
    setStatus(componentIndexOrNull === null ? 'Déplacement de la région complète.' : 'Déplacement du composant sélectionné.', 'info');
  }

  function onPointerMove(event) {
    if (!state.drag) return;
    if (state.drag.pointerId !== undefined && event.pointerId !== undefined && state.drag.pointerId !== event.pointerId) return;
    if (state.drag.type === 'pan') {
      const rect = el.mapSvg.getBoundingClientRect();
      const dx = event.clientX - state.drag.startClient.x;
      const dy = event.clientY - state.drag.startClient.y;
      const sx = state.drag.startViewBox.w / Math.max(1, rect.width);
      const sy = state.drag.startViewBox.h / Math.max(1, rect.height);
      state.viewBox = clampViewBox({
        x: state.drag.startViewBox.x - dx * sx,
        y: state.drag.startViewBox.y - dy * sy,
        w: state.drag.startViewBox.w,
        h: state.drag.startViewBox.h
      });
      applyViewBox();
      updateInfoPanels();
      return;
    }
    if (state.drag.type === 'point' || state.drag.type === 'move-region') {
      let p = eventToSvgPoint(event);
      if (el.snapGrid.checked) p = snapPointToGrid(p, 2);
      const dx = p.x - state.drag.start.x;
      const dy = p.y - state.drag.start.y;
      for (const target of state.drag.targets) {
        const point = state.contours.regions[target.slug].components[target.ci][target.pi];
        point[0] = clamp(round2(target.original[0] + dx), 0, state.imageSize[0]);
        point[1] = clamp(round2(target.original[1] + dy), 0, state.imageSize[1]);
      }
      updateChangedGeometry(state.drag.targets);
      refreshMetrics();
      updateInfoPanels();
    }
  }

  function onPointerUp(event) {
    if (!state.drag) return;
    if (state.drag.pointerId !== undefined && event.pointerId !== undefined && state.drag.pointerId !== event.pointerId) return;
    const type = state.drag.type;
    state.drag = null;
    el.mapSvg.classList.remove('panning');
    if (type === 'point' || type === 'move-region') {
      markDirty();
      renderAll();
      setStatus('Modification appliquée.', 'ok');
    }
  }

  function onKeyDown(event) {
    const active = document.activeElement;
    const inInput = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    if (event.code === 'Space' && !inInput) {
      state.spaceDown = true;
      el.mapSvg.classList.add('space-pan');
      event.preventDefault();
      return;
    }
    if (inInput) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteSelectedPoint();
      return;
    }
    if (event.key === 'a') setMode('add');
    if (event.key === 'v') setMode('select');
    if (event.key === 'm') setMode('move');
    if (event.key === 'f') focusSelectedRegion(false);
  }

  function onKeyUp(event) {
    if (event.code === 'Space') {
      state.spaceDown = false;
      el.mapSvg.classList.remove('space-pan');
    }
  }

  function onWheel(event) {
    event.preventDefault();
    const factor = Math.exp(event.deltaY * 0.0012);
    zoomAt(event, factor);
  }

  function zoomAt(event, factor) {
    const mouse = eventToSvgPoint(event);
    const minW = 80;
    const maxW = state.imageSize[0] * 2.5;
    const newW = clamp(state.viewBox.w * factor, minW, maxW);
    const newH = newW / Math.max(0.1, el.mapSvg.clientWidth / Math.max(1, el.mapSvg.clientHeight));
    const rx = (mouse.x - state.viewBox.x) / state.viewBox.w;
    const ry = (mouse.y - state.viewBox.y) / state.viewBox.h;
    state.viewBox = clampViewBox({
      x: mouse.x - rx * newW,
      y: mouse.y - ry * newH,
      w: newW,
      h: newH
    });
    applyViewBox();
    updateInfoPanels();
  }

  function addPointAtEvent(event) {
    const region = state.contours.regions[state.selectedSlug];
    if (!region || !region.components.length) return;
    const p = eventToSvgPoint(event);
    const nearest = nearestSegment(region.components, p);
    if (!nearest) return;
    pushHistory('add-point');
    const component = region.components[nearest.ci];
    component.splice(nearest.insertIndex, 0, [round2(p.x), round2(p.y)]);
    state.selectedComponent = nearest.ci;
    state.selectedPoint = nearest.insertIndex;
    markDirty();
    renderAll();
    setStatus(`Sommet ajouté au composant ${nearest.ci + 1}.`, 'ok');
  }

  function deleteSelectedPoint() {
    const region = state.contours.regions[state.selectedSlug];
    if (!region || state.selectedPoint < 0 || !region.components[state.selectedComponent]) {
      setStatus('Sélectionne d’abord un sommet à supprimer.', 'warn');
      return;
    }
    const component = region.components[state.selectedComponent];
    if (component.length <= 3) {
      setStatus('Impossible de supprimer: un composant doit garder au moins 3 sommets.', 'warn');
      return;
    }
    pushHistory('delete-point');
    component.splice(state.selectedPoint, 1);
    state.selectedPoint = Math.min(state.selectedPoint, component.length - 1);
    markDirty();
    renderAll();
    setStatus('Sommet supprimé.', 'ok');
  }

  function addComponentToSelectedRegion() {
    const region = state.contours.regions[state.selectedSlug];
    if (!region) return;
    const center = region.label_point && region.point_count > 0 ? region.label_point : [state.imageSize[0] / 2, state.imageSize[1] / 2];
    const radius = 32;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI * 2 / 6;
      points.push([round2(center[0] + Math.cos(a) * radius), round2(center[1] + Math.sin(a) * radius)]);
    }
    pushHistory('add-component');
    region.components.push(points);
    state.selectedComponent = region.components.length - 1;
    state.selectedPoint = 0;
    markDirty();
    renderAll();
    setStatus('Nouveau composant ajouté. Déplace ses points vers l’île ou la zone voulue.', 'ok');
  }

  function deleteSelectedComponent() {
    const region = state.contours.regions[state.selectedSlug];
    if (!region || !region.components[state.selectedComponent]) return;
    if (region.components.length <= 1) {
      setStatus('Suppression refusée: garde au moins un composant par région. Déplace-le ou simplifie-le.', 'warn');
      return;
    }
    pushHistory('delete-component');
    region.components.splice(state.selectedComponent, 1);
    state.selectedComponent = Math.max(0, state.selectedComponent - 1);
    state.selectedPoint = -1;
    markDirty();
    renderAll();
    setStatus('Composant supprimé.', 'ok');
  }

  function simplifySelectedRegion() {
    const region = state.contours.regions[state.selectedSlug];
    if (!region) return;
    const tolerance = Math.max(0.1, Number(el.simplifyTolerance.value));
    pushHistory('simplify-region');
    let before = 0;
    let after = 0;
    region.components = region.components.map(component => {
      before += component.length;
      const simplified = simplifyPolygon(component, tolerance);
      after += simplified.length;
      return simplified;
    });
    state.selectedPoint = -1;
    markDirty();
    renderAll();
    setStatus(`Simplification région: ${before} → ${after} points.`, 'ok');
  }

  function nearestSegment(components, p) {
    let best = null;
    components.forEach((component, ci) => {
      const n = component.length;
      for (let i = 0; i < n; i++) {
        const a = component[i];
        const b = component[(i + 1) % n];
        const d = pointSegmentDistance(p, { x: a[0], y: a[1] }, { x: b[0], y: b[1] });
        if (!best || d < best.distance) {
          best = { ci, pi: i, distance: d, insertIndex: i + 1 };
        }
      }
    });
    return best;
  }

  function findLinkedTargets(slug, ci, pi) {
    const base = state.contours.regions[slug].components[ci][pi];
    const targets = [{ slug, ci, pi }];
    if (!el.snapLinked.checked) return targets;
    const radius = Number(el.snapRadius.value || 10);
    const radiusSq = radius * radius;
    const seen = new Set([`${slug}|${ci}|${pi}`]);
    for (const meta of state.regionIds.regions) {
      const region = state.contours.regions[meta.slug];
      if (!region || state.hiddenRegions.has(meta.slug)) continue;
      region.components.forEach((component, cidx) => {
        component.forEach((point, pidx) => {
          const key = `${meta.slug}|${cidx}|${pidx}`;
          if (seen.has(key)) return;
          const dx = point[0] - base[0];
          const dy = point[1] - base[1];
          if (dx * dx + dy * dy <= radiusSq) {
            seen.add(key);
            targets.push({ slug: meta.slug, ci: cidx, pi: pidx });
          }
        });
      });
    }
    return targets;
  }

  function updateChangedGeometry(targets) {
    const touched = new Set(targets.map(t => componentKey(t.slug, t.ci)));
    for (const key of touched) {
      const [slug, ciStr] = key.split('|');
      const ci = Number(ciStr);
      const region = state.contours.regions[slug];
      const poly = state.polygonEls.get(key);
      if (poly && region && region.components[ci]) poly.setAttribute('points', pointsAttr(region.components[ci]));
    }
    const handleGroup = document.getElementById('handleLayer');
    if (handleGroup) {
      handleGroup.innerHTML = '';
      renderHandles(handleGroup);
    }
  }

  function pushHistory(label) {
    const snapshot = JSON.stringify(state.contours.regions);
    if (state.history.length === 0 || state.history[state.history.length - 1] !== snapshot) {
      state.history.push(snapshot);
      if (state.history.length > 80) state.history.shift();
    }
    state.redo.length = 0;
    updateInfoPanels();
  }

  function undo() {
    if (state.history.length === 0) return;
    const current = JSON.stringify(state.contours.regions);
    state.redo.push(current);
    state.contours.regions = JSON.parse(state.history.pop());
    state.selectedPoint = -1;
    markDirty(false);
    renderAll();
    setStatus('Undo.', 'ok');
  }

  function redo() {
    if (state.redo.length === 0) return;
    const current = JSON.stringify(state.contours.regions);
    state.history.push(current);
    state.contours.regions = JSON.parse(state.redo.pop());
    state.selectedPoint = -1;
    markDirty(false);
    renderAll();
    setStatus('Redo.', 'ok');
  }

  function markDirty(autoSave = true) {
    state.dirty = true;
    if (autoSave && el.autoSave.checked) {
      clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = setTimeout(() => saveLocal(false), 600);
    }
  }

  function saveLocal(withMessage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(buildEditorExport()));
      state.dirty = false;
      if (withMessage) setStatus('Sauvegarde navigateur effectuée.', 'ok');
    } catch (err) {
      setStatus('Sauvegarde navigateur impossible: ' + err.message, 'bad');
    }
  }

  function loadLocal() {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setStatus('Aucune sauvegarde navigateur trouvée.', 'warn');
        return;
      }
      const imported = JSON.parse(raw);
      importContoursObject(imported, true);
      setStatus('Sauvegarde navigateur restaurée.', 'ok');
    } catch (err) {
      setStatus('Chargement navigateur impossible: ' + err.message, 'bad');
    }
  }

  function clearLocal() {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStatus('Sauvegarde navigateur supprimée.', 'ok');
  }

  function importJsonFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importContoursObject(data, true);
        setStatus(`JSON importé: ${file.name}`, 'ok');
      } catch (err) {
        setStatus('Import JSON échoué: ' + err.message, 'bad');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function importContoursObject(data, resetHistory) {
    if (data.region_ids) state.regionIds = data.region_ids;
    state.contours = normalizeContours(data);
    state.imageSize = state.contours.image_size || state.imageSize;
    state.viewBox = clampViewBox(state.viewBox);
    if (!state.contours.regions[state.selectedSlug]) state.selectedSlug = state.regionIds.regions[0].slug;
    state.selectedPoint = -1;
    if (resetHistory) {
      state.history.length = 0;
      state.redo.length = 0;
    }
    refreshMetrics();
    renderAll();
    markDirty(false);
  }

  function importBackgroundFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.backgroundUrl = String(reader.result);
      renderAll();
      setStatus(`Image de fond chargée: ${file.name}`, 'ok');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function buildEditorExport() {
    refreshMetrics();
    return {
      schema_version: 'region_editor_shapes_v1',
      editor_version: EDITOR_VERSION,
      exported_at: new Date().toISOString(),
      source_image: state.contours.source_image || 'europe_map_backdrop_generated_clean_v1.png',
      image_size: state.imageSize,
      coordinate_system: 'image_pixels_top_left',
      notes: 'Export du Region Shape Editor. Les formes sont gameplay/stylisées, pas géographiques au mètre près.',
      region_ids: state.regionIds,
      contours: buildContoursExport()
    };
  }

  function buildContoursExport() {
    refreshMetrics();
    const out = JSON.parse(JSON.stringify(state.contours));
    out.schema_version = 'region_contours_v1';
    out.editor_version = EDITOR_VERSION;
    out.exported_at = new Date().toISOString();
    out.coordinate_system = 'image_pixels_top_left';
    out.image_size = state.imageSize;
    out.source_image = out.source_image || 'europe_map_backdrop_generated_clean_v1.png';
    return out;
  }

  function buildSvgExport() {
    refreshMetrics();
    const w = state.imageSize[0];
    const h = state.imageSize[1];
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" version="1.1" id="egrid_regions_master_template">`);
    lines.push('  <metadata>Exported from E-Grid 2045 Region Shape Editor. Background layer is a guide; region groups are editable semantic gameplay regions.</metadata>');
    lines.push('  <g id="background_locked" inkscape:groupmode="layer" inkscape:label="background_locked" sodipodi:insensitive="true">');
    lines.push(`    <image id="map_backdrop" href="europe_map_backdrop_generated_clean_v1.png" xlink:href="europe_map_backdrop_generated_clean_v1.png" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" opacity="1" />`);
    lines.push('  </g>');
    lines.push('  <g id="region_shapes" inkscape:groupmode="layer" inkscape:label="region_shapes_editable">');
    for (const meta of state.regionIds.regions) {
      const region = state.contours.regions[meta.slug];
      const color = hslToHex(colorForId(meta.id));
      lines.push(`    <g id="region:${escapeXml(meta.slug)}" data-region-id="${meta.id}" data-region-slug="${escapeXml(meta.slug)}" data-region-name="${escapeXml(meta.display_name)}" style="fill:${color};fill-opacity:0.28;stroke:#31e6ff;stroke-width:1.5;stroke-opacity:0.72;vector-effect:non-scaling-stroke">`);
      if (region && region.components) {
        region.components.forEach((component, ci) => {
          lines.push(`      <polygon id="region__${escapeXml(meta.slug)}__${String(ci).padStart(2, '0')}" points="${pointsAttr(component)}" />`);
        });
      }
      lines.push('    </g>');
    }
    lines.push('  </g>');
    lines.push('</svg>');
    return lines.join('\n');
  }

  function downloadCodexNote() {
    const text = `# Intégration des frontières éditées E-Grid 2045\n\n` +
      `1. Copier l'export JSON de l'éditeur dans le repo, par exemple \`tools/region_editor/exports/egrid_region_editor_shapes.json\`.\n` +
      `2. Lancer :\n\n` +
      '```bash\n' +
      'python tools/map_regions/apply_region_editor_export.py \\\n' +
      '  --editor-export tools/region_editor/exports/egrid_region_editor_shapes.json \\\n' +
      '  --background assets/map/europe_map_backdrop_generated_clean_v1.png \\\n' +
      '  --region-ids assets/map/region_ids.json \\\n' +
      '  --out assets/map/generated \\\n' +
      '  --svg-out assets/map/regions_master_template.svg \\\n' +
      '  --debug\n' +
      '```\n\n' +
      `3. Relancer la validation existante :\n\n` +
      '```bash\n' +
      'python tools/map_regions/validate_region_assets.py \\\n' +
      '  --background assets/map/europe_map_backdrop_generated_clean_v1.png \\\n' +
      '  --region-ids assets/map/region_ids.json \\\n' +
      '  --mask assets/map/generated/region_id_mask.png \\\n' +
      '  --contours assets/map/generated/regions_contours.json\n' +
      '```\n\n' +
      `Les coordonnées exportées restent en pixels image, origine top-left. Le mask généré par le script est en IDs entiers 0..30.`;
    downloadText(text, 'REGION_EDITOR_CODEX_INTEGRATION.md', 'text/markdown');
  }

  function downloadJson(obj, filename) {
    downloadText(JSON.stringify(obj, null, 2), filename, 'application/json');
  }

  function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Export généré: ${filename}`, 'ok');
  }

  function eventToSvgPoint(event) {
    const pt = el.mapSvg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = el.mapSvg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const res = pt.matrixTransform(ctm.inverse());
    return { x: res.x, y: res.y };
  }

  function applyViewBox() {
    el.mapSvg.setAttribute('viewBox', `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);
  }

  function clampViewBox(v) {
    const maxW = state.imageSize[0] * 2.5;
    const maxH = state.imageSize[1] * 2.5;
    let w = clamp(v.w, 60, maxW);
    let h = clamp(v.h, 60, maxH);
    let x = v.x;
    let y = v.y;
    const marginX = w * 0.2;
    const marginY = h * 0.2;
    x = clamp(x, -marginX, state.imageSize[0] - w + marginX);
    y = clamp(y, -marginY, state.imageSize[1] - h + marginY);
    return { x, y, w, h };
  }

  function setStatus(message, kind) {
    el.statusLine.textContent = message;
    el.statusLine.className = 'status ' + (kind || 'info');
  }

  function getMeta(slug) {
    return state.regionIds.regions.find(r => r.slug === slug);
  }

  function pointsAttr(component) {
    return component.map(p => `${round2(p[0])},${round2(p[1])}`).join(' ');
  }

  function componentKey(slug, ci) {
    return `${slug}|${ci}`;
  }

  function colorForId(id) {
    const hue = (id * 37 + 188) % 360;
    return `hsl(${hue} 92% 62%)`;
  }

  function hslToHex(hsl) {
    const m = /hsl\(([-\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/.exec(hsl);
    if (!m) return '#6be6ff';
    let h = Number(m[1]) / 360;
    let s = Number(m[2]) / 100;
    let l = Number(m[3]) / 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  }

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === '') continue;
      node.setAttribute(key, String(value));
    }
    return node;
  }

  function pointSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq, 0, 1);
    const x = a.x + t * dx;
    const y = a.y + t * dy;
    return Math.hypot(p.x - x, p.y - y);
  }

  function simplifyPolygon(points, epsilon) {
    if (!points || points.length <= 4) return points ? points.slice() : [];
    const closed = points.concat([points[0]]);
    let simplified = rdp(closed, epsilon);
    if (simplified.length > 1) {
      const first = simplified[0];
      const last = simplified[simplified.length - 1];
      if (Math.abs(first[0] - last[0]) < 0.001 && Math.abs(first[1] - last[1]) < 0.001) {
        simplified = simplified.slice(0, -1);
      }
    }
    if (simplified.length < 3) return points.slice(0, 3);
    return simplified.map(p => [round2(p[0]), round2(p[1])]);
  }

  function rdp(points, epsilon) {
    if (points.length < 3) return points.slice();
    let dmax = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
      const d = pointSegmentDistance({ x: points[i][0], y: points[i][1] }, { x: start[0], y: start[1] }, { x: end[0], y: end[1] });
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    if (dmax > epsilon) {
      const left = rdp(points.slice(0, index + 1), epsilon);
      const right = rdp(points.slice(index), epsilon);
      return left.slice(0, -1).concat(right);
    }
    return [start, end];
  }

  function snapPointToGrid(p, step) {
    return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
  }

  function timestampedName(prefix, ext) {
    const d = new Date();
    const stamp = d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').replace('T', '_');
    return `${prefix}_${stamp}.${ext}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function escapeXml(str) {
    return escapeHtml(str);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round2(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function fmt(value) {
    return Number(value).toFixed(1);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
