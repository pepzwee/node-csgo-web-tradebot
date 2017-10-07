'use strict'

const config = require('../config')
const request = require('request')
const async = require('async')
const Trade = require('./index')

const MAX_RETRIES = 3
const API_URL = 'https://api.steamapis.com/steam/inventory'

Trade.prototype.getInventory = function getInventory(steamID64, appID, contextID, callback, retries) {
    request(`${API_URL}/${steamID64}/${appID}/${contextID}?api_key=${config.SteamApisKey}`, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const items = JSON.parse(body)
            const assets = items.assets
            const descriptions = items.descriptions

            const inventory = {}

            if (descriptions && assets) {
                async.forEach(descriptions, (description, cbDesc) => async.forEach(assets, (asset, cbAsset) => {
                    if (
                        description.classid === asset.classid
                        && description.tradable
                        && description.market_hash_name.indexOf('Souvenir') === -1
                    ) {
                        if (typeof inventory[asset.assetid] !== 'undefined') {
                            return true
                        }
                        const type = Trade.prototype.getItemType(description.market_hash_name, description.type)
                        const wear = Trade.prototype.getItemWear(description.market_hash_name)
                        const inspect = Trade.prototype.getInspect(steamID64, asset.assetid, description.actions)
                        inventory[asset.assetid] = asset
                        inventory[asset.assetid].item_type = type
                        inventory[asset.assetid].item_wear = wear
                        inventory[asset.assetid].inspect = inspect
                        inventory[asset.assetid].data = {
                            background: description.background_color,
                            image: description.icon_url,
                            tradable: description.tradable,
                            marketable: description.marketable,
                            market_hash_name: description.market_hash_name,
                            type: description.type,
                            color: description.name_color,
                        }
                    }
                    return cbAsset()
                }, cbDesc))
            }
            return callback(null, inventory)
        }
        let retry = retries
        if (typeof retries === 'undefined') {
            retry = 0
        }
        retry += 1
        if (retry <= MAX_RETRIES) {
            return Trade.prototype.getInventory(steamID64, appID, contextID, callback, retry)
        }
        let statusCode = null
        if (typeof response !== 'undefined' && typeof response.statusCode !== 'undefined') {
            statusCode = response.statusCode
        }
        return callback({ error, statusCode })
    })
}

Trade.prototype.getInventories = function getInventories(params, callback) {
    const inventories = {}
    async.each(params, (user, cb) => {
        Trade.prototype.getInventory(user.steamID64, user.appID, user.contextID, (err, data) => {
            inventories[user.id] = {}
            inventories[user.id] = {
                error: err,
                items: (!err) ? Object.keys(data).map(key => data[key]) : null,
            }
            cb()
        })
    }, () => {
        callback(inventories)
    })
}

Trade.prototype.getItemType = function getItemType(marketHashName, type) {
    if (marketHashName.indexOf('Key') !== -1) {
        return { value: 0, name: 'key' }
    }
    if (marketHashName.indexOf('★') !== -1) {
        return { value: 1, name: 'knife' }
    }
    if (
        type.indexOf('Classified') !== -1 ||
        type.indexOf('Contraband') !== -1 ||
        type.indexOf('Covert') !== -1
    ) {
        return { value: 2, name: 'rare_skin' }
    }
    if (
        type.indexOf('Consumer Grade') !== -1 ||
        type.indexOf('Base Grade') !== -1 ||
        type.indexOf('Graffiti') !== -1 ||
        type.indexOf('Sticker') !== -1 ||
        type.indexOf('Industrial Grade') !== -1
    ) {
        return { value: 4, name: 'misc' }
    }
    return { value: 3, name: 'weapon' }
}

Trade.prototype.getItemWear = function getItemWear(marketHashName) {
    if (marketHashName.indexOf('Factory New') !== -1) {
        return 'FN'
    }
    if (marketHashName.indexOf('Minimal Wear') !== -1) {
        return 'MW'
    }
    if (marketHashName.indexOf('Field-Tested') !== -1) {
        return 'FT'
    }
    if (marketHashName.indexOf('Well-Worn') !== -1) {
        return 'WW'
    }
    if (marketHashName.indexOf('Battle-Scarred') !== -1) {
        return 'BS'
    }
    return false
}
Trade.prototype.getInspect = function getInspect (steamID64, assetid, actions) {
    let inspectLink = null;                                           
    if (actions) {
        for (const a in actions) {
            if (actions[a].name.indexOf('Inspect') !== -1) {
                   inspectLink = actions[a].link
                   inspectLink = inspectLink.replace('%owner_steamid%', steamID64)
                   inspectLink = inspectLink.replace('%assetid%', assetid)
            }
        }
    }
    return inspectLink
}
