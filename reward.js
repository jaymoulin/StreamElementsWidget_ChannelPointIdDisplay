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