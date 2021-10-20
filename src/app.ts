import { AppConfig } from '@/config/app-config';
import { Logger } from '@/logger';
import { School } from '@/school/school';
import { User } from '@/user/user';

export class App {
  public readonly appConfig: AppConfig;
  public readonly users: User[];

  constructor() {
    this.appConfig = new AppConfig();
    Logger.setLevel(this.appConfig.config.logLevel);
    this.users = this.appConfig.config.users.map(
      userConfig => new User(this.appConfig, userConfig),
    );
  }

  async start() {
    await School.initSchoolList();
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
