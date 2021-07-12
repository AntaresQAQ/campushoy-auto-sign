const axios = require("axios");
const UUID = require("uuid");
const CryptoJS = require("crypto-js");
require("axios-cookiejar-support").default(axios);

function DESEncrypt(data) {
  const key = CryptoJS.enc.Utf8.parse("b3L26XNL");
  const iv = CryptoJS.enc.Hex.parse("0102030405060708");
  return CryptoJS.DES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString();
}

class Sign {
  constructor(cookieJar, school_url) {
    this.cookieJar = cookieJar;
    this.school_url = school_url;
  }

  async getForms() {
    logger.debug("Start Get Forms...");
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Redmi K20 Pro Build/RKQ1.200826.002) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/89.0.4389.82 " +
        "Safari/537.36",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Connection": "Keep-Alive",
      "X-Requested-With": "XMLHttpRequest"
    };
    const res1 = await axios.post(this.school_url +
      "/wec-counselor-sign-apps/stu/sign/getStuSignInfosInOneDay", {}, {
      headers,
      jar: this.cookieJar,
      withCredentials: true
    });
    const tasks = res1.data["datas"]["unSignedTasks"];
    logger.debug(`Successfully Get ${tasks.length} Tasks`);
    const forms = [];
    for (const task of tasks) {
      const sign_instance_wid = task['signInstanceWid'];
      const sign_wid = task['signWid'];
      const res2 = await axios.post(this.school_url +
        "/wec-counselor-sign-apps/stu/sign/detailSignInstance", {
        signInstanceWid: sign_instance_wid,
        signWid: sign_wid
      }, {
        headers,
        jar: this.cookieJar,
        withCredentials: true
      });
      forms.push(res2.data["datas"])
    }
    logger.debug("Get Forms Finished");
    return forms;
  }

  async generateConfig() {
    logger.debug("Start Generate Config...");
    const forms = await this.getForms();
    const config = [];
    forms.forEach(value => {
      const fields = value["extraField"] && value["extraField"].map(value1 => {
        const options = value1["extraFieldItems"].map(value2 => value2.content);
        return {
          title: value1.title,
          options,
          answer: ""
        }
      });
      config.push({
        title: value["taskName"],
        enable: true,
        address: "",
        position: {
          lon: 0.00,
          lat: 0.00
        },
        abnormal_reason: "",
        need_photo: !!value["isPhoto"],
        photo_url: "",
        need_extra: !!value["isNeedExtra"],
        extra_fields: fields
      });
    });
    logger.debug("Generate Config Finished");
    return config;
  }

  async fillForms(config) {
    logger.debug("Start Fill Forms...");
    if (typeof config !== "object") {
      logger.error("错误的配置文件格式");
      return null;
    }
    const tasks = await this.getForms();
    const forms = [];
    for (let i = 0; i < Math.min(tasks.length, config.length); i++) {
      const config_form = config[i];
      const task = tasks[i];
      if (!config_form.enable) continue;
      const form = {
        signInstanceWid: task['signInstanceWid'],
        longitude: config_form.position.lon,
        latitude: config_form.position.lat,
        position: config_form.address,
        isMalposition: task['isMalposition'],
        uaIsCpadaily: true,
        abnormalReason: config_form.abnormal_reason,
        signPhotoUrl: config_form.photo_url
      };
      if (task["isNeedExtra"]) {
        const extra_fields = task['extraField'];
        const config_extra_fields = config_form.extra_fields;
        const extra_field_item_values = [];
        for (let j = 0; j < extra_fields.length; j++) {
          const extra_field = extra_fields[j];
          const config_extra_field = config_extra_fields[j];
          if (extra_field.title !== config_extra_field.title) {
            logger.error(`配置文件 Form:${i} Fields:${j} 有错误`);
            return null;
          }
          const extra_field_items = extra_field['extraFieldItems'];
          for (const extra_field_item of extra_field_items) {
            if (extra_field_item["content"] === config_extra_field.answer) {
              extra_field_item_values.push({
                extraFieldItemValue: config_extra_field.answer,
                extraFieldItemWid: extra_field_item["wid"]
              });
            }
          }
        }
        form['extraFieldItems'] = extra_field_item_values;
      }
      forms.push({
        title: task["taskName"],
        form: form
      });
    }
    logger.debug("Fill Forms Finished");
    return forms;
  }

  async submit(config, username) {
    logger.debug("Start Submit Forms...");
    const results = [];
    const forms = await this.fillForms(config);
    for (const form of forms) {
      const extension = {
        lon: form.form["longitude"],
        lat: form.form["latitude"],
        model: "Redmi K20 Pro",
        appVersion: "8.2.21",
        systemVersion: "11.0",
        userId: username,
        systemName: "android",
        deviceId: UUID.v1()
      };
      const headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 11; Redmi K20 Pro Build/RKQ1.200826.002) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/89.0.4389.82 " +
          "Safari/537.36",
        "CpdailyStandAlone": "0",
        "extension": "1",
        "Cpdaily-Extension": DESEncrypt(JSON.stringify(extension)),
        "Content-Type": 'application/json; charset=utf-8',
        "Host": new URL(this.school_url).host,
        "Connection": "Keep-Alive",
        "Accept-Encoding": "gzip",
      };
      const res = await axios.post(this.school_url +
        "/wec-counselor-sign-apps/stu/sign/submitSign", form.form, {
        headers,
        jar: this.cookieJar,
        withCredentials: true
      });
      logger.debug(`Submit Result: ${res.data}`);
      const {message} = res.data;
      const result = {
        title: form.title,
        succeed: message === "SUCCESS",
        message
      };
      results.push(result);
      if (result.succeed) {
        logger.info(`表单 ${result.title} 提交成功`);
      } else {
        logger.warning(`表单 ${result.title} 提交失败 msg=${result.message}`);
      }
    }
    logger.debug("Submit Forms Finished");
    return results;
  }
}

module.exports = Sign;
