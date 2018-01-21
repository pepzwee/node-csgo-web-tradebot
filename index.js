'use strict'

// Modules
const express = require('express')

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const passport = require('passport')

const session = require('express-session')
const sharedsession = require('express-socket.io-session')
const SteamStrategy = require('passport-steam').Strategy
// Site stuff
const TradeBot = require('./lib/index')

const Trade = new TradeBot({ io })
const config = require('./config')
// Web server
server.listen(config.websitePort)
console.log('[!] Website server is online.')
console.log('[!] Socket server is online.')
// Passport
passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((obj, done) => {
    done(null, obj)
})
passport.use(new SteamStrategy({
    returnURL: `${config.website}/auth/steam/return`,
    realm: `${config.website}/`,
    apiKey: config.steamApiKey,
},
(identifier, profile, done) => {
    process.nextTick(() => {
        const user = profile
        user.identifier = identifier
        return done(null, user)
    })
}))
const sessionMiddleware = session({
    secret: 'csg0tradebot',
    name: 'csg0trade',
    resave: true,
    saveUninitialized: true,
})
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
app.use('/static', express.static('./static'))
// Routes
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})
// Auth Routes
app.get('/auth/steam', passport.authenticate('steam'))
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/auth/steam' }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/')
})
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
// Sockets
io.use(sharedsession(sessionMiddleware))
io.on('connection', (socket) => {
    let userObject = false
    if (
        typeof socket.handshake.session.passport !== 'undefined' &&
        typeof socket.handshake.session.passport.user !== 'undefined' &&
        typeof socket.handshake.session.passport.user.id !== 'undefined'
    ) {
        userObject = socket.handshake.session.passport.user
    }

    socket.emit('site', config.site)
    socket.emit('user', userObject)
    socket.on('get user inv', (steamID64) => {
        Trade.getInventory(steamID64, config.appID, config.contextID, (err, data) => {
            socket.emit('user inv', { error: err, items: data })
        })
    })
    socket.on('get bot inv', (id) => {
        Trade.getInventory(config.bots[id].steamID64, config.appID, config.contextID, (err, data) => {
            socket.emit('bot inv', { error: err, items: data })
        })
    })
    socket.on('get bots inv', () => {
        const params = []
        Object.keys(config.bots).forEach((index) => {
            const bot = config.bots[index]
            params.push({
                id: index,
                steamID64: bot.steamID64,
                appID: config.appID,
                contextID: config.contextID,
            })
        })
        Trade.getInventories(params, (data) => {
            socket.emit('bots inv', data)
            socket.emit('bots floats', Trade.getFloatValues())
        })
    })
    socket.on('get pricelist', () => {
        socket.emit('pricelist', Trade.getPriceList())
    })
    socket.on('get rates', () => {
        socket.emit('rates', {
            ignore: Trade.getIgnorePrice(),
            trash: Trade.getTrashPrice(),
            user: Trade.getUserRates(),
            bot: Trade.getBotRates(),
        })
    })
    socket.on('get offer', (data) => {
        socket.emit('offer status', {
            error: null,
            status: 4,
        })
        const link = data.tradelink
        const offerData = data
        if (
            link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
            link.indexOf('?partner=') === -1 ||
            link.indexOf('&token=') === -1
        ) {
            socket.emit('offer status', {
                error: 'Invalid trade link!',
                status: false,
            })
        } else {
            Trade.validateOffer(offerData, (err, success) => {
                socket.emit('offer status', {
                    error: err,
                    status: (success) ? 1 : false,
                })
                if (!err && success) {
                    if (typeof config.bots[offerData.bot_id] === 'undefined') {
                        offerData.bot_id = Object.keys(config.bots)[0]
                    }
                    const Bot = Trade.getBot(offerData.bot_id)
                    const offer = Bot.manager.createOffer(offerData.tradelink)
                    offer.addTheirItems(offerData.user.map(assetid => ({
                        assetid,
                        appid: config.appID,
                        contextid: config.contextID,
                        amount: 1,
                    })))
                    if (offerData.bot.length) {
                        offer.addMyItems(offerData.bot.map(assetid => ({
                            assetid,
                            appid: config.appID,
                            contextid: config.contextID,
                            amount: 1,
                        })))
                    }
                    offer.setMessage(config.tradeMessage)
                    offer.getUserDetails((detailsError, me, them) => {
                        if (detailsError) {
                            socket.emit('offer status', {
                                error: detailsError,
                                status: false,
                            })
                        } else if (me.escrowDays + them.escrowDays > 0) {
                            socket.emit('offer status', {
                                error: 'You must have 2FA enabled, we do not accept trades that go into Escrow.',
                                status: false,
                            })
                        } else {
                            offer.send((errSend, status) => {
                                if (errSend) {
                                    socket.emit('offer status', {
                                        error: errSend,
                                        status: false,
                                    })
                                } else {
                                    console.log('[!!!!!] Sent a trade: ', data)
                                    if (status === 'pending') {
                                        socket.emit('offer status', {
                                            error: null,
                                            status: 2,
                                        })
                                        Trade.botConfirmation(data.bot_id, offer.id, (errConfirm) => {
                                            if (!errConfirm) {
                                                socket.emit('offer status', {
                                                    error: null,
                                                    status: 3,
                                                    offer: offer.id,
                                                })
                                            } else {
                                                socket.emit('offer status', {
                                                    error: errConfirm,
                                                    status: false,
                                                })
                                            }
                                        })
                                    } else {
                                        socket.emit('offer status', {
                                            error: null,
                                            status: 3,
                                            offer: offer.id,
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})
