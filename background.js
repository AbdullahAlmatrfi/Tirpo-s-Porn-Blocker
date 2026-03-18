importScripts('sites.js');

console.log('Background script loaded');

const BLOCK_RULE_ID_START = 1;
const BLOCK_RULE_ID_END = 7999;
const ADULT_KEYWORD_RULE_ID_START = 8000;
const SAFE_SEARCH_RULE_ID_START = 9000;
const MAX_ADULT_REDIRECT_RULES = 600;
const MAX_WHOLESOME_OUTLETS = 3;
const MAX_CUSTOM_OUTLETS = 1;
const ADULT_BLOCKLIST_URL = 'https://raw.githubusercontent.com/blocklistproject/Lists/master/porn.txt';
const ADULT_BLOCKLIST_CACHE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REDIRECT_SETTINGS = {
    redirectModeEnabled: false
};
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
            selectedSocialSites: socialMediaSites.slice(),
            wholesomeOutlets: DEFAULT_WHOLESOME_OUTLETS,
            ...DEFAULT_EXTENSION_SETTINGS,
            ...DEFAULT_REDIRECT_SETTINGS
        }, async () => {
            await refreshAdultSiteDatabase(true);
            await rebuildAllRules();
            chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
        });

        return;
    }

    refreshAdultSiteDatabase(false).finally(rebuildAllRules);
});

chrome.runtime.onStartup.addListener(() => {
    refreshAdultSiteDatabase(false)
        .catch((error) => console.error('Failed to refresh adult database on startup:', error))
        .finally(() => {
            rebuildAllRules();
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
        'redirectModeEnabled',
        'extensionEnabled'
    ].some((key) => changes[key]);

    if (needsRuleRefresh) {
        rebuildAllRules();
    }

    if (changes.adultContentBlocked) {
        updateAdultKeywordRules(changes.adultContentBlocked.newValue || false);
    }

    if (changes.safeSearchEnabled) {
        updateSafeSearchRules(changes.safeSearchEnabled.newValue || false);
    }

    if (changes.wholesomeOutlets) {
        const sanitizedOutlets = sanitizeWholesomeOutlets(changes.wholesomeOutlets.newValue);
        if (!areOutletsEqual(changes.wholesomeOutlets.newValue, sanitizedOutlets)) {
            chrome.storage.local.set({ wholesomeOutlets: sanitizedOutlets });
        }
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        validateToggleStates();
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

    if (request.type === 'TOGGLE_SAFE_SEARCH') {
        chrome.storage.local.set({ safeSearchEnabled: !!request.enabled }, () => {
            updateSafeSearchRules(!!request.enabled);
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

chrome.storage.local.get(['safeSearchEnabled', 'adultContentBlocked', 'wholesomeOutlets', 'extensionEnabled'], async (result) => {
    try {
        const sanitizedOutlets = sanitizeWholesomeOutlets(result.wholesomeOutlets);
        const normalizedExtensionEnabled = result.extensionEnabled !== false;
        const storagePatch = {};

        if (!areOutletsEqual(result.wholesomeOutlets, sanitizedOutlets)) {
            storagePatch.wholesomeOutlets = sanitizedOutlets;
        }

        if (typeof result.extensionEnabled !== 'boolean') {
            storagePatch.extensionEnabled = normalizedExtensionEnabled;
        }

        if (Object.keys(storagePatch).length > 0) {
            await chrome.storage.local.set(storagePatch);
        }

        if (result.safeSearchEnabled !== false) {
            await updateSafeSearchRules(true);
        }

        if (result.adultContentBlocked) {
            await updateAdultKeywordRules(true);
        }

        await refreshAdultSiteDatabase(false);
        await rebuildAllRules();
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
        ...Object.keys(DEFAULT_REDIRECT_SETTINGS)
    ]);

    const rules = [];
    let ruleId = BLOCK_RULE_ID_START;
    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    const redirectSettings = getRedirectSettings(state);
    const unblockedSites = new Set((state.unblockedSites || []).map(normalizeDomain));
    const extensionEnabled = state.extensionEnabled !== false;

    const manualSites = (state.manuallyAddedSites || []).map(normalizeDomain).filter(Boolean);
    const adultSites = state.adultContentBlocked ? getAdultSites(state).filter((site) => !unblockedSites.has(site)) : [];
    const socialSites = state.socialMediaBlocked
        ? (state.selectedSocialSites || socialMediaSites).map(normalizeDomain).filter((site) => !unblockedSites.has(site))
        : [];
    const gamingSitesList = state.gamingBlocked
        ? gamingSites.map(normalizeDomain).filter((site) => !unblockedSites.has(site))
        : [];

    if (!extensionEnabled) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: Array.from({ length: BLOCK_RULE_ID_END - BLOCK_RULE_ID_START + 1 }, (_, index) => index + BLOCK_RULE_ID_START),
            addRules: []
        });
        return;
    }

    const addDirectSiteRule = (site, matchType, label) => {
        if (!site || unblockedSites.has(site) || ruleId > BLOCK_RULE_ID_END) {
            return;
        }

        rules.push({
            id: ruleId++,
            priority: 3,
            action: buildNavigationAction(matchType, label || site, redirectSettings, blockedPageUrl),
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
        const adultAction = buildNavigationAction('adult', 'Adult content', redirectSettings, blockedPageUrl);
        const blockAction = { type: 'block' };
        const redirectAllowed = redirectSettings.redirectModeEnabled === true;
        const adultCandidates = deduplicate(adultSites);
        const availableSlots = Math.max(0, BLOCK_RULE_ID_END - ruleId + 1);
        const adultSitesToApply = adultCandidates.slice(0, availableSlots);
        let adultRedirectRulesUsed = 0;

        adultSitesToApply.forEach((site) => {
            if (!site || unblockedSites.has(site) || ruleId > BLOCK_RULE_ID_END) {
                return;
            }

            const useRedirect = redirectAllowed && adultRedirectRulesUsed < MAX_ADULT_REDIRECT_RULES;
            if (useRedirect) {
                adultRedirectRulesUsed += 1;
            }

            rules.push({
                id: ruleId++,
                priority: 2,
                action: useRedirect ? adultAction : blockAction,
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

        if (redirectAllowed && adultSitesToApply.length > MAX_ADULT_REDIRECT_RULES) {
            console.warn(`Adult redirects capped at ${MAX_ADULT_REDIRECT_RULES} due Chrome unsafe dynamic rule limit. Remaining adult domains use block action.`);
        }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from({ length: BLOCK_RULE_ID_END - BLOCK_RULE_ID_START + 1 }, (_, index) => index + BLOCK_RULE_ID_START),
        addRules: rules
    });

    console.log('Blocking rules updated:', rules.length);
}

async function updateAdultKeywordRules(enabled) {
    const state = await chrome.storage.local.get([
        ...Object.keys(DEFAULT_REDIRECT_SETTINGS),
        ...Object.keys(DEFAULT_EXTENSION_SETTINGS)
    ]);
    const redirectSettings = getRedirectSettings(state);
    const extensionEnabled = state.extensionEnabled !== false;
    const shouldEnable = enabled && extensionEnabled;
    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    const ruleIdsToRemove = Array.from({ length: 200 }, (_, index) => ADULT_KEYWORD_RULE_ID_START + index);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: []
    });

    if (!shouldEnable) {
        return;
    }

    // Use one regex per keyword to avoid Chrome's 2KB compiled regex limit.
    const rules = ADULT_KEYWORDS.map((keyword, index) => {
        const escaped = escapeRegex(keyword).replace(/\\ /g, '(?:\\+|%20|\\s)');
        return {
            id: ADULT_KEYWORD_RULE_ID_START + index,
            priority: 4,
            action: buildNavigationAction('adult', 'Blocked adult search', redirectSettings, blockedPageUrl),
            condition: {
                regexFilter: `^https?://.*(?:${escaped})`,
                resourceTypes: ['main_frame']
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

    if (manualSites.includes(site) || blockedSites.includes(site)) {
        return { success: false, reason: 'Site already blocked.' };
    }

    await chrome.storage.local.set({
        manuallyAddedSites: deduplicate([...manualSites, site]),
        blockedSites: deduplicate([...blockedSites, site]),
        unblockedSites: unblockedSites.filter((entry) => entry !== site)
    });

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

    await rebuildAllRules();

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
        await rebuildAllRules();
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

function validateToggleStates() {
    chrome.storage.local.get(['blockedSites', 'selectedSocialSites'], (result) => {
        const blockedSites = (result.blockedSites || []).map(normalizeDomain);
        const selectedSocialSites = (result.selectedSocialSites || socialMediaSites).map(normalizeDomain);

        chrome.storage.local.set({
            adultContentBlocked: uniqueAdultSites.some((site) => blockedSites.includes(normalizeDomain(site))),
            socialMediaBlocked: selectedSocialSites.some((site) => blockedSites.includes(normalizeDomain(site))),
            gamingBlocked: gamingSites.some((site) => blockedSites.includes(normalizeDomain(site)))
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

function getRedirectSettings(state) {
    return {
        ...DEFAULT_REDIRECT_SETTINGS,
        ...state
    };
}

function buildNavigationAction(matchType, label, redirectSettings, blockedPageUrl) {
    if (shouldRedirect(matchType, redirectSettings)) {
        return {
            type: 'redirect',
            redirect: {
                url: getRedirectTarget(redirectSettings, label, blockedPageUrl)
            }
        };
    }

    return {
        type: 'redirect',
        redirect: {
            url: `${blockedPageUrl}?site=${encodeURIComponent(label)}`
        }
    };
}

function shouldRedirect(matchType, settings) {
    if (!settings.redirectModeEnabled) {
        return false;
    }

    return matchType === 'adult' || matchType === 'blocked';
}

function getRedirectTarget(settings, label, blockedPageUrl) {
    return `${blockedPageUrl}?site=${encodeURIComponent(label)}&mode=focus`;
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

function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deduplicate(values) {
    return [...new Set(values)];
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
    'porn', 'xxx', 'nsfw', 'xnxx', 'xvideo', 'xhamster', 'redtube', 'youporn',
    'pornhub', 'brazzers', 'bangbros', 'naughty', 'hardcore', 'milf', 'hentai',
    'onlyfans', 'fansly', 'chaturbate', 'livejasmin', 'stripchat', 'bongacams',
    'cam4', 'camsoda', 'myfreecams', 'flirt4free', 'camgirl', 'webcamgirl',
    'nude', 'naked', 'pussy', 'cock', 'dick', 'penis', 'vagina', 'boobs', 'tits',
    'anal', 'blowjob', 'handjob', 'cumshot', 'creampie', 'gangbang', 'threesome',
    'lesbian', 'gay porn', 'fetish', 'bdsm', 'bondage', 'escort', 'hooker',
    'adultvideo', 'adultmovie', 'adultsite', 'adulttube', 'porntube', 'rule34',
    'sex video', 'sex movie', 'sex tape', 'sextape', 'leaked nudes'
];
