const moment = require("moment");
require("colors");
const {inspect} = require("util");

class Logger {
  constructor(level) {
    level = (level || "info").toLowerCase();
    this.set_level(level)
  }

  set_level(level) {
    if (level === "debug") {
      this.debug_on = true;
      this.info_on = true;
      this.warning_on = true;
      this.error_on = true;
    } else if (level === "info") {
      this.debug_on = false;
      this.info_on = true;
      this.warning_on = true;
      this.error_on = true;
    } else if (level === "warning") {
      this.debug_on = false;
      this.info_on = false;
      this.warning_on = true;
      this.error_on = true;
    } else if (level === "error") {
      this.debug_on = false;
      this.info_on = false;
      this.warning_on = false;
      this.error_on = true;
    } else {
      this.debug_on = false;
      this.info_on = false;
      this.warning_on = false;
      this.error_on = false;
    }
  }

  print_log(msg, level) {
    if (typeof msg !== "string") msg = inspect(msg);
    msg = `[${moment().format("YYYY-MM-DD HH:mm:ss")}][${level.toUpperCase()}]: ${msg}`;
    msg = msg.split('\n').join("")
    if (level === "debug") {
      msg = msg.white;
    } else if (level === "info") {
      msg = msg.green;
    } else if (level === "warning") {
      msg = msg.yellow;
    } else if (level === "error") {
      msg = msg.red;
    }
    console.log(msg);
  }

  debug(msg) {
    if (this.debug_on) {
      this.print_log(msg, "debug");
    }
  }

  info(msg) {
    if (this.info_on) {
      this.print_log(msg, "info");
    }
  }

  warning(msg) {
    if (this.warning_on) {
      this.print_log(msg, "warning");
    }
  }

  error(msg) {
    if (this.error_on) {
      this.print_log(msg, "error");
    }
  }
}

module.exports = Logger;