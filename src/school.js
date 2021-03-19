const axios = require("axios");
const {URL} = require("url");

class School {
  constructor(config) {
    this.config = config;
    this.schools_list = [];
  }

  async getSchoolsList() {
    logger.debug("Getting Schools List...");
    const res = await axios.get("https://static.campushoy.com/apicache/tenantListSort");
    if (res.data["errCode"] !== 0) {
      logger.error(`Can Not Get Schools List: ${res.data["errMsg"]}`);
      return;
    }
    res.data["data"].forEach((section) => {
      this.schools_list.push(...section["datas"]);
    });
    logger.debug(`Successfully Get ${this.schools_list.length} Schools`);
  }

  findSchoolId(school_name) {
    const school = this.schools_list.find(
      value => value.name === school_name);
    if (!school) {
      logger.error(`您的学校名称 "${school_name}" 有误或该学校未加入今日校园，请核实信息！`);
      process.exit(-1);
    }
    return school.id;
  }

  async getSchoolInfo(school_id) {
    const res = await axios.get("https://mobile.campushoy.com/v6/config/guest/tenant/info", {
      params: {ids: school_id}
    });
    if (res.data["errCode"] !== 0) {
      logger.error(`无法获取学校ID为 ${school_id} 的信息: ${res.data["errMsg"]}`);
      process.exit(-1);
    }
    return res.data["data"][0];
  }

  async getSchoolUrl(school_name) {
    const school_id = this.findSchoolId(school_name);
    logger.debug(`Your School ID is "${school_id}"`);
    const school_info = await this.getSchoolInfo(school_id);
    const ids_url = new URL(school_info["idsUrl"]);
    logger.debug(`Your School URL is ${ids_url.host}`);
    return ids_url.origin;
  }
}

module.exports = School;