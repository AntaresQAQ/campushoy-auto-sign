import { AppConfig } from '@/config/app-config';
import { Logger } from '@/logger';
import { Noticer } from '@/noticer/noticer';
import { School } from '@/school/school';
import { User } from '@/user/user';

export class App {
  public readonly appConfig: AppConfig;
  public readonly users: User[];
  public readonly noticer: Noticer;

  constructor() {
    this.appConfig = new AppConfig();
    Logger.setLevel(this.appConfig.config.logLevel);
    this.noticer = new Noticer(this.appConfig.config.noticer);
    this.users = this.appConfig.config.users.map(
      userConfig => new User(this.appConfig, userConfig, this.noticer),
    );
  }

  async start() {
    await School.initSchoolList(this.appConfig.config.proxy);
    for (const user of this.users) {
      try {
        await user.init();
        user.start();
      } catch (e) {
        Logger.error(e);
      }
    }
  }
}
