'use strict';

const config = require('../config');
const async = require('async');
const fs = require('fs');
let Trade = require('./index');

const SteamUser           = require('steam-user');
const SteamCommunity      = require('steamcommunity');
const SteamTotp           = require('steam-totp');
const TradeOfferManager   = require('steam-tradeoffer-manager');

Trade.prototype.startBots = function(done) {
    let self = this;
    let count = 0;

    async.eachOfSeries(config.bots, function(bot, id, callback) {
        count++;
        let client = new SteamUser({
            'dataDirectory': null
        });
        self.instances[id] = {
            client: client,
            community: new SteamCommunity(),
            manager: new TradeOfferManager({
                'steam': client,
                'domain': config.domain,
                'language': 'en',
                'cancelTime': 600000
            }),
            login: {
                'accountName': bot.accountName,
                'password': bot.password,
                'twoFactorCode': SteamTotp.getAuthCode(bot.twoFactorCode)
            },
            user: bot
        };
        // identifiers
        self.instances[id].client.bot_id = id;
        self.instances[id].community.bot_id = id;
        self.instances[id].manager.bot_id = id;
        // polldata
        if(fs.existsSync(`./polls/${id}.json`)) {
            self.instances[id].manager.pollData = JSON.parse(fs.readFileSync(`./polls/${id}.json`));
        }
        // login
        self.instances[id].client.logOn(self.instances[id].login);
        self.instances[id].client.addListener('webSession', function(sessionID, cookies) {
            self.instances[id].manager.setCookies(cookies, function(err) {
                if(err) {
                    return callback(err);
                }
            });
            self.instances[id].community.setCookies(cookies);
            self.instances[id].client.setPersona(SteamUser.Steam.EPersonaState.LookingToTrade, bot.personaName);
        });
        self.instances[id].manager.on('pollData', function(data) {
            fs.writeFile(`./polls/${id}.json`, JSON.stringify(data));
        });
        // authenticated
        console.log(`Bot (${id}) has been logged-in.`);
        if(count >= Object.keys(config.bots).length) {
            return callback();
        } else {
            console.log('Waiting 30 seconds before authenticating another bot to avoid Steam cooldowns.');
            setTimeout(() => {
                return callback();
            }, 30000);
        }
    }, function() {
        console.log('[!] All bots online.');
        if(typeof done === 'function') {
            done();
        }
    });
}

Trade.prototype.addBotListeners = function() {
    this.listen('manager', 'newOffer', function(offer) {
        setTimeout(() => offer.decline(), 30000);
    });
}

Trade.prototype.reloadBotSessions = function() {
    for(let id in this.instances) {
        this.instances[id]['client'].webLogOn();
    }
}

Trade.prototype.getBot = function(id) {
    return this.instances[id];
}

Trade.prototype.botConfirmation = function(id, offerid, callback) {
    this.instances[id].community.acceptConfirmationForObject(this.instances[id].user.identitySecret, offerid, (err) => {
        return callback(err);
    });
}

Trade.prototype.listen = function(obj, listen, fn) {
    for(let id in this.instances) {
        this.instances[id][obj].on(listen, fn);
    }
}
