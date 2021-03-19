const qs = require("querystring");
const axios = require("axios");
const CryptoJS = require("crypto-js");

class FuckCaptcha {
  constructor(pd_id, pd_key) {
    this.pd_id = pd_id;
    this.pd_key = pd_key;
  }

  calcSign(timestamp) {
    return CryptoJS.MD5(
      `${this.pd_id}${timestamp}${CryptoJS.MD5(
        `${timestamp}${this.pd_key}`).toString()}`).toString();
  }

  async capreg(image) {
    logger.info("开始识别验证码");
    const timestamp = Math.ceil(Date.now() / 1000);
    const body = qs.stringify({
      user_id: this.pd_id,
      timestamp,
      sign: this.calcSign(timestamp),
      predict_type: "20500",
      img_data: image
    });
    const {data} = await axios.post("http://pred.fateadm.com/api/capreg", body, {
      headers: {"Content-type": "application/x-www-form-urlencoded"}
    });
    if (data["RetCode"] === "0") {
      logger.info(`验证码识别成功: ${data["RspData"]}, RequestId=${data["RequestId"]}`);
      return {
        request_id: data["RequestId"],
        ...JSON.parse(data["RspData"])
      };
    } else {
      logger.warning(`验证码识别出错: ${data["ErrMsg"]}`);
      return null;
    }
  }

  async capjust(request_id) {
    logger.debug("Sending Capjust Request...");
    const timestamp = Math.ceil(Date.now() / 1000);
    const body = qs.stringify({
      user_id: this.pd_id,
      timestamp,
      sign: this.calcSign(timestamp),
      request_id
    });
    const {data} = await axios.post("http://pred.fateadm.com/api/capjust", body, {
      headers: {"Content-type": "application/x-www-form-urlencoded"}
    });
    if (data["RetCode"] === "0") {
      logger.info(`验证码退款成功, RequestId=${request_id}`);
      return true;
    } else {
      logger.warning(`验证码退款出错: ${data["ErrMsg"]}, RequestId=${request_id}`);
      return false;
    }
  }
}

module.exports = FuckCaptcha;