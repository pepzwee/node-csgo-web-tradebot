module.exports = {
    bots: {
        'bot_1': {
            "siteName": "Bot 1",
            "accountName": "",
            "password": "",
            "twoFactorCode": "",
            "identitySecret": "",
            "steamID64": "",
            "personaName": "csg0.trade - Bot #1"
        },
        'bot_2': {
            "siteName": "Bot 2",
            "accountName": "",
            "password": "",
            "twoFactorCode": "",
            "identitySecret": "",
            "steamID64": "",
            "personaName": "csg0.trade - Bot #2"
        }
    },
    // Your Steam API key, get it here: https://steamcommunity.com/dev/apikey
    steamApiKey: '',
    // Your SteamApis.com key, get it here: https://steamapis.com
    SteamApisKey: '',
    site: {
        header: 'CSG0.Trade',
        steamGroup: '#',
        copyrights: 'Copyright © csg0.trade 2016'
    },
    // Domain name only, follow the example (no http:// & no www & no /)
    domain: 'csg0.trade',
    // Website URL, follow the example (do not add / at the end)
    website: 'http://csg0.trade',
    // Website PORT, don't change it unless you're using a reverse proxy
    websitePort: 80,
    // Quite obvious
    tradeMessage: 'Trade offer from csg0.trade | If you did not request this offer or the offer looks invalid please decline.',
    rates: {
        ignoreItemsBelow: 0.05, // Ignore items below this price (price * rate < ignoreItemsBelow)
        trashPriceBelow: 0.2, // Items below this price are considered trash
        // Items
        user: {
            key: 1,
            knife: 0.95,
            rare_skin: 0.95,
            weapon: 0.9,
            misc: 0.85,
            trash: 0.7
        },
        bot: {
            key: 1.05,
            knife: 1,
            rare_skin: 1,
            weapon: 0.95,
            misc: 0.9,
            trash: 0.8
        }
    }
};
