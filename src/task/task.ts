import moment from 'moment';
import { Job, scheduleJob } from 'node-schedule';

import { UserConfig } from '@/config/app-config.schema';
import { TaskConfigItem } from '@/config/task-config.schema';
import { Logger } from '@/logger';
import { Login } from '@/login/login';
import { Noticer } from '@/noticer/noticer';
import { Sign } from '@/sign/sign';

export class Task {
  private readonly job: Job;

  constructor(
    private readonly task: TaskConfigItem,
    private readonly login: Login,
    private readonly sign: Sign,
    private readonly noticer: Noticer,
    private readonly userConfig: UserConfig,
  ) {
    this.job = scheduleJob(this.task.cron, () => {
      this.handle().catch(reason => {
        Logger.error(reason);
        this.noticer.sendMessage(
          `Signing Task /${this.task.titleRegex}/ Error: ${reason.toString()}`,
          this.userConfig.qq,
        );
      });
    });
    Logger.info(
      `User ${this.userConfig.school}-${this.userConfig.username} Task's ` +
        `Name Like /${this.task.titleRegex}/ Will Run on ` +
        `${moment(this.getNextInvocation()).format('YYYY-MM-DD HH:mm:ss')}`,
    );
  }

  getNextInvocation(): Date {
    return new Date(this.job.nextInvocation());
  }

  private async handle() {
    Logger.info(
      `User ${this.userConfig.school}-${this.userConfig.username} Task's ` +
        `Name Like /${this.task.titleRegex}/ Running...`,
    );
    await this.login.login();
    const result = await this.sign.submit(this.task);
    if (result.success) {
      Logger.info(
        `User ${this.userConfig.school}-${this.userConfig.username}'s Task ` +
          `${result.name} Submitting Succeed, Message: ${result.message}`,
      );
      this.noticer.sendMessage(
        `User ${this.userConfig.school}-${this.userConfig.username}'s ` +
          `Signing Task "${result.name}" Submitted Succeed`,
        this.userConfig.qq,
      );
    } else {
      Logger.warn(
        `User ${this.userConfig.school}-${this.userConfig.username}'s Task ` +
          `${result.name} Submitting Fail, Message: ${result.message}`,
      );
      this.noticer.sendMessage(
        `User ${this.userConfig.school}-${this.userConfig.username}'s ` +
          `Signing Task "${result.name}" Submitted Fail, Message: ${result.message}`,
        this.userConfig.qq,
      );
    }
    Logger.info(
      `User ${this.userConfig.school}-${this.userConfig.username} Task's ` +
        `Name Like /${this.task.titleRegex}/ Will Run on ` +
        `${moment(this.getNextInvocation()).format('YYYY-MM-DD HH:mm:ss')}`,
    );
  }
}
