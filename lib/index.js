'use strict';

const config = require('../config');

module.exports = Trade;

function Trade(params) {
    this.prices = {};
    this.instances = [];

    this.io = params.io || false;

    this.getPrices((prices) => {
        this.prices = prices;
    });
    setInterval(() => {
        this.getPrices((prices) => {
            this.prices = prices;
        });
    }, 21600000);

    this.startBots(() => {
        this.addBotListeners();
        setInterval(() => this.reloadBotSessions(), 3600000);
    });
}

Trade.prototype.getPriceList = function() {
    return this.prices;
}

Trade.prototype.getPrice = function(name, rateType, itemType) {
    return this.prices[name] * config.rates[rateType][itemType.name] || 0;
}

Trade.prototype.getUserRates = function() {
    return config.rates.user;
}

Trade.prototype.getBotRates = function() {
    return config.rates.bot;
}

Trade.prototype.getTrashPrice = function() {
    return config.rates.trashPriceBelow;
}

Trade.prototype.getIgnorePrice = function() {
    return config.rates.ignoreItemsBelow;
}

Trade.prototype.validateOffer = function(obj, callback) {
    let self = this;

    let userValue = 0;
    let botValue = 0;
    let userCount = 0;
    let botCount = 0;

    if(obj.user.length) {
        self.getInventory(obj.steamID64, '730', '2', (err, data) => {
            if( ! err) {
                let userInventory = data;
                for(let i in userInventory) {
                    let item = userInventory[i];
                    if(obj.user.indexOf(item.assetid) !== -1) {
                        userCount = userCount + 1;
                        userValue += self.getPrice(item.data.market_hash_name, 'user', item.item_type);
                    }
                }

                if(obj.bot.length) {
                    if(typeof config.bots[obj.bot_id] === 'undefined') {
                        return callback('(╯°□°）╯︵ ┻━┻ STAPH NAOW!');
                    }
                    self.getInventory(config.bots[obj.bot_id].steamID64, '730', '2', (err, data) => {
                        if( ! err) {
                            let botInventory = data;
                            for(let i in botInventory) {
                                let item = botInventory[i];
                                if(obj.bot.indexOf(item.assetid) !== -1) {
                                    botCount = botCount + 1;
                                    botValue += self.getPrice(item.data.market_hash_name, 'bot', item.item_type);
                                    if(self.getPrice(item.data.market_hash_name, 'bot', item.item_type) === 0) {
                                        return callback('Could not get a price for item(s). Trade has been cancelled.');
                                    }
                                }
                            }
                            if(userCount !== obj.user.length) {
                                return callback('Some items were not found in users inventory!');
                            }
                            if(botCount !== obj.bot.length) {
                                return callback('Some items were not found in bots inventory!');
                            }
                            if(parseFloat(userValue.toFixed(2)) < parseFloat(botValue.toFixed(2))) {
                                return callback('You do not have enough value!');
                            }
                            return callback(null, true);
                        } else {
                            return callback('Could not verify inventory contents for the trade. Please try again later!');
                        }
                    });
                } else {
                    if(userCount !== obj.user.length) {
                        return callback('Some items were not found in users inventory!' + `${userCount}|${obj.user.length}`);
                    }
                    if(botCount !== obj.bot.length) {
                        return callback('Some items were not found in bots inventory!');
                    }
                    if(parseFloat(userValue.toFixed(2)) < parseFloat(botValue.toFixed(2))) {
                        return callback('You do not have enough value!');
                    }
                    return callback(null, true);
                }
            } else {
                return callback('Could not verify inventory contents for the trade. Please try again later!');
            }
        });
    } else {
        return callback('(╯°□°）╯︵ ┻━┻ STAPH!');
    }

};

require('./bots');
require('./inv');
require('./prices');
