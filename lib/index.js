'use strict'

const config = require('../config')
const async = require('async')

function Trade(params) {
    this.prices = {}
    this.floats = {}
    this.instances = []

    this.io = params.io || false

    this.getPrices((prices) => {
        this.prices = prices
    })
    setInterval(() => {
        this.getPrices((prices) => {
            this.prices = prices
        })
    }, 21600000)

    this.startBots(() => {
        this.addBotListeners()
        setInterval(() => this.reloadBotSessions(), 3600000)
    })
}

Trade.prototype.getPriceList = function getPriceList() {
    return this.prices
}

Trade.prototype.getFloatValues = function getFloatValues() {
    return this.floats
}

Trade.prototype.getPrice = function getPrice(name, rateType, itemType) {
    const price = this.prices[name] * config.rates[rateType][itemType.name] || 0
    // Check if price is below ignoreItemsBelow value.
    // If it is we set the value to 0
    if (price <= config.rates.ignoreItemsBelow) {
        return 0
    }
    return price
}

Trade.prototype.getUserRates = function getUserRates() {
    return config.rates.user
}

Trade.prototype.getBotRates = function getBotRates() {
    return config.rates.bot
}

Trade.prototype.getTrashPrice = function getTrashPrice() {
    return config.rates.trashPriceBelow
}

Trade.prototype.getIgnorePrice = function getIgnorePrice() {
    return config.rates.ignoreItemsBelow
}

Trade.prototype.validateOffer = function validateOffer(object, callback) {
    const self = this

    let userValue = 0
    let botValue = 0
    let userCount = 0
    let botCount = 0

    const obj = object
    obj.user = obj.user.filter(Boolean)
    obj.bot = obj.bot.filter(Boolean)

    if (!obj.user.length) {
        return callback('(╯°□°）╯︵ ┻━┻ How about no?')
    }
    return self.getInventory(obj.steamID64, config.appID, config.contextID, (err, data) => {
        if (err) {
            return callback('Could not verify inventory contents for the trade. Please try again later!')
        }
        const userInventory = data
        return async.forEach(Object.keys(userInventory), (index, cb) => {
            const item = userInventory[index]
            if (obj.user.indexOf(item.assetid) !== -1) {
                const price = self.getPrice(item.data.market_hash_name, 'user', item.item_type)
                userCount += 1
                if (config.rates.trashPriceBelow >= price) {
                    userValue += price * config.rates.user.trash
                } else {
                    userValue += price
                }
            }
            cb()
        }, () => {
            if (obj.bot.length) {
                console.log(obj.bot)
                if (typeof config.bots[obj.bot_id] === 'undefined') {
                    return callback('(╯°□°）╯︵ ┻━┻ How about no?')
                }
                self.getInventory(config.bots[obj.bot_id].steamID64, config.appID, config.contextID, (invErr, invData) => {
                    if (invErr) {
                        return callback('Could not verify inventory contents for the trade. Please try again later!')
                    }
                    const botInventory = invData
                    return async.forEach(Object.keys(botInventory), (index, cb) => {
                        const item = botInventory[index]
                        if (obj.bot.indexOf(item.assetid) !== -1) {
                            const price = self.getPrice(item.data.market_hash_name, 'bot', item.item_type)
                            botCount += 1
                            if (config.rates.trashPriceBelow >= price) {
                                botValue += price * config.rates.bot.trash
                            } else {
                                botValue += price
                            }
                            if (price === 0) {
                                return cb('Could not get a price for item(s). Trade has been cancelled.')
                            }
                        }
                        return cb()
                    }, (cbError) => {
                        if (cbError) {
                            return callback(cbError)
                        }
                        if (botCount !== obj.bot.length) {
                            return callback('Some items were not found in bots inventory!')
                        }
                        if (
                            parseFloat(userValue.toFixed(2)) < parseFloat(botValue.toFixed(2))
                        ) {
                            return callback('You do not have enough value!')
                        }
                        return callback(null, true)
                    })
                })
            } else {
                if (userCount !== obj.user.length) {
                    console.log(userCount, obj.user.length, obj.user)
                    return callback('Some items were not found in users inventory!')
                }
                return callback(null, true)
            }
            return false
        })
    })
}

module.exports = Trade

require('./bots')
require('./inv')
require('./prices')
