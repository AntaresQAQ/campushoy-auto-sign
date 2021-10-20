class CaptchaConfig {
  readonly enable: boolean;
  readonly pdId: string;
  readonly pdKey: string;
}

export class LoginConfig {
  readonly retryTimes: number;
  readonly captcha: CaptchaConfig;
}

export class LoginPostBody {
  readonly username: string;
  readonly password: string;
  readonly mobile: string;
  readonly dllt: string;
  readonly captcha: string;
  readonly rememberMe: boolean;
  readonly lt: string;
}
