import { CookieJar } from 'tough-cookie';

import { AppConfig } from '@/config/app-config';
import { UserConfig } from '@/config/app-config.schema';
import { TaskConfig } from '@/config/task-config';
import { Logger } from '@/logger';
import { Login } from '@/login/login';
import { Noticer } from '@/noticer/noticer';
import { School } from '@/school/school';
import { Sign } from '@/sign/sign';
import { Task } from '@/task/task';

export class User {
  // noinspection JSMismatchedCollectionQueryUpdate
  private readonly tasks: Task[];
  private readonly cookieJar: CookieJar;
  private readonly taskConfig: TaskConfig;
  private school: School;
  private login: Login;
  private sign: Sign;
  constructor(
    private readonly appConfig: AppConfig,
    private readonly userConfig: UserConfig,
    private readonly noticer: Noticer,
  ) {
    this.tasks = [];
    this.cookieJar = new CookieJar();
    this.taskConfig = new TaskConfig(this.userConfig);
  }

  async loadTaskConfig() {
    Logger.info(
      `Loading Config for User ${this.userConfig.school}-${this.userConfig.username}`,
    );
    if (!this.taskConfig.getConfig()) {
      await this.login.login();
      const newConfig = await this.sign.generateConfig();
      this.taskConfig.update(newConfig);
      await this.taskConfig.saveFile();
      throw new Error(
        `Please Finish Task Config ${this.userConfig.school}-${this.userConfig.username}.yaml`,
      );
    }
  }

  async init() {
    try {
      Logger.info(
        `Initializing User ${this.userConfig.school}-${this.userConfig.username}`,
      );
      this.school = new School(this.userConfig.school);
      await this.school.loadSchoolInfo();
      this.login = new Login(
        this.appConfig.config.login,
        this.userConfig,
        this.school,
        this.cookieJar,
      );
      this.sign = new Sign(this.school, this.userConfig, this.cookieJar);
      await this.loadTaskConfig();
    } catch (e) {
      Logger.error(
        `User ${this.userConfig.school}-${this.userConfig.username} initialization failed`,
      );
      throw e;
    }
  }

  start() {
    Logger.info(
      `Registering User ${this.userConfig.school}-${this.userConfig.username} Tasks...`,
    );
    const { tasks } = this.taskConfig.getConfig();
    tasks.forEach(task => {
      if (task.enable) {
        this.tasks.push(
          new Task(task, this.login, this.sign, this.noticer, this.userConfig),
        );
      }
    });
  }
}
