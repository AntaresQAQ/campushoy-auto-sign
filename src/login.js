const axios = require("axios");
require("axios-cookiejar-support").default(axios);
const qs = require("querystring");
const FuckCaptcha = require("./fuckcaptcha.js");

function sleep(x) {
  return new Promise(resolve => setTimeout(resolve, x))
}

function removeAllCookie(cookieJar) {
  return new Promise((resolve, reject) => {
    cookieJar.removeAllCookies(err => {
      if (err) reject(err);
      resolve();
    });
  });
}

class Login {
  constructor(config, user, cookieJar, school_url) {
    this.config = config;
    this.user = user;
    this.cookieJar = cookieJar;
    this.school_url = school_url;
    this.lt = null;
  }

  async getLt() {
    logger.debug("Getting lt...");
    const res = await axios.get(this.school_url + "/iap/login", {
      params: {service: this.school_url + "/portal/login"},
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/81.0.4044.122 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "Keep-Alive",
        "X-Requested-With": "XMLHttpRequest"
      },
      jar: this.cookieJar,
      withCredentials: true
    });
    this.lt = /_2lBepC=([^&]+)/g.exec(res.request.path)[1];
    logger.debug(`Successfully Get lt=${this.lt}`);
  }

  async getCaptcha() {
    logger.debug("Getting Captcha...");
    const res = await axios.get(this.school_url + "/iap/generateCaptcha", {
      params: {ltId: this.lt},
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/81.0.4044.122 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "Keep-Alive",
        "X-Requested-With": "XMLHttpRequest"
      },
      jar: this.cookieJar,
      withCredentials: true,
      responseType: "arraybuffer"
    });
    return Buffer.from(res.data, "binary");
  }

  async postLoginData() {
    const {retry_times} = this.config["login"];
    const {username, password} = this.user;
    let login_counter = 0;
    let need_captcha = false;
    while (true) {
      if (login_counter) {
        logger.info(`正在重新登录... 重试第${login_counter}次`);
      }
      let captcha = null;
      if (need_captcha) {
        if (!this.config.captcha.enable) {
          logger.error(`需要验证码，请前往 ${this.school_url} 输入验证码登录后重试`);
          return false;
        }
        const image = await this.getCaptcha();
        captcha = await this.fuckCaptcha.capreg(image.toString("base64"));
      }
      const body = qs.stringify({
        username,
        password,
        mobile: "",
        dllt: "",
        captcha: captcha ? captcha.result : "",
        rememberMe: false,
        lt: this.lt
      });
      const {data} = await axios.post(this.school_url + "/iap/doLogin", body, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/81.0.4044.122 Safari/537.36",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Connection": "Keep-Alive",
          "X-Requested-With": "XMLHttpRequest"
        },
        jar: this.cookieJar,
        withCredentials: true
      });
      logger.debug(data);
      const result = data["resultCode"];
      need_captcha = data["needCaptcha"];
      if (result === "REDIRECT") {
        await axios.get(data.url, {
          jar: this.cookieJar,
          withCredentials: true
        });
        return true;
      }
      login_counter++;
      if (result === "CAPTCHA_NOTMATCH") {
        logger.warning("用户登录验证码错误");
        if (captcha) {
          await this.fuckCaptcha.capjust(captcha.request_id);
        }
      } else if (result === "LT_NOTMATCH") {
        logger.warning("LT不匹配");
      } else if (result === "FAIL_UPNOTMATCH") {
        logger.warning("账户密码不匹配");
      } else {
        logger.warning("未知错误，请检查账户是否可用");
      }
      if (login_counter > retry_times) {
        return false;
      }
      await sleep(1000);
    }
  }

  async login() {
    logger.debug("Start Login...");
    await removeAllCookie(this.cookieJar);
    if (this.config.captcha.enable) {
      this.fuckCaptcha = new FuckCaptcha(this.config.captcha.pd_id, this.config.captcha.pd_key);
    }
    await this.getLt();
    const result = await this.postLoginData();
    logger.debug("Login Finished");
    return result;
  }
}

module.exports = Login;