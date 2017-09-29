'use strict'

const config = require('../config')
const async = require('async')
const fs = require('fs')
const Trade = require('./index')

const SteamUser = require('steam-user')
const SteamCommunity = require('steamcommunity')
const SteamTotp = require('steam-totp')
const TradeOfferManager = require('steam-tradeoffer-manager')
const GlobalOffensive = require('globaloffensive')

Trade.prototype.startBots = function startBots(done) {
    const self = this
    let count = 0

    async.eachOfSeries(config.bots, (bot, id, callback) => {
        count += 1
        const client = new SteamUser({
            dataDirectory: null,
        })
        const csgo = new GlobalOffensive(client)
        self.instances[id] = {
            client,
            csgo,
            community: new SteamCommunity(),
            manager: new TradeOfferManager({
                steam: client,
                domain: config.domain,
                language: 'en',
                cancelTime: 600000,
            }),
            login: {
                accountName: bot.accountName,
                password: bot.password,
                twoFactorCode: SteamTotp.getAuthCode(bot.twoFactorCode),
            },
            user: bot,
        }
        // identifiers
        self.instances[id].client.bot_id = id
        self.instances[id].community.bot_id = id
        self.instances[id].manager.bot_id = id
        // polldata
        if (fs.existsSync(`./polls/${id}.json`)) {
            self.instances[id].manager.pollData = JSON.parse(fs.readFileSync(`./polls/${id}.json`))
        }
        // personaState
        const LookingToTrade = SteamUser.Steam.EPersonaState.LookingToTrade
        // login
        self.instances[id].client.logOn(self.instances[id].login)
        self.instances[id].client.addListener('webSession', (sessionID, cookies) => {
            self.instances[id].manager.setCookies(cookies, (err) => {
                if (err) {
                    return callback(err)
                }
                return true
            })
            self.instances[id].community.setCookies(cookies)
            self.instances[id].client.setPersona(LookingToTrade, bot.personaName)
            // Initialize CS:GO
            self.instances[id].client.gamesPlayed([config.appID])
        })
        self.instances[id].manager.on('pollData', (data) => {
            fs.writeFile(`./polls/${id}.json`, JSON.stringify(data))
        })
        self.instances[id].csgo.on('itemAcquired', (item) => {
            if (item) {
                self.floats[item.itemid] = {
                    defindex: item.defindex,
                    paintindex: item.paintindex,
                    rarity: item.rarity,
                    quality: item.quality,
                    paintwear: item.paintwear,
                    paintseed: item.paintseed,
                }
            }
        })
        self.instances[id].csgo.on('inspectItemInfo', (item) => {
            if (item) {
                self.floats[item.itemid] = {
                    defindex: item.defindex,
                    paintindex: item.paintindex,
                    rarity: item.rarity,
                    quality: item.quality,
                    paintwear: item.paintwear,
                    paintseed: item.paintseed,
                }
            }
        })
        // authenticated
        console.log(`Bot (${id}) has been logged-in.`)
        setTimeout(() => {
            if (count >= Object.keys(config.bots).length) {
                return this.startFloatChecker(id, () => {
                    return callback()
                })
            }
            console.log('Waiting until floats are checked before authenticating the second bot.')
            this.startFloatChecker(id, () => {
                console.log('Waiting 30 seconds before authenticating another bot to avoid Steam cooldowns.')
                return setTimeout(() => {
                    callback()
                }, 30000)
            })
        }, 15000)
    }, () => {
        console.log('[!] All bots online.')
        if (typeof done === 'function') {
            done()
        }
    })
}

Trade.prototype.addBotListeners = function addBotListeners() {
    this.botListen('manager', 'newOffer', (offer) => {
        setTimeout(() => offer.decline(), 30000)
    })
}

Trade.prototype.reloadBotSessions = function reloadBotSessions() {
    const self = this
    Object.keys(self.instances).forEach((id) => {
        self.instances[id].client.webLogOn()
    })
}

Trade.prototype.getBot = function getBot(id) {
    return this.instances[id]
}

Trade.prototype.botConfirmation = function botConfirmation(id, offerid, callback) {
    const bot = this.instances[id]
    bot.community.acceptConfirmationForObject(bot.user.identitySecret, offerid, callback)
}

Trade.prototype.botListen = function botListen(obj, listen, fn) {
    const self = this
    Object.keys(self.instances).forEach((id) => {
        self.instances[id][obj].on(listen, fn)
    })
}

Trade.prototype.startFloatChecker = function startFloatChecker(instanceID, done) {
    const self = this
    const instance = self.instances[instanceID]
    // Fetch instance inventory
    Trade.prototype.getInventory(config.bots[instanceID].steamID64, config.appID, config.contextID, (err, items) => {
        if (err) {
            console.log('[FloatChecker:Error]', `Could not get inventory for "${instanceID}", can't set floats.`)
            return done()
        }
        if (!items || !Object.keys(items).length) {
            console.log('[FloatChecker:Error]', `Could not get items for "${instanceID}", empty inventory?`)
            return done()
        }
        console.log('[FloatChecker:Progress]', `Starting to acquire floats for bot "${instanceID}". This can take a while if you have a lot of items.`)
        const csgo = instance.csgo
        // Go through all inventory items and inspect them for float values (paint wear)
        // Once all items have been checked, we callback and continue with the next bot
        async.eachOfSeries(items, (item, assetid, itemCallback) => {
            // Check if we already have inspected the item
            if (typeof self.floats[assetid] !== 'undefined' || !item.inspect) {
                return itemCallback()
            }
            csgo.inspectItem(item.inspect)
            setTimeout(itemCallback, 3000)
        }, () => {
            console.log('[FloatChecker:Progress]', `Done floats for bot "${instanceID}".`)
            return done()
        })
    })
}
