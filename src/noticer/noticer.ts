import type { Client } from 'oicq';
import { createClient } from 'oicq';
import { join } from 'path';

import type { NoticerConfig } from '@/config/app-config.schema';
import { Logger } from '@/logger';

import { Queue } from './queue';
import type { Message } from './types/common';

const INTERVAL_TIME = 1000;

export class Noticer {
  private readonly client: Client;
  private readonly msgQueue: Queue<Message>;
  private job: NodeJS.Timer;

  constructor(private readonly noticerConfig: NoticerConfig) {
    if (!this.noticerConfig.enable) return;
    this.msgQueue = new Queue<Message>();
    this.job = null;
    this.client = createClient(noticerConfig.qq, {
      platform: 2,
      log_level: 'off',
      data_dir: join(__dirname, '..', '..', 'data'),
    });
    this.client
      .on('system.login.device', event => {
        Logger.error(event.url);
        Logger.error('Please Enter This Url to Finish Device Lock');
        process.exit(-1);
      })
      .login(noticerConfig.password)
      .then(() => {
        Logger.info(`Noticer QQ ${noticerConfig.qq} Logged Succeed`);
      })
      .catch(e => {
        Logger.error(e);
        process.exit(-1);
      });
  }

  private async send(): Promise<boolean> {
    if (this.msgQueue.empty()) return false;
    const msg = this.msgQueue.front();
    this.msgQueue.pop();
    Logger.info(`Sending Message to ${msg.qq} ...`);
    try {
      await this.client.sendPrivateMsg(msg.qq, msg.message);
      Logger.info(`Sending Message to ${msg.qq} Succeed`);
    } catch (err) {
      if (msg.counter >= 3) throw err;
      Logger.warn(`Sending Message to ${msg.qq} Fail, Msg: ${err.message}`);
      this.msgQueue.push({
        qq: msg.qq,
        message: msg.message,
        counter: msg.counter + 1,
      });
    }
    return true;
  }

  private createSend(msg: Message): void {
    Logger.debug(`Pushing ${msg.qq} Message Into Queue...`);
    this.msgQueue.push(msg);
    if (this.job) return;
    this.job = setInterval(() => {
      this.send()
        .then(hasMessages => {
          if (!hasMessages) {
            clearInterval(this.job);
            this.job = null;
          }
        })
        .catch(reason => {
          if (this.msgQueue.empty() && this.job) {
            clearInterval(this.job);
            this.job = null;
          }
          Logger.error(reason);
        });
    }, INTERVAL_TIME);
  }

  sendMessage(msg: string, qq: number): void {
    if (!this.noticerConfig.enable) return;
    this.createSend({ message: msg, qq: qq, counter: 0 });
  }
}
