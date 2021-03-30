(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Reward = require('./reward')
const sleep = require('./tools').sleep

window.addEventListener('onWidgetLoad', function (obj) {
    const CHANNEL_ID = obj.detail.channel.providerId
    const loadedModules = [
        new Reward(),
    ]

    let ws = undefined;
    let pong = false;
    let interval = false;

    function connect() {
        ws = new WebSocket("wss://pubsub-edge.twitch.tv");
        listen();
    }

    function disconnect() {
        if (interval) {
            clearInterval(interval);
            interval = false;
        }
        ws.close();
    }

    function listen() {
        ws.onmessage = (a) => {
            let o = JSON.parse(a.data);
            switch (o.type) {
                case "PING":
                    ws.send(JSON.stringify({
                        "type": "PONG"
                    }));
                    break;
                case "PONG":
                    pong = true;
                    break;
                case "RECONNECT":
                    disconnect();
                    connect();
                    break;
                case "MESSAGE":
                    switch (o.data['topic']) {
                        case `community-points-channel-v1.${CHANNEL_ID}`:
                            let msg = JSON.parse(o.data.message);
                            console.log(msg);
                            loadedModules.forEach(module => module.canHandle(msg) && module.handle(msg))
                            break;
                    }
                    break;
            }
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({
                "type": "LISTEN",
                "nonce": "pepega",
                "data": {"topics": ["community-points-channel-v1." + CHANNEL_ID], "auth_token": ""}
            }));
            interval = setInterval(async () => {
                ws.send(JSON.stringify({
                    "type": "PING"
                }));
                await sleep(5000);
                if (pong) {
                    pong = false;
                    return
                }
                pong = false;
                disconnect();
                connect();
            }, 5 * 60 * 1000)
        }
    }

    connect();
})

},{"./reward":2,"./tools":3}],2:[function(require,module,exports){
const sleep = require('./tools').sleep

class Reward {
    constructor() {
        this.container = document.getElementById("points-notification-container");
        this.title = document.getElementById("points-notification-title");
        this.notifications = [];

        this.init()
            .initDisplay()
    }

    init() {
        this.title.setAttribute("style", `color: red;font-size: 35px;`);
        return this;
    }

    /**
     * Daemon to display reward
     * @returns {Promise<void>}
     */
    async initDisplay() {
        while (true) {
            if (this.notifications.length > 0) {
                let currentNotification = this.notifications.pop();
                console.log("Notification showing", currentNotification);
                this.title.innerText = currentNotification.title;
                this.container.setAttribute("class", "");
                await sleep(7500);
                this.container.setAttribute("class", "hide");
                console.log("Notification ended");
            }
            await sleep(1000);
        }
    }

    canHandle(message) {
        return (
            message &&
            message.type &&
            message.type === 'reward-redeemed' &&
            message['data'] &&
            message['data']['redemption'] &&
            message['data']['redemption']['user'] &&
            message['data']['redemption']['user']['display_name'] &&
            message['data']['redemption']['reward'] &&
            message['data']['redemption']['reward']['id']
        )
    }

    handle(message) {
        let reward = message.data['redemption']['reward'];
        let notification = {
            title: reward.id + ' - ' + reward.title,
        };
        console.log("Notification queued", notification);
        this.notifications.push(notification);
    }
}

module.exports = Reward
},{"./tools":3}],3:[function(require,module,exports){
module.exports = {
    sleep: function (milliseconds) {
        return new Promise(res => {
            setTimeout(res, milliseconds)
        });
    }
}
},{}]},{},[1]);
