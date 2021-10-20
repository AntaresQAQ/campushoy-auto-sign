import moment from 'moment';
import { Job, scheduleJob } from 'node-schedule';

import { TaskConfigItem } from '@/config/task-config.schema';
import { Logger } from '@/logger';
import { Sign } from '@/sign/sign';

export class Task {
  private readonly job: Job;

  constructor(
    private readonly task: TaskConfigItem,
    private readonly sign: Sign,
    private readonly userConfig,
  ) {
    this.job = scheduleJob(this.task.cron, () => {
      this.handle().catch(reason => Logger.error(reason));
    });
    Logger.info(
      `User ${this.userConfig.school}-${this.userConfig.username} Task's ` +
        `Name Like /${this.task.titleRegex}/ Will Run at ` +
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
    const result = await this.sign.submit(this.task);
    if (result.success) {
      Logger.info(
        `User ${this.userConfig.school}-${this.userConfig.username} Task's Name Like ` +
          `/${this.task.titleRegex}/ Submitting Succeed, Message: ${result.message}`,
      );
    } else {
      Logger.warn(
        `User ${this.userConfig.school}-${this.userConfig.username} Task's Name Like ` +
          `/${this.task.titleRegex}/ Submitting Fail, Message: ${result.message}`,
      );
    }
    Logger.info(
      `User ${this.userConfig.school}-${this.userConfig.username} Task's ` +
        `Name Like /${this.task.titleRegex}/ Will Run at ` +
        `${moment(this.getNextInvocation()).format('YYYY-MM-DD HH:mm:ss')}`,
    );
  }
}
