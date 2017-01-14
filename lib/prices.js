'use strict';

const request = require('request');
let Trade = require('./index');

Trade.prototype.getPrices = function(callback) {
    let prices = {};
    Trade.prototype.getCsgofast((err, data) => {
        if( ! err) {
            prices = data;
        } else {
            return this.getPrices(callback);
        }
        Trade.prototype.getSteamapis((err, data) => {
            if( ! err) {
                for(let i in data) {
                    let price = data[i];
                    if(price) {
                        prices[i] = price;
                    }
                }
                return callback(prices);
            } else {
                return this.getPrices(callback);
            }
        });
    });
    console.log('[!] Prices are updated.');
}

Trade.prototype.getCsgofast = function(callback) {
    request('https://api.csgofast.com/price/all', (error, response, body) => {
        if( ! error && response.statusCode === 200) {
            let items = JSON.parse(body);
            return callback(null, items);
        } else {
            let statusCode = (response) ? response.statusCode || false : false;
            return callback({ error: error, statusCode: statusCode });
        }
    })
}

Trade.prototype.getSteamapis = function(callback) {
    request('http://api.steamapis.com/market/items/730?format=compact&key=VBZ495KxZxrxkMsZPJtb6fBf', (error, response, body) => {
        if( ! error && response.statusCode === 200) {
            let items = JSON.parse(body);
            return callback(null, items);
        } else {
            let statusCode = (response) ? response.statusCode || false : false;
            return callback({ error: error, statusCode: statusCode });
        }
    })
}
