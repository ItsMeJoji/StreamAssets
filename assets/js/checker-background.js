const state = {
    assets: [],
    placements: []
};

const els = {
    input: document.getElementById('imageInput'),
    dropZone: document.getElementById('dropZone'),
    canvas: document.getElementById('checkerCanvas'),
    canvasMeta: document.getElementById('canvasMeta'),
    assetList: document.getElementById('assetList'),
    message: document.getElementById('message'),
    width: document.getElementById('canvasWidth'),
    height: document.getElementById('canvasHeight'),
    columns: document.getElementById('columnCount'),
    rows: document.getElementById('rowCount'),
    backgroundColor: document.getElementById('backgroundColor'),
    imageScale: document.getElementById('imageScale'),
    imageScaleValue: document.getElementById('imageScaleValue'),
    jitter: document.getElementById('jitterAmount'),
    jitterValue: document.getElementById('jitterAmountValue'),
    rotation: document.getElementById('rotationAmount'),
    rotationValue: document.getElementById('rotationAmountValue'),
    allowRepeats: document.getElementById('allowRepeats'),
    randomize: document.getElementById('randomizeBtn'),
    download: document.getElementById('downloadBtn'),
    clear: document.getElementById('clearBtn')
};

const ctx = els.canvas.getContext('2d');

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function getSettings() {
    return {
        width: clampNumber(els.width.value, 128, 4096, 615),
        height: clampNumber(els.height.value, 128, 4096, 426),
        columns: clampNumber(els.columns.value, 1, 24, 8),
        rows: clampNumber(els.rows.value, 1, 24, 5),
        backgroundColor: els.backgroundColor.value || '#ffffff',
        imageScale: clampNumber(els.imageScale.value, 30, 115, 78) / 100,
        jitter: clampNumber(els.jitter.value, 0, 45, 14) / 100,
        rotation: clampNumber(els.rotation.value, 0, 35, 0),
        allowRepeats: els.allowRepeats.checked
    };
}

function setMessage(text, tone = '') {
    els.message.textContent = text;
    els.message.className = `message${tone ? ` ${tone}` : ''}`;
}

function syncRangeLabels() {
    els.imageScaleValue.textContent = `${els.imageScale.value}%`;
    els.jitterValue.textContent = `${els.jitter.value}%`;
    els.rotationValue.textContent = `${els.rotation.value}\u00b0`;
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            resolve({
                id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
                name: file.name,
                url,
                image
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Could not load ${file.name}`));
        };

        image.src = url;
    });
}

async function addFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) {
        setMessage('Choose image files to add to the layout.', 'error');
        return;
    }

    setMessage(`Loading ${files.length} image${files.length === 1 ? '' : 's'}...`);

    const settled = await Promise.allSettled(files.map(loadImageFromFile));
    const loaded = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

    state.assets.push(...loaded);
    rollPlacements();
    renderAssetList();
    draw();

    const failed = settled.length - loaded.length;
    if (failed) {
        setMessage(`Loaded ${loaded.length} image${loaded.length === 1 ? '' : 's'}; ${failed} failed.`, 'error');
    } else {
        setMessage(`Loaded ${loaded.length} image${loaded.length === 1 ? '' : 's'}.`, 'success');
    }
}

function renderAssetList() {
    if (!state.assets.length) {
        els.assetList.innerHTML = '<div class="asset-empty">No images loaded yet.</div>';
        els.download.disabled = true;
        return;
    }

    els.assetList.innerHTML = state.assets
        .map((asset) => `
            <div class="asset-thumb" title="${escapeHtml(asset.name)}">
                <img src="${asset.url}" alt="">
            </div>
        `)
        .join('');
    els.download.disabled = false;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function pickAsset(index, allowRepeats) {
    if (!state.assets.length) return null;
    if (allowRepeats) {
        return state.assets[Math.floor(Math.random() * state.assets.length)];
    }
    return state.assets[index % state.assets.length];
}

function rollPlacements() {
    const settings = getSettings();
    const count = settings.columns * settings.rows;
    const sequence = [...state.assets];

    for (let i = sequence.length - 1; i > 0; i -= 1) {
        const swapIndex = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[swapIndex]] = [sequence[swapIndex], sequence[i]];
    }

    state.placements = Array.from({ length: count }, (_, index) => {
        const asset = settings.allowRepeats
            ? pickAsset(index, true)
            : sequence[index % Math.max(1, sequence.length)] || null;

        return {
            assetId: asset?.id || '',
            offsetX: (Math.random() * 2) - 1,
            offsetY: (Math.random() * 2) - 1,
            rotation: (Math.random() * 2) - 1,
            scale: 0.9 + (Math.random() * 0.22)
        };
    });
}

function getAssetById(id) {
    return state.assets.find((asset) => asset.id === id) || null;
}

function drawImageContain(image, centerX, centerY, maxWidth, maxHeight, rotation) {
    const imageRatio = image.width / image.height;
    const boxRatio = maxWidth / maxHeight;
    let drawWidth = maxWidth;
    let drawHeight = maxHeight;

    if (imageRatio > boxRatio) {
        drawHeight = maxWidth / imageRatio;
    } else {
        drawWidth = maxHeight * imageRatio;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
}

function draw() {
    const settings = getSettings();
    const count = settings.columns * settings.rows;

    if (els.canvas.width !== settings.width || els.canvas.height !== settings.height) {
        els.canvas.width = settings.width;
        els.canvas.height = settings.height;
    }

    els.canvasMeta.textContent = `${settings.width} x ${settings.height}`;
    ctx.clearRect(0, 0, settings.width, settings.height);
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, settings.width, settings.height);

    const cellWidth = settings.width / settings.columns;
    const cellHeight = settings.height / settings.rows;

    if (!state.assets.length) {
        drawEmptyState(settings);
        return;
    }

    if (state.placements.length !== count) {
        rollPlacements();
    }

    state.placements.forEach((placement, index) => {
        const asset = getAssetById(placement.assetId) || state.assets[index % state.assets.length];
        if (!asset) return;

        const column = index % settings.columns;
        const row = Math.floor(index / settings.columns);
        const centerX = (column + 0.5) * cellWidth + (placement.offsetX * cellWidth * settings.jitter);
        const centerY = (row + 0.5) * cellHeight + (placement.offsetY * cellHeight * settings.jitter);
        const maxWidth = cellWidth * settings.imageScale * placement.scale;
        const maxHeight = cellHeight * settings.imageScale * placement.scale;
        const rotation = placement.rotation * settings.rotation * (Math.PI / 180);

        drawImageContain(asset.image, centerX, centerY, maxWidth, maxHeight, rotation);
    });
}

function drawEmptyState(settings) {
    ctx.save();
    ctx.fillStyle = 'rgba(32, 36, 54, 0.26)';
    ctx.font = '800 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Drop images to build a randomized background', settings.width / 2, settings.height / 2);
    ctx.restore();
}

function clearAssets() {
    state.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    state.assets = [];
    state.placements = [];
    els.input.value = '';
    renderAssetList();
    draw();
    setMessage('Cleared loaded images.');
}

function downloadPng() {
    if (!state.assets.length) {
        setMessage('Add images before downloading a PNG.', 'error');
        return;
    }

    els.canvas.toBlob((blob) => {
        if (!blob) {
            setMessage('PNG export failed.', 'error');
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'checker-background.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setMessage('PNG downloaded.', 'success');
    }, 'image/png');
}

function wireEvents() {
    els.input.addEventListener('change', () => addFiles(els.input.files));

    ['dragenter', 'dragover'].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            els.dropZone.classList.add('dragging');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            els.dropZone.classList.remove('dragging');
        });
    });

    els.dropZone.addEventListener('drop', (event) => {
        addFiles(event.dataTransfer.files);
    });

    [
        els.width,
        els.height,
        els.columns,
        els.rows,
        els.backgroundColor,
        els.imageScale,
        els.jitter,
        els.rotation,
        els.allowRepeats
    ].forEach((input) => {
        input.addEventListener('input', () => {
            syncRangeLabels();
            draw();
        });
    });

    [els.columns, els.rows, els.allowRepeats].forEach((input) => {
        input.addEventListener('change', () => {
            rollPlacements();
            draw();
        });
    });

    els.randomize.addEventListener('click', () => {
        rollPlacements();
        draw();
        setMessage('Rolled a new image layout.', 'success');
    });

    els.download.addEventListener('click', downloadPng);
    els.clear.addEventListener('click', clearAssets);
}

function initialize() {
    syncRangeLabels();
    renderAssetList();
    wireEvents();
    draw();
}

initialize();
