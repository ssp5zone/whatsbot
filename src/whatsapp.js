// ==UserScript==
// @name         Whatsapp Listener
// @version      1.0
// @description  Whatsapp side of the code.
// @author       ssp5zone
// @match        https://web.whatsapp.com/
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
(function () {    

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


    // Inject jQuery 
    injectjQuery();

    // Wait for page to load
    window.addEventListener("load", () => {
        let whatsapp = whatsAppFactory();
        watch(whatsapp);
        console.debug("Watching whatsapp");
    });

    // The one that watches everything
    function watch(whatsapp) {

        // We do not store the people/groups names, just the HTML entity
        let talkingTo,
        // a flag that is used internally to trigger processing
        __isProcessing = false;

        let replyQueue = []; // Stores bot replies sequentially
        let chatQueue = []; // Stores user pings sequentially

        // A Map of <ChatingEntity, Bot>
        let botMap = new Map();

        botListener();
        chatListener();

        /**
         * The one that processes all the queues
         */
        function processQueue () {
            if(replyQueue.length) {
                let payload = replyQueue.shift();
                processReply(payload);
                processQueue(); // recursive redundant
            } 
            else if(chatQueue.length) {
                let chat = chatQueue.shift();
                processChat(chat);
                processQueue(); // recursive redundant
            }
            __isProcessing = false;
        }

        /**
         * The one that haldles reply from bot
         * 
         * @param {Payload} payload 
         */
        function processReply(payload) {
            talkingTo = payload.source;
            whatsapp.open(payload.source);
            whatsapp.write(payload.message);
            whatsapp.send();
        }


        /**
         * The one that handles a new ping
         * 
         * @param {HTMLElement} chat 
         */
        function processChat(chat) {

            // If this ping is not from the guy we are talking to
            if(chat != talkingTo) {
                talkingTo = chat;
                // open that window
                whatsapp.open(chat);
            }
            // Get the bot allocated for this chat
            let bot = getBot(chat);
            // Read the message
            let message = whatsapp.read();
            // Only if this is a legible message
            if(message !== "") {
                bot.send(message);
            }

        }

        /**
         * The one that keeps listening to any new chat.
         * 
         */
        function chatListener() {
            // Check for any new chats
            let newChats = whatsapp.check();

            // for each new chat
            newChats.forEach(chat => {
                // check if not already in the queue and are we suppose to chat with this entity
                if(shouldChat(chat) && chatQueue.indexOf(chat) === -1) {
                    // if not add it
                    chatQueue.push(chat);
                }
            });

            // Notify the processor 
            notify();

            // recheck after a quater second
            setTimeout(chatListener, 250);
        }


        /**
         * The one that listenes to the replies from various bots
         */
        function botListener() {
            const crossOrigin = "cleverbot.com";
            window.addEventListener("message", (event) => {
                if(event.origin.indexOf(crossOrigin) === -1) {
                    return;
                } 
                // If a valid reply, add it to reply queue
                replyQueue.push(JSON.parse(event.data));
                // Notify the processor
                notify();

            }, false);
        }

        /**
         * A simple notification macro that
         * calls the processor if it is available.
         */
        function notify() {
            if(!__isProcessing) {
                __isProcessing = true;
                processQueue();
            }
        }

        function getBot(chat) {
            if(botMap.has(chat)) {
                return botMap.get(chat);
            } else {
                let bot = new CleverBot(chat);
                botMap.set(chat, bot);
                return bot;
            }
        }

        function shouldChat(chat) {
            if(blacklist && blacklist.length && blacklist.indexOf(chat.trim())) {
                return false;
            }
            if(whitelist && whitelist.length && !whitelist.indexOf(chat.trim())) {
                return false;
            }
            return true;
        }

    }

    /**
     * A factory that creates a WhatsApp Web handler.
     * 
     * The returned handler provides various mechanisms to 
     * use the Whatsapp page
     */
    function whatsAppFactory() {

        // To identify a new message
        const isBold = (element) => ['500', '600', '700', '800', '900', 'bold', 'bolder'].indexOf($(element).css('font-weight')) > -1;  

        // the bundled handler
        return {
            write: getWriter(),
            send: send,
            read: readLatest,
            check: () => getMsgElements().filter(isBold).map(e => e.getAttribute('title')),
            open: open,
        }

        /**
         * This changes usually.
         * 
         * Update here the logic to fetch,
         * 
         * 1. All contact elements as an array.
         * 2. If an entity name is passed then only that contact's bounding element.
         * 
         * @param {*} entity 
         */
        function getMsgElements(entity) {
            let title = entity ? "=".concat(entity) : "";
            return $("#pane-side").find('[dir="auto"][title' + title + ']').toArray();
        }

        /**
         * Used to open a chat for a given contact
         * 
         * @param {*} entity 
         */
        function open(entity) {
            let element =   getMsgElements(entity)[0];
            simulateMouseEvent(element, 'mousedown');
        }

        /**
         * Used within open() to click on a chat box.
         * 
         * @param {*} element 
         * @param {*} eventName 
         */
        function simulateMouseEvent(element, eventName) 
        { 
            var mouseEvent = document.createEvent('MouseEvents'); 
            mouseEvent.initEvent(eventName, true, true); 
            element.dispatchEvent(mouseEvent); 
        }

        /**
         * Clicks the send button.
         */
        function send() {
            let sendButton = document.querySelector('span[data-icon="send"]');
            if(sendButton) {
                sendButton.click();    
            } else {
                console.debug("Type the message - write() before sending it.");
            }
        }

        /**
         * Reads the last message from a given chat history.
         */
        function readLatest() {
            let lastMessage = $('#main').find('.message-in').last();
            let text = lastMessage.find('.copyable-text').last().text().trim();
            return text;
        }

        /**
         * Types the message in the reply box.
         */
        function getWriter() {
            const event = new Event('Event'); 
            event.initEvent("input", true, true, window, 1); 
            return (msg) => {
                let messageBox = document.querySelector("[contenteditable='true']");
                messageBox.innerHTML = msg;
                messageBox.dispatchEvent(event);
            }    
        }
    }

    /**
     * 
     * Cleverbot Class.
     * 
     * Opens a new window for each object created.
     * Used only for sending the message to bot.
     * 
     * @param {*} entity 
     */
    function CleverBot(entity) {
        
        const target = "https://www.cleverbot.com/"; 
        let popup = window.open(target);
        
        let lastUserMessage = "";
        
        // A promise that resolves after target page loads
        let targetLoad = new Promise((resolve) => {
            // Meh, stupid logic. Wait for some time for target page
            setTimeout(resolve, 8000);
        });
        
        /**
         * The one that talks to bot.
         * 
         * @param {*} msg 
         */
        this.send = async (msg) => {
            // wait till target page has finished loading 
            // and can actually listen go us.
            await targetLoad;

            // Avoid echos. 
            // !! Warning: This causes repeated msgs to be ignored.
            if(lastUserMessage === msg) {
                return;
            }

            // update the last message to this
            lastUserMessage = msg;

            // create a paylod
            let payload = {
                source: entity,
                message: msg
            }

            // send the message to target window
            popup.postMessage(JSON.stringify(payload), target);            
        }

    }
    
    /**
     * A function that adds jQuery to page.
     */
    function injectjQuery() {
        var jq = document.createElement('script');
        jq.src = "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
        document.getElementsByTagName('head')[0].appendChild(jq);
    }

    
})();
