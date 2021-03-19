const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const schedule = require('node-schedule');
const moment = require("moment");
const Login = require("./login.js");
const Forms = require("./sign.js");


class Task {
  constructor(config, user, school, noticer) {
    this.config = config;
    this.school = school;
    this.user = user;
    this.noticer = noticer;
  }

  async loadFormsConfig() {
    const form_config_dir = path.join(__dirname, "../forms");
    if (!fs.existsSync(form_config_dir)) {
      fs.mkdirSync(form_config_dir, {recursive: true});
    }
    const filename = `${this.user["school_name"]}-${this.user["username"]}.yaml`;
    const form_config_path = path.join(form_config_dir, filename);
    if (!fs.existsSync(form_config_path)) {
      const config = await this.forms.generateConfig();
      if (!config.length) {
        logger.error(`用户 ${this.user["school_name"]} ${this.user["username"]} ` +
          `的今日校园内没有待填写的收集表，请等待收集表发布`);
        return false;
      }
      const config_file = yaml.dump(config);
      fs.writeFileSync(form_config_path, config_file);
      logger.warning(`表单配置文件已生成，请完成 ${filename}`);
      return false;
    }
    this.forms_config = yaml.load(fs.readFileSync(form_config_path).toString());
    logger.info(`加载表单配置文件 ${filename} 成功`);
    return true;
  }

  async taskHandle(task) {
    logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 开始执行计划任务`);
    let result = await task.login.login();
    if (!result) {
      result = await task.noticer.sendNoticer(this.user.qq,
        `登录失败，本次提交任务终止，请检查服务器状态并及时提交`);
      if (result) {
        if (result.success) {
          logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} Qmsg酱消息推送成功`);
        } else {
          logger.warning(`用户 ${this.user["school_name"]} ${this.user["username"]} ` +
            `Qmsg酱消息推送失败 reason=${result["reason"]}`);
        }
      }
      logger.warning(`用户 ${this.user["school_name"]} ${this.user["username"]} 登录失败，本次任务终止`);
      logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 下次表单提交时间：` +
        moment(new Date(task.job.nextInvocation())).format("YYYY-MM-DD HH:mm:ss"));
      return;
    }
    const results = await task.forms.submit(task.forms_config, this.user["username"]);
    let content = "表单列表推送信息:";
    results.forEach(form => {
      content += `\n\n表单“${form.title}”提交${form.succeed ? "成功" : "失败"}，message=${form.message}`
    });
    result = await task.noticer.sendNoticer(this.user.qq, content);
    if (result) {
      if (result.success) {
        logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} Qmsg酱消息推送成功`);
      } else {
        logger.warning(`用户 ${this.user["school_name"]} ${this.user["username"]} ` +
          `Qmsg酱消息推送失败 reason=${result["reason"]}`);
      }
    }
    logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 计划任务结束`);
    logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 下次表单提交时间：` +
      moment(new Date(task.job.nextInvocation())).format("YYYY-MM-DD HH:mm:ss"));
  }

  async init() {
    try {
      this.cookieJar = new (require('tough-cookie')).CookieJar();
      this.school_url = await this.school.getSchoolUrl(this.user["school_name"]);
      this.login = new Login(this.config, this.user, this.cookieJar, this.school_url);
      this.forms = new Forms(this.cookieJar, this.school_url);
      if (await this.login.login()) {
        logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 登录成功`);
      } else {
        logger.error(`用户 ${this.user["school_name"]} ${this.user["username"]} 登录失败`);
        return false;
      }
      return await this.loadFormsConfig();
    } catch (e) {
      logger.error(e);
      return false;
    }
  }

  start() {
    this.taskHandle(this).catch(console.error);
    this.job = schedule.scheduleJob(this.user["cron"],
      () => this.taskHandle(this).catch(e => logger.error(e)));
    logger.info(`用户 ${this.user["school_name"]} ${this.user["username"]} 下次表单提交时间：` +
      moment(new Date(this.job.nextInvocation())).format("YYYY-MM-DD HH:mm:ss"));
  }
}


module.exports = Task;