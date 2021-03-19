const axios = require("axios");
const qs = require("querystring");

class Noticer {
  constructor(config) {
    this.enable = config.enable;
    this.key = config["secret_key"];
  }

  async sendNoticer(qq, msg) {
    if (!this.enable) return null;
    const res = await axios.post("https://qmsg.zendee.cn/send/" + this.key, qs.stringify({
      qq, msg
    }));
    return res.data;
  }
}

module.exports = Noticer;