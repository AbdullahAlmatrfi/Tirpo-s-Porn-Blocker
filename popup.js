console.log('Popup script loaded');

const SOCIAL_PRESETS = [
    { domain: 'youtube.com', label: 'youtube.com', emoji: 'YT', note: 'Video rabbit holes', noteAr: 'محتوى فيديو لا نهائي' },
    { domain: 'facebook.com', label: 'facebook.com', emoji: 'f', note: 'Social feed', noteAr: 'تدفق اجتماعي' },
    { domain: 'x.com', label: 'x.com', emoji: 'X', note: 'Fast-scroll feed', noteAr: 'تمرير سريع ومشتت' },
    { domain: 'instagram.com', label: 'instagram.com', emoji: 'IG', note: 'Social feed', noteAr: 'تدفق اجتماعي' },
    { domain: 'reddit.com', label: 'reddit.com', emoji: 'R', note: 'Communities and NSFW risk', noteAr: 'مجتمعات ومحتوى حساس' },
    { domain: 'tiktok.com', label: 'tiktok.com', emoji: 'TT', note: 'Short-form loops', noteAr: 'حلقات قصيرة متواصلة' },
    { domain: 'pinterest.com', label: 'pinterest.com', emoji: 'P', note: 'Image feed', noteAr: 'تصفح صور مستمر' },
    { domain: 'snapchat.com', label: 'snapchat.com', emoji: 'S', note: 'Messaging and stories', noteAr: 'رسائل وقصص' }
];

const GAMING_SITES = [
    'twitch.tv',
    'steam.com',
    'steamcommunity.com',
    'discord.com',
    'epicgames.com',
    'roblox.com',
    'minecraft.net',
    'leagueoflegends.com'
];

const DEFAULT_REDIRECT_SETTINGS = {
    redirectModeEnabled: false
};

const DEFAULT_OUTLETS = [
    { name: 'Quran', url: 'https://www.youtube.com/watch?v=bP3AYLevqnI' }
];
const CLUMSY_BIRD_REPO_URL = 'https://github.com/ellisonleao/clumsy-bird';
const CLUMSY_BIRD_LIVE_URL = 'https://ellisonleao.github.io/clumsy-bird/';
const CLUMSY_BIRD_LOCAL_URL = chrome.runtime.getURL('vendor/clumsy-bird/index.html');
const FRIENDLY_GAME_NAME = 'Focus Bird Game';
const FIXED_QURAN_OUTLET = { ...DEFAULT_OUTLETS[0] };
const FIXED_GAME_OUTLET = { name: FRIENDLY_GAME_NAME, url: CLUMSY_BIRD_LOCAL_URL };
const FIXED_OUTLETS = [FIXED_QURAN_OUTLET, FIXED_GAME_OUTLET];
const MAX_WHOLESOME_OUTLETS = 3;
const MAX_CUSTOM_OUTLETS = 1;
const LEGACY_OUTLET_NAMES = new Set(['learn something', 'quick workout', 'meditate']);

const BLOCKED_QUERY_WORDS = [
    'porn', 'xxx', 'sex', 'nsfw', 'nude', 'hentai', 'boobs', 'anal', 'blowjob', 'escort', 'fetish'
];

const TRANSLATIONS = {
    en: {
        lang: 'AR',
        title: "Tirpo's Porn Blocker",
        subtitle: 'Strict blocking with optional safe redirects.',
        nav: ['Home', 'Block', 'Redirect', 'Insights'],
        eyebrow: 'Modern protection',
        summaryLabels: ['Mode', 'Protected sites', 'Today'],
        overviewKicker: 'Overview',
        overviewTitle: 'Protection at a glance',
        overviewNote: 'Turn on the essentials here, then fine-tune strict blocking and safe redirects in their own pages.',
        liveStatusKicker: 'Live status',
        anchorKicker: 'Anchor',
        anchorTitle: 'Why I quit',
        strictKicker: 'Strict blocking',
        strictTitle: 'Block entire websites',
        strictNote: 'This is your BlockSite-style control page for domain blocking, category blocking, and list management.',
        addSiteKicker: 'Add a site',
        addSiteTitle: 'Manual block list',
        blockSiteButton: 'Block site',
        presetsKicker: 'Quick presets',
        presetsTitle: 'Category blocking',
        adultTitle: 'Adult content',
        adultDesc: 'Large adult database plus keyword search protection for explicit searches and URLs.',
        gamingTitle: 'Gaming',
        gamingDesc: 'Blocks common gaming and community sites during work or recovery.',
        socialKicker: 'Social presets',
        socialTitle: 'Customize social blocking',
        socialMaster: 'Master',
        dbKicker: 'Protected database',
        dbTitle: 'Blocked websites',
        dbNote: 'Manual blocks stay editable. Database results only unlock on exact full-domain matches, and explicit search terms are not allowed here.',
        redirectKicker: 'Safe redirection',
        redirectTitle: 'Redirect risky clicks',
        redirectNote: 'This is your PorNo-style layer. When enabled, blocked matches can be rerouted to a safer place.',
        redirectEngineKicker: 'Redirect engine',
        redirectEngineTitle: 'How blocked matches should resolve',
        redirectToggleTitle: 'Enable redirect mode',
        redirectToggleDesc: 'When off, blocked items go to the normal blocked page.',
        destinationLabel: 'Destination',
        destinations: ["Tirpo's focus page", 'Google Safe Search', 'Custom safe URL'],
        customUrlLabel: 'Custom safe URL',
        outletsKicker: 'Wholesome outlets',
        outletsTitle: 'Safe places to send yourself',
        nameLabel: 'Name',
        urlLabel: 'URL',
        addOutletButton: 'Add outlet',
        momentumKicker: 'Momentum',
        momentumTitle: 'Insights and focus',
        momentumNote: 'Track your saved time, your streak, and keep a lightweight focus timer inside the popup.',
        statsKickers: ['Total', 'Today', 'Saved', 'Streak', 'Best streak'],
        statsNotes: ['All-time blocked attempts', 'Blocked today', 'Estimated focus preserved', 'Current streak days', 'Your best run so far'],
        focusTimerKicker: 'Focus timer',
        focusTimerTitle: 'Stay deliberate',
        focusLabel: 'Focus',
        breakLabel: 'Break',
        startFocus: 'Start focus',
        reset: 'Reset',
        whyPlaceholder: 'Write the reason you want to protect your attention and peace.',
        sitePlaceholder: 'example.com',
        searchPlaceholder: 'Type a full domain like x.com',
        outletNamePlaceholder: 'Quran',
        outletUrlPlaceholder: 'https://example.com'
    },
    ar: {
        lang: 'EN',
        title: 'تيربوس كورن بلوكر',
        subtitle: 'حظر صارم مع تحويل آمن اختياري.',
        nav: ['الرئيسية', 'الحظر', 'التحويل', 'الإحصاءات'],
        eyebrow: 'حماية عصرية',
        summaryLabels: ['الوضع', 'المواقع المحمية', 'اليوم'],
        overviewKicker: 'نظرة عامة',
        overviewTitle: 'الحماية بنظرة سريعة',
        overviewNote: 'فعّل الأساسيات هنا، ثم خصص الحظر الصارم والتحويل الآمن من صفحاتهما الخاصة.',
        liveStatusKicker: 'الحالة الحالية',
        anchorKicker: 'مرساة',
        anchorTitle: 'لماذا أقلعت',
        strictKicker: 'حظر صارم',
        strictTitle: 'احظر المواقع بالكامل',
        strictNote: 'هذه هي صفحة التحكم على طريقة BlockSite لحظر النطاقات والفئات وإدارة القوائم.',
        addSiteKicker: 'أضف موقعاً',
        addSiteTitle: 'قائمة الحظر اليدوي',
        blockSiteButton: 'احظر الموقع',
        presetsKicker: 'إعدادات سريعة',
        presetsTitle: 'حظر الفئات',
        adultTitle: 'محتوى إباحي',
        adultDesc: 'قاعدة كبيرة للمواقع الإباحية مع حماية كلمات البحث والروابط الصريحة.',
        gamingTitle: 'الألعاب',
        gamingDesc: 'يحظر مواقع الألعاب والمجتمعات أثناء العمل أو التعافي.',
        socialKicker: 'إعدادات اجتماعية',
        socialTitle: 'خصص حظر الشبكات الاجتماعية',
        socialMaster: 'الرئيسي',
        dbKicker: 'قاعدة محمية',
        dbTitle: 'المواقع المحظورة',
        dbNote: 'تظل المواقع اليدوية قابلة للتعديل. نتائج القاعدة لا تظهر إلا عند كتابة النطاق الكامل، ولا يُسمح بعبارات البحث الصريحة هنا.',
        redirectKicker: 'تحويل آمن',
        redirectTitle: 'حوّل النقرات الخطرة',
        redirectNote: 'هذه هي طبقة PorNo. عند تفعيلها يمكن تحويل النتائج المحظورة إلى مكان أكثر أماناً.',
        redirectEngineKicker: 'محرك التحويل',
        redirectEngineTitle: 'كيف يجب أن تُعالج النتائج المحظورة',
        redirectToggleTitle: 'تفعيل وضع التحويل',
        redirectToggleDesc: 'عند الإيقاف تذهب العناصر المحظورة إلى صفحة الحظر العادية.',
        destinationLabel: 'الوجهة',
        destinations: ['صفحة تركيز تيربوس', 'بحث Google الآمن', 'رابط آمن مخصص'],
        customUrlLabel: 'رابط آمن مخصص',
        outletsKicker: 'مخارج نافعة',
        outletsTitle: 'أماكن آمنة ترسل نفسك إليها',
        nameLabel: 'الاسم',
        urlLabel: 'الرابط',
        addOutletButton: 'أضف مخرجاً',
        momentumKicker: 'الزخم',
        momentumTitle: 'الإحصاءات والتركيز',
        momentumNote: 'تابع الوقت الذي وفرته وسلسلتك واحتفظ بمؤقت تركيز خفيف داخل النافذة.',
        statsKickers: ['الإجمالي', 'اليوم', 'المحفوظ', 'السلسلة', 'أفضل سلسلة'],
        statsNotes: ['كل محاولات الحظر', 'المحظور اليوم', 'وقت تركيز محفوظ تقديرياً', 'أيام السلسلة الحالية', 'أفضل سلسلة لديك حتى الآن'],
        focusTimerKicker: 'مؤقت التركيز',
        focusTimerTitle: 'ابق متعمداً',
        focusLabel: 'التركيز',
        breakLabel: 'الاستراحة',
        startFocus: 'ابدأ التركيز',
        reset: 'إعادة ضبط',
        whyPlaceholder: 'اكتب السبب الذي يجعلك تريد حماية انتباهك وطمأنينتك.',
        sitePlaceholder: 'example.com',
        searchPlaceholder: 'اكتب النطاق الكامل مثل x.com',
        outletNamePlaceholder: 'القرآن',
        outletUrlPlaceholder: 'https://example.com'
    }
};

const BRANDING = {
    en: {
        name: "Tirpo's Porn Blocker",
        subtitle: 'Strict blocking with optional safe redirects.'
    },
    ar: {
        name: 'مانع المواقع الإباحية الخاص بتيربو',
        subtitle: 'حظر صارم مع تحويل آمن اختياري.'
    }
};

const RUNTIME_TEXT = {
    en: {
        homeAdultTitle: 'Adult shield',
        homeAdultDesc: 'Blocks adult domains and keyword-based searches.',
        homeSafeSearchTitle: 'Safe Search',
        homeSafeSearchDesc: 'Forces safer results on Google, Bing, DuckDuckGo, Yahoo, and YouTube.',
        homeRedirectTitle: 'Redirect mode',
        homeRedirectDesc: 'Sends blocked matches to a safer destination instead of only showing the block page.',
        statusActive: 'Protection is active',
        statusStandby: 'Protection is standing by',
        statusCopyRedirect: "Redirect mode is on and sends blocked matches to Tirpo's focus page.",
        statusCopyBlocked: 'Blocked matches currently land on the standard block page.',
        heroModeAdult: 'adult shield',
        heroModeSafeSearch: 'safe search',
        heroModeRedirect: 'redirect mode',
        heroModeBlockingOnly: 'Blocking only',
        heroModeActiveCount: '{count} modes active',
        heroTodayBlocksSuffix: 'blocks',
        streakDayShort: 'd',
        streakBadgeLabel: 'Fire',
        minuteShort: 'm',
        minuteLabel: 'min',
        hourShort: 'h',
        dayShort: 'd',
        redirectPreviewOn: "Redirect mode is active. Destination: Tirpo's focus page.",
        redirectPreviewOff: "Redirect mode is off. Matches will use Tirpo's block page by default.",
        outletNameRequired: 'Give the outlet a short name first.',
        outletFixedError: `Quran and ${FRIENDLY_GAME_NAME} are fixed defaults and cannot be edited.`,
        outletInvalidUrl: 'Add a valid URL first.',
        outletLimitError: `You can keep up to ${MAX_WHOLESOME_OUTLETS} outlets total (Quran + ${FRIENDLY_GAME_NAME} + ${MAX_CUSTOM_OUTLETS} custom).`,
        outletDuplicate: 'This outlet already exists.',
        outletAdded: '{name} added as a wholesome outlet.',
        saving: 'Saving...',
        saved: 'Saved',
        timerResume: 'Resume',
        timerPause: 'Pause',
        timerPauseBreak: 'Pause break',
        timerStartBreak: 'Start break',
        timerStartFocus: 'Start focus',
        notifyFocusTitle: 'Focus session complete',
        notifyFocusBody: 'Time for a break.',
        notifyBreakTitle: 'Break complete',
        notifyBreakBody: 'Ready for another focused session?',
        addSiteInvalid: 'Please enter a valid domain like example.com.',
        addSiteCommError: 'Failed to communicate with the extension.',
        addSiteCouldNotBlock: 'Could not block that site.',
        addSiteBlocked: '{site} is now blocked.',
        blockedSummary: 'Blocking {count} sites',
        hiddenSite: 'hidden-site.example',
        buttonUnblock: 'Unblock',
        noSitesBlocked: 'No sites are blocked yet.',
        explicitNotAllowed: 'Not allowed to manage using explicit terms.',
        dbLookupLocked: 'Database lookup locked for this query.',
        exactDomainFound: 'Exact full-domain match found.',
        typeExactDomain: 'Type the full exact domain to reveal a protected site.',
        presetReadyToAdd: 'Ready to add to your social preset list',
        presetAdd: 'Add',
        presetRemove: 'Remove',
        outletDefaultTag: 'Default',
        outletRemove: 'Remove',
        fixedOutletQuran: 'Quran',
        fixedOutletGame: 'Focus Bird Game',
        localFocusGame: 'Local focus game',
        localExtensionPage: 'Local extension page',
        adultDomainsReady: '{count} adult domains ready',
        removedFromBlockList: '{site} was removed from the block list.',
        dialogHoldTitle: 'Hold that decision',
        dialogWaitCopy: 'Wait 30 seconds before unblocking. This pause is here on purpose.',
        dialogUnblock: 'Unblock',
        dialogCancel: 'Cancel'
    },
    ar: {
        homeAdultTitle: 'درع المحتوى الإباحي',
        homeAdultDesc: 'يحظر نطاقات المحتوى الإباحي وعمليات البحث بالكلمات الصريحة.',
        homeSafeSearchTitle: 'البحث الآمن',
        homeSafeSearchDesc: 'يفرض نتائج أكثر أمانًا على جوجل وبينغ ودك دك جو وياهو ويوتيوب.',
        homeRedirectTitle: 'وضع التحويل',
        homeRedirectDesc: 'يحوّل النتائج المحظورة إلى وجهة آمنة بدلًا من عرض صفحة الحظر فقط.',
        statusActive: 'الحماية مفعلة',
        statusStandby: 'الحماية في وضع الاستعداد',
        statusCopyRedirect: 'وضع التحويل مفعّل ويعيد توجيه النتائج المحظورة إلى صفحة تركيز تيربوس.',
        statusCopyBlocked: 'النتائج المحظورة تذهب حاليًا إلى صفحة الحظر القياسية.',
        heroModeAdult: 'درع المحتوى الإباحي',
        heroModeSafeSearch: 'البحث الآمن',
        heroModeRedirect: 'وضع التحويل',
        heroModeBlockingOnly: 'حظر فقط',
        heroModeActiveCount: '{count} أوضاع مفعّلة',
        heroTodayBlocksSuffix: 'محاولات',
        streakDayShort: 'ي',
        streakBadgeLabel: 'سلسلة',
        minuteShort: 'د',
        minuteLabel: 'د',
        hourShort: 'س',
        dayShort: 'ي',
        redirectPreviewOn: 'وضع التحويل مفعّل. الوجهة: صفحة تركيز تيربوس.',
        redirectPreviewOff: 'وضع التحويل متوقف. سيتم استخدام صفحة تيربوس الافتراضية.',
        outletNameRequired: 'اكتب اسمًا مختصرًا للمخرج أولاً.',
        outletFixedError: 'القرآن ولعبة الطائر خياران افتراضيان ثابتان ولا يمكن تعديلهما.',
        outletInvalidUrl: 'أدخل رابطًا صحيحًا أولاً.',
        outletLimitError: `يمكنك الاحتفاظ بحد أقصى ${MAX_WHOLESOME_OUTLETS} مخارج (القرآن + لعبة الطائر + ${MAX_CUSTOM_OUTLETS} مخصص).`,
        outletDuplicate: 'هذا المخرج موجود بالفعل.',
        outletAdded: 'تمت إضافة {name} كمخرج نافع.',
        saving: 'جارٍ الحفظ...',
        saved: 'تم الحفظ',
        timerResume: 'متابعة',
        timerPause: 'إيقاف مؤقت',
        timerPauseBreak: 'إيقاف الاستراحة',
        timerStartBreak: 'ابدأ الاستراحة',
        timerStartFocus: 'ابدأ التركيز',
        notifyFocusTitle: 'اكتملت جلسة التركيز',
        notifyFocusBody: 'حان وقت الاستراحة.',
        notifyBreakTitle: 'انتهت الاستراحة',
        notifyBreakBody: 'جاهز لجلسة تركيز جديدة؟',
        addSiteInvalid: 'أدخل نطاقًا صحيحًا مثل example.com.',
        addSiteCommError: 'تعذر التواصل مع الإضافة.',
        addSiteCouldNotBlock: 'تعذر حظر هذا الموقع.',
        addSiteBlocked: 'تم حظر {site}.',
        blockedSummary: 'يتم حظر {count} موقع',
        hiddenSite: 'موقع-مخفي.example',
        buttonUnblock: 'إلغاء الحظر',
        noSitesBlocked: 'لا توجد مواقع محظورة بعد.',
        explicitNotAllowed: 'لا يُسمح بالإدارة باستخدام كلمات صريحة.',
        dbLookupLocked: 'تم قفل البحث في القاعدة لهذا الاستعلام.',
        exactDomainFound: 'تم العثور على تطابق مطابق للنطاق الكامل.',
        typeExactDomain: 'اكتب النطاق الكامل بدقة لإظهار الموقع المحمي.',
        presetReadyToAdd: 'جاهز للإضافة إلى قائمة الشبكات الاجتماعية',
        presetAdd: 'إضافة',
        presetRemove: 'إزالة',
        outletDefaultTag: 'افتراضي',
        outletRemove: 'إزالة',
        fixedOutletQuran: 'القرآن',
        fixedOutletGame: 'لعبة الطائر',
        localFocusGame: 'لعبة تركيز محلية',
        localExtensionPage: 'صفحة محلية داخل الإضافة',
        adultDomainsReady: '{count} نطاق إباحي جاهز',
        removedFromBlockList: 'تمت إزالة {site} من قائمة الحظر.',
        dialogHoldTitle: 'تمهل قبل القرار',
        dialogWaitCopy: 'انتظر 30 ثانية قبل إلغاء الحظر. هذه المهلة مقصودة.',
        dialogUnblock: 'إلغاء الحظر',
        dialogCancel: 'إلغاء'
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    chrome.runtime.connect({ name: 'popup' });

    const elements = {
        navButtons: [...document.querySelectorAll('.page-nav__button')],
        pages: [...document.querySelectorAll('.page')],
        heroMode: document.getElementById('hero-mode'),
        heroSiteCount: document.getElementById('hero-site-count'),
        heroTodayCount: document.getElementById('hero-today-count'),
        statusHeadline: document.getElementById('status-headline'),
        statusCopy: document.getElementById('status-copy'),
        statusDot: document.getElementById('status-dot'),
        streakBadge: document.getElementById('streak-badge'),
        streakBadgeCount: document.getElementById('streak-badge-count'),
        adultToggleHome: document.getElementById('adult-content-toggle'),
        adultToggleBlock: document.getElementById('adult-content-toggle-block'),
        socialToggle: document.getElementById('social-media-toggle'),
        gamingToggle: document.getElementById('gaming-toggle'),
        safeSearchToggle: document.getElementById('safe-search-toggle'),
        redirectToggleHome: document.getElementById('redirect-mode-toggle-home'),
        redirectToggle: document.getElementById('redirect-mode-toggle'),
        redirectSettings: document.getElementById('redirect-settings'),
        redirectPreview: document.getElementById('redirect-preview'),
        adultDbCount: document.getElementById('adult-db-count'),
        siteInput: document.getElementById('site-input'),
        addSiteButton: document.getElementById('add-site'),
        feedback: document.getElementById('form-feedback'),
        siteCount: document.getElementById('site-count'),
        searchInput: document.getElementById('search-blocked-sites'),
        searchFeedback: document.getElementById('search-feedback'),
        blockedList: document.getElementById('blocked-list'),
        socialPresets: document.getElementById('social-presets'),
        whyTextarea: document.getElementById('why-i-quit'),
        whySaveIndicator: document.getElementById('why-save-indicator'),
        totalBlocks: document.getElementById('total-blocks'),
        todayBlocks: document.getElementById('today-blocks'),
        timeSaved: document.getElementById('time-saved'),
        streakDays: document.getElementById('streak-days'),
        bestStreak: document.getElementById('best-streak'),
        focusTimer: document.getElementById('focus-timer'),
        timerForeground: document.querySelector('.timer-foreground'),
        startFocus: document.getElementById('start-focus'),
        resetFocus: document.getElementById('reset-focus'),
        focusDuration: document.getElementById('focus-duration'),
        breakDuration: document.getElementById('break-duration'),
        outletName: document.getElementById('outlet-name'),
        outletUrl: document.getElementById('outlet-url'),
        addOutlet: document.getElementById('add-outlet'),
        outletFeedback: document.getElementById('outlet-feedback'),
        outletsList: document.getElementById('outlets-list'),
        popupLangToggle: document.getElementById('popup-lang-toggle')
    };

    const state = {
        allBlockedSites: [],
        manualSites: [],
        systemBlockedSites: [],
        selectedSocialSites: [],
        wholesomeOutlets: [],
        language: 'en'
    };

    let whySaveTimeout = null;
    let timer = null;
    let timeLeft = 0;
    let totalSeconds = 0;
    let isRunning = false;
    let isBreak = false;

    function getRuntimeText() {
        return RUNTIME_TEXT[state.language] || RUNTIME_TEXT.en;
    }

    function getBranding() {
        return BRANDING[state.language] || BRANDING.en;
    }

    function localizeTemplate(template, values) {
        return Object.entries(values).reduce((acc, [key, value]) => {
            return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }, template);
    }

    initializeNavigation();
    initializeWhyIQuit();
    initializeFocusTimer();
    bindGeneralHandlers();
    bindRedirectHandlers();
    bindOutletHandlers();
    bindLanguageHandlers();
    await hydrateUi();

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;

        if (
            changes.blockedSites ||
            changes.manuallyAddedSites ||
            changes.blockStats ||
            changes.streakDays ||
            changes.bestStreak ||
            changes.adultContentBlocked ||
            changes.socialMediaBlocked ||
            changes.gamingBlocked ||
            changes.safeSearchEnabled ||
            changes.redirectModeEnabled ||
            changes.adultSitesCache ||
            changes.selectedSocialSites ||
            changes.wholesomeOutlets
        ) {
            hydrateUi();
        }

        if (changes.whyIQuit) {
            elements.whyTextarea.value = changes.whyIQuit.newValue || '';
        }
    });

    async function hydrateUi() {
        const storage = await chrome.storage.local.get([
            'blockedSites',
            'manuallyAddedSites',
            'unblockedSites',
            'selectedSocialSites',
            'adultContentBlocked',
            'socialMediaBlocked',
            'gamingBlocked',
            'safeSearchEnabled',
            'blockStats',
            'streakDays',
            'bestStreak',
            'whyIQuit',
            'adultSitesCache',
            'wholesomeOutlets',
            'popupLanguage',
            ...Object.keys(DEFAULT_REDIRECT_SETTINGS)
        ]);

        const redirectSettings = getRedirectSettings(storage);
        const unblockedSet = new Set((storage.unblockedSites || []).map(normalizeDomain));
        const blockedSites = (storage.blockedSites || [])
            .map(normalizeDomain)
            .filter((site) => !unblockedSet.has(site))
            .slice()
            .sort((a, b) => a.localeCompare(b));
        const manualSites = (storage.manuallyAddedSites || []).slice().sort((a, b) => a.localeCompare(b));
        const manualSet = new Set(manualSites);

        state.allBlockedSites = blockedSites;
        state.manualSites = manualSites;
        state.systemBlockedSites = blockedSites.filter((site) => !manualSet.has(site));
        state.selectedSocialSites = storage.selectedSocialSites || SOCIAL_PRESETS.map((site) => site.domain);
        const sanitizedOutlets = normalizeOutlets(storage.wholesomeOutlets);
        state.wholesomeOutlets = sanitizedOutlets;
        state.language = storage.popupLanguage || 'en';

        if (!areOutletsEqual(storage.wholesomeOutlets, sanitizedOutlets)) {
            await chrome.storage.local.set({ wholesomeOutlets: sanitizedOutlets });
        }

        syncCheckboxPair(elements.adultToggleHome, elements.adultToggleBlock, !!storage.adultContentBlocked);
        elements.socialToggle.checked = !!storage.socialMediaBlocked;
        elements.gamingToggle.checked = !!storage.gamingBlocked;
        elements.safeSearchToggle.checked = !!storage.safeSearchEnabled;
        elements.redirectToggle.checked = redirectSettings.redirectModeEnabled;
        elements.redirectToggleHome.checked = redirectSettings.redirectModeEnabled;
        elements.redirectSettings.hidden = !redirectSettings.redirectModeEnabled;
        elements.whyTextarea.value = storage.whyIQuit || elements.whyTextarea.value;

        updateAdultDatabaseBadge(storage.adultSitesCache);
        renderProtectedSearch();
        renderSocialPresets();
        renderOutlets();
        renderStats(storage);
        renderHero(storage, redirectSettings);
        renderRedirectPreview(redirectSettings);
        applyLanguage();
    }

    function initializeNavigation() {
        elements.navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetPage = button.dataset.page;
                elements.navButtons.forEach((navButton) => navButton.classList.toggle('is-active', navButton === button));
                elements.pages.forEach((page) => page.classList.toggle('is-active', page.dataset.page === targetPage));
            });
        });
    }

    function bindGeneralHandlers() {
        elements.addSiteButton.addEventListener('click', addSite);
        elements.siteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addSite();
            }
        });

        elements.searchInput.addEventListener('input', renderProtectedSearch);
        elements.adultToggleHome.addEventListener('change', () => handleCategoryToggle('adult', elements.adultToggleHome.checked));
        elements.adultToggleBlock.addEventListener('change', () => handleCategoryToggle('adult', elements.adultToggleBlock.checked));
        elements.socialToggle.addEventListener('change', () => handleCategoryToggle('social', elements.socialToggle.checked));
        elements.gamingToggle.addEventListener('change', () => handleCategoryToggle('gaming', elements.gamingToggle.checked));
        elements.safeSearchToggle.addEventListener('change', () => {
            chrome.runtime.sendMessage({ type: 'TOGGLE_SAFE_SEARCH', enabled: elements.safeSearchToggle.checked });
        });
    }

    function bindRedirectHandlers() {
        const onRedirectToggle = async (enabled) => {
            elements.redirectToggle.checked = enabled;
            elements.redirectToggleHome.checked = enabled;
            elements.redirectSettings.hidden = !enabled;
            await saveRedirectSettings({ redirectModeEnabled: enabled });
            renderRedirectPreview(getRedirectSettings(await chrome.storage.local.get(Object.keys(DEFAULT_REDIRECT_SETTINGS))));
        };

        elements.redirectToggle.addEventListener('change', () => onRedirectToggle(elements.redirectToggle.checked));
        elements.redirectToggleHome.addEventListener('change', () => onRedirectToggle(elements.redirectToggleHome.checked));
    }

    function bindOutletHandlers() {
        elements.addOutlet.addEventListener('click', async () => {
            const rt = getRuntimeText();
            const name = (elements.outletName.value || '').trim();
            const rawUrl = (elements.outletUrl.value || '').trim();
            if (!name) {
                setFeedback(elements.outletFeedback, rt.outletNameRequired, 'error');
                return;
            }

            if (isFixedOutlet({ name, url: '' })) {
                setFeedback(elements.outletFeedback, rt.outletFixedError, 'error');
                return;
            }

            const url = normalizeUrl(rawUrl);
            if (!rawUrl || !url) {
                setFeedback(elements.outletFeedback, rt.outletInvalidUrl, 'error');
                return;
            }

            if (state.wholesomeOutlets.length >= MAX_WHOLESOME_OUTLETS) {
                setFeedback(elements.outletFeedback, rt.outletLimitError, 'error');
                return;
            }

            const duplicate = state.wholesomeOutlets.some((outlet) => outlet.url === url || outlet.name.toLowerCase() === name.toLowerCase());
            if (duplicate) {
                setFeedback(elements.outletFeedback, rt.outletDuplicate, 'error');
                return;
            }

            const wholesomeOutlets = normalizeOutlets([...state.wholesomeOutlets, { name, url }]);
            await chrome.storage.local.set({ wholesomeOutlets });
            elements.outletName.value = '';
            elements.outletUrl.value = '';
            setFeedback(elements.outletFeedback, localizeTemplate(rt.outletAdded, { name }), 'success');
        });
    }

    function bindLanguageHandlers() {
        elements.popupLangToggle.addEventListener('click', async () => {
            state.language = state.language === 'en' ? 'ar' : 'en';
            await chrome.storage.local.set({ popupLanguage: state.language });
            await hydrateUi();
        });
    }

    function initializeWhyIQuit() {
        elements.whyTextarea.addEventListener('input', () => {
            const rt = getRuntimeText();
            clearTimeout(whySaveTimeout);
            elements.whySaveIndicator.textContent = rt.saving;
            whySaveTimeout = setTimeout(() => {
                chrome.storage.local.set({ whyIQuit: elements.whyTextarea.value.trim() }, () => {
                    elements.whySaveIndicator.textContent = rt.saved;
                    setTimeout(() => {
                        if (elements.whySaveIndicator.textContent === rt.saved) {
                            elements.whySaveIndicator.textContent = '';
                        }
                    }, 1500);
                });
            }, 350);
        });
    }

    function initializeFocusTimer() {
        const circumference = 2 * Math.PI * 45;
        elements.timerForeground.style.strokeDasharray = String(circumference);

        elements.startFocus.addEventListener('click', () => {
            const rt = getRuntimeText();
            if (isRunning) {
                clearInterval(timer);
                isRunning = false;
                elements.startFocus.textContent = rt.timerResume;
                return;
            }

            if (!timeLeft) {
                timeLeft = parseInt(elements.focusDuration.value, 10) * 60;
                totalSeconds = timeLeft;
            }

            isRunning = true;
            elements.startFocus.textContent = isBreak ? rt.timerPauseBreak : rt.timerPause;

            timer = setInterval(() => {
                timeLeft -= 1;
                updateTimerDisplay();
                if (timeLeft > 0) return;

                clearInterval(timer);
                isRunning = false;
                if (!isBreak) {
                    isBreak = true;
                    timeLeft = parseInt(elements.breakDuration.value, 10) * 60;
                    totalSeconds = timeLeft;
                    elements.startFocus.textContent = rt.timerStartBreak;
                    showNotification(rt.notifyFocusTitle, rt.notifyFocusBody);
                } else {
                    isBreak = false;
                    timeLeft = parseInt(elements.focusDuration.value, 10) * 60;
                    totalSeconds = timeLeft;
                    elements.startFocus.textContent = rt.timerStartFocus;
                    showNotification(rt.notifyBreakTitle, rt.notifyBreakBody);
                }
                updateTimerDisplay();
            }, 1000);
        });

        elements.resetFocus.addEventListener('click', resetTimer);
        elements.focusDuration.addEventListener('change', () => {
            if (!isRunning && !isBreak) resetTimer();
        });

        function resetTimer() {
            const rt = getRuntimeText();
            clearInterval(timer);
            isRunning = false;
            isBreak = false;
            timeLeft = parseInt(elements.focusDuration.value, 10) * 60;
            totalSeconds = timeLeft;
            elements.startFocus.textContent = rt.timerStartFocus;
            updateTimerDisplay();
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            elements.focusTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            const progress = totalSeconds ? 1 - (timeLeft / totalSeconds) : 0;
            elements.timerForeground.style.strokeDashoffset = String((2 * Math.PI * 45) * progress);
        }

        resetTimer();
    }

    async function handleCategoryToggle(category, enabled) {
        const storage = await chrome.storage.local.get(['blockedSites', 'selectedSocialSites']);
        const currentSites = new Set(storage.blockedSites || []);

        if (!enabled) {
            forceToggleState(category, true);
            showUnblockConfirmation(async () => {
                getCategorySites(category, storage).forEach((site) => currentSites.delete(site));
                await chrome.storage.local.set({
                    blockedSites: [...currentSites],
                    ...(category === 'adult' ? { adultContentBlocked: false } : {}),
                    ...(category === 'social' ? { socialMediaBlocked: false } : {}),
                    ...(category === 'gaming' ? { gamingBlocked: false } : {})
                });
                forceToggleState(category, false);
            }, () => forceToggleState(category, true));
            return;
        }

        getCategorySites(category, storage).forEach((site) => currentSites.add(site));
        await chrome.storage.local.set({
            blockedSites: [...currentSites],
            ...(category === 'adult' ? { adultContentBlocked: true } : {}),
            ...(category === 'social' ? { socialMediaBlocked: true } : {}),
            ...(category === 'gaming' ? { gamingBlocked: true } : {})
        });
        forceToggleState(category, true);
    }

    async function toggleSocialPreset(domain) {
        const storage = await chrome.storage.local.get(['blockedSites', 'selectedSocialSites', 'socialMediaBlocked']);
        const blockedSites = new Set(storage.blockedSites || []);
        const selectedSocialSites = new Set(storage.selectedSocialSites || SOCIAL_PRESETS.map((site) => site.domain));
        const wasSelected = selectedSocialSites.has(domain);

        if (wasSelected) {
            selectedSocialSites.delete(domain);
            blockedSites.delete(domain);
        } else {
            selectedSocialSites.add(domain);
            blockedSites.add(domain);
        }

        await chrome.storage.local.set({
            selectedSocialSites: [...selectedSocialSites],
            blockedSites: [...blockedSites],
            socialMediaBlocked: !wasSelected || (storage.socialMediaBlocked && selectedSocialSites.size > 0)
        });
    }

    async function addSite() {
        const rt = getRuntimeText();
        const site = normalizeDomain(elements.siteInput.value);
        if (!isValidDomain(site)) {
            setFeedback(elements.feedback, rt.addSiteInvalid, 'error');
            return;
        }

        chrome.runtime.sendMessage({ type: 'ADD_MANUAL_SITE', site }, (response) => {
            if (chrome.runtime.lastError) {
                setFeedback(elements.feedback, rt.addSiteCommError, 'error');
                return;
            }
            if (!response?.success) {
                setFeedback(elements.feedback, response?.reason || rt.addSiteCouldNotBlock, 'error');
                return;
            }
            elements.siteInput.value = '';
            setFeedback(elements.feedback, localizeTemplate(rt.addSiteBlocked, { site }), 'success');
        });
    }

    function renderProtectedSearch() {
        const rt = getRuntimeText();
        elements.blockedList.innerHTML = '';
        elements.siteCount.textContent = String(state.allBlockedSites.length);

        const query = normalizeDomain(elements.searchInput.value);
        const hasExplicitTerm = BLOCKED_QUERY_WORDS.some((word) => query.includes(word));

        const summary = document.createElement('div');
        summary.className = 'blocked-summary';
        summary.textContent = localizeTemplate(rt.blockedSummary, {
            count: state.allBlockedSites.length.toLocaleString(state.language === 'ar' ? 'ar' : 'en-US')
        });
        elements.blockedList.appendChild(summary);
        elements.searchFeedback.textContent = '';
        elements.searchFeedback.className = 'inline-feedback';

        if (!query) {
            if (state.manualSites.length > 0) {
                state.manualSites.slice(0, 6).forEach((site) => elements.blockedList.appendChild(createBlockedItem(site)));
            }

            if (state.systemBlockedSites.length > 0) {
                for (let index = 0; index < Math.min(3, state.systemBlockedSites.length); index += 1) {
                    const blurred = document.createElement('div');
                    blurred.className = 'blocked-blurred';
                    blurred.innerHTML = `<strong>${rt.hiddenSite}</strong><button type="button">${rt.buttonUnblock}</button>`;
                    elements.blockedList.appendChild(blurred);
                }
            }

            if (state.manualSites.length === 0 && state.systemBlockedSites.length === 0) {
                appendEmptyState(rt.noSitesBlocked);
            }
            return;
        }

        if (hasExplicitTerm) {
            setFeedback(elements.searchFeedback, rt.explicitNotAllowed, 'error');
            appendEmptyState(rt.dbLookupLocked);
            return;
        }

        const exactMatch = state.allBlockedSites.find((site) => site === query);
        if (exactMatch) {
            elements.blockedList.appendChild(createBlockedItem(exactMatch));
            setFeedback(elements.searchFeedback, rt.exactDomainFound, 'success');
            return;
        }

        setFeedback(elements.searchFeedback, rt.typeExactDomain, 'error');
        for (let index = 0; index < 2; index += 1) {
            const blurred = document.createElement('div');
            blurred.className = 'blocked-blurred';
            blurred.innerHTML = `<strong>${rt.hiddenSite}</strong><button type="button">${rt.buttonUnblock}</button>`;
            elements.blockedList.appendChild(blurred);
        }
    }

    function renderSocialPresets() {
        const rt = getRuntimeText();
        elements.socialPresets.innerHTML = '';
        const selectedSet = new Set(state.selectedSocialSites);
        const blockedSet = new Set(state.allBlockedSites);

        SOCIAL_PRESETS.forEach((preset) => {
            const item = document.createElement('div');
            const isSelected = selectedSet.has(preset.domain);
            const isBlocked = blockedSet.has(preset.domain);

            item.className = 'preset-item';
            item.innerHTML = `
                <div class="preset-logo">${preset.emoji}</div>
                <div class="preset-meta">
                    <strong>${preset.label}</strong>
                    <small>${isSelected ? (state.language === 'ar' ? preset.noteAr : preset.note) : rt.presetReadyToAdd}</small>
                </div>
                <button class="preset-action ${isBlocked ? 'remove' : 'add'}" type="button">${isBlocked ? rt.presetRemove : rt.presetAdd}</button>
            `;

            item.querySelector('button').addEventListener('click', () => toggleSocialPreset(preset.domain));
            elements.socialPresets.appendChild(item);
        });
    }

    function renderOutlets() {
        const rt = getRuntimeText();
        elements.outletsList.innerHTML = '';
        state.wholesomeOutlets.forEach((outlet) => {
            const isFixed = isFixedOutlet(outlet);
            const displayName = normalizeUrl(outlet.url) === normalizeUrl(FIXED_QURAN_OUTLET.url)
                ? rt.fixedOutletQuran
                : (normalizeUrl(outlet.url) === normalizeUrl(FIXED_GAME_OUTLET.url) ? rt.fixedOutletGame : outlet.name);
            const item = document.createElement('div');
            item.className = 'outlet-item';
            item.innerHTML = `
                <div class="outlet-logo">${displayName.charAt(0).toUpperCase()}</div>
                <div class="outlet-meta">
                    <strong>${displayName}</strong>
                    <small title="${outlet.url}">${formatOutletUrlForDisplay(outlet.url)}</small>
                </div>
                ${isFixed ? `<span class="outlet-fixed-tag">${rt.outletDefaultTag}</span>` : `<button class="outlet-action remove" type="button">${rt.outletRemove}</button>`}
            `;

            if (!isFixed) {
                item.querySelector('button').addEventListener('click', async () => {
                    const nextOutlets = normalizeOutlets(state.wholesomeOutlets.filter((entry) => entry.url !== outlet.url));
                    await chrome.storage.local.set({ wholesomeOutlets: nextOutlets });
                });
            }
            elements.outletsList.appendChild(item);
        });
    }

    function formatOutletUrlForDisplay(rawUrl) {
        const rt = getRuntimeText();
        if (!rawUrl) return '';

        if (rawUrl === CLUMSY_BIRD_LOCAL_URL) {
            return rt.localFocusGame;
        }

        try {
            const parsed = new URL(rawUrl);
            if (parsed.protocol === 'chrome-extension:') {
                return rt.localExtensionPage;
            }

            const host = parsed.hostname.replace(/^www\./i, '');
            const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
            const compact = `${host}${path}`;
            return compact.length > 42 ? `${compact.slice(0, 41)}...` : compact;
        } catch (error) {
            return rawUrl.length > 42 ? `${rawUrl.slice(0, 41)}...` : rawUrl;
        }
    }

    function createBlockedItem(site) {
        const rt = getRuntimeText();
        const item = document.createElement('div');
        item.className = 'blocked-item';
        item.innerHTML = `
            <div><strong>${site}</strong></div>
            <button type="button">${rt.buttonUnblock}</button>
        `;
        item.querySelector('button').addEventListener('click', () => {
            showUnblockConfirmation(() => removeSite(site), () => {});
        });
        return item;
    }

    function appendEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'blocked-empty';
        empty.textContent = message;
        elements.blockedList.appendChild(empty);
    }

    function renderStats(storage) {
        const rt = getRuntimeText();
        const locale = state.language === 'ar' ? 'ar' : 'en-US';
        const stats = storage.blockStats || { totalBlocks: 0, todayBlocks: 0 };
        elements.totalBlocks.textContent = (stats.totalBlocks || 0).toLocaleString(locale);
        elements.todayBlocks.textContent = (stats.todayBlocks || 0).toLocaleString(locale);
        elements.timeSaved.textContent = formatTimeSaved((stats.totalBlocks || 0) * 5);
        elements.streakDays.textContent = Number(storage.streakDays || 0).toLocaleString(locale);
        elements.bestStreak.textContent = Number(storage.bestStreak || 0).toLocaleString(locale);
        if (storage.streakDays > 0) {
            elements.streakBadge.hidden = false;
            const days = Number(storage.streakDays || 0).toLocaleString(state.language === 'ar' ? 'ar' : 'en-US');
            elements.streakBadgeCount.textContent = `${days}${rt.streakDayShort}`;
        } else {
            elements.streakBadge.hidden = true;
        }
    }

    function renderHero(storage, redirectSettings) {
        const rt = getRuntimeText();
        const locale = state.language === 'ar' ? 'ar' : 'en-US';
        const activeModes = [];
        if (storage.adultContentBlocked) activeModes.push(rt.heroModeAdult);
        if (storage.safeSearchEnabled) activeModes.push(rt.heroModeSafeSearch);
        if (redirectSettings.redirectModeEnabled) activeModes.push(rt.heroModeRedirect);

        if (activeModes.length === 0) {
            elements.heroMode.textContent = rt.heroModeBlockingOnly;
        } else if (activeModes.length === 1) {
            elements.heroMode.textContent = activeModes[0];
        } else {
            elements.heroMode.textContent = localizeTemplate(rt.heroModeActiveCount, {
                count: Number(activeModes.length).toLocaleString(locale)
            });
        }
        elements.heroMode.title = activeModes.join(' + ');
        elements.heroSiteCount.textContent = state.allBlockedSites.length.toLocaleString(locale);
        elements.heroTodayCount.textContent = `${(storage.blockStats?.todayBlocks || 0).toLocaleString(locale)} ${rt.heroTodayBlocksSuffix}`;
        const protectionActive = activeModes.length > 0 || state.allBlockedSites.length > 0;
        elements.statusDot.classList.toggle('active', protectionActive);
        elements.statusHeadline.textContent = protectionActive ? rt.statusActive : rt.statusStandby;
        elements.statusCopy.textContent = redirectSettings.redirectModeEnabled
            ? rt.statusCopyRedirect
            : rt.statusCopyBlocked;
    }

    function renderRedirectPreview(redirectSettings) {
        const rt = getRuntimeText();
        elements.redirectPreview.textContent = redirectSettings.redirectModeEnabled
            ? rt.redirectPreviewOn
            : rt.redirectPreviewOff;
    }

    function applyLanguage() {
        const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
        const rt = getRuntimeText();
        const branding = getBranding();
        document.documentElement.lang = state.language;
        document.body.dir = state.language === 'ar' ? 'rtl' : 'ltr';
        document.title = branding.name;
        elements.popupLangToggle.textContent = t.lang;
        const streakFire = document.querySelector('.streak-fire');
        if (streakFire) {
            streakFire.textContent = rt.streakBadgeLabel;
        }
        document.querySelector('.eyebrow').textContent = t.eyebrow;
        document.querySelector('.brand-copy h1').textContent = branding.name;
        document.querySelector('.hero-subtitle').textContent = branding.subtitle;
        elements.navButtons.forEach((button, index) => {
            button.textContent = t.nav[index];
        });
        document.querySelectorAll('.summary-label').forEach((node, index) => {
            node.textContent = t.summaryLabels[index];
        });
        document.querySelector('#home-page .page-kicker').textContent = t.overviewKicker;
        document.querySelector('#home-page h2').textContent = t.overviewTitle;
        document.querySelector('#home-page .page-note').textContent = t.overviewNote;
        document.querySelector('.status-card .card-kicker').textContent = t.liveStatusKicker;
        document.querySelector('#adult-content-toggle').closest('.toggle-tile').querySelector('strong').textContent = rt.homeAdultTitle;
        document.querySelector('#adult-content-toggle').closest('.toggle-tile').querySelector('small').textContent = rt.homeAdultDesc;
        document.querySelector('#safe-search-toggle').closest('.toggle-tile').querySelector('strong').textContent = rt.homeSafeSearchTitle;
        document.querySelector('#safe-search-toggle').closest('.toggle-tile').querySelector('small').textContent = rt.homeSafeSearchDesc;
        document.querySelector('#redirect-mode-toggle-home').closest('.toggle-tile').querySelector('strong').textContent = rt.homeRedirectTitle;
        document.querySelector('#redirect-mode-toggle-home').closest('.toggle-tile').querySelector('small').textContent = rt.homeRedirectDesc;
        document.querySelector('.reason-card .card-kicker').textContent = t.anchorKicker;
        document.querySelector('.reason-card h3').textContent = t.anchorTitle;
        document.querySelector('#block-page .page-kicker').textContent = t.strictKicker;
        document.querySelector('#block-page h2').textContent = t.strictTitle;
        document.querySelector('#block-page .page-note').textContent = state.language === 'ar'
            ? 'هذه صفحة التحكم لحظر النطاقات والفئات وإدارة القائمة.'
            : t.strictNote;
        document.querySelectorAll('#block-page .card-kicker')[0].textContent = t.addSiteKicker;
        document.querySelectorAll('#block-page .card-heading h3')[0].textContent = t.addSiteTitle;
        elements.addSiteButton.textContent = t.blockSiteButton;
        document.querySelectorAll('#block-page .card-kicker')[1].textContent = t.presetsKicker;
        document.querySelectorAll('#block-page .card-heading h3')[1].textContent = t.presetsTitle;
        document.querySelector('#adult-content-toggle-block').closest('.toggle-tile').querySelector('strong').textContent = t.adultTitle;
        document.querySelector('#adult-content-toggle-block').closest('.toggle-tile').querySelector('small').textContent = t.adultDesc;
        document.querySelector('#gaming-toggle').closest('.toggle-tile').querySelector('strong').textContent = t.gamingTitle;
        document.querySelector('#gaming-toggle').closest('.toggle-tile').querySelector('small').textContent = t.gamingDesc;
        document.querySelectorAll('#block-page .card-kicker')[2].textContent = t.socialKicker;
        document.querySelectorAll('#block-page .card-heading h3')[2].textContent = t.socialTitle;
        document.querySelector('.inline-switch-label span').textContent = t.socialMaster;
        document.querySelectorAll('#block-page .card-kicker')[3].textContent = t.dbKicker;
        document.querySelectorAll('#block-page .card-heading h3')[3].textContent = t.dbTitle;
        document.querySelectorAll('#block-page .page-note')[1].textContent = t.dbNote;
        document.querySelector('#redirect-page .page-kicker').textContent = t.redirectKicker;
        document.querySelector('#redirect-page h2').textContent = t.redirectTitle;
        document.querySelector('#redirect-page .page-note').textContent = state.language === 'ar'
            ? 'عند التفعيل يتم تحويل النتائج المحظورة إلى وجهة آمنة.'
            : t.redirectNote;
        document.querySelectorAll('#redirect-page .card-kicker')[0].textContent = t.redirectEngineKicker;
        document.querySelectorAll('#redirect-page .card-heading h3')[0].textContent = t.redirectEngineTitle;
        document.querySelector('.toggle-row strong').textContent = t.redirectToggleTitle;
        document.querySelector('.toggle-row small').textContent = t.redirectToggleDesc;
        document.querySelectorAll('#redirect-page .card-kicker')[1].textContent = t.outletsKicker;
        document.querySelectorAll('#redirect-page .card-heading h3')[1].textContent = t.outletsTitle;
        document.querySelector('label[for="outlet-name"]').textContent = t.nameLabel;
        document.querySelector('label[for="outlet-url"]').textContent = t.urlLabel;
        elements.addOutlet.textContent = t.addOutletButton;
        document.querySelector('#insights-page .page-kicker').textContent = t.momentumKicker;
        document.querySelector('#insights-page h2').textContent = t.momentumTitle;
        document.querySelector('#insights-page .page-note').textContent = t.momentumNote;
        document.querySelectorAll('.stats-grid .card-kicker').forEach((node, index) => {
            if (t.statsKickers[index]) node.textContent = t.statsKickers[index];
        });
        document.querySelectorAll('.stats-grid .muted').forEach((node, index) => {
            if (t.statsNotes[index]) node.textContent = t.statsNotes[index];
        });
        document.querySelector('.focus-card .card-kicker').textContent = t.focusTimerKicker;
        document.querySelector('.focus-card h3').textContent = t.focusTimerTitle;
        document.querySelector('label[for="focus-duration"]').textContent = t.focusLabel;
        document.querySelector('label[for="break-duration"]').textContent = t.breakLabel;
        if (isRunning) {
            elements.startFocus.textContent = isBreak ? rt.timerPauseBreak : rt.timerPause;
        } else {
            elements.startFocus.textContent = isBreak ? rt.timerStartBreak : rt.timerStartFocus;
        }
        elements.resetFocus.textContent = t.reset;
        elements.whyTextarea.placeholder = t.whyPlaceholder;
        elements.siteInput.placeholder = t.sitePlaceholder;
        elements.searchInput.placeholder = t.searchPlaceholder;
        elements.outletName.placeholder = t.outletNamePlaceholder;
        elements.outletUrl.placeholder = t.outletUrlPlaceholder;
        document.querySelectorAll('#focus-duration option').forEach((option) => {
            option.textContent = `${option.value} ${rt.minuteLabel}`;
        });
        document.querySelectorAll('#break-duration option').forEach((option) => {
            option.textContent = `${option.value} ${rt.minuteLabel}`;
        });
    }

    function updateAdultDatabaseBadge(adultSitesCache) {
        const rt = getRuntimeText();
        const count = Array.isArray(adultSitesCache) && adultSitesCache.length
            ? adultSitesCache.length
            : (Array.isArray(uniqueAdultSites) ? uniqueAdultSites.length : 0);
        elements.adultDbCount.textContent = localizeTemplate(rt.adultDomainsReady, {
            count: count.toLocaleString(state.language === 'ar' ? 'ar' : 'en-US')
        });
    }

    function removeSite(site) {
        const rt = getRuntimeText();
        chrome.runtime.sendMessage({ type: 'REMOVE_SITE', site }, (response) => {
            if (chrome.runtime.lastError || !response?.success) return;
            setFeedback(elements.feedback, localizeTemplate(rt.removedFromBlockList, { site }), 'success');
        });
    }

    function syncCheckboxPair(primary, secondary, checked) {
        primary.checked = checked;
        secondary.checked = checked;
    }

    function forceToggleState(category, checked) {
        if (category === 'adult') {
            elements.adultToggleHome.checked = checked;
            elements.adultToggleBlock.checked = checked;
        } else if (category === 'social') {
            elements.socialToggle.checked = checked;
        } else if (category === 'gaming') {
            elements.gamingToggle.checked = checked;
        }
    }

    function getCategorySites(category, storage) {
        if (category === 'adult') return Array.isArray(uniqueAdultSites) ? uniqueAdultSites : [];
        if (category === 'social') return storage.selectedSocialSites || state.selectedSocialSites || SOCIAL_PRESETS.map((site) => site.domain);
        if (category === 'gaming') return GAMING_SITES;
        return [];
    }

    function getRedirectSettings(storage) {
        return { ...DEFAULT_REDIRECT_SETTINGS, ...storage };
    }

    async function saveRedirectSettings(partialSettings) {
        const nextSettings = {
            ...DEFAULT_REDIRECT_SETTINGS,
            ...(await chrome.storage.local.get(Object.keys(DEFAULT_REDIRECT_SETTINGS))),
            ...partialSettings
        };
        return chrome.storage.local.set(nextSettings);
    }

    function normalizeOutlets(outlets) {
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

    function areOutletsEqual(current, normalized) {
        const a = Array.isArray(current) ? current.map((item) => ({ name: (item?.name || '').trim(), url: normalizeUrl(item?.url || '') })) : [];
        const b = Array.isArray(normalized) ? normalized.map((item) => ({ name: (item?.name || '').trim(), url: normalizeUrl(item?.url || '') })) : [];
        if (a.length !== b.length) {
            return false;
        }

        return a.every((item, index) => item.name === b[index].name && item.url === b[index].url);
    }

    function normalizeDomain(input) {
        return (input || '').trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
    }

    function normalizeUrl(input) {
        if (!input) return '';
        const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
        try {
            const parsed = new URL(candidate);
            if (!['http:', 'https:'].includes(parsed.protocol)) return '';
            return parsed.toString();
        } catch (error) {
            return '';
        }
    }

    function isValidDomain(domain) {
        return /^[a-z0-9][a-z0-9-_.]*\.[a-z]{2,}$/i.test(domain);
    }

    function setFeedback(node, message, type) {
        node.textContent = message;
        node.className = `inline-feedback ${type}`;
    }

    function formatTimeSaved(minutes) {
        const rt = getRuntimeText();
        const locale = state.language === 'ar' ? 'ar' : 'en-US';
        if (minutes < 60) return `${Number(minutes).toLocaleString(locale)}${rt.minuteShort}`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            const remainingMinutes = minutes % 60;
            const h = Number(hours).toLocaleString(locale);
            const m = Number(remainingMinutes).toLocaleString(locale);
            return remainingMinutes ? `${h}${rt.hourShort} ${m}${rt.minuteShort}` : `${h}${rt.hourShort}`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        const d = Number(days).toLocaleString(locale);
        const h = Number(remainingHours).toLocaleString(locale);
        return remainingHours ? `${d}${rt.dayShort} ${h}${rt.hourShort}` : `${d}${rt.dayShort}`;
    }

    function showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title,
            message
        });
    }

    function showUnblockConfirmation(onConfirm, onCancel) {
        const rt = getRuntimeText();
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        const locale = state.language === 'ar' ? 'ar' : 'en-US';
        const initialSeconds = Number(30).toLocaleString(locale);
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>${rt.dialogHoldTitle}</h3>
                <p>${rt.dialogWaitCopy}</p>
                <div class="timer">${initialSeconds}</div>
                <div class="dialog-actions">
                    <button class="dialog-confirm" disabled>${rt.dialogUnblock}</button>
                    <button class="dialog-cancel">${rt.dialogCancel}</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        const timerLabel = dialog.querySelector('.timer');
        const confirmButton = dialog.querySelector('.dialog-confirm');
        const cancelButton = dialog.querySelector('.dialog-cancel');
        let secondsLeft = 30;

        const countdown = setInterval(() => {
            secondsLeft -= 1;
            timerLabel.textContent = Number(secondsLeft).toLocaleString(locale);
            if (secondsLeft <= 0) {
                clearInterval(countdown);
                confirmButton.disabled = false;
            }
        }, 1000);

        confirmButton.addEventListener('click', () => {
            if (confirmButton.disabled) return;
            clearInterval(countdown);
            dialog.remove();
            onConfirm();
        });

        cancelButton.addEventListener('click', () => {
            clearInterval(countdown);
            dialog.remove();
            onCancel();
        });
    }
});
