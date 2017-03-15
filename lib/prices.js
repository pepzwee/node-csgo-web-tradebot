'use strict'

const config = require('../config')
const request = require('request')
const Trade = require('./index')

const cfPrices = 'https://api.csgofast.com/price/all'
const saPrices = `https://api.steamapis.com/market/items/730?format=compact&api_key=${config.SteamApisKey}`

Trade.prototype.getPrices = function getPrices(callback) {
    let prices = {}
    Trade.prototype.getCsgofast((err, data) => {
        if (err) {
            return this.getPrices(callback)
        }
        prices = data
        Trade.prototype.getSteamapis((saErr, saData) => {
            if (saErr) {
                return this.getPrices(callback)
            }
            Object.keys(saData).forEach((marketHashName) => {
                const value = saData[marketHashName]
                if (value) {
                    prices[marketHashName] = value
                }
            })
            console.log('[!] Prices are updated.')
            return callback(prices)
        })
        return false
    })
}

Trade.prototype.getCsgofast = function getCsgofast(callback) {
    request(cfPrices, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const items = JSON.parse(body)
            return callback(null, items)
        }
        const statusCode = (response) ? response.statusCode || false : false
        return callback({ error, statusCode })
    })
}

Trade.prototype.getSteamapis = function getSteamapis(callback) {
    request(saPrices, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const items = JSON.parse(body)
            return callback(null, items)
        }
        const statusCode = (response) ? response.statusCode || false : false
        return callback({ error, statusCode })
    })
}
