const envClientId = (import.meta.env.VITE_TWITCH_CLIENT_ID || '').trim();

const state = {
    clientId: envClientId,
    accessToken: localStorage.getItem('schedule_maker_access_token') || '',
    tokenLogin: localStorage.getItem('schedule_maker_token_login') || '',
    tokenUserId: localStorage.getItem('schedule_maker_token_user_id') || '',
    broadcasterInput: localStorage.getItem('schedule_maker_broadcaster') || '',
    timezone: localStorage.getItem('schedule_maker_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekOffset: Number(localStorage.getItem('schedule_maker_week_offset') || 0),
    layout: localStorage.getItem('schedule_maker_layout') || 'vertical',
    tokenRefreshTimer: null,
    validating: false,
    currentBoard: null
};

const els = {
    broadcasterInput: document.getElementById('broadcasterInput'),
    timezoneInput: document.getElementById('timezoneInput'),
    weekOffsetSelect: document.getElementById('weekOffsetSelect'),
    message: document.getElementById('message'),
    boardTitle: document.getElementById('boardTitle'),
    boardSubtitle: document.getElementById('boardSubtitle'),
    weekLabel: document.getElementById('weekLabel'),
    days: document.getElementById('days'),
    connectBtn: document.getElementById('connectBtn'),
    loadBtn: document.getElementById('loadBtn'),
    verticalLayoutBtn: document.getElementById('verticalLayoutBtn'),
    horizontalLayoutBtn: document.getElementById('horizontalLayoutBtn'),
    exportPngBtn: document.getElementById('exportPngBtn')
};

const BOARD_TITLE_HTML = '<span>Stream</span><span>Schedule</span>';
const WEEK_OPTIONS = [-1, 0, 1];
const TIME_ZONE_OPTIONS = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
];

function saveState() {
    localStorage.setItem('schedule_maker_access_token', state.accessToken);
    localStorage.setItem('schedule_maker_token_login', state.tokenLogin);
    localStorage.setItem('schedule_maker_token_user_id', state.tokenUserId);
    localStorage.setItem('schedule_maker_broadcaster', state.broadcasterInput);
    localStorage.setItem('schedule_maker_timezone', state.timezone);
    localStorage.setItem('schedule_maker_week_offset', String(state.weekOffset));
    localStorage.setItem('schedule_maker_layout', state.layout);
}

function setMessage(text, tone = '') {
    els.message.textContent = text;
    els.message.className = `message${tone ? ` ${tone}` : ''}`;
}

function syncInputs() {
    els.broadcasterInput.value = state.broadcasterInput;
    populateTimezoneOptions(state.timezone);
    els.timezoneInput.value = state.timezone;
    const weekValue = WEEK_OPTIONS.includes(state.weekOffset) ? state.weekOffset : 0;
    state.weekOffset = weekValue;
    els.weekOffsetSelect.value = String(weekValue);
    updateLayoutButtons();
}

function populateTimezoneOptions(selectedZone = state.timezone) {
    const zones = [...new Set([selectedZone, ...TIME_ZONE_OPTIONS].filter(Boolean))];
    els.timezoneInput.innerHTML = zones
        .map((zone) => `<option value="${escapeHtml(zone)}">${escapeHtml(zone)}</option>`)
        .join('');
}

function updateLayoutButtons() {
    const isVertical = state.layout !== 'horizontal';
    els.verticalLayoutBtn.classList.toggle('active', isVertical);
    els.horizontalLayoutBtn.classList.toggle('active', !isVertical);
    document.body.classList.toggle('layout-vertical', isVertical);
    document.body.classList.toggle('layout-horizontal', !isVertical);
}

function setBoardTitle() {
    els.boardTitle.innerHTML = BOARD_TITLE_HTML;
}

function setLayout(layout) {
    state.layout = layout === 'horizontal' ? 'horizontal' : 'vertical';
    saveState();
    updateLayoutButtons();
    if (state.currentBoard) {
        renderBoard(
            state.currentBoard.segments,
            state.currentBoard.weekStart,
            state.currentBoard.timeZone,
            state.currentBoard.info,
            {
                broadcasterId: state.currentBoard.broadcasterId,
                channelEmotes: state.currentBoard.channelEmotes
            }
        );
    }
}

function parseHashToken() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    if (!accessToken) return null;

    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return accessToken;
}

function buildRedirectUri() {
    return `${window.location.origin}${window.location.pathname}`;
}

function buildAuthUrl() {
    const params = new URLSearchParams({
        client_id: state.clientId,
        redirect_uri: buildRedirectUri(),
        response_type: 'token'
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

async function connectTwitch() {
    if (!state.clientId) {
        setMessage('Set VITE_TWITCH_CLIENT_ID in .env first.', 'error');
        return;
    }

    saveState();
    window.location.href = buildAuthUrl();
}

async function validateToken(token) {
    const response = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
            Authorization: `OAuth ${token}`
        }
    });

    if (!response.ok) throw new Error('Invalid Twitch token');
    return response.json();
}

async function hydrateToken() {
    const token = parseHashToken() || state.accessToken;
    if (!token) return;

    state.accessToken = token;
    saveState();
    setMessage('Validating Twitch token...', '');

    try {
        const info = await validateToken(token);
        state.tokenLogin = info.login || state.tokenLogin;
        state.tokenUserId = info.user_id || state.tokenUserId;
        if (!state.broadcasterInput && info.login) {
            state.broadcasterInput = info.login;
        }
        saveState();
        syncInputs();
        setMessage(`Connected to Twitch as ${state.tokenLogin || 'signed-in user'}.`, 'success');
    } catch (error) {
        state.accessToken = '';
        state.tokenLogin = '';
        state.tokenUserId = '';
        saveState();
        syncInputs();
        setMessage('Stored Twitch token is no longer valid.', 'error');
    }
}

function getTimeZoneParts(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });

    const parts = {};
    for (const part of formatter.formatToParts(date)) {
        if (part.type !== 'literal') parts[part.type] = part.value;
    }

    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        second: Number(parts.second)
    };
}

function getTimeZoneOffsetMs(date, timeZone) {
    const parts = getTimeZoneParts(date, timeZone);
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime();
}

function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
    let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const offset = getTimeZoneOffsetMs(utc, timeZone);
    utc = new Date(utc.getTime() - offset);
    const nextOffset = getTimeZoneOffsetMs(utc, timeZone);
    if (nextOffset !== offset) {
        utc = new Date(utc.getTime() - (nextOffset - offset));
    }
    return utc;
}

function getWeekStart(referenceDate, timeZone, weekOffset) {
    const parts = getTimeZoneParts(referenceDate, timeZone);
    const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
    const mondayDelta = (weekday + 6) % 7;
    const anchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - mondayDelta + weekOffset * 7));

    return zonedTimeToUtc({
        year: anchor.getUTCFullYear(),
        month: anchor.getUTCMonth() + 1,
        day: anchor.getUTCDate()
    }, timeZone);
}

function formatDate(date, timeZone, options = {}) {
    return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(date);
}

function formatWeekLabel(start, end, timeZone) {
    const startLabel = formatDate(start, timeZone, { month: 'short', day: 'numeric' });
    const endLabel = formatDate(new Date(end.getTime() - 1), timeZone, { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
}

function getDateKey(date, timeZone) {
    const parts = getTimeZoneParts(date, timeZone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}


function toBoxArtUrl(categoryId, width = 160, height = 214, useIGDB = false) {
    if (useIGDB) {
        return `https://static-cdn.jtvnw.net/ttv-boxart/${categoryId}_IGDB-${width}x${height}.jpg`;
    }
    return `https://static-cdn.jtvnw.net/ttv-boxart/${categoryId}-${width}x${height}.jpg`;
}

/**
 * Checks if a Twitch box art URL redirects to the generic 404 image.
 * Returns the IGDB fallback URL if a redirect is detected.
 */
async function resolveBoxArtUrl(categoryId, width, height) {
    const url = toBoxArtUrl(categoryId, width, height);
    try {
        const response = await fetch(url);
        if (response.ok && response.url.includes('404_boxart')) {
            console.log(`[Art] Redirect detected for ${categoryId}, switching to IGDB.`);
            return toBoxArtUrl(categoryId, width, height, true);
        }
        return url;
    } catch (err) {
        console.warn(`[Art] Failed to resolve redirect for ${categoryId}:`, err);
        return url;
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            console.log('✓ Image loaded:', url);
            resolve(image);
        };
        image.onerror = () => {
            console.error('✗ Image failed to load:', url);
            reject(new Error(`Failed to load image: ${url}`));
        };
        image.src = url;
    });
}

function buildEmoteImageUrl(template, emote) {
    if (!template) {
        return emote.images?.url_4x || emote.images?.url_2x || emote.images?.url_1x || '';
    }

    const format = emote.format?.includes('static') ? 'static' : emote.format?.[0] || 'static';
    const themeMode = emote.theme_mode?.includes('dark')
        ? 'dark'
        : emote.theme_mode?.includes('light')
            ? 'light'
            : 'dark';
    const scale = emote.scale?.includes('3.0')
        ? '3.0'
        : emote.scale?.includes('2.0')
            ? '2.0'
            : emote.scale?.includes('1.0')
                ? '1.0'
                : '2.0';

    return template
        .replaceAll('{{id}}', emote.id)
        .replaceAll('{{format}}', format)
        .replaceAll('{{theme_mode}}', themeMode)
        .replaceAll('{{scale}}', scale);
}

function pickRandomItem(items, excludeId = '') {
    const pool = items.filter((item) => item.id !== excludeId);
    const source = pool.length ? pool : items;
    if (!source.length) return null;
    return source[Math.floor(Math.random() * source.length)];
}

function getStaticChannelEmotes(payload) {
    const template = payload?.template || '';
    return (payload?.data || [])
        .filter((emote) => Array.isArray(emote.format) && emote.format.includes('static'))
        .map((emote) => ({
            ...emote,
            imageUrl: buildEmoteImageUrl(template, emote)
        }))
        .filter((emote) => Boolean(emote.imageUrl));
}

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function drawCoverImage(ctx, image, x, y, width, height) {
    if (!image) return;

    const sourceAspect = image.width / image.height;
    const targetAspect = width / height;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceAspect > targetAspect) {
        sw = image.height * targetAspect;
        sx = (image.width - sw) / 2;
    } else {
        sh = image.width / targetAspect;
        sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawContainImage(ctx, image, x, y, width, height) {
    if (!image) return;

    const sourceAspect = image.width / image.height;
    const targetAspect = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;

    if (sourceAspect > targetAspect) {
        drawHeight = width / sourceAspect;
        drawY = y + ((height - drawHeight) / 2);
    } else {
        drawWidth = height * sourceAspect;
        drawX = x + ((width - drawWidth) / 2);
    }

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function createMeasureContext() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas rendering is not supported in this browser.');
    return ctx;
}

function wrapLines(ctx, text, maxWidth, maxLines = 3) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];

    const lines = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (!current || ctx.measureText(test).width <= maxWidth) {
            current = test;
            continue;
        }

        lines.push(current);
        current = word;
        if (lines.length === maxLines - 1) break;
    }

    if (current) lines.push(current);
    return lines.filter(Boolean).slice(0, maxLines);
}

function getSegmentRenderPlan(ctx, segment, layout, metrics, dayWidth) {
    const isHorizontal = layout === 'horizontal';
    const segmentWidth = dayWidth - 8;
    const titleText = segment.title || 'Untitled stream';
    const maxTitleWidth = isHorizontal ? segmentWidth - 88 : segmentWidth - 86;
    const titleX = isHorizontal ? 10 : 88;
    const titleY = isHorizontal ? 50 : 9;
    const lineHeight = isHorizontal ? 21 : 18;
    const minHeight = isHorizontal ? metrics.segmentHeight : metrics.segmentHeight;
    const wrapped = wrapLines(ctx, titleText, maxTitleWidth, isHorizontal ? 5 : 8);
    const titleBottom = titleY + (wrapped.length * lineHeight) + (isHorizontal ? 12 : 10);
    const neededHeight = isHorizontal ? Math.max(minHeight, titleBottom) : Math.max(minHeight, titleBottom);

    return {
        segmentWidth,
        segmentHeight: neededHeight,
        maxTitleWidth,
        titleX,
        titleY,
        lineHeight,
        wrapped
    };
}

function prepareBoardLayout(board, layout) {
    const metrics = getLayoutMetrics(layout);
    const ctx = createMeasureContext();
    ctx.font = '800 14px Inter, system-ui, sans-serif';

    if (layout === 'horizontal') {
        const cellWidth = (metrics.boardWidth - (metrics.boardPadding * 2) - (3 * metrics.dayGap)) / 4;
        const dayLayouts = board.dayGroups.map((daySegments) => {
            const segmentLayouts = daySegments.map((segment) => {
                ctx.font = `800 ${metrics.titleSize}px Inter, system-ui, sans-serif`;
                return {
                    segment,
                    ...getSegmentRenderPlan(ctx, segment, layout, metrics, cellWidth)
                };
            });

            const dayHeight = daySegments.length
                ? segmentLayouts.reduce((sum, item) => sum + item.segmentHeight, 0) + ((daySegments.length - 1) * metrics.segmentGap) + (metrics.dayPaddingY * 2) + metrics.dayHeadHeight
                : (metrics.dayPaddingY * 2) + metrics.dayHeadHeight + metrics.offlineHeight;

            return { segmentLayouts, dayHeight };
        });

        const rowHeights = [
            Math.max(...dayLayouts.slice(0, 3).map((day) => day.dayHeight), 96),
            Math.max(...dayLayouts.slice(3).map((day) => day.dayHeight))
        ];
        const emoteSize = Math.min(96, cellWidth * 0.78);
        const boardHeight = (metrics.boardPadding * 2) + metrics.titleHeight + metrics.dayGap + rowHeights[0] + metrics.dayGap + rowHeights[1];
        return { metrics, dayLayouts, boardHeight, cellWidth, rowHeights, emoteSize };
    }

    const dayLayouts = board.dayGroups.map((daySegments) => {
        const segmentLayouts = daySegments.map((segment) => {
            const segmentWidth = (layout === 'horizontal'
                ? (metrics.boardWidth - (metrics.boardPadding * 2) - (6 * metrics.dayGap)) / 7
                : metrics.boardWidth - (metrics.boardPadding * 2)) - 8;
            const titleFont = layout === 'horizontal'
                ? `800 ${metrics.titleSize}px Inter, system-ui, sans-serif`
                : `800 ${metrics.titleSize}px Inter, system-ui, sans-serif`;
            ctx.font = titleFont;
            return {
                segment,
                ...getSegmentRenderPlan(ctx, segment, layout, metrics, segmentWidth + 8)
            };
        });
        const dayHeight = daySegments.length
            ? segmentLayouts.reduce((sum, item) => sum + item.segmentHeight, 0) + ((daySegments.length - 1) * metrics.segmentGap) + (metrics.dayPaddingY * 2) + metrics.dayHeadHeight
            : (metrics.dayPaddingY * 2) + metrics.dayHeadHeight + metrics.offlineHeight;
        return { segmentLayouts, dayHeight };
    });

    const tallestDay = dayLayouts.length ? Math.max(...dayLayouts.map((day) => day.dayHeight)) : 0;
    const boardHeight = layout === 'horizontal'
        ? (metrics.boardPadding * 2) + metrics.titleHeight + metrics.dayGap + tallestDay
        : (metrics.boardPadding * 2) + metrics.titleHeight + metrics.dayGap + dayLayouts.reduce((sum, day) => sum + day.dayHeight, 0) + ((board.dayGroups.length - 1) * metrics.dayGap);

    return { metrics, dayLayouts, boardHeight };
}

function getLayoutMetrics(layout) {
    const vertical = layout !== 'horizontal';
    return vertical
        ? {
            canvasWidth: 378,
            boardWidth: 330,
            margin: 24,
            boardPadding: 14,
            titleHeight: 116,
            titleTop: 34,
            titleFont: '900 44px "Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif',
            weekFont: '900 11px Inter, system-ui, sans-serif',
            dayGap: 10,
            dayPaddingY: 10,
            dayPaddingX: 12,
            dayHeadHeight: 15,
            offlineHeight: 28,
            segmentHeight: 70,
            segmentGap: 8,
            dayRadius: 13,
            segmentRadius: 12,
            dayLabelSize: 12,
            timeSize: 13,
            weekdaySize: 11,
            titleSize: 14,
            titleWidth: 180,
            pageTop: 18,
            outerShadowBlur: 26
        }
        : {
            canvasWidth: 1168,
            boardWidth: 1120,
            margin: 24,
            boardPadding: 18,
            titleHeight: 104,
            titleTop: 32,
            titleFont: '900 48px "Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif',
            weekFont: '900 11px Inter, system-ui, sans-serif',
            dayGap: 12,
            dayPaddingY: 12,
            dayPaddingX: 12,
            dayHeadHeight: 20,
            offlineHeight: 64,
            segmentHeight: 112,
            segmentGap: 10,
            dayRadius: 13,
            segmentRadius: 12,
            dayLabelSize: 12,
            timeSize: 14,
            weekdaySize: 11,
            titleSize: 16,
            titleWidth: 140,
            pageTop: 18,
            outerShadowBlur: 30
        };
}

function getBoardHeight(board, layout) {
    const metrics = getLayoutMetrics(layout);
    const dayHeights = board.dayGroups.map((daySegments) => {
        const contentHeight = daySegments.length
            ? (daySegments.length * metrics.segmentHeight) + ((daySegments.length - 1) * metrics.segmentGap)
            : metrics.offlineHeight;
        return (metrics.dayPaddingY * 2) + metrics.dayHeadHeight + contentHeight;
    });

    if (layout === 'horizontal') {
        const tallestDay = dayHeights.length ? Math.max(...dayHeights) : 0;
        return (metrics.boardPadding * 2) + metrics.titleHeight + metrics.dayGap + tallestDay;
    }

    const totalDays = dayHeights.reduce((sum, value) => sum + value, 0);
    return (metrics.boardPadding * 2) + metrics.titleHeight + metrics.dayGap + totalDays + ((board.dayGroups.length - 1) * metrics.dayGap);
}

async function buildScheduleCanvas(board, layout) {
    const prepared = prepareBoardLayout(board, layout);
    const { metrics, dayLayouts, boardHeight } = prepared;
    const scale = 2;
    const canvasWidth = metrics.canvasWidth;
    const canvasHeight = boardHeight + (metrics.margin * 2);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const pageGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    pageGradient.addColorStop(0, '#1d1842');
    pageGradient.addColorStop(0.36, '#120b33');
    pageGradient.addColorStop(1, '#070515');
    ctx.fillStyle = pageGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const glowA = ctx.createRadialGradient(70, 20, 0, 70, 20, 160);
    glowA.addColorStop(0, 'rgba(185, 147, 255, 0.28)');
    glowA.addColorStop(1, 'rgba(185, 147, 255, 0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const glowB = ctx.createRadialGradient(canvasWidth - 50, 20, 0, canvasWidth - 50, 20, 140);
    glowB.addColorStop(0, 'rgba(102, 217, 255, 0.18)');
    glowB.addColorStop(1, 'rgba(102, 217, 255, 0)');
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const boardX = (canvasWidth - metrics.boardWidth) / 2;
    const boardY = metrics.margin;
    const boardInnerHeight = canvasHeight - (metrics.margin * 2);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = metrics.outerShadowBlur;
    ctx.shadowOffsetY = 12;
    roundRect(ctx, boardX, boardY, metrics.boardWidth, boardInnerHeight, 28);
    const boardGradient = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardInnerHeight);
    boardGradient.addColorStop(0, 'rgba(169, 165, 224, 0.95)');
    boardGradient.addColorStop(0.16, 'rgba(126, 113, 200, 0.96)');
    boardGradient.addColorStop(0.56, 'rgba(76, 59, 175, 0.98)');
    boardGradient.addColorStop(1, 'rgba(18, 0, 161, 1)');
    ctx.fillStyle = boardGradient;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, boardX, boardY, metrics.boardWidth, boardInnerHeight, 28);
    ctx.clip();
    const boardGlow = ctx.createRadialGradient(boardX + metrics.boardWidth / 2, boardY - 10, 12, boardX + metrics.boardWidth / 2, boardY - 10, metrics.boardWidth * 0.8);
    boardGlow.addColorStop(0, 'rgba(255,255,255,0.14)');
    boardGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = boardGlow;
    ctx.fillRect(boardX, boardY, metrics.boardWidth, boardInnerHeight);
    ctx.restore();

    const title = 'Stream Schedule';
    const titleX = boardX + (metrics.boardWidth / 2);
    const titleY = boardY + metrics.titleTop;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = metrics.titleFont;
    ctx.shadowColor = 'rgba(42, 25, 98, 0.36)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 4;
    const titleLines = title.split(' ');
    const titleLineHeight = layout === 'horizontal' ? 40 : 38;
    titleLines.forEach((line, index) => {
        ctx.fillText(line.toUpperCase(), titleX, titleY + (index * titleLineHeight));
    });
    ctx.restore();

    ctx.save();
    const rangeLabel = board.weekLabel;
    ctx.font = metrics.weekFont;
    ctx.textBaseline = 'top';
    const badgePaddingX = 7;
    const badgePaddingY = 4;
    const badgeWidth = ctx.measureText(rangeLabel).width + (badgePaddingX * 2);
    const badgeHeight = 18;
    const badgeX = boardX + metrics.boardWidth - badgeWidth - 7;
    const badgeY = boardY + 7;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 9);
    ctx.fill();
    ctx.fillStyle = '#5847aa';
    ctx.fillText(rangeLabel, badgeX + badgePaddingX, badgeY + badgePaddingY - 1);
    ctx.restore();

    const isHorizontal = layout === 'horizontal';
    if (isHorizontal) {
        const cellWidth = prepared.cellWidth;
        const rowHeights = prepared.rowHeights;
        const topRowY = boardY + metrics.boardPadding + metrics.titleHeight + metrics.dayGap;
        const bottomRowY = topRowY + rowHeights[0] + metrics.dayGap;
        const emote = board.currentEmoteImage;

        if (emote) {
            const emoteX = boardX + metrics.boardPadding;
            const emoteY = topRowY;
            drawContainImage(ctx, emote, emoteX + 8, emoteY + 8, cellWidth - 16, rowHeights[0] - 16);
        }

        const drawHorizontalDay = (index, dayX, dayY, dayWidth, dayHeight) => {
            const daySegments = board.dayGroups[index];
            const dayLayout = dayLayouts[index];
            const day = board.days[index];
            const dayLabel = day.label;
            const dayName = day.name;

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.14)';
            ctx.shadowBlur = 0;
            roundRect(ctx, dayX, dayY, dayWidth, dayHeight, 13);
            const dayGradient = ctx.createLinearGradient(dayX, dayY, dayX + dayWidth, dayY);
            dayGradient.addColorStop(0, 'rgba(170, 119, 187, 0.72)');
            dayGradient.addColorStop(1, 'rgba(72, 62, 193, 0.78)');
            ctx.fillStyle = dayGradient;
            ctx.fill();
            ctx.restore();

            ctx.save();
            roundRect(ctx, dayX, dayY, dayWidth, dayHeight, 13);
            ctx.clip();
            const sheen = ctx.createLinearGradient(dayX, dayY, dayX, dayY + dayHeight);
            sheen.addColorStop(0, 'rgba(255,255,255,0.07)');
            sheen.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = sheen;
            ctx.fillRect(dayX, dayY, dayWidth, dayHeight);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = 'rgba(243, 240, 255, 0.48)';
            ctx.font = `900 ${metrics.dayLabelSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(dayName, dayX + 4, dayY + 4);
            ctx.fillStyle = 'rgba(255,255,255,0.56)';
            ctx.font = `900 11px Inter, system-ui, sans-serif`;
            ctx.fillText(dayLabel, dayX + dayWidth - ctx.measureText(dayLabel).width - 4, dayY + 4);
            ctx.restore();

            let contentY = dayY + metrics.dayPaddingY + metrics.dayHeadHeight;
            if (!daySegments.length) {
                ctx.save();
                ctx.fillStyle = 'rgba(239, 236, 255, 0.92)';
                ctx.font = '900 17px "Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(38, 25, 100, 0.28)';
                ctx.shadowOffsetY = 3;
                ctx.fillText('OFFLINE', dayX + dayWidth / 2, contentY + (metrics.offlineHeight / 2));
                ctx.restore();
            } else {
                for (const item of dayLayout.segmentLayouts) {
                    const segment = item.segment;
                    const segmentX = dayX + 4;
                    const segmentY = contentY;
                    const segmentWidth = dayWidth - 8;
                    const segmentHeight = item.segmentHeight;
                    const segmentArt = segment.category?.id ? board.artImages.get(segment.category.id) : null;
                    const start = new Date(segment.start_time);
                    const timeLabel = formatDate(start, board.timeZone, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    const weekdayLabel = formatDate(start, board.timeZone, { weekday: 'short' }).toUpperCase();

                    ctx.save();
                    roundRect(ctx, segmentX, segmentY, segmentWidth, segmentHeight, 12);
                    ctx.clip();
                    const segmentGradient = ctx.createLinearGradient(segmentX, segmentY, segmentX + segmentWidth, segmentY + segmentHeight);
                    segmentGradient.addColorStop(0, 'rgba(16, 18, 54, 0.45)');
                    segmentGradient.addColorStop(1, 'rgba(10, 12, 34, 0.92)');
                    ctx.fillStyle = segmentGradient;
                    ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                    if (segmentArt) {
                        ctx.globalAlpha = 0.58;
                        drawCoverImage(ctx, segmentArt, segmentX, segmentY, segmentWidth, segmentHeight);
                        ctx.globalAlpha = 1;
                    }
                    const overlay = ctx.createLinearGradient(segmentX, segmentY, segmentX + segmentWidth, segmentY);
                    overlay.addColorStop(0, 'rgba(10, 12, 34, 0.6)');
                    overlay.addColorStop(0.7, 'rgba(10, 12, 34, 0.18)');
                    overlay.addColorStop(1, 'rgba(10, 12, 34, 0.4)');
                    ctx.fillStyle = overlay;
                    ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                    ctx.restore();

                    ctx.save();
                    ctx.fillStyle = 'rgba(255,255,255,0.96)';
                    ctx.font = `900 ${metrics.timeSize}px Inter, system-ui, sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.shadowColor = 'rgba(0,0,0,0.55)';
                    ctx.shadowOffsetY = 2;
                    ctx.fillText(timeLabel, segmentX + 10, segmentY + 8);
                    ctx.fillStyle = 'rgba(255,255,255,0.94)';
                    ctx.font = `900 ${metrics.weekdaySize}px Inter, system-ui, sans-serif`;
                    ctx.fillText(weekdayLabel, segmentX + 10, segmentY + 28);
                    ctx.restore();

                    ctx.save();
                    ctx.fillStyle = 'rgba(255,255,255,0.98)';
                    ctx.font = `800 ${metrics.titleSize}px Inter, system-ui, sans-serif`;
                    ctx.textBaseline = 'top';
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowOffsetY = 2;
                    item.wrapped.forEach((line, index) => {
                        ctx.fillText(line, segmentX + item.titleX, segmentY + item.titleY + (index * item.lineHeight));
                    });
                    ctx.restore();

                    contentY += segmentHeight + metrics.segmentGap;
                }
            }
        };

        const row1Y = topRowY;
        const row2Y = topRowY + rowHeights[0] + metrics.dayGap;
        const dayWidth = cellWidth;

        drawHorizontalDay(0, boardX + metrics.boardPadding + (1 * (dayWidth + metrics.dayGap)), row1Y, dayWidth, rowHeights[0]);
        drawHorizontalDay(1, boardX + metrics.boardPadding + (2 * (dayWidth + metrics.dayGap)), row1Y, dayWidth, rowHeights[0]);
        drawHorizontalDay(2, boardX + metrics.boardPadding + (3 * (dayWidth + metrics.dayGap)), row1Y, dayWidth, rowHeights[0]);
        drawHorizontalDay(3, boardX + metrics.boardPadding + (0 * (dayWidth + metrics.dayGap)), row2Y, dayWidth, rowHeights[1]);
        drawHorizontalDay(4, boardX + metrics.boardPadding + (1 * (dayWidth + metrics.dayGap)), row2Y, dayWidth, rowHeights[1]);
        drawHorizontalDay(5, boardX + metrics.boardPadding + (2 * (dayWidth + metrics.dayGap)), row2Y, dayWidth, rowHeights[1]);
        drawHorizontalDay(6, boardX + metrics.boardPadding + (3 * (dayWidth + metrics.dayGap)), row2Y, dayWidth, rowHeights[1]);
        return canvas;
    }

    const daysTop = boardY + metrics.boardPadding + metrics.titleHeight + metrics.dayGap;
    let currentY = daysTop;
    const dayWidth = metrics.boardWidth - (metrics.boardPadding * 2);

    for (let i = 0; i < board.dayGroups.length; i += 1) {
        const daySegments = board.dayGroups[i];
        const dayLayout = dayLayouts[i];
        const day = board.days[i];
        const dayLabel = day.label;
        const dayName = day.name;
        const dayHeight = dayLayout.dayHeight;
        const dayX = boardX + metrics.boardPadding;
        const dayY = currentY;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.14)';
        ctx.shadowBlur = 0;
        roundRect(ctx, dayX, dayY, dayWidth, dayHeight, 13);
        const dayGradient = ctx.createLinearGradient(dayX, dayY, dayX + dayWidth, dayY);
        dayGradient.addColorStop(0, 'rgba(170, 119, 187, 0.72)');
        dayGradient.addColorStop(1, 'rgba(72, 62, 193, 0.78)');
        ctx.fillStyle = dayGradient;
        ctx.fill();
        ctx.restore();

        ctx.save();
        roundRect(ctx, dayX, dayY, dayWidth, dayHeight, 13);
        ctx.clip();
        const sheen = ctx.createLinearGradient(dayX, dayY, dayX, dayY + dayHeight);
        sheen.addColorStop(0, 'rgba(255,255,255,0.07)');
        sheen.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(dayX, dayY, dayWidth, dayHeight);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(243, 240, 255, 0.48)';
        ctx.font = `900 ${metrics.dayLabelSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(dayName, dayX + 4, dayY + 4);
        ctx.restore();

        let contentY = dayY + metrics.dayPaddingY + metrics.dayHeadHeight;
        if (!daySegments.length) {
            ctx.save();
            ctx.fillStyle = 'rgba(239, 236, 255, 0.92)';
            ctx.font = '900 17px "Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(38, 25, 100, 0.28)';
            ctx.shadowOffsetY = 3;
            ctx.fillText('OFFLINE', dayX + dayWidth / 2, contentY + (metrics.offlineHeight / 2));
            ctx.restore();
        } else {
            for (const item of dayLayout.segmentLayouts) {
                const segment = item.segment;
                const segmentX = dayX + 4;
                const segmentY = contentY;
                const segmentWidth = dayWidth - 8;
                const segmentHeight = item.segmentHeight;
                const segmentArt = segment.category?.id ? board.artImages.get(segment.category.id) : null;
                const start = new Date(segment.start_time);
                const timeLabel = formatDate(start, board.timeZone, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const weekdayLabel = formatDate(start, board.timeZone, { weekday: 'short' }).toUpperCase();
                const titleText = segment.title || 'Untitled stream';

                ctx.save();
                roundRect(ctx, segmentX, segmentY, segmentWidth, segmentHeight, 12);
                ctx.clip();
                const segmentGradient = ctx.createLinearGradient(segmentX, segmentY, segmentX + segmentWidth, segmentY + segmentHeight);
                segmentGradient.addColorStop(0, 'rgba(16, 18, 54, 0.45)');
                segmentGradient.addColorStop(1, 'rgba(10, 12, 34, 0.92)');
                ctx.fillStyle = segmentGradient;
                ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                if (segmentArt) {
                    ctx.globalAlpha = 0.58;
                    drawCoverImage(ctx, segmentArt, segmentX, segmentY, segmentWidth, segmentHeight);
                    ctx.globalAlpha = 1;
                }
                const overlay = ctx.createLinearGradient(segmentX, segmentY, segmentX + segmentWidth, segmentY);
                overlay.addColorStop(0, 'rgba(10, 12, 34, 0.6)');
                overlay.addColorStop(0.7, 'rgba(10, 12, 34, 0.18)');
                overlay.addColorStop(1, 'rgba(10, 12, 34, 0.4)');
                ctx.fillStyle = overlay;
                ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                ctx.restore();

                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.96)';
                ctx.font = `900 ${metrics.timeSize}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.shadowColor = 'rgba(0,0,0,0.55)';
                ctx.shadowOffsetY = 2;
                ctx.fillText(timeLabel, segmentX + 10, segmentY + 8);
                ctx.fillStyle = 'rgba(255,255,255,0.94)';
                ctx.font = `900 ${metrics.weekdaySize}px Inter, system-ui, sans-serif`;
                ctx.fillText(weekdayLabel, segmentX + 10, segmentY + 28);
                ctx.restore();

                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.98)';
                ctx.font = `800 ${metrics.titleSize}px Inter, system-ui, sans-serif`;
                ctx.textBaseline = 'top';
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowOffsetY = 2;
                item.wrapped.forEach((line, index) => {
                    ctx.fillText(line, segmentX + item.titleX, segmentY + item.titleY + (index * item.lineHeight));
                });
                ctx.restore();

                contentY += segmentHeight + metrics.segmentGap;
            }
        }

        currentY += dayHeight + metrics.dayGap;
    }

    return canvas;
}

async function exportPng() {
    if (!state.currentBoard) {
        setMessage('Load a schedule before exporting PNG.', 'error');
        return;
    }

    setMessage(`Rendering ${state.layout} PNG...`, '');
    const board = state.currentBoard;
    const artEntries = [...new Map(board.segments
        .map((segment) => {
            const categoryId = segment.category?.id;
            return categoryId ? [categoryId, toBoxArtUrl(categoryId, 512, 683)] : null;
        })
        .filter(Boolean)).entries()];

    const artImages = new Map();
    console.log('Loading art for categories:', artEntries.map(([id]) => id));

    await Promise.all(artEntries.map(async ([categoryId, originalUrl]) => {
        try {
            // Resolve the best URL (checking for 404 redirects)
            const resolvedUrl = await resolveBoxArtUrl(categoryId, 512, 683);
            console.log(`Attempting to load art for category ${categoryId}:`, resolvedUrl);
            artImages.set(categoryId, await loadImage(resolvedUrl));
        } catch (error) {
            // Final fallback if everything fails
            const igdbUrl = toBoxArtUrl(categoryId, 512, 683, true);
            try {
                console.log(`Total failure fallback to IGDB for category ${categoryId}:`, igdbUrl);
                artImages.set(categoryId, await loadImage(igdbUrl));
            } catch (igdbError) {
                console.warn(`Skipped art for category ${categoryId}:`, error.message, '| IGDB fallback failed:', igdbError.message);
            }
        }
    }));

    let currentEmoteImage = null;
    const currentEmote = board.currentEmote || pickRandomItem(board.channelEmotes || []) || null;
    if (currentEmote?.imageUrl) {
        try {
            currentEmoteImage = await loadImage(currentEmote.imageUrl);
        } catch (error) {
            console.warn('Skipped channel emote for PNG export:', error.message);
        }
    }

    const exportBoard = {
        weekLabel: board.weekLabel,
        timeZone: board.timeZone,
        dayGroups: board.dayGroups,
        days: board.days,
        artImages,
        currentEmote,
        currentEmoteImage
    };

    const canvas = await buildScheduleCanvas(exportBoard, state.layout);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
        setMessage('PNG export failed.', 'error');
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stream-schedule-${state.layout}-${board.weekLabel.replaceAll(' ', '-').replaceAll(',', '').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setMessage('PNG exported.', 'success');
}

async function resolveBroadcasterId() {
    const raw = els.broadcasterInput.value.trim();
    if (!raw) throw new Error('Enter a broadcaster login or ID.');
    if (/^\d+$/.test(raw)) return raw;
    if (!state.accessToken) throw new Error('Connect Twitch first so the page can resolve a broadcaster login.');
    if (!state.clientId) throw new Error('Set VITE_TWITCH_CLIENT_ID in .env first.');

    const url = new URL('https://api.twitch.tv/helix/users');
    url.searchParams.set('login', raw);

    const response = await fetch(url, {
        headers: {
            'Client-ID': state.clientId,
            Authorization: `Bearer ${state.accessToken}`
        }
    });

    if (!response.ok) throw new Error('Unable to resolve the broadcaster login.');
    const payload = await response.json();
    if (!payload.data || !payload.data.length) throw new Error('No Twitch user matched that login.');
    return payload.data[0].id;
}

async function fetchSchedulePage(broadcasterId, startTime, after) {
    const url = new URL('https://api.twitch.tv/helix/schedule');
    url.searchParams.set('broadcaster_id', broadcasterId);
    url.searchParams.set('start_time', startTime);
    url.searchParams.set('first', '25');
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url, {
        headers: {
            'Client-ID': state.clientId,
            Authorization: `Bearer ${state.accessToken}`
        }
    });

    if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.message || `Twitch schedule request failed (${response.status})`);
    }

    return response.json();
}

async function fetchSchedule(broadcasterId, weekStart, weekEnd) {
    const segments = [];
    let after = null;
    let info = null;

    while (true) {
        const payload = await fetchSchedulePage(broadcasterId, weekStart.toISOString(), after);
        info = payload.data || info;
        const pageSegments = payload.data?.segments || [];

        for (const segment of pageSegments) {
            const segmentStart = new Date(segment.start_time);
            const segmentEnd = new Date(segment.end_time);
            if (segmentEnd <= weekStart || segmentStart >= weekEnd) continue;
            segments.push(segment);
        }

        const cursor = payload.pagination?.cursor;
        const lastSegment = pageSegments[pageSegments.length - 1];
        const lastSegmentTime = lastSegment ? new Date(lastSegment.start_time) : null;

        if (!cursor || (lastSegmentTime && lastSegmentTime >= weekEnd)) break;
        after = cursor;
    }

    segments.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return { info, segments };
}

async function fetchChannelEmotes(broadcasterId) {
    const url = new URL('https://api.twitch.tv/helix/chat/emotes');
    url.searchParams.set('broadcaster_id', broadcasterId);

    const response = await fetch(url, {
        headers: {
            'Client-ID': state.clientId,
            Authorization: `Bearer ${state.accessToken}`
        }
    });

    if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.message || `Twitch emotes request failed (${response.status})`);
    }

    const payload = await response.json();
    return getStaticChannelEmotes(payload);
}

function groupSegmentsByDay(segments, timeZone) {
    const groups = new Map();
    for (const segment of segments) {
        const key = getDateKey(new Date(segment.start_time), timeZone);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(segment);
    }
    return groups;
}

function renderDayCard(date, segments, timeZone) {
    const dayKey = getDateKey(date, timeZone);
    const dayName = formatDate(date, timeZone, { weekday: 'short' }).toUpperCase();
    const dayLabel = formatDate(date, timeZone, { month: 'short', day: 'numeric' });

    const cards = segments.length
        ? segments.map((segment) => {
            const start = new Date(segment.start_time);
            const categoryId = segment.category?.id;
            const categoryName = segment.category?.name || 'Unknown';
            const art = segment.resolvedArtUrl || (categoryId ? toBoxArtUrl(categoryId, 160, 214) : '');
            
            if (art) {
                console.log(`📺 "${segment.title}" (${categoryName}):`, art);
            } else {
                console.log(`⚠️ "${segment.title}" - No category ID`);
            }
            
            const timeLabel = formatDate(start, timeZone, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const weekdayLabel = formatDate(start, timeZone, { weekday: 'short' }).toUpperCase();

            return `
                <article class="segment">
                    ${art ? `<div class="segment-art" style="background-image:url('${art}')"></div>` : ''}
                    <div class="segment-content">
                        <div class="segment-time">${timeLabel}</div>
                        <div class="segment-weekday">${weekdayLabel}</div>
                        <div class="segment-title">${escapeHtml(segment.title || 'Untitled stream')}</div>
                    </div>
                </article>
            `;
        }).join('')
        : `<div class="day-empty">Offline</div>`;

    return `
        <section class="day${segments.length ? '' : ' day-empty-state'}" data-day="${dayKey}">
            <div class="day-head">
                <strong>${dayName}</strong>
                <span>${dayLabel}</span>
            </div>
            ${cards}
        </section>
    `;
}

function renderEmoteTile(emotes) {
    if (!emotes.length) {
        return {
            html: `
            <div class="emote-tile emote-empty" aria-label="No static emotes available">
                <span>No emotes</span>
            </div>
        `,
            emote: null
        };
    }

    const emote = pickRandomItem(emotes) || emotes[0];
    const alt = emote.name || 'Channel emote';

    return {
        emote,
        html: `
        <button
            class="emote-tile"
            type="button"
            data-emote-roll="true"
            data-emote-id="${escapeHtml(emote.id)}"
            aria-label="Roll a random emote"
            title="Click to roll a random emote"
        >
            <img
                class="emote-image"
                data-emote-image="true"
                src="${escapeHtml(emote.imageUrl)}"
                alt="${escapeHtml(alt)}"
                draggable="false"
            >
        </button>
    `
    };
}

function wireEmoteRoller(emotes) {
    const button = els.days.querySelector('[data-emote-roll="true"]');
    const image = els.days.querySelector('[data-emote-image="true"]');
    if (!button || !image || !emotes.length) return;

    const roll = (excludeId = '') => {
        const next = pickRandomItem(emotes, excludeId) || emotes[0];
        if (!next) return;
        if (next.id === excludeId && emotes.length === 1) return;
        button.dataset.emoteId = next.id;
        image.src = next.imageUrl;
        image.alt = next.name || 'Channel emote';
        button.title = `Click to roll a random emote: ${next.name || 'Channel emote'}`;
        if (state.currentBoard) {
            state.currentBoard.currentEmote = next;
        }
    };

    button.addEventListener('click', () => {
        roll(button.dataset.emoteId || '');
    });

    image.addEventListener('error', () => {
        roll(button.dataset.emoteId || '');
    });
}

function renderBoard(segments, weekStart, timeZone, info, extras = {}) {
    const grouped = groupSegmentsByDay(segments, timeZone);
    const days = [];
    const dayGroups = [];
    const emoteTile = state.layout === 'horizontal' ? renderEmoteTile(extras.channelEmotes || []) : { html: '', emote: null };

    for (let i = 0; i < 7; i += 1) {
        const day = new Date(weekStart.getTime() + i * 86400000);
        const key = getDateKey(day, timeZone);
        const daySegments = grouped.get(key) || [];
        dayGroups.push(daySegments);
        days.push(renderDayCard(day, daySegments, timeZone));
    }

    if (state.layout === 'horizontal') {
        const topDays = [emoteTile.html, ...days.slice(0, 3)].join('');
        const bottomDays = days.slice(3).join('');
        els.days.innerHTML = `
            <div class="horizontal-board">
                <div class="horizontal-days horizontal-days-top">${topDays}</div>
                <div class="horizontal-days horizontal-days-bottom">${bottomDays}</div>
            </div>
        `;
        wireEmoteRoller(extras.channelEmotes || []);
    } else {
        els.days.innerHTML = days.join('');
    }
    els.weekLabel.textContent = formatWeekLabel(weekStart, new Date(weekStart.getTime() + 7 * 86400000), timeZone);
    setBoardTitle();
    els.boardSubtitle.textContent = '';
    state.currentBoard = {
        segments,
        weekStart: new Date(weekStart.getTime()),
        timeZone,
        info: info || null,
        weekLabel: formatWeekLabel(weekStart, new Date(weekStart.getTime() + 7 * 86400000), timeZone),
        dayGroups,
        broadcasterId: extras.broadcasterId || null,
        channelEmotes: extras.channelEmotes || [],
        currentEmote: emoteTile.emote,
        days: dayGroups.map((daySegments, index) => {
            const day = new Date(weekStart.getTime() + index * 86400000);
            return {
                name: formatDate(day, timeZone, { weekday: 'short' }).toUpperCase(),
                label: formatDate(day, timeZone, { month: 'short', day: 'numeric' })
            };
        })
    };

    if (info?.vacation?.start_time && info?.vacation?.end_time) {
        const start = new Date(info.vacation.start_time);
        const end = new Date(info.vacation.end_time);
        setMessage(
            `Vacation scheduled from ${formatDate(start, timeZone, { month: 'short', day: 'numeric' })} to ${formatDate(end, timeZone, { month: 'short', day: 'numeric' })}.`,
            'success'
        );
    }
}

function updateWeekButtons() {
    const enabled = Boolean(state.accessToken && state.clientId);
    els.weekOffsetSelect.disabled = !enabled;
    els.loadBtn.disabled = !enabled;
}

async function loadSchedule() {
    try {
        state.broadcasterInput = els.broadcasterInput.value.trim();
        state.timezone = els.timezoneInput.value.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
        saveState();
        syncInputs();
        updateWeekButtons();

        if (!state.accessToken) throw new Error('Connect Twitch first to load the schedule.');
        if (!state.clientId) throw new Error('Set VITE_TWITCH_CLIENT_ID in .env first.');
        if (!state.broadcasterInput) throw new Error('Enter a broadcaster login or ID.');

        setMessage('Resolving broadcaster and loading schedule...', '');
        const broadcasterId = await resolveBroadcasterId();
        const reference = new Date();
        const weekStart = getWeekStart(reference, state.timezone, state.weekOffset);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
        const payload = await fetchSchedule(broadcasterId, weekStart, weekEnd);

        setMessage(
            payload.segments.length
                ? `Loaded ${payload.segments.length} scheduled segment(s).`
                : 'No schedule entries were found for this week.',
            payload.segments.length ? 'success' : 'error'
        );

        // Pre-resolve box art URLs to handle 404 redirects to the generic image
        if (payload.segments.length) {
            setMessage('Optimizing box art sources...', '');
            await Promise.all(payload.segments.map(async (segment) => {
                if (segment.category?.id) {
                    segment.resolvedArtUrl = await resolveBoxArtUrl(segment.category.id, 160, 214);
                }
            }));
            setMessage(`Loaded ${payload.segments.length} scheduled segment(s).`, 'success');
        }

        let channelEmotes = [];
        try {
            channelEmotes = await fetchChannelEmotes(broadcasterId);
        } catch (emoteError) {
            console.warn('Failed to load channel emotes:', emoteError);
        }

        renderBoard(payload.segments, weekStart, state.timezone, payload.info, {
            broadcasterId,
            channelEmotes
        });
    } catch (error) {
        els.days.innerHTML = '';
        els.weekLabel.textContent = 'Week label';
        setBoardTitle();
        els.boardSubtitle.textContent = 'Pick a broadcaster and load a week.';
        state.currentBoard = null;
        setMessage(error.message || 'Failed to load schedule.', 'error');
    }
}

function wireEvents() {
    els.broadcasterInput.addEventListener('input', () => {
        state.broadcasterInput = els.broadcasterInput.value.trim();
        saveState();
        updateWeekButtons();
    });

    els.timezoneInput.addEventListener('change', () => {
        state.timezone = els.timezoneInput.value || Intl.DateTimeFormat().resolvedOptions().timeZone;
        saveState();
    });

    els.weekOffsetSelect.addEventListener('change', () => {
        const nextOffset = Number(els.weekOffsetSelect.value);
        state.weekOffset = Number.isNaN(nextOffset) ? 0 : nextOffset;
        saveState();
    });

    els.connectBtn.addEventListener('click', connectTwitch);
    els.loadBtn.addEventListener('click', loadSchedule);
    els.verticalLayoutBtn.addEventListener('click', () => setLayout('vertical'));
    els.horizontalLayoutBtn.addEventListener('click', () => setLayout('horizontal'));
    els.exportPngBtn.addEventListener('click', exportPng);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.target === els.broadcasterInput || event.target === els.timezoneInput)) {
            loadSchedule();
        }
    });
}

function startValidationLoop() {
    if (state.tokenRefreshTimer) {
        clearInterval(state.tokenRefreshTimer);
    }

    if (!state.accessToken) return;

    state.tokenRefreshTimer = setInterval(async () => {
        if (state.validating || !state.accessToken) return;
        state.validating = true;
        try {
            const info = await validateToken(state.accessToken);
            state.tokenLogin = info.login || state.tokenLogin;
            state.tokenUserId = info.user_id || state.tokenUserId;
            saveState();
        } catch (error) {
            state.accessToken = '';
            state.tokenLogin = '';
            state.tokenUserId = '';
            saveState();
            syncInputs();
            setMessage('Twitch token expired or was revoked. Connect again to continue.', 'error');
        } finally {
            state.validating = false;
        }
    }, 60 * 60 * 1000);
}

async function initialize() {
    syncInputs();
    wireEvents();
    updateWeekButtons();
    await hydrateToken();
    startValidationLoop();

    const reference = new Date();
    const weekStart = getWeekStart(reference, state.timezone, state.weekOffset);
    els.weekLabel.textContent = formatWeekLabel(weekStart, new Date(weekStart.getTime() + 7 * 86400000), state.timezone);
    setBoardTitle();
    els.boardSubtitle.textContent = '';
    renderBoard([], weekStart, state.timezone, null);

    if (state.accessToken && state.broadcasterInput) {
        loadSchedule();
    }
}

initialize();
