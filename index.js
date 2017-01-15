'use strict';
// Modules
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const passport = require('passport');
const util = require('util');
const session = require('express-session');
const sharedsession = require('express-socket.io-session');
const FileStore = require('session-file-store')(session);
const SteamStrategy = require('passport-steam').Strategy;
// Site stuff
const TradeBot = require('./lib/index');
const Trade = new TradeBot({ io: io });
const config = require('./config');
// Web server
server.listen(config.websitePort);
console.log('[!] Website server is online.');
console.log('[!] Socket server is online.');
// Passport
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
passport.use(new SteamStrategy({
        returnURL: `${config.website}/auth/steam/return`,
        realm: `${config.website}/`,
        apiKey: config.steamApiKey
    },
    function(identifier, profile, done) {
        process.nextTick(function() {
            profile.identifier = identifier;
            return done(null, profile);
        });
    }
));
let sessionMiddleware = session({
    store: new FileStore(),
    secret: 'csg0tradebot',
    name: 'csg0trade',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use('/static', express.static('./static'));
// Routes
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
// Auth Routes
app.get('/auth/steam',
    passport.authenticate('steam'),
    function(req, res) {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
    }
);
app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/auth/steam' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
// Sockets
io.use(sharedsession(sessionMiddleware));
io.on('connection', function(socket) {
    let userObject = false;
    if(
        typeof socket.handshake.session.passport !== 'undefined' &&
        typeof socket.handshake.session.passport.user !== 'undefined' &&
        typeof socket.handshake.session.passport.user.id !== 'undefined'
    ) {
        userObject = socket.handshake.session.passport.user;
    }

    socket.emit('site', config.site);
    socket.emit('user', userObject);
    socket.on('get user inv', (steamID64) => {
        Trade.getInventory(steamID64, '730', '2', (err, data) => {
            socket.emit('user inv', { error: err, items: data });
        });
    });
    socket.on('get bot inv', (id) => {
        Trade.getInventory(config.bots[id].steamID64, '730', '2', (err, data) => {
            socket.emit('bot inv', { error: err, items: data });
        });
    });
    socket.on('get bots inv', () => {
        let params = [];
        for(let i in config.bots) {
            let bot = config.bots[i];
            params.push({
                id: i,
                steamID64: bot.steamID64,
                appID: '730',
                contextID: '2'
            });
        }
        Trade.getInventories(params, (data) => {
            socket.emit('bots inv', data);
        });
    });
    socket.on('get pricelist', () => {
        socket.emit('pricelist', Trade.getPriceList());
    });
    socket.on('get rates', () => {
        socket.emit('rates', {
            ignore: Trade.getIgnorePrice(),
            trash: Trade.getTrashPrice(),
            user: Trade.getUserRates(),
            bot: Trade.getBotRates()
        })
    });
    socket.on('get offer', (data) => {
        socket.emit('offer status', {
            error: null,
            status: 4
        });
        let link = data.tradelink;
        if(
            link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
            link.indexOf('?partner=') === -1 ||
            link.indexOf('&token=') === -1
        ) {
            socket.emit('offer status', {
                error: 'Invalid trade link!',
                status: false
            });
        } else {
            Trade.validateOffer(data, (err, success) => {
                socket.emit('offer status', {
                    error: err,
                    status: (success) ? 1 : false
                });
                if( ! err && success) {
                    if(typeof config.bots[data.bot_id] === 'undefined') {
                        data.bot_id = Object.keys(config.bots)[0];
                    }
                    let Bot = Trade.getBot(data.bot_id);
                    let offer = Bot.manager.createOffer(data.tradelink);
                    offer.addTheirItems(data.user.map((assetid) => {
                        return {
                            assetid: assetid,
                            appid: 730,
                            contextid: 2,
                            amount: 1
                        };
                    }));
                    if(data.bot.length) {
                        offer.addMyItems(data.bot.map((assetid) => {
                            return {
                                assetid: assetid,
                                appid: 730,
                                contextid: 2,
                                amount: 1
                            };
                        }));
                    }
                    offer.setMessage(config.tradeMessage);
                    offer.send((err, status) => {
                        if(err) {
                            socket.emit('offer status', {
                                error: err,
                                status: false
                            });
                        } else {
                            console.log('[!!!!!] Sent a trade: ', data);
                            if(status == 'pending') {
                                socket.emit('offer status', {
                                    error: null,
                                    status: 2
                                });
                                Trade.botConfirmation(data.bot_id, offer.id, (err) => {
                                    if( ! err) {
                                        socket.emit('offer status', {
                                            error: null,
                                            status: 3,
                                            offer: offer.id
                                        });
                                    } else {
                                        socket.emit('offer status', {
                                            error: err,
                                            status: false
                                        });
                                    }
                                });
                            } else {
                                socket.emit('offer status', {
                                    error: null,
                                    status: 3,
                                    offer: offer.id
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});
