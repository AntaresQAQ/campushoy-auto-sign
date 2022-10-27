import type { Axios } from 'axios';
import { stringify } from 'querystring';
import type { CookieJar } from 'tough-cookie';

import { Captcha } from '@/captcha/captcha';
import type { IdentifyResult } from '@/captcha/types/common';
import type { LoginConfig, UserConfig } from '@/config/app-config.schema';
import { Logger } from '@/logger';
import type { School } from '@/school/school';

import type { LoginPostBody } from './types/common';
import type { DoLoginApi } from './types/do-login-api';

function sleep(x) {
  return new Promise(resolve => setTimeout(resolve, x));
}

export class Login {
  private readonly captcha: Captcha;
  private readonly schoolUrl: string;

  constructor(
    private readonly loginConfig: LoginConfig,
    private readonly userConfig: UserConfig,
    private readonly school: School,
    private readonly client: Axios,
  ) {
    this.schoolUrl = school.getSchoolUrl();
    if (loginConfig.captcha.enable) {
      this.captcha = new Captcha(loginConfig.captcha.pdId, loginConfig.captcha.pdKey);
    }
  }

  private removeAllCookie(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      (this.client.defaults.jar as CookieJar).removeAllCookies(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  private async getLt(): Promise<string> {
    const res = await this.client.get(this.schoolUrl + '/iap/login', {
      params: { service: this.schoolUrl + '/portal/login' },
    });
    const lt = /_2lBepC=([^&]+)/g.exec(res.request.path)[1];
    Logger.debug(`Successfully Get lt=${lt}`);
    return lt;
  }

  private async getCaptcha(lt: string): Promise<string> {
    Logger.debug('Getting Captcha...');
    const res = await this.client.get(this.schoolUrl + '/iap/generateCaptcha', {
      params: { ltId: lt },
      responseType: 'arraybuffer',
    });
    const response = res.data as Buffer;
    return response.toString('base64');
  }

  private async doLogin(): Promise<void> {
    const { retryTimes } = this.loginConfig;
    const { username, password } = this.userConfig;
    let counter = 0;
    let needCaptcha = false;
    while (true) {
      const lt = await this.getLt();
      if (counter) {
        Logger.info(`Retrying... Number of Retries ${counter}`);
      }
      let captchaResult: IdentifyResult;
      if (needCaptcha) {
        if (!this.loginConfig.captcha.enable) {
          throw new Error(`Require Enable Captcha Identify`);
        }
        const image = await this.getCaptcha(lt);
        try {
          captchaResult = await this.captcha.identify(image);
        } catch (e) {
          Logger.warn(e);
        }
      }
      const body: LoginPostBody = {
        username,
        password,
        lt,
        mobile: '',
        dllt: '',
        captcha: captchaResult ? captchaResult.result : '',
        rememberMe: false,
      };
      const res = await this.client.post(
        this.schoolUrl + '/iap/doLogin',
        stringify(Object(body)),
      );
      const response = res.data as DoLoginApi;
      if (response.resultCode === 'REDIRECT') {
        await this.client.get(response.url);
        Logger.info(
          `User ${this.userConfig.school}-${this.userConfig.username} Logged Succeed`,
        );
        return;
      }
      counter++;
      needCaptcha = response.needCaptcha;
      if (response.resultCode === 'CAPTCHA_NOTMATCH') {
        Logger.warn(
          `User ${this.userConfig.school}-${this.userConfig.username} Error Captcha Code`,
        );
        if (captchaResult) {
          try {
            await this.captcha.requestRefund(captchaResult.id);
          } catch (e) {
            Logger.warn(e);
          }
        }
      } else if (response.resultCode === 'LT_NOTMATCH') {
        Logger.warn(
          `User ${this.userConfig.school}-${this.userConfig.username} Error LT, lt=${lt}`,
        );
      } else if (response.resultCode === 'FAIL_UPNOTMATCH') {
        throw new Error(
          `User ${this.userConfig.school}-${this.userConfig.username} Error Username or Password`,
        );
      } else {
        Logger.warn(
          `User ${this.userConfig.school}-${this.userConfig.username} ` +
            `Unknown Error: ${response.resultCode}`,
        );
      }
      if (counter > retryTimes) {
        throw new Error(`Login Error, resultCode=${response.resultCode}`);
      }
      await sleep(1000);
    }
  }

  async login(): Promise<void> {
    Logger.debug(`Logging...`);
    await this.removeAllCookie();
    await this.doLogin();
    Logger.debug(`Logging Finished`);
  }
}
