// Shared lists of sites to block
const adultContentSites = [
    // Major video sites
    'xvideos.com',
    'pornhub.com',
    'xnxx.com',
    'youporn.com',
    'redtube.com',
    'tube8.com',
    'youjizz.com',
    'spankbang.com',
    'drtuber.com',
    'myfans.jp',
    
    // Image hosting and forums
    'imagefap.com',
    'xhamster.com',
    'motherless.com',
    'asstr.org',
    'literotica.com',
    
    // Webcam sites
    'chaturbate.com',
    'myfreecams.com',
    'cam4.com',
    'streamate.com',
    'stripchat.com',
    
    // Adult dating/personals
    'adultfriendfinder.com',
    'onlyfans.com',
    'seeking.com',
    
    // Add common TLDs for major sites
    'pornhub.net',
    'pornhub.org',
    'xvideos.net',
    'xnxx.net',
    
    // Add common subdomains
    'en.xvideos.com',
    'jp.xvideos.com',
    'de.xvideos.com',
    'fr.pornhub.com',
    'es.pornhub.com',
    'it.pornhub.com'
];

const socialMediaSites = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'tiktok.com',
    'linkedin.com',
    'reddit.com',
    'snapchat.com',
    'pinterest.com'
];

const gamingSites = [
    'twitch.tv',
    'steam.com',
    'steamcommunity.com',
    'discord.com',
    'epicgames.com',
    'roblox.com',
    'minecraft.net',
    'leagueoflegends.com'
];

// Configuration for variations
const languages = ['en', 'jp', 'de', 'fr', 'es', 'it', 'ru', 'cn', 'kr', 'pt', 'pl', 'nl', 'cz', 'se'];
const prefixes = ['www', 'm', 'mobile', 'touch', 'wap', 'beta', 'dev', 'new', 'old', 'cdn'];
const suffixes = ['.com', '.net', '.org', '.xyz', '.tv', '.me', '.co', '.site', '.website', '.online'];

// Update the generateSiteVariations function
function generateSiteVariations(sites) {
    return sites.map(site => {
        // Clean the domain and ensure it's just the base domain
        return site.toLowerCase()
            .replace(/^(https?:\/\/)?(www\.)?/, '')
            .replace(/\/.*$/, '');
    });
}

// Generate base patterns without wildcards
const uniqueAdultSites = [...new Set(generateSiteVariations(adultContentSites))];

// Make sure these are available to other scripts
self.adultContentSites = adultContentSites;
self.socialMediaSites = socialMediaSites;
self.gamingSites = gamingSites;
self.uniqueAdultSites = uniqueAdultSites; 