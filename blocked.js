const params = new URLSearchParams(window.location.search);
const site = params.get('site') || 'this page';
const mode = params.get('mode') || 'blocked';

const quotes = [
    'This moment of resistance is building the person you want to become.',
    'Your future self will thank you for this choice.',
    'Progress, not perfection.',
    'You are stronger than the urge that brought you here.',
    'One clean decision can change the next hour.'
];

const FIXED_QURAN_OUTLET = { name: 'Quran', url: 'https://www.youtube.com/watch?v=bP3AYLevqnI' };
const CLUMSY_BIRD_REPO_URL = 'https://github.com/ellisonleao/clumsy-bird';
const CLUMSY_BIRD_LIVE_URL = 'https://ellisonleao.github.io/clumsy-bird/';
const CLUMSY_BIRD_LOCAL_URL = chrome.runtime.getURL('vendor/clumsy-bird/index.html');
const FRIENDLY_GAME_NAME = 'Focus Bird Game';
const FIXED_GAME_OUTLET = { name: FRIENDLY_GAME_NAME, url: CLUMSY_BIRD_LOCAL_URL };
const FIXED_OUTLETS = [FIXED_QURAN_OUTLET, FIXED_GAME_OUTLET];
const MAX_WHOLESOME_OUTLETS = 3;
const MAX_CUSTOM_OUTLETS = 1;
const LEGACY_OUTLET_NAMES = new Set(['learn something', 'quick workout', 'meditate']);

const configByMode = {
    blocked: {
        headline: 'Oops! Access blocked',
        pill: 'Strict block',
        messageTitle: 'Pause here for a second',
        messageCopy: `Looks like ${site} was blocked to protect your focus. Usually it is just an urge.`,
        primaryLabel: 'Take a breath',
        primaryAction: 'breathe'
    },
    focus: {
        headline: 'Route changed on purpose',
        pill: 'Focus redirect',
        messageTitle: 'You took the safer route',
        messageCopy: `Instead of opening ${site}, tirpos corn blocker sent you here to interrupt the loop and give you a better next step.`,
        primaryLabel: 'Start breathing',
        primaryAction: 'breathe'
    },
    'safe-search': {
        headline: 'Take the clean route instead',
        pill: 'Safe Search handoff',
        messageTitle: 'Not this road',
        messageCopy: 'Open Google Safe Search instead and keep the search clean.',
        primaryLabel: 'Open Google Safe Search',
        primaryAction: 'google'
    }
};

const translations = {
    en: {
        lang: 'AR',
        reason: 'Your reason',
        startStreak: 'Start your next streak now',
        streakCopyFallback: 'A clean next step still counts.',
        breatheIn: 'Breathe in...',
        breathingPrompt: 'Focus on your breathing',
        done: 'Done',
        actionLearn: 'Learn something',
        actionLearnNote: 'Move into a better loop.',
        actionWorkout: 'Quick workout',
        actionWorkoutNote: 'Burn the energy off fast.',
        actionMeditate: 'Meditate',
        actionMeditateNote: 'Get your nervous system back down.',
        actionBack: 'Back to safety',
        actionBackNote: 'Open Google Safe Search.',
        takeBreath: 'Take a breath'
    },
    ar: {
        lang: 'EN',
        reason: 'سببك',
        startStreak: 'ابدأ سلسلتك من جديد',
        streakCopyFallback: 'الخطوة النظيفة التالية ما زالت مهمة.',
        breatheIn: 'خذ شهيقاً...',
        breathingPrompt: 'ركّز على تنفسك',
        done: 'تم',
        actionLearn: 'تعلّم شيئاً',
        actionLearnNote: 'ادخل في مسار أفضل.',
        actionWorkout: 'تمرين سريع',
        actionWorkoutNote: 'فرّغ هذه الطاقة بسرعة.',
        actionMeditate: 'تأمل',
        actionMeditateNote: 'أعد تهدئة جهازك العصبي.',
        actionBack: 'عودة آمنة',
        actionBackNote: 'افتح بحث Google الآمن.',
        takeBreath: 'خذ نفساً'
    }
};

const config = configByMode[mode] || configByMode.blocked;
let currentLanguage = 'en';

document.getElementById('headline').textContent = config.headline;
document.getElementById('site').textContent = site;
document.getElementById('mode-pill').textContent = config.pill;
document.getElementById('message-panel').classList.remove('hidden');
document.getElementById('message-title').textContent = config.messageTitle;
document.getElementById('message-copy').textContent = config.messageCopy;
document.getElementById('quote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    applyLanguage();
});

const primaryCta = document.getElementById('primary-cta');
primaryCta.textContent = config.primaryLabel;
primaryCta.addEventListener('click', () => {
    if (config.primaryAction === 'google') {
        window.location.href = 'https://www.google.com/search?safe=active&q=dont+do+it+again+buddy';
        return;
    }

    openBreathing();
});

if (mode === 'safe-search') {
    window.setTimeout(() => {
        window.location.href = 'https://www.google.com/search?safe=active&q=dont+do+it+again+buddy';
    }, 250);
}

chrome.storage.local.get(['whyIQuit', 'streakDays', 'bestStreak', 'wholesomeOutlets'], (result) => {
    if (result.whyIQuit) {
        document.getElementById('reason-panel').classList.remove('hidden');
        document.querySelector('#reason-panel strong').textContent = translations[currentLanguage].reason;
        document.getElementById('reason-text').textContent = result.whyIQuit;
    }

    const streakDays = result.streakDays || 0;
    const bestStreak = result.bestStreak || 0;
    const streakPanel = document.getElementById('streak-panel');
    streakPanel.classList.remove('hidden');
    document.getElementById('streak-title').textContent = streakDays > 0
        ? `You had a ${streakDays}-day streak`
        : translations[currentLanguage].startStreak;
    document.getElementById('streak-copy').textContent = bestStreak > 0
        ? `Your best streak is ${bestStreak} days. You can build that again.`
        : translations[currentLanguage].streakCopyFallback;

    renderActions(mode);
    renderOutlets(result.wholesomeOutlets);
});

function renderActions(currentMode) {
    const actionsGrid = document.getElementById('actions-grid');
    actionsGrid.innerHTML = '';
    const t = translations[currentLanguage];
    const actions = currentMode === 'safe-search'
        ? [
            { title: t.takeBreath, note: currentLanguage === 'ar' ? 'توقف قبل أن تختار التبويب التالي.' : 'Pause before you choose the next tab.', href: '#breathe', action: 'breathe' },
            { title: t.actionBack, note: t.actionBackNote, href: 'https://www.google.com/?safe=active' }
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
        actionsGrid.appendChild(link);
    });
}

function applyLanguage() {
    const body = document.body;
    const language = translations[currentLanguage];
    document.getElementById('lang-toggle').textContent = language.lang;
    body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    body.lang = currentLanguage;
    const reasonLabel = document.querySelector('#reason-panel strong');
    if (reasonLabel) {
        reasonLabel.textContent = language.reason;
    }

    if (currentLanguage === 'ar') {
        document.getElementById('headline').textContent = mode === 'focus' ? 'تم تحويل المسار' : 'تم حظر الوصول';
        document.getElementById('lead').innerHTML = `يبدو أن <span class="site" id="site">${site}</span> تم اعتراضه لحماية تركيزك.`;
        document.getElementById('message-title').textContent = mode === 'safe-search' ? 'خذ الطريق الأنظف' : 'تمهل قليلاً';
        document.getElementById('message-copy').textContent = mode === 'safe-search'
            ? 'افتح بحث Google الآمن بدلًا من ذلك.'
            : `تم حظر ${site} لحماية تركيزك.`;
        document.getElementById('primary-cta').textContent = mode === 'safe-search' ? 'افتح Google الآمن' : translations.ar.takeBreath;
    } else {
        document.getElementById('headline').textContent = config.headline;
        document.getElementById('lead').innerHTML = `Looks like <span class="site" id="site">${site}</span> was intercepted to protect your focus.`;
        document.getElementById('message-title').textContent = config.messageTitle;
        document.getElementById('message-copy').textContent = config.messageCopy;
        document.getElementById('primary-cta').textContent = config.primaryLabel;
    }
    document.getElementById('breathe-text').textContent = language.breatheIn;
    document.getElementById('breathe-prompt').textContent = language.breathingPrompt;
    document.getElementById('breathe-done').textContent = language.done;
    renderActions(mode);
}

function renderOutlets(outlets) {
    const outletsGrid = document.getElementById('outlets-grid');
    outletsGrid.innerHTML = '';
    const items = sanitizeWholesomeOutlets(outlets);

    items.forEach((outlet) => {
        const link = document.createElement('a');
        link.className = 'outlet';
        link.href = outlet.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = `<strong>${outlet.name}</strong><small>${outlet.url}</small>`;
        outletsGrid.appendChild(link);
    });
}

const breatheOverlay = document.getElementById('breathe-overlay');
const breatheCircle = document.getElementById('breathe-circle');
const breatheText = document.getElementById('breathe-text');
const breathePrompt = document.getElementById('breathe-prompt');
const breatheDone = document.getElementById('breathe-done');
let breatheTimer = null;

function openBreathing() {
    breatheCircle.style.transition = 'none';
    breatheCircle.style.transform = 'scale(0.6)';
    breatheOverlay.classList.add('active');
    breatheCircle.offsetHeight;
    breatheCircle.style.transition = 'transform 4s ease-in-out';
    startBreathingCycle();
}

breatheDone.addEventListener('click', () => {
    breatheOverlay.classList.remove('active');
    if (breatheTimer) clearTimeout(breatheTimer);
    breatheCircle.style.transition = 'none';
    breatheCircle.style.transform = 'scale(0.6)';
});

function startBreathingCycle() {
    let elapsed = 0;
    const cycleDuration = 12000;
    const totalDuration = 60000;

    function cycle() {
        if (elapsed >= totalDuration) {
            breatheText.textContent = 'Well done';
            breathePrompt.textContent = 'You did great. Close when ready.';
            return;
        }

        breatheText.textContent = 'Breathe in...';
        breathePrompt.textContent = currentLanguage === 'ar' ? 'استنشق ببطء من أنفك' : 'Inhale slowly through your nose';
        breatheCircle.style.transform = 'scale(1)';

        breatheTimer = setTimeout(() => {
            breatheText.textContent = 'Hold...';
            breathePrompt.textContent = currentLanguage === 'ar' ? 'احبس النفس بلطف' : 'Hold gently';
            breatheTimer = setTimeout(() => {
                breatheText.textContent = 'Breathe out...';
                breathePrompt.textContent = currentLanguage === 'ar' ? 'أخرج الزفير ببطء' : 'Exhale slowly';
                breatheCircle.style.transform = 'scale(0.6)';
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
