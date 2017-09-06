'use strict'

const config = require('../config')
const request = require('request')
const Trade = require('./index')

const saPrices = `https://api.steamapis.com/market/items/730?format=compact&api_key=${config.SteamApisKey}`

Trade.prototype.getPrices = function getPrices(callback) {
    Trade.prototype.getSteamapis(3, (err, data) => { // 3 retries 
        if (err) {
            return this.getPrices(callback)
        }
        console.log('[!] Prices are updated.')
        return callback(data)
    })
}

Trade.prototype.getSteamapis = function getSteamapis(retries, callback) {
    request(saPrices, (error, response, body) => {
        const statusCode = (response) ? response.statusCode || false : false
        if(error) {
            if(retries > 0) {
                retries--
                Trade.prototype.getSteamapis(retries, callback)
            } else {
                return callback({ error, statusCode })
            }
        } else (!error && response.statusCode === 200) {
            const items = JSON.parse(body)
            return callback(null, items)
        }
    })
}
