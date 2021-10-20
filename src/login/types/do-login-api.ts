export interface DoLoginApi {
  readonly resultCode:
    | 'REDIRECT'
    | 'CAPTCHA_NOTMATCH'
    | 'LT_NOTMATCH'
    | 'FAIL_UPNOTMATCH'
    | string;
  readonly needCaptcha?: boolean;
  readonly url?: string;
}
