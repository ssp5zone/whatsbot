# Whatsbot (web.WhatsApp + Cleverbot.com)

Add cleverbots to your selected whatsapp chats.

A fairly simple JavaScript only code that connects a bot from https://cleverbot.com to a chat in https://web.whatsapp.com.

![](docs/demo.gif)

**Note:** Each bot opens in a new tab. So if you were chatting with 21 people; 21 additional tabs would be open.

## Usage

### Running
1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension for Chrome or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) for Firefox.
2. In the installed extention, click _Create new Scripts_.
3. Copy contents of each file in `src` folder as a new script and save.

_OR_
3.a   Dowload this repo.\
3.b Go to > Utilities > File > Import ( and select `whatsapp.js` and `cleverbot.js` in src folder)

_OR_

3.a Dowload the latest release.\
3.b Go to > Utilities > Zip > Import > Select the downloaded `whatsbot.zip`

_OR_

3.a Go to > Utilities > URL > https://raw.githubusercontent.com/ssp5zone/whatsbot/master/src/whatsapp.js \
3.b Go to > Utilities > URL > https://raw.githubusercontent.com/ssp5zone/whatsbot/master/src/cleverbot.js


### Settings
_(Optional)_
You can **Blacklist** or **Whitelist** certain contacts by adding them in `src/whatsapp.js`,
```Javascript
    /**
     * Whitelisted contacts.
     * 
     * I want to attach a bot for these contacts ONLY.
     * Default - Empty => Talk to everyone.
     */
    const whitelist = []; // You can also give a comma seperated values intead of array

    /**
     * Blacklisted contacts.
     * 
     * I DO NOT want any bot talking to these.
     * Default - Empty => Don't ignore anyone.
     */
    const blacklist = []; // You can also give a comma seperated values intead of array
```

## To do
1. Convert `chatListener()` to `MutationObserver` instead of poller.
2. Add source to target bot on init - Only once.
3. Add target load complete watcher.

## Disclaimer
Use wisely.
