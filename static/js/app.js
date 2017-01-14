$(function() {
    var app = new Vue({
        el: '#app',
        data: {
            priceList: {},
            rates: {
                user: {},
                bot: {}
            },
            disableReload: true,
            disableTrade: true,
            // bot
            selectedBot: 'All bots',
            botInventories: {},
            botInventory: [],
            botInventorySelected: [],
            botInventorySelectedValue: 0,
            // user
            userInventory: [],
            userInventorySelected: [],
            userInventorySelectedValue: 0,
            // auth
            user: false,
            // site
            site: {
                header: '',
                steamGroup: '#',
                copyrights: ''
            },
            // trade
            offerStatus: {},
            invalidTradelink: false
        },
        methods: {
            setInventorySort: function(who, value) {
                if(who == 'bot') {
                    this.botInventory = this.sortInventory(this.botInventory, value);
                } else {
                    this.userInventory = this.sortInventory(this.userInventory, value);
                }
            },
            sortInventory: function(inventory, desc) {
                return inventory.sort(function(a, b) {
                    if(desc) {
                        return b.price - a.price;
                    } else {
                        return a.price - b.price;
                    }
                });
            },
            addItem: function(who, id, assetid, price) {
                if(typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                if(who == 'bot') {
                    if(this.selectedBot !== id) {
                        this.activeBot(id);
                    }
                    var botInventorySelected = this.botInventorySelected;
                    botInventorySelected.push(assetid);
                    this.botInventorySelected = botInventorySelected;
                    this.botInventorySelectedValue += parseFloat(price);
                } else {
                    var userInventorySelected = this.userInventorySelected;
                    userInventorySelected.push(assetid);
                    this.userInventorySelected = userInventorySelected;
                    this.userInventorySelectedValue += parseFloat(price);
                }
                this.checkTradeable();
            },
            removeItem: function(who, id, assetid, price) {
                if(typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                if(who == 'bot') {
                    var botInventorySelected = this.botInventorySelected;
                    delete botInventorySelected[botInventorySelected.indexOf(assetid)];
                    this.botInventorySelected = botInventorySelected;
                    this.botInventorySelectedValue -= price;
                } else {
                    var userInventorySelected = this.userInventorySelected;
                    delete userInventorySelected[userInventorySelected.indexOf(assetid)];
                    this.userInventorySelected = userInventorySelected;
                    this.userInventorySelectedValue -= price;
                    if(this.userInventorySelectedValue <= 0) {
                        this.userInventorySelectedValue = 0;
                    }
                }
                this.checkTradeable();
            },
            checkTradeable: function() {
                var user = parseFloat(this.userInventorySelectedValue.toFixed(2));
                var bot = parseFloat(this.botInventorySelectedValue.toFixed(2));
                if(user != 0 && user >= bot) {
                    this.disableTrade = false;
                } else {
                    this.disableTrade = true;
                }
            },
            activeBot: function(id) {
                if(this.selectedBot !== id) {
                    if(id == 'All Bots') {
                        var botInventory = [];
                        for(var i in this.botInventories) {
                            var bot = this.botInventories[i];
                            for(var y in bot.items) {
                                var item = bot.items[y];
                                item.bot = i;
                                item.price = this.priceList[item.data.market_hash_name];
                                botInventory.push(item);
                            }
                        }
                        this.botInventory = sortInventory(botInventory, true);
                    } else {
                        this.botInventory = this.sortInventory(this.botInventories[id].items, true);
                    }
                    this.botInventorySelected = [];
                    this.botInventorySelectedValue = 0;
                    this.selectedBot = id;
                }
            },
            searchInventory: function(who, value) {
                var inventory = [];
                var search = [];
                if(who == 'bot') {
                    search = this.botInventory;
                } else {
                    search = this.userInventory;
                }
                for(var i in search) {
                    var item = search[i];
                    if(item.data.market_hash_name.toLowerCase().indexOf(value.toLowerCase()) === -1) {
                        item.hidden = 1;
                    } else {
                        item.hidden = 0;
                    }
                    inventory.push(item);
                }
                if(who == 'bot') {
                    this.botInventory = sortInventory(inventory, true);
                } else {
                    this.userInventory = sortInventory(inventory, true);
                }
            },
            updateTradelink: function() {
                var link = this.user.tradelink;
                if(typeof link !== 'undefined') {
                    link = link.trim();
                    if(
                        link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
                        link.indexOf('?partner=') === -1 ||
                        link.indexOf('&token=') === -1
                    ) {
                        this.invalidTradelink = true;
                    } else {
                        ga('send', 'updateTradelink', {
                            eventCategory: 'Trade',
                            eventAction: 'click',
                            eventLabel: this.user.tradelink
                        });
                        this.invalidTradelink = false;
                        localStorage.setItem(this.user.id, this.user.tradelink);
                        $('#tradelink').modal('hide');
                    }
                } else {
                    this.invalidTradelink = true;
                }

            },
            reloadInventories: function() {
                this.disableReload = true;
                this.botInventory = [];
                this.botInventorySelected = [];
                this.botInventorySelectedValue = 0;
                this.userInventory = [];
                this.userInventorySelected = [];
                this.userInventorySelectedValue = 0;
                socket.emit('get bots inv');
                if(this.user && typeof this.user.steamID64 !== 'undefined') {
                    socket.emit('get user inv', this.user.steamID64);
                }
                ga('send', 'reloadInventories', {
                    eventCategory: 'Trade',
                    eventAction: 'click',
                    eventLabel: this.user.steamID64 || false
                });
            },
            sendOffer: function() {
                if( ! localStorage[this.user.id]) {
                    $('#tradelink').modal('show');
                } else {
                    ga('send', 'sendOffer', {
                        eventCategory: 'Trade',
                        eventAction: 'click',
                        eventLabel: this.user.id
                    });
                    this.offerStatus = {};
                    this.checkTradeable();
                    if( ! this.disableTrade) {
                        this.disableTrade = true;
                        $('#tradeoffer').modal('show');
                        socket.emit('get offer', {
                            user: this.userInventorySelected,
                            bot: this.botInventorySelected,
                            bot_id: this.selectedBot,
                            steamID64: this.user.id,
                            tradelink: localStorage[this.user.id]
                        });
                    }
                }
            }
        }
    });


    var socket = io.connect();
    socket.emit('get bots inv');
    socket.emit('get pricelist');
    socket.emit('get rates');

    socket.on('site', function(data) {
        app.site = data;
        window.document.title = data.header + ' | Web-based CS:GO Trading Bot';
    });

    socket.on('offer status', function(data) {
        app.offerStatus = data;
        if(data.status === 3 || data.status === false) {
            app.disableTrade = false;
        }
        if(data.status === 3) {
            app.botInventorySelected = [];
            app.botInventorySelectedValue = 0;
            app.userInventorySelected = [];
            app.userInventorySelectedValue = 0;
        }
    });

    socket.on('user', function(user) {
        user.steamID64 = user.id;
        app.user = user;

        if(app.user.steamID64) {
            socket.emit('get user inv', app.user.steamID64);
        }

        if(localStorage[app.user.id]) {
            app.user.tradelink = localStorage[app.user.id];
        }
        if(typeof app.user.tradelink === 'undefined' && app.user) {
            $('#tradelink').modal('show');
        }
    });

    socket.on('user inv', function(data) {
        app.disableReload = false;
        if( ! data.error) {
            var userInventory = [];
            for(var i in data.items) {
                var item = data.items[i];
                if(app.priceList[item.data.market_hash_name] <= app.rates.trash) {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.user['trash']).toFixed(2);
                } else {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.user[item.item_type.name]).toFixed(2);
                }
                userInventory.push(item);
            }
            if( ! userInventory.length) {
                userInventory = { error: { error: 'No tradeable items found.' } };
            } else {
                userInventory = sortInventory(userInventory, true);
            }
            app.userInventory = userInventory;
        } else {
            app.userInventory = data;
        }
    });

    socket.on('bots inv', function(items) {
        app.disableReload = false;
        app.botInventories = Object.assign({}, items);

        var botInventory = [];
        var error = false;
        for(var i in items) {
            var bot = items[i];
            if(bot.error) {
                error = bot.error;
            }
            for(var y in bot.items) {
                var item = bot.items[y];
                item.bot = i;
                if(app.priceList[item.data.market_hash_name] <= app.rates.trash) {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot['trash']).toFixed(2);
                } else {
                    item.price = (app.priceList[item.data.market_hash_name] * app.rates.bot[item.item_type.name]).toFixed(2);
                }
                botInventory.push(item);
            }
        }
        if( ! botInventory.length) {
            if( ! error) {
                error = { error: { error: 'No tradeable items found. Make sure all bots have items and are not set to private.' } };
            }
            botInventory = { error: error };
        } else {
            botInventory = sortInventory(botInventory, true);
        }
        app.botInventory = botInventory;
    });
    socket.on('pricelist', function(prices) {
        app.priceList = Object.assign({}, app.priceList, prices);
    });
    socket.on('rates', function(rates) {
        app.rates = Object.assign({}, app.rates, rates);
    });

    function sortInventory(inventory, desc) {
        return inventory.sort(function(a, b) {
            return (desc) ? b.price - a.price : a.price - b.price;
        });
    }

});
