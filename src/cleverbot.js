// ==UserScript==
// @name         Cleverbot Listener
// @version      1.0
// @description  Cleverbots side of the code.
// @author       ssp5zone
// @match        https://www.cleverbot.com/
// ==/UserScript==

/**
 * Copyright 2018 ssp5zone
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(function(){

    const origin = "web.whatsapp.com";
    let source, callerEvent;

    /**
     * Set to not remmember this conversation.
     * This is needed so that different bots 
     * do not cross wire.
     */
    // Wait for page to load
    window.addEventListener("load", () => {
        cleverbot.rememberconversation = 0;
        cleverbot.setCookieValue("CBREMCONV", "no");
        window.addEventListener("message", readMessage, false);
        console.debug("Whatsbot Ready!");
    });

    
    /**
     * This is called whenever any message comes from
     * the whatsapp side of the code from the other tab.
     * 
     * @param {*} event 
     */
    function readMessage(event) {
        // If not from our origin, dont do anything.
        if(event.origin.indexOf(origin) === -1) {
            return;
        }       
        // Extract the payload
        let payload = JSON.parse(event.data);
        source = payload.source; 
        callerEvent = event;
        // Call the bot
        think(payload.message);       
    }


    /**
     * The code that makes the bot think.
     * 
     * It just calls the xhr used by cleverbot and waits for the response.
     * 
     * @param {*} msg 
     */
    function think(msg) {
        cleverbot.aistate = 2;
        cleverbot.input = msg;
        let a = new XMLHttpRequest();
        a.onreadystatechange = function () {
            if (a.readyState != 4) {
                return
            }
            if (a.status == 200) {
                cleverbot.processAI(a.responseText, a.getResponseHeader("SC"), 0);
                reply(cleverbot.reply);
            }
        };
        let b = (new Date()).getTime() - cleverbot.lastreplytime;
        cleverbot.airequest = cleverbot.makeAIRequestBody(a, cleverbot.input, "yes", b);
    }

    /**
     * When the bot is ready to reply, this is called.
     * 
     */
    function reply(message) {
        // Add source information so the caller code would be able to identify
        // who sent the response.
        let payload = {
            source: source,
            message: message,
        };

        // Send the reply back to the caller tab
        callerEvent.source.postMessage(JSON.stringify(payload), callerEvent.origin);
    }

    
})();