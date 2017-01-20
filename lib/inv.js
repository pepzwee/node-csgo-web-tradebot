'use strict';

const request = require('request');
const async = require('async');
let Trade = require('./index');

const MAX_RETRIES = 3;

Trade.prototype.getInventory = function(steamID64, appID, contextID, callback, retries) {
    request(`http://inventory.steamapis.com/get/${steamID64}/${appID}/${contextID}?key=VBZ495KxZxrxkMsZPJtb6fBf`, (error, response, body) => {
        if( ! error && response.statusCode === 200) {
            const items = JSON.parse(body);
            const assets = items.assets;
            const descriptions = items.descriptions;

            let inventory = {};

            for(let i in descriptions) {
                let description = items.descriptions[i];

                for(let y in assets) {
                    let asset = assets[y];

                    if(description.classid === asset.classid && description.tradable && description.marketable && description.market_hash_name.indexOf('Souvenir') === -1) {
                        if(typeof inventory[asset.assetid] !== 'undefined') {
                            continue;
                        }
                        inventory[asset.assetid] = asset;
                        inventory[asset.assetid]['item_type'] = Trade.prototype.getItemType(description.market_hash_name, description.type);
                        inventory[asset.assetid]['item_wear'] = Trade.prototype.getItemWear(description.market_hash_name);
                        inventory[asset.assetid]['data'] = {
                            background: description.background_color,
                            image: description.icon_url,
                            tradable: description.tradable,
                            marketable: description.marketable,
                            market_hash_name: description.market_hash_name,
                            type: description.type,
                            color: description.name_color
                        };
                    }
                }
            }
            return callback(null, inventory);
        } else {
            if(typeof retries === 'undefined') {
                retries = 0;
            }
            retries++;
            if(retries <= MAX_RETRIES) {
                return Trade.prototype.getInventory(steamID64, appID, contextID, callback, retries);
            } else {
                let statusCode = null;
                if(typeof response !== 'undefined' && typeof response.statusCode !== 'undefined') {
                    statusCode = response.statusCode;
                }
                return callback({ error: error, statusCode: statusCode });
            }
        }
    })
}

Trade.prototype.getInventories = function(params, callback) {
    let inventories = {};
    async.each(params, (user, cb) => {
        Trade.prototype.getInventory(user.steamID64, user.appID, user.contextID, (err, data) => {
            inventories[user.id] = {};
            inventories[user.id] = {
                error: err,
                items: ( ! err) ? Object.keys(data).map(function(key) { return data[key] }) : null
            };
            cb();
        });
    }, () => {
        callback(inventories);
    });
}

Trade.prototype.getItemType = function(market_hash_name, type) {
    if(market_hash_name.indexOf('Key') !== -1) {
        return { value: 0, name: 'key' };
    }
    if(market_hash_name.indexOf('★') !== -1) {
        return { value: 1, name: 'knife' };
    }
    if(
        type.indexOf('Classified') !== -1 ||
        type.indexOf('Covert') !== -1
    ) {
        return { value: 2, name: 'rare_skin' };
    }
    if(
        type.indexOf('Consumer Grade') !== -1 ||
        type.indexOf('Base Grade') !== -1 ||
        type.indexOf('Industrial Grade') !== -1
    ) {
        return { value: 4, name: 'misc' };
    }
    return { value: 3, name: 'weapon' };
}

Trade.prototype.getItemWear = function(market_hash_name) {
    if(market_hash_name.indexOf('Factory New') !== -1) {
        return 'FN';
    }
    if(market_hash_name.indexOf('Minimal Wear') !== -1) {
        return 'MW';
    }
    if(market_hash_name.indexOf('Field-Tested') !== -1) {
        return 'FT';
    }
    if(market_hash_name.indexOf('Well-Worn') !== -1) {
        return 'WW';
    }
    if(market_hash_name.indexOf('Battle-Scarred') !== -1) {
        return 'BS';
    }
    return false;
}
