'use strict'

const config = require('../config')
const request = require('request')
const Trade = require('./index')

const saPrices = `https://api.steamapis.com/market/items/730?format=compact&api_key=${config.SteamApisKey}`

Trade.prototype.getPrices = function getPrices(callback) {
    Trade.prototype.getSteamapis((err, data) => {
        if (err) {
            // TODO: Infinite getPrices call if error.. add max retries
            return this.getPrices(callback)
        }
        console.log('[!] Prices are updated.')
        return callback(data)
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
