importScripts('sites.js');

console.log('Background script loaded');

const BLOCK_RULE_ID_START = 1;
const BLOCK_RULE_ID_END = 7999;
const ADULT_KEYWORD_RULE_ID_START = 8000;
const SAFE_SEARCH_RULE_ID_START = 9000;
const DNR_UNSAFE_RULE_LIMIT = Number(chrome.declarativeNetRequest?.MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES) || 5000;
const DNR_RULE_BUFFER = 80;
const MAX_DYNAMIC_BLOCK_RULES = Math.max(
    1000,
    Math.min(BLOCK_RULE_ID_END - BLOCK_RULE_ID_START + 1, DNR_UNSAFE_RULE_LIMIT - DNR_RULE_BUFFER)
);
const MAX_WHOLESOME_OUTLETS = 3;
const MAX_CUSTOM_OUTLETS = 1;
const DEFAULT_SELECTED_SOCIAL_SITES = [
    'youtube.com',
    'facebook.com',
    'x.com',
    'instagram.com',
    'reddit.com',
    'tiktok.com',
    'pinterest.com',
    'snapchat.com'
];
const ADULT_BLOCKLIST_URL = 'https://raw.githubusercontent.com/blocklistproject/Lists/master/porn.txt';
const ADULT_BLOCKLIST_CACHE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXTENSION_SETTINGS = {
    extensionEnabled: true
};
const FIXED_QURAN_OUTLET = { name: 'Quran', url: 'https://www.youtube.com/watch?v=bP3AYLevqnI' };
const CLUMSY_BIRD_REPO_URL = 'https://github.com/ellisonleao/clumsy-bird';
const CLUMSY_BIRD_LIVE_URL = 'https://ellisonleao.github.io/clumsy-bird/';
const CLUMSY_BIRD_LOCAL_URL = chrome.runtime.getURL('vendor/clumsy-bird/index.html');
const FRIENDLY_GAME_NAME = 'Focus Bird Game';
const FIXED_GAME_OUTLET = { name: FRIENDLY_GAME_NAME, url: CLUMSY_BIRD_LOCAL_URL };
const FIXED_OUTLETS = [FIXED_QURAN_OUTLET, FIXED_GAME_OUTLET];
const DEFAULT_WHOLESOME_OUTLETS = [...FIXED_OUTLETS];
const LEGACY_OUTLET_NAMES = new Set(['learn something', 'quick workout', 'meditate']);
let ruleRebuildQueue = Promise.resolve();

function queueRuleRebuild(reason) {
    ruleRebuildQueue = ruleRebuildQueue
        .catch(() => undefined)
        .then(() => rebuildAllRules())
        .catch((error) => {
            console.error(`Rule rebuild failed (${reason}):`, error);
        });
    return ruleRebuildQueue;
}

chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed or updated:', details?.reason);

    if (details?.reason === 'install') {
        chrome.storage.local.set({
            blockedSites: [],
            manuallyAddedSites: [],
            unblockedSites: [],
            adultContentBlocked: false,
            socialMediaBlocked: false,
            gamingBlocked: false,
            safeSearchEnabled: true,
            blockStats: {
                totalBlocks: 0,
                todayBlocks: 0,
                lastUpdate: new Date().toDateString(),
                mostBlocked: null,
                siteAttempts: {}
            },
            streakDays: 0,
            streakStartDate: null,
            lastStreakCheck: '',
            bestStreak: 0,
            installDate: new Date().toISOString(),
            selectedSocialSites: DEFAULT_SELECTED_SOCIAL_SITES.slice(),
            wholesomeOutlets: DEFAULT_WHOLESOME_OUTLETS,
            ...DEFAULT_EXTENSION_SETTINGS
        }, async () => {
            await refreshAdultSiteDatabase(true);
            await queueRuleRebuild('onInstalled:install');
            chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
        });

        return;
    }

    refreshAdultSiteDatabase(false).finally(() => {
        queueRuleRebuild('onInstalled:update');
    });
});

chrome.runtime.onStartup.addListener(() => {
    refreshAdultSiteDatabase(false)
        .catch((error) => console.error('Failed to refresh adult database on startup:', error))
        .finally(() => {
            queueRuleRebuild('onStartup');
            checkDailyStreak();
        });
});

setInterval(() => {
    validateBlockingRules();
    checkDailyStreak();
}, 60000);

setInterval(() => {
    refreshAdultSiteDatabase(false).catch((error) => {
        console.error('Scheduled adult database refresh failed:', error);
    });
}, ADULT_BLOCKLIST_CACHE_MS);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') {
        return;
    }

    const needsRuleRefresh = [
        'blockedSites',
        'manuallyAddedSites',
        'unblockedSites',
        'adultContentBlocked',
        'socialMediaBlocked',
        'gamingBlocked',
        'adultSitesCache',
        'selectedSocialSites',
        'extensionEnabled',
        'safeSearchEnabled'
    ].some((key) => changes[key]);

    if (needsRuleRefresh) {
        queueRuleRebuild('storage.onChanged');
    }

    if (changes.wholesomeOutlets) {
        const sanitizedOutlets = sanitizeWholesomeOutlets(changes.wholesomeOutlets.newValue);
        if (!areOutletsEqual(changes.wholesomeOutlets.newValue, sanitizedOutlets)) {
            chrome.storage.local.set({ wholesomeOutlets: sanitizedOutlets });
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ADD_MANUAL_SITE') {
        handleAddManualSite(request.site)
            .then(sendResponse)
            .catch((error) => {
                console.error('Error adding manual site:', error);
                sendResponse({ success: false, reason: 'Failed to add site.' });
            });
        return true;
    }

    if (request.type === 'REMOVE_SITE') {
        handleRemoveSite(request.site)
            .then(sendResponse)
            .catch((error) => {
                console.error('Error removing site:', error);
                sendResponse({ success: false, reason: 'Failed to remove site.' });
            });
        return true;
    }

    if (request.type === 'ADD_ALLOW_SITE') {
        handleAddAllowSite(request.site)
            .then(sendResponse)
            .catch((error) => {
                console.error('Error adding allowlist site:', error);
                sendResponse({ success: false, reason: 'Failed to add allowlist site.' });
            });
        return true;
    }

    if (request.type === 'REMOVE_ALLOW_SITE') {
        handleRemoveAllowSite(request.site)
            .then(sendResponse)
            .catch((error) => {
                console.error('Error removing allowlist site:', error);
                sendResponse({ success: false, reason: 'Failed to remove allowlist site.' });
            });
        return true;
    }

    if (request.type === 'TOGGLE_SAFE_SEARCH') {
        chrome.storage.local.set({ safeSearchEnabled: !!request.enabled }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    return false;
});

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
    try {
        const url = new URL(info.request.url);
        updateBlockStats(url.hostname);
    } catch (error) {
        console.error('Failed to read matched URL:', error);
    }
});

chrome.runtime.setUninstallURL('https://tally.so/r/wdXdro');

chrome.storage.local.get(['safeSearchEnabled', 'adultContentBlocked', 'wholesomeOutlets', 'selectedSocialSites', 'extensionEnabled'], async (result) => {
    try {
        const sanitizedOutlets = sanitizeWholesomeOutlets(result.wholesomeOutlets);
        const sanitizedSocialSites = sanitizeSelectedSocialSites(result.selectedSocialSites);
        const normalizedExtensionEnabled = result.extensionEnabled !== false;
        const storagePatch = {};

        if (!areOutletsEqual(result.wholesomeOutlets, sanitizedOutlets)) {
            storagePatch.wholesomeOutlets = sanitizedOutlets;
        }

        if (typeof result.extensionEnabled !== 'boolean') {
            storagePatch.extensionEnabled = normalizedExtensionEnabled;
        }

        if (!areStringArraysEqual(result.selectedSocialSites, sanitizedSocialSites)) {
            storagePatch.selectedSocialSites = sanitizedSocialSites;
        }

        if (Object.keys(storagePatch).length > 0) {
            await chrome.storage.local.set(storagePatch);
        }

        await refreshAdultSiteDatabase(false);
        await queueRuleRebuild('initialization');
    } catch (error) {
        console.error('Background initialization failed:', error);
    }
});

async function rebuildAllRules() {
    const extensionState = await chrome.storage.local.get(Object.keys(DEFAULT_EXTENSION_SETTINGS));
    const extensionEnabled = extensionState.extensionEnabled !== false;

    if (!extensionEnabled) {
        await updateBlockingRules();
        await updateAdultKeywordRules(false);
        await updateSafeSearchRules(false);
        return;
    }

    await updateBlockingRules();

    const state = await chrome.storage.local.get(['adultContentBlocked', 'safeSearchEnabled']);
    await updateAdultKeywordRules(!!state.adultContentBlocked);
    await updateSafeSearchRules(state.safeSearchEnabled !== false);
}

async function updateBlockingRules() {
    const state = await chrome.storage.local.get([
        'manuallyAddedSites',
        'adultContentBlocked',
        'socialMediaBlocked',
        'gamingBlocked',
        'unblockedSites',
        'adultSitesCache',
        'selectedSocialSites',
        ...Object.keys(DEFAULT_EXTENSION_SETTINGS),
    ]);

    const rules = [];
    let ruleId = BLOCK_RULE_ID_START;
    const blockRuleBudget = MAX_DYNAMIC_BLOCK_RULES;
    const blockRuleIds = Array.from({ length: BLOCK_RULE_ID_END - BLOCK_RULE_ID_START + 1 }, (_, index) => index + BLOCK_RULE_ID_START);
    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    const unblockedSites = new Set((state.unblockedSites || []).map(normalizeDomain));
    const extensionEnabled = state.extensionEnabled !== false;

    const manualSites = (state.manuallyAddedSites || []).map(normalizeDomain).filter(Boolean);
    const adultSites = state.adultContentBlocked ? getAdultSites(state).filter((site) => !unblockedSites.has(site)) : [];
    const socialSites = state.socialMediaBlocked
        ? sanitizeSelectedSocialSites(state.selectedSocialSites).filter((site) => !unblockedSites.has(site))
        : [];
    const gamingSitesList = state.gamingBlocked
        ? gamingSites.map(normalizeDomain).filter((site) => !unblockedSites.has(site))
        : [];

    if (!extensionEnabled) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: blockRuleIds,
            addRules: []
        });
        return;
    }

    const addDirectSiteRule = (site, matchType, label) => {
        if (!site || unblockedSites.has(site) || ruleId > BLOCK_RULE_ID_END || rules.length >= blockRuleBudget) {
            return;
        }

        rules.push({
            id: ruleId++,
            priority: 3,
            action: buildNavigationAction(label || site, blockedPageUrl),
            condition: {
                urlFilter: `||${site}^`,
                resourceTypes: ['main_frame']
            }
        });
    };

    manualSites.forEach((site) => addDirectSiteRule(site, 'blocked', site));
    socialSites.forEach((site) => addDirectSiteRule(site, 'blocked', site));
    gamingSitesList.forEach((site) => addDirectSiteRule(site, 'blocked', site));

    if (adultSites.length > 0) {
        const blockAction = { type: 'block' };
        const adultCandidates = deduplicate(adultSites);
        const availableSlots = Math.max(0, blockRuleBudget - rules.length);
        const adultSitesToApply = adultCandidates.slice(0, availableSlots);

        adultSitesToApply.forEach((site) => {
            if (!site || unblockedSites.has(site) || ruleId > BLOCK_RULE_ID_END || rules.length >= blockRuleBudget) {
                return;
            }

            rules.push({
                id: ruleId++,
                priority: 2,
                action: blockAction,
                condition: {
                    urlFilter: `||${site}^`,
                    resourceTypes: ['main_frame']
                }
            });
        });

        const omitted = adultCandidates.length - adultSitesToApply.length;
        if (omitted > 0) {
            console.warn(`Adult domain list truncated by rule budget. Applied ${adultSitesToApply.length}, omitted ${omitted}.`);
        }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: blockRuleIds,
        addRules: rules
    });

    console.log(`Blocking rules updated: ${rules.length}/${blockRuleBudget}`);
}

async function updateAdultKeywordRules(enabled) {
    const state = await chrome.storage.local.get([
        ...Object.keys(DEFAULT_EXTENSION_SETTINGS),
        'unblockedSites'
    ]);
    const extensionEnabled = state.extensionEnabled !== false;
    const shouldEnable = enabled && extensionEnabled;
    const ruleIdsToRemove = Array.from({ length: 200 }, (_, index) => ADULT_KEYWORD_RULE_ID_START + index);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: []
    });

    if (!shouldEnable) {
        return;
    }

    const excludedRequestDomains = deduplicate((state.unblockedSites || []).map(normalizeDomain).filter(Boolean)).slice(0, 500);

    const rules = ADULT_KEYWORDS.map((keyword, index) => {
        return {
            id: ADULT_KEYWORD_RULE_ID_START + index,
            priority: 4,
            action: { type: 'block' },
            condition: {
                urlFilter: keyword,
                resourceTypes: ['main_frame'],
                ...(excludedRequestDomains.length > 0 ? { excludedRequestDomains } : {})
            }
        };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules: rules
    });
}

async function updateSafeSearchRules(enabled) {
    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    const extensionState = await chrome.storage.local.get(Object.keys(DEFAULT_EXTENSION_SETTINGS));
    const extensionEnabled = extensionState.extensionEnabled !== false;
    const shouldEnable = enabled && extensionEnabled;
    const ruleIdsToRemove = Array.from({ length: 50 }, (_, index) => SAFE_SEARCH_RULE_ID_START + index);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: []
    });

    if (!shouldEnable) {
        return;
    }

    const rules = [
        {
            id: SAFE_SEARCH_RULE_ID_START,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: 'safe', value: 'active' }]
                        }
                    }
                }
            },
            condition: {
                urlFilter: '||google.com/search',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 1,
            priority: 2,
            action: {
                type: 'redirect',
                redirect: {
                    url: `${blockedPageUrl}?site=Google%20SafeSearch%20Settings`
                }
            },
            condition: {
                urlFilter: '||google.com/safesearch',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 2,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: 'safeSearch', value: 'Strict' }]
                        }
                    }
                }
            },
            condition: {
                urlFilter: '||bing.com/search',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 3,
            priority: 2,
            action: {
                type: 'redirect',
                redirect: {
                    url: `${blockedPageUrl}?site=Bing%20SafeSearch%20Settings`
                }
            },
            condition: {
                urlFilter: '||bing.com/account',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 4,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: 'kp', value: '1' }]
                        }
                    }
                }
            },
            condition: {
                urlFilter: '||duckduckgo.com/',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 5,
            priority: 2,
            action: {
                type: 'redirect',
                redirect: {
                    url: `${blockedPageUrl}?site=DuckDuckGo%20Settings`
                }
            },
            condition: {
                urlFilter: '||duckduckgo.com/settings',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 6,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: 'vm', value: 'r' }]
                        }
                    }
                }
            },
            condition: {
                urlFilter: '||search.yahoo.com/search',
                resourceTypes: ['main_frame']
            }
        },
        {
            id: SAFE_SEARCH_RULE_ID_START + 7,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: 'has_verified', value: '1' }]
                        }
                    }
                }
            },
            condition: {
                urlFilter: '||youtube.com/results',
                resourceTypes: ['main_frame']
            }
        }
    ];

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules: rules
    });
}

async function handleAddManualSite(siteInput) {
    const site = normalizeDomain(siteInput);

    if (!site) {
        return { success: false, reason: 'Please enter a valid domain.' };
    }

    const state = await chrome.storage.local.get(['manuallyAddedSites', 'blockedSites', 'unblockedSites']);
    const manualSites = (state.manuallyAddedSites || []).map(normalizeDomain);
    const blockedSites = (state.blockedSites || []).map(normalizeDomain);
    const unblockedSites = (state.unblockedSites || []).map(normalizeDomain);

    if ((manualSites.includes(site) || blockedSites.includes(site)) && !unblockedSites.includes(site)) {
        return { success: false, reason: 'Site already blocked.' };
    }

    await chrome.storage.local.set({
        manuallyAddedSites: deduplicate([...manualSites, site]),
        blockedSites: deduplicate([...blockedSites, site]),
        unblockedSites: unblockedSites.filter((entry) => entry !== site)
    });

    await queueRuleRebuild('handleAddManualSite');
    return { success: true };
}

async function handleAddAllowSite(siteInput) {
    const site = normalizeDomain(siteInput);
    if (!site) {
        return { success: false, reason: 'Please enter a valid domain.' };
    }

    const state = await chrome.storage.local.get(['blockedSites', 'manuallyAddedSites', 'unblockedSites', 'selectedSocialSites']);
    const blockedSites = (state.blockedSites || []).map(normalizeDomain).filter((entry) => entry !== site);
    const manuallyAddedSites = (state.manuallyAddedSites || []).map(normalizeDomain).filter((entry) => entry !== site);
    const selectedSocialSites = sanitizeSelectedSocialSites(state.selectedSocialSites).filter((entry) => entry !== site);
    const unblockedSites = deduplicate([...(state.unblockedSites || []).map(normalizeDomain), site]);

    await chrome.storage.local.set({
        blockedSites,
        manuallyAddedSites,
        selectedSocialSites,
        unblockedSites
    });

    await queueRuleRebuild('handleAddAllowSite');
    return { success: true };
}

async function handleRemoveAllowSite(siteInput) {
    const site = normalizeDomain(siteInput);
    if (!site) {
        return { success: false, reason: 'Please enter a valid domain.' };
    }

    const state = await chrome.storage.local.get(['unblockedSites']);
    const unblockedSites = (state.unblockedSites || []).map(normalizeDomain).filter((entry) => entry !== site);
    await chrome.storage.local.set({ unblockedSites });
    await queueRuleRebuild('handleRemoveAllowSite');
    return { success: true };
}

async function handleRemoveSite(siteInput) {
    const site = normalizeDomain(siteInput);
    const state = await chrome.storage.local.get(['blockedSites', 'manuallyAddedSites', 'unblockedSites']);

    const blockedSites = (state.blockedSites || []).map(normalizeDomain).filter((entry) => entry !== site);
    const manuallyAddedSites = (state.manuallyAddedSites || []).map(normalizeDomain).filter((entry) => entry !== site);
    const unblockedSites = deduplicate([...(state.unblockedSites || []).map(normalizeDomain), site]);

    await chrome.storage.local.set({
        blockedSites,
        manuallyAddedSites,
        unblockedSites
    });

    await queueRuleRebuild('handleRemoveSite');

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (activeTab?.url?.includes('blocked.html')) {
        chrome.tabs.update(activeTab.id, { url: `https://${site}` });
    }

    return { success: true };
}

async function validateBlockingRules() {
    const [dynamicRules, storage] = await Promise.all([
        chrome.declarativeNetRequest.getDynamicRules(),
        chrome.storage.local.get(['blockedSites', 'adultContentBlocked', 'socialMediaBlocked', 'gamingBlocked', 'extensionEnabled'])
    ]);

    if (storage.extensionEnabled === false) {
        return;
    }

    const shouldHaveRules =
        (storage.blockedSites || []).length > 0 ||
        storage.adultContentBlocked ||
        storage.socialMediaBlocked ||
        storage.gamingBlocked;

    if (shouldHaveRules && dynamicRules.length === 0) {
        console.warn('Rules were empty while protection was enabled. Rebuilding.');
        await queueRuleRebuild('validateBlockingRules');
    }
}

function updateBlockStats(blockedSite) {
    chrome.storage.local.get(['blockStats'], (result) => {
        const now = new Date();
        const today = now.toDateString();
        const stats = result.blockStats || {
            totalBlocks: 0,
            todayBlocks: 0,
            lastUpdate: today,
            mostBlocked: null,
            siteAttempts: {}
        };

        if (stats.lastUpdate !== today) {
            stats.todayBlocks = 0;
            stats.lastUpdate = today;
        }

        stats.totalBlocks += 1;
        stats.todayBlocks += 1;
        stats.siteAttempts[blockedSite] = (stats.siteAttempts[blockedSite] || 0) + 1;

        const siteEntries = Object.entries(stats.siteAttempts);
        if (siteEntries.length > 0) {
            stats.mostBlocked = siteEntries.reduce((highest, current) => (highest[1] > current[1] ? highest : current))[0];
        }

        chrome.storage.local.set({ blockStats: stats }, () => {
            chrome.storage.local.get(['streakDays'], (streakResult) => {
                if ((streakResult.streakDays || 0) > 0) {
                    chrome.storage.local.set({ streakDays: 0, streakStartDate: null });
                }
            });
        });
    });
}

function checkDailyStreak() {
    const today = new Date().toDateString();

    chrome.storage.local.get(['lastStreakCheck', 'streakDays', 'streakStartDate', 'bestStreak'], (result) => {
        if (result.lastStreakCheck === today) {
            return;
        }

        let streakDays = result.streakDays || 0;
        let streakStartDate = result.streakStartDate;
        let bestStreak = result.bestStreak || 0;

        if (result.lastStreakCheck) {
            if (streakDays > 0 || streakStartDate) {
                streakDays += 1;
            } else {
                streakDays = 1;
                streakStartDate = new Date().toISOString();
            }

            bestStreak = Math.max(bestStreak, streakDays);
        } else {
            streakDays = 0;
        }

        chrome.storage.local.set({
            lastStreakCheck: today,
            streakDays,
            streakStartDate,
            bestStreak
        });
    });
}

async function refreshAdultSiteDatabase(forceRefresh) {
    const cache = await chrome.storage.local.get(['adultSitesCache', 'lastCacheUpdate']);
    const now = Date.now();
    const cacheIsFresh =
        Array.isArray(cache.adultSitesCache) &&
        cache.adultSitesCache.length > 0 &&
        cache.lastCacheUpdate &&
        now - cache.lastCacheUpdate < ADULT_BLOCKLIST_CACHE_MS;

    if (!forceRefresh && cacheIsFresh) {
        return cache.adultSitesCache;
    }

    try {
        const response = await fetch(ADULT_BLOCKLIST_URL);
        if (!response.ok) {
            throw new Error(`Adult blocklist request failed with status ${response.status}`);
        }

        const text = await response.text();
        const fetchedSites = deduplicate([
            ...uniqueAdultSites.map(normalizeDomain),
            ...processDomainsText(text)
        ]).slice(0, 12000);

        await chrome.storage.local.set({
            adultSitesCache: fetchedSites,
            lastCacheUpdate: now
        });

        console.log('Adult blocklist cache refreshed:', fetchedSites.length);
        return fetchedSites;
    } catch (error) {
        console.error('Failed to refresh adult blocklist:', error);

        if (Array.isArray(cache.adultSitesCache) && cache.adultSitesCache.length > 0) {
            return cache.adultSitesCache;
        }

        const fallbackSites = uniqueAdultSites.map(normalizeDomain);
        await chrome.storage.local.set({
            adultSitesCache: fallbackSites,
            lastCacheUpdate: now
        });
        return fallbackSites;
    }
}

function buildNavigationAction(label, blockedPageUrl) {
    return {
        type: 'redirect',
        redirect: {
            url: `${blockedPageUrl}?site=${encodeURIComponent(label)}`
        }
    };
}

function getAdultSites(state) {
    const cachedSites = Array.isArray(state.adultSitesCache) && state.adultSitesCache.length > 0
        ? state.adultSitesCache
        : uniqueAdultSites;

    return deduplicate(cachedSites.map(normalizeDomain)).filter(Boolean);
}

function processDomainsText(text) {
    return deduplicate(
        text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => line.replace(/^0\.0\.0\.0\s+/, '').replace(/^\|\|/, '').replace(/\^.*$/, '').trim())
            .map(normalizeDomain)
            .filter(Boolean)
    );
}

function normalizeDomain(input) {
    return (input || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/.*$/, '');
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

function deduplicate(values) {
    return [...new Set(values)];
}

function sanitizeSelectedSocialSites(value) {
    const allowed = new Set(DEFAULT_SELECTED_SOCIAL_SITES.map(normalizeDomain));
    const hasExplicitList = Array.isArray(value);
    const source = hasExplicitList ? value : DEFAULT_SELECTED_SOCIAL_SITES;
    const selected = deduplicate(source.map(normalizeDomain).filter(Boolean));
    const filtered = selected.filter((domain) => allowed.has(domain));
    if (!hasExplicitList) {
        return filtered.length > 0 ? filtered : DEFAULT_SELECTED_SOCIAL_SITES.slice();
    }
    return filtered;
}

function areStringArraysEqual(a, b) {
    const left = Array.isArray(a) ? a.map((item) => String(item)) : [];
    const right = Array.isArray(b) ? b.map((item) => String(item)) : [];
    if (left.length !== right.length) {
        return false;
    }

    return left.every((value, index) => value === right[index]);
}

function chunkArray(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
        chunks.push(values.slice(index, index + size));
    }
    return chunks;
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
    const a = Array.isArray(current)
        ? current.map((item) => ({ name: (item?.name || '').trim(), url: normalizeUrl(item?.url || '') }))
        : [];
    const b = Array.isArray(normalized)
        ? normalized.map((item) => ({ name: (item?.name || '').trim(), url: normalizeUrl(item?.url || '') }))
        : [];

    if (a.length !== b.length) {
        return false;
    }

    return a.every((item, index) => item.name === b[index].name && item.url === b[index].url);
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

const ADULT_KEYWORDS = [
    'porn',
    'xxx',
    'nsfw',
    'pornhub',
    'xnxx',
    'xhamster',
    'xvideos',
    'redtube',
    'youporn',
    'hentai',
    'onlyfans',
    'fansly',
    'chaturbate',
    'stripchat',
    'cam4',
    'camsoda',
    'myfreecams',
    'adulttube',
    'porntube',
    'rule34',
    'nude',
    'naked',
    'boobs',
    'blowjob',
    'escort'
];
