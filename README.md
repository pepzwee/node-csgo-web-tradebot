# Web Based Trading Bot for CS:GO

This is a quickly coded website for people who want to see how these kind of websites work. Before you decide to use this script be aware, that this script, may have bugs.
I also suggest looking through the code to see how it works, and if you spot an error make a pull request.

Live preview:

* [http://csg0.trade](http://csg0.trade)

# API Usage

### Prices

The script gets its prices from two sources. If you don't feel comfortable with any of the API's this script uses, feel free to change them to your preferred one.

1. CSGOFast API for it's high tier items, anything that's not high tier will be ignored.
2. SteamApis.com API for market tier items, using the `safe_price` values provided by it.

### Inventory

To avoid Steam rate-limits all inventories are loaded through SteamApis.com inventory proxy. It utilizes thousands of proxies to maintain a high success rate.

# Support and Development

### Development

I don't plan on adding any additional features. But feel free to add them yourself and make a pull request.

### Support

Keep in mind this project is free and open-source. Don't expect support to be good and fast.