'use strict'

module.exports = {
    appID: 730, // 730 - CS:GO
    contextID: 2, // ContextID
    bots: {
        bot_1: {
            siteName: 'Bot 1', // Will be displayed under the "All bots" tab e.g. "Keys Only"
            accountName: 'thehomoerectus', // bot_1 username
            password: 'JimmyFloopy', // bot_1  password
            twoFactorCode: 'JIOu04dnsF1FAi3e24xQiQXeImc=', // shared_secret value
            identitySecret: 'NJcXPvq10quYpdCUE1EmPWZTg5Q=', // identity_secret value
            steamID64: '76561198225989616', // SteamID64 of bot account can be found here: "https://steamid.io/"
            personaName: 'Afolabi Ulutunji Onwuatuegwu', // Nickname for bot account, will change on restart
        },
    },
    steamApiKey: 'A052F903FF126E9317C9EAC645BC98E2', // Your Steam API key, get it here: https://steamcommunity.com/dev/apikey
    SteamApisKey: '08fej2-f7tkgTFHqI-MwFpgnT1A', // Your SteamApis.com key, get it here: https://steamapis.com
    SteamApisCompactValue: 'safe_ts.last_30d', // Use safe price calculated from 30 days of data, more info: https://steamapis.com/developers (Market Items - Optional Query Parameters "compact_value")
    site: {
        header: 'CSG0.Trade', // Name/header/title of website. Prefix for  <title></title> (For more: /index.html line: 9)
        steamGroup: '#',
        copyrights: 'Copyright © csg0.trade 2017', // Copyright text
    },
    domain: 'localhost', // Domain name only, follow the example (no http:// & no www & no /)
    website: 'http://localhost', // Website URL, follow the example (do not add / at the end)
    websitePort: 80, // Website PORT, don't change it unless you're using a reverse proxy
    tradeMessage: 'Trade offer from csg0.trade | If you did not request this offer or the offer looks invalid please decline.', // Quite obvious
    rates: {
        ignoreItemsBelow: 0.05, // Ignore items below this price (price * rate < ignoreItemsBelow) - shows (Too Low) for user
        trashPriceBelow: 0.2, // Items below this price are considered trash, the trash rate modifier will be applied
        // Items
        user: {
            key: 1,
            knife: 0.95,
            rare_skin: 0.95,
            weapon: 0.9,
            misc: 0.85,
            trash: 0.7,
        },
        bot: {
            key: 1.05,
            knife: 1,
            rare_skin: 1,
            weapon: 0.95,
            misc: 0.9,
            trash: 0.8,
        },
    },
}
