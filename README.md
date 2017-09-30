# Web Based Trading Bot for CS:GO

[![dependencies](https://img.shields.io/david/pepzwee/node-csgo-web-tradebot.svg)](https://github.com/pepzwee/node-csgo-web-tradebot)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)](https://github.com/pepzwee/node-csgo-web-tradebot/blob/master/LICENSE)
[![steam](https://img.shields.io/badge/steam-donate-green.svg?style=flat-square)](https://steamcommunity.com/tradeoffer/new/?partner=78261062&token=2_WUiltH)
[![paypal](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XKPQ3TWDYJ2Z6)

### Do not add PEPZ on Steam. If you have a question or need help, look through "Issues" and create a new issue if you can't find an answer.

This is a quickly coded website for people who want to see how these kind of websites work. Before you decide to use this script be aware, that this script, may have bugs.
I also suggest looking through the code to see how it works, and if you spot an error make a pull request.

Live preview:

* [https://csg0.trade](https://csg0.trade) (Using outdated version)

# Installation

Tutorial: [https://steamapis.com/projects/node-csgo-web-tradebot](https://steamapis.com/projects/node-csgo-web-tradebot)

# API Usage

### Prices

The script gets its prices from SteamApis. If you don't feel comfortable with any of the API's this script uses, feel free to change them to your preferred one.

1. SteamApis.com API for market tier items, using the `safe_price` values provided by it.

<pre>* SteamApis provides high tier items as well.</pre>

### Inventory

To avoid Steam rate-limits all inventories are loaded through SteamApis.com inventory proxy. It utilizes thousands of proxies to maintain a high success rate.

### SteamApis.com

SteamApis is a paid service. You can get the API key at https://steamapis.com

**You need to enable these endpoints in the Upgrade page:**

- `market/items`
- `steam/inventory`

# Support and Development

### Development

I don't plan on adding any additional features. But feel free to add them yourself and make a pull request.

### Support

Keep in mind this project is free and open-source. Don't expect support to be good and fast.

### Contributors

Author: [PEPZ](https://pepzwee.com)
You can view the [people who have helped with this project here.](https://github.com/pepzwee/node-csgo-web-tradebot/graphs/contributors)
