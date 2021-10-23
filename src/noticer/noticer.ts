import { Client, createClient } from 'oicq';
import { join } from 'path';

import { NoticerConfig } from '@/config/app-config.schema';
import { Logger } from '@/logger';
import { Message } from '@/noticer/types/common';

const INTERVAL_TIME = 1000;

class Queue<T> {
  private queue: T[];

  constructor() {
    this.queue = [];
  }

  push(item: T): void {
    this.queue.push(item);
  }

  pop(): void {
    this.queue = this.queue.slice(1);
  }

  empty(): boolean {
    return !this.queue.length;
  }

  front(): T {
    return this.queue[0];
  }

  back(): T {
    return this.queue[this.queue.length - 1];
  }
}

export class Noticer {
  private readonly client: Client;
  private readonly msgQueue: Queue<Message>;
  private job: NodeJS.Timer;

  constructor(private readonly noticerConfig: NoticerConfig) {
    if (!this.noticerConfig.enable) return;
    this.msgQueue = new Queue<Message>();
    this.job = null;
    this.client = createClient(noticerConfig.qq, {
      platform: 3,
      log_level: 'off',
      data_dir: join(__dirname, '..', '..', 'data'),
    });
    this.client
      .on('system.login.device', event => {
        Logger.error(event.url);
        Logger.error('Please Enter This Url to Finish Device Lock');
        process.exit(-1);
      })
      .login(noticerConfig.password);
    Logger.info(`Noticer QQ ${noticerConfig.qq} Logged Succeed`);
  }

  private async send(): Promise<boolean> {
    if (this.msgQueue.empty()) {
      return false;
    }
    const msg = this.msgQueue.front();
    this.msgQueue.pop();
    Logger.info(`Sending Message to ${msg.qq} ...`);
    const result = await this.client.sendPrivateMsg(msg.qq, msg.message);
    if (result.error) {
      Logger.warn(`Sending Message to ${msg.qq} Fail, Msg: ${result.error.message}`);
      if (msg.counter >= 3) {
        throw new Error(result.error.message);
      }
      this.msgQueue.push({
        qq: msg.qq,
        message: msg.message,
        counter: msg.counter + 1,
      });
    } else {
      Logger.info(`Sending Message to ${msg.qq} Succeed`);
    }
    return true;
  }

  private createSend(msg: Message): void {
    Logger.debug(`Pushing ${msg.qq} Message Into Queue...`);
    this.msgQueue.push(msg);
    if (this.job) return;
    this.job = setInterval(async () => {
      try {
        if (!(await this.send())) {
          clearInterval(this.job);
          this.job = null;
        }
      } catch (e) {
        Logger.error(e);
      }
    }, INTERVAL_TIME);
  }

  sendMessage(msg: string, qq: number): void {
    if (!this.noticerConfig.enable) return;
    // Logger.info(`Sending Message to ${qq} ...`);
    // try {
    //   let counter = 0;
    //   while (true) {
    //     const result = await this.client.sendPrivateMsg(qq, msg);
    //     counter++;
    //     if (!result.error) break;
    //     Logger.warn(`Sending Message to ${qq} Fail, Msg: ${result.error.message}`);
    //     if (counter > 3) {
    //       // noinspection ExceptionCaughtLocallyJS
    //       throw new Error(result.error.message);
    //     }
    //   }
    //   Logger.info(`Sending Message to ${qq} Succeed`);
    // } catch (e) {
    //   Logger.error(e);
    // }
    this.createSend({ message: msg, qq: qq, counter: 0 });
  }
}
