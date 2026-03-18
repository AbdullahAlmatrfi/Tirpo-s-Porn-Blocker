const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'blocked';
const siteParam = (params.get('site') || '').trim();

const QUOTES = {
    en: [
        'This moment of resistance is building the person you want to become.',
        'Your future self will thank you for this choice.',
        'Progress, not perfection.',
        'You are stronger than the urge that brought you here.',
        'One clean decision can change the next hour.'
    ],
    ar: [
        'هذه اللحظة تصنع الشخص الذي تريد أن تكونه.',
        'نسختك القادمة ستشكرك على هذا القرار.',
        'التقدم أهم من الكمال.',
        'أنت أقوى من الرغبة التي قادتك إلى هنا.',
        'قرار نظيف واحد قد يغير ساعتك القادمة.'
    ]
};

const FIXED_QURAN_OUTLET = { name: 'Quran', url: 'https://www.youtube.com/watch?v=bP3AYLevqnI' };
const CLUMSY_BIRD_REPO_URL = 'https://github.com/ellisonleao/clumsy-bird';
const CLUMSY_BIRD_LIVE_URL = 'https://ellisonleao.github.io/clumsy-bird/';
const CLUMSY_BIRD_LOCAL_URL = chrome.runtime.getURL('vendor/clumsy-bird/index.html');
const FRIENDLY_GAME_NAME = 'Focus Bird Game';
const FIXED_GAME_OUTLET = { name: FRIENDLY_GAME_NAME, url: CLUMSY_BIRD_LOCAL_URL };
const FIXED_OUTLETS = [FIXED_QURAN_OUTLET, FIXED_GAME_OUTLET];
const MAX_CUSTOM_OUTLETS = 1;
const LEGACY_OUTLET_NAMES = new Set(['learn something', 'quick workout', 'meditate']);

const modeContent = {
    en: {
        blocked: {
            headline: 'Oops! Access blocked',
            pill: 'Strict block',
            messageTitle: 'Pause here for a second',
            messageTemplate: 'Looks like {site} was blocked to protect your focus. Usually it is just an urge.',
            primaryLabel: 'Take a breath',
            primaryAction: 'breathe'
        },
        focus: {
            headline: 'Route changed on purpose',
            pill: 'Focus redirect',
            messageTitle: 'You took the safer route',
            messageTemplate: "Instead of opening {site}, Tirpo's Porn Blocker sent you here to interrupt the loop and give you a better next step.",
            primaryLabel: 'Start breathing',
            primaryAction: 'breathe'
        },
        'safe-search': {
            headline: 'Take the clean route instead',
            pill: 'Safe Search handoff',
            messageTitle: 'Not this road',
            messageTemplate: 'Open Google Safe Search instead and keep the search clean.',
            primaryLabel: 'Open Google Safe Search',
            primaryAction: 'google'
        }
    },
    ar: {
        blocked: {
            headline: 'تم حظر الوصول',
            pill: 'حظر صارم',
            messageTitle: 'تمهل قليلًا',
            messageTemplate: 'تم حظر {site} لحماية تركيزك. غالبًا هي مجرد رغبة عابرة.',
            primaryLabel: 'خذ نفسًا',
            primaryAction: 'breathe'
        },
        focus: {
            headline: 'تم تحويل المسار',
            pill: 'تحويل للتركيز',
            messageTitle: 'اخترت الطريق الآمن',
            messageTemplate: 'بدلًا من فتح {site}، تم تحويلك إلى هنا لكسر الحلقة واختيار خطوة أفضل.',
            primaryLabel: 'ابدأ التنفس',
            primaryAction: 'breathe'
        },
        'safe-search': {
            headline: 'اسلك الطريق الأنظف',
            pill: 'تحويل البحث الآمن',
            messageTitle: 'ليس هذا الطريق',
            messageTemplate: 'افتح البحث الآمن في جوجل بدلًا من ذلك وحافظ على بحث نظيف.',
            primaryLabel: 'افتح البحث الآمن',
            primaryAction: 'google'
        }
    }
};

const translations = {
    en: {
        lang: 'AR',
        reason: 'Your reason',
        leadTemplate: 'Looks like {site} was intercepted to protect your focus.',
        startStreak: 'Start your next streak now',
        streakCopyFallback: 'A clean next step still counts.',
        streakTitleWithDays: 'You had a {days}-day streak',
        bestStreakCopy: 'Your best streak is {days} days. You can build that again.',
        pauseBeforeNextTab: 'Pause before you choose the next tab.',
        doneWell: 'Well done',
        donePrompt: 'You did great. Close when ready.',
        breatheIn: 'Breathe in...',
        breatheOut: 'Breathe out...',
        hold: 'Hold...',
        breathingPrompt: 'Focus on your breathing',
        inhalePrompt: 'Inhale slowly through your nose',
        holdPrompt: 'Hold gently',
        exhalePrompt: 'Exhale slowly',
        done: 'Done',
        actionBack: 'Back to safety',
        actionBackNote: 'Open Google Safe Search.',
        takeBreath: 'Take a breath',
        localFocusGame: 'Local focus game',
        localExtensionPage: 'Local extension page',
        fixedOutletQuran: 'Quran',
        fixedOutletGame: 'Focus Bird Game',
        thisPage: 'this page'
    },
    ar: {
        lang: 'EN',
        reason: 'سببك',
        leadTemplate: 'يبدو أن {site} تم اعتراضه لحماية تركيزك.',
        startStreak: 'ابدأ سلسلتك من جديد',
        streakCopyFallback: 'الخطوة النظيفة التالية ما زالت مهمة.',
        streakTitleWithDays: 'كانت لديك سلسلة لمدة {days} يومًا',
        bestStreakCopy: 'أفضل سلسلة لديك هي {days} يومًا. يمكنك بناؤها من جديد.',
        pauseBeforeNextTab: 'توقف قبل أن تختار التبويب التالي.',
        doneWell: 'أحسنت',
        donePrompt: 'أديت بشكل ممتاز. أغلق عندما تكون جاهزًا.',
        breatheIn: 'خذ شهيقًا...',
        breatheOut: 'أخرج الزفير...',
        hold: 'احبس النفس...',
        breathingPrompt: 'ركز على تنفسك',
        inhalePrompt: 'استنشق ببطء من أنفك',
        holdPrompt: 'احبس النفس بلطف',
        exhalePrompt: 'أخرج الزفير ببطء',
        done: 'تم',
        actionBack: 'عودة آمنة',
        actionBackNote: 'افتح البحث الآمن في جوجل.',
        takeBreath: 'خذ نفسًا',
        localFocusGame: 'لعبة تركيز محلية',
        localExtensionPage: 'صفحة محلية داخل الإضافة',
        fixedOutletQuran: 'القرآن',
        fixedOutletGame: 'لعبة الطائر',
        thisPage: 'هذه الصفحة'
    }
};

let currentLanguage = 'en';
let breatheTimer = null;
const latestState = {
    streakDays: 0,
    bestStreak: 0,
    outlets: []
};

const ui = {
    headline: document.getElementById('headline'),
    lead: document.getElementById('lead'),
    modePill: document.getElementById('mode-pill'),
    messagePanel: document.getElementById('message-panel'),
    messageTitle: document.getElementById('message-title'),
    messageCopy: document.getElementById('message-copy'),
    quote: document.getElementById('quote'),
    langToggle: document.getElementById('lang-toggle'),
    primaryCta: document.getElementById('primary-cta'),
    reasonTitle: document.querySelector('#reason-panel strong'),
    reasonText: document.getElementById('reason-text'),
    reasonPanel: document.getElementById('reason-panel'),
    streakPanel: document.getElementById('streak-panel'),
    streakTitle: document.getElementById('streak-title'),
    streakCopy: document.getElementById('streak-copy'),
    actionsGrid: document.getElementById('actions-grid'),
    outletsGrid: document.getElementById('outlets-grid'),
    breatheOverlay: document.getElementById('breathe-overlay'),
    breatheCircle: document.getElementById('breathe-circle'),
    breatheText: document.getElementById('breathe-text'),
    breathePrompt: document.getElementById('breathe-prompt'),
    breatheDone: document.getElementById('breathe-done')
};

function t() {
    return translations[currentLanguage] || translations.en;
}

function template(text, values) {
    return Object.entries(values).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, text);
}

function displaySite() {
    return siteParam || t().thisPage;
}

function currentModeConfig() {
    const source = currentLanguage === 'ar' ? modeContent.ar : modeContent.en;
    return source[mode] || source.blocked;
}

function pickQuote() {
    const source = QUOTES[currentLanguage] || QUOTES.en;
    return source[Math.floor(Math.random() * source.length)];
}

function goToSafeSearch() {
    window.location.href = 'https://www.google.com/search?safe=active&q=dont+do+it+again+buddy';
}

function renderPageText() {
    const lang = t();
    const cfg = currentModeConfig();
    const shownSite = displaySite();

    document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.body.lang = currentLanguage;
    ui.langToggle.textContent = lang.lang;

    ui.headline.textContent = cfg.headline;
    ui.lead.innerHTML = template(lang.leadTemplate, { site: '<span class="site" id="site-inline"></span>' });
    const inlineSite = ui.lead.querySelector('#site-inline');
    if (inlineSite) {
        inlineSite.textContent = shownSite;
    }
    ui.modePill.textContent = cfg.pill;
    ui.messagePanel.classList.remove('hidden');
    ui.messageTitle.textContent = cfg.messageTitle;
    ui.messageCopy.textContent = template(cfg.messageTemplate, { site: shownSite });
    ui.primaryCta.textContent = cfg.primaryLabel;
    ui.quote.textContent = `"${pickQuote()}"`;

    if (ui.reasonTitle) {
        ui.reasonTitle.textContent = lang.reason;
    }

    ui.breatheText.textContent = lang.breatheIn;
    ui.breathePrompt.textContent = lang.breathingPrompt;
    ui.breatheDone.textContent = lang.done;
}

function renderActions() {
    const lang = t();
    ui.actionsGrid.innerHTML = '';

    const actions = mode === 'safe-search'
        ? [
            { title: lang.takeBreath, note: lang.pauseBeforeNextTab, href: '#breathe', action: 'breathe' },
            { title: lang.actionBack, note: lang.actionBackNote, href: 'https://www.google.com/?safe=active' }
        ]
        : [];

    actions.forEach((action) => {
        const link = document.createElement('a');
        link.className = 'action';
        link.href = action.href;
        link.innerHTML = `<strong>${action.title}</strong><small>${action.note}</small>`;

        if (action.action === 'breathe') {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openBreathing();
            });
        }

        ui.actionsGrid.appendChild(link);
    });
}

function localizedOutletName(outlet) {
    const lang = t();
    const normalizedUrl = normalizeUrl(outlet.url || '');
    if (normalizedUrl === normalizeUrl(FIXED_QURAN_OUTLET.url)) {
        return lang.fixedOutletQuran;
    }
    if (normalizedUrl === normalizeUrl(FIXED_GAME_OUTLET.url)) {
        return lang.fixedOutletGame;
    }
    return outlet.name;
}

function renderOutlets(outlets) {
    ui.outletsGrid.innerHTML = '';
    const items = sanitizeWholesomeOutlets(outlets);

    items.forEach((outlet) => {
        const link = document.createElement('a');
        link.className = 'outlet';
        link.href = outlet.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        const title = document.createElement('strong');
        title.textContent = localizedOutletName(outlet);

        const compactUrl = document.createElement('small');
        compactUrl.textContent = formatOutletUrlForDisplay(outlet.url);
        compactUrl.title = outlet.url;

        link.appendChild(title);
        link.appendChild(compactUrl);
        ui.outletsGrid.appendChild(link);
    });
}

function formatOutletUrlForDisplay(rawUrl) {
    if (!rawUrl) {
        return '';
    }

    const lang = t();
    if (rawUrl === CLUMSY_BIRD_LOCAL_URL) {
        return lang.localFocusGame;
    }

    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === 'chrome-extension:') {
            return lang.localExtensionPage;
        }

        const host = parsed.hostname.replace(/^www\./i, '');
        const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
        const compact = `${host}${path}`;
        return compact.length > 40 ? `${compact.slice(0, 39)}...` : compact;
    } catch (error) {
        return rawUrl.length > 40 ? `${rawUrl.slice(0, 39)}...` : rawUrl;
    }
}

function renderStreak(streakDays, bestStreak) {
    const lang = t();
    ui.streakPanel.classList.remove('hidden');
    ui.streakTitle.textContent = streakDays > 0
        ? template(lang.streakTitleWithDays, { days: streakDays })
        : lang.startStreak;
    ui.streakCopy.textContent = bestStreak > 0
        ? template(lang.bestStreakCopy, { days: bestStreak })
        : lang.streakCopyFallback;
}

function applyLanguage() {
    renderPageText();
    renderActions();
    renderStreak(latestState.streakDays, latestState.bestStreak);
    renderOutlets(latestState.outlets);
}

function openBreathing() {
    ui.breatheCircle.style.transition = 'none';
    ui.breatheCircle.style.transform = 'scale(0.6)';
    ui.breatheOverlay.classList.add('active');
    ui.breatheCircle.offsetHeight;
    ui.breatheCircle.style.transition = 'transform 4s ease-in-out';
    startBreathingCycle();
}

function closeBreathing() {
    ui.breatheOverlay.classList.remove('active');
    if (breatheTimer) {
        clearTimeout(breatheTimer);
    }
    ui.breatheCircle.style.transition = 'none';
    ui.breatheCircle.style.transform = 'scale(0.6)';
}

function startBreathingCycle() {
    const lang = t();
    let elapsed = 0;
    const cycleDuration = 12000;
    const totalDuration = 60000;

    function cycle() {
        if (elapsed >= totalDuration) {
            ui.breatheText.textContent = lang.doneWell;
            ui.breathePrompt.textContent = lang.donePrompt;
            return;
        }

        ui.breatheText.textContent = lang.breatheIn;
        ui.breathePrompt.textContent = lang.inhalePrompt;
        ui.breatheCircle.style.transform = 'scale(1)';

        breatheTimer = setTimeout(() => {
            ui.breatheText.textContent = lang.hold;
            ui.breathePrompt.textContent = lang.holdPrompt;
            breatheTimer = setTimeout(() => {
                ui.breatheText.textContent = lang.breatheOut;
                ui.breathePrompt.textContent = lang.exhalePrompt;
                ui.breatheCircle.style.transform = 'scale(0.6)';
                breatheTimer = setTimeout(() => {
                    elapsed += cycleDuration;
                    cycle();
                }, 4000);
            }, 4000);
        }, 4000);
    }

    cycle();
}

function sanitizeWholesomeOutlets(outlets) {
    const source = Array.isArray(outlets) ? outlets : [];
    const customOutlets = [];
    const seenUrls = new Set();

    source.forEach((outlet) => {
        const normalizedOutlet = normalizeOutletPreset(outlet);
        const name = normalizedOutlet.name;
        const url = normalizedOutlet.url;

        if (!name || !url) {
            return;
        }

        if (isFixedOutlet({ name, url }) || LEGACY_OUTLET_NAMES.has(name.toLowerCase())) {
            return;
        }

        if (seenUrls.has(url)) {
            return;
        }

        seenUrls.add(url);
        customOutlets.push({ name, url });
    });

    return [...FIXED_OUTLETS, ...customOutlets.slice(0, MAX_CUSTOM_OUTLETS)];
}

function normalizeOutletPreset(outlet) {
    const name = (outlet?.name || '').trim();
    const url = normalizeUrl(outlet?.url || '');
    if (!name && !url) {
        return { name: '', url: '' };
    }

    const lowerName = name.toLowerCase();
    if (
        lowerName === 'clumsy bird' ||
        lowerName === FRIENDLY_GAME_NAME.toLowerCase() ||
        url === CLUMSY_BIRD_REPO_URL ||
        url === `${CLUMSY_BIRD_REPO_URL}/` ||
        url === CLUMSY_BIRD_LIVE_URL
    ) {
        return { name: FRIENDLY_GAME_NAME, url: CLUMSY_BIRD_LOCAL_URL };
    }

    return { name, url };
}

function isFixedOutlet(outlet) {
    if (!outlet) {
        return false;
    }

    const name = (outlet.name || '').trim().toLowerCase();
    const url = normalizeUrl(outlet.url || '');
    return FIXED_OUTLETS.some((fixedOutlet) => {
        const fixedName = (fixedOutlet.name || '').trim().toLowerCase();
        const fixedUrl = normalizeUrl(fixedOutlet.url || '');
        return name === fixedName || url === fixedUrl;
    });
}

function normalizeUrl(input) {
    if (!input) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;

    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return '';
        }
        return parsed.toString();
    } catch (error) {
        return '';
    }
}

ui.langToggle.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    applyLanguage();
});

ui.primaryCta.addEventListener('click', () => {
    const cfg = currentModeConfig();
    if (cfg.primaryAction === 'google') {
        goToSafeSearch();
        return;
    }
    openBreathing();
});

ui.breatheDone.addEventListener('click', closeBreathing);

chrome.storage.local.get(['whyIQuit', 'streakDays', 'bestStreak', 'wholesomeOutlets'], (result) => {
    if (result.whyIQuit) {
        ui.reasonPanel.classList.remove('hidden');
        ui.reasonTitle.textContent = t().reason;
        ui.reasonText.textContent = result.whyIQuit;
    }

    latestState.streakDays = result.streakDays || 0;
    latestState.bestStreak = result.bestStreak || 0;
    latestState.outlets = result.wholesomeOutlets;
    renderStreak(latestState.streakDays, latestState.bestStreak);
    renderOutlets(latestState.outlets);
});

if (mode === 'safe-search') {
    window.setTimeout(goToSafeSearch, 250);
}

applyLanguage();
