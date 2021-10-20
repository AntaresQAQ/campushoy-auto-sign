import axios from 'axios';
import { MD5 } from 'crypto-js';
import { stringify } from 'querystring';

import { CapjustApi, CapregApi } from '@/captcha/types/capreg-api';
import { IdentifyResult } from '@/captcha/types/common';
import { Logger } from '@/logger';

export class Captcha {
  constructor(private readonly pdId: string, private readonly pdKey: string) {}

  private calculateSign(timestamp): string {
    return MD5(
      `${this.pdId}${timestamp}${MD5(`${timestamp}${this.pdKey}`).toString()}`,
    ).toString();
  }

  async identify(image: string): Promise<IdentifyResult> {
    Logger.info('Identifying captcha...');
    const timestamp = Math.ceil(Date.now() / 1000);
    const body = stringify({
      user_id: this.pdId,
      timestamp,
      sign: this.calculateSign(timestamp),
      predict_type: '20500',
      img_data: image,
    });
    const res = await axios.post('http://pred.fateadm.com/api/capreg', body, {
      headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    });
    const response = res.data as CapregApi;
    if (response.RetCode === '0') {
      Logger.info(`Successfully Identify Captcha, RequestId=${response.RequestId}`);
      return {
        id: response.RequestId,
        result: JSON.parse(response.RspData).result,
      };
    } else {
      throw new Error(`Identify Captcha Error, Msg=${response.ErrMsg}`);
    }
  }

  async requestRefund(id: string): Promise<void> {
    const timestamp = Math.ceil(Date.now() / 1000);
    const body = stringify({
      user_id: this.pdId,
      timestamp,
      sign: this.calculateSign(timestamp),
      request_id: id,
    });
    const res = await axios.post('http://pred.fateadm.com/api/capjust', body, {
      headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    });
    const response = res.data as CapjustApi;
    if (response.RetCode !== '0') {
      throw new Error(`Refund Request Error, Msg=${response.ErrMsg}`);
    }
    Logger.info(`Successfully Request Refund, RequestId=${id}`);
  }
}
