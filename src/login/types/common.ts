export interface LoginPostBody {
  readonly username: string;
  readonly password: string;
  readonly mobile: string;
  readonly dllt: string;
  readonly captcha: string;
  readonly rememberMe: boolean;
  readonly lt: string;
}
