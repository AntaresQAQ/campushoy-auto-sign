import type { Axios } from 'axios';
import axios from 'axios';
import wrapper from 'axios-cookiejar-support';
import CryptoJS from 'crypto-js';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import type { CookieJar } from 'tough-cookie';
import { v1 as UUIDv1 } from 'uuid';

import type { UserConfig } from '@/config/app-config.schema';
import {
  TaskConfigExtraFieldsItem,
  TaskConfigItem,
  TaskConfigSchema,
} from '@/config/task-config.schema';
import { Logger } from '@/logger';
import type { School } from '@/school/school';

import type {
  CryptTaskForm,
  Extension,
  SubmitResult,
  TaskForm,
  TasksResult,
} from './types/common';
import type {
  DetailSignInstanceApi,
  DetailSignInstanceApiDatas,
} from './types/detail-sign-instance-api';
import type { GetStuSignInfosInOneDayApi } from './types/get-stu-sign-infos-in-one-day-api';
import type { GetUploadPolicyApi } from './types/get-upload-policy-api';
import type { PreviewAttachmentApi } from './types/preview-attachment-api';
import type { SubmitSignApi } from './types/submit-sign-api';

const APP_VERSION = '9.0.12';
const AES_KEY = 'ytUQ7l2ZZu8mLvJZ';
const DES_KEY = 'b3L26XNL';

export class Sign {
  private readonly client: Axios;
  private readonly schoolUrl: string;

  constructor(
    private readonly school: School,
    private readonly userConfig: UserConfig,
    private readonly cookieJar: CookieJar,
  ) {
    this.schoolUrl = school.getSchoolUrl();
    this.client = wrapper(
      axios.create({
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 11; Redmi K20 Pro Build/RKQ1.200826.002) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/89.0.4389.82 ' +
            'Safari/537.36',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Connection: 'Keep-Alive',
          'X-Requested-With': 'XMLHttpRequest',
        },
        jar: cookieJar,
        withCredentials: true,
      }),
    );
  }

  private async getTaskDetails(
    signInstanceWid,
    signWid,
  ): Promise<DetailSignInstanceApiDatas> {
    const res = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/sign/detailSignInstance',
      {
        signInstanceWid,
        signWid,
      },
    );
    const response = res.data as DetailSignInstanceApi;
    return response.datas;
  }

  private async getTasks(): Promise<TasksResult> {
    const res = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/sign/getStuSignInfosInOneDay',
      {},
    );
    const response = res.data as GetStuSignInfosInOneDayApi;
    const tasks: TasksResult = {
      signedTasks: [],
      unSignedTasks: [],
    };
    for (const task of response.datas.unSignedTasks) {
      tasks.unSignedTasks.push(
        await this.getTaskDetails(task.signInstanceWid, task.signWid),
      );
    }
    for (const task of response.datas.signedTasks) {
      tasks.signedTasks.push(
        await this.getTaskDetails(task.signInstanceWid, task.signWid),
      );
    }
    return tasks;
  }

  async generateConfig(): Promise<TaskConfigSchema> {
    const tasks = await this.getTasks();
    const config = new TaskConfigSchema();
    config.tasks = tasks.unSignedTasks.concat(tasks.signedTasks).map(task => {
      const taskConfigItem = new TaskConfigItem();
      taskConfigItem.enable = true;
      taskConfigItem.titleRegex = task.taskName;
      taskConfigItem.cron = '0 0 8 * * *';
      taskConfigItem.address = 'xx省xx市xx区xx路';
      taskConfigItem.position = { latitude: 0.1234, longitude: 5.6789 };
      taskConfigItem.abnormalReason = '';
      taskConfigItem.needPhoto = !!task.isPhoto;
      taskConfigItem.photoPath = '';
      taskConfigItem.needExtra = !!task.isNeedExtra;
      taskConfigItem.extraFields = task.extraField.map(extraField => {
        const configExtraFieldsItem = new TaskConfigExtraFieldsItem();
        configExtraFieldsItem.title = extraField.title;
        configExtraFieldsItem.hasOther = !!extraField.hasOtherItems;
        configExtraFieldsItem.options = extraField.extraFieldItems.map(item => {
          configExtraFieldsItem.answer ||= item.value;
          return item.content;
        });
        return configExtraFieldsItem;
      });
      return taskConfigItem;
    });
    return config;
  }

  private async uploadPhoto(path: string): Promise<string> {
    const res1 = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/oss/getUploadPolicy',
      { fileType: 1 },
    );
    const response = res1.data as GetUploadPolicyApi;
    const file = await readFile(path);
    const form = new FormData();
    form.append('key', response.datas.fileName);
    form.append('policy', response.datas.policy);
    form.append('OSSAccessKeyId', response.datas.accessid);
    form.append('success_action_status', '200');
    form.append('signature', response.datas.signature);
    form.append('file', file);
    await this.client.post(response.datas.host, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    const res2 = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/sign/previewAttachment',
      { ossKey: response.datas.fileName },
    );
    return (res2.data as PreviewAttachmentApi).datas;
  }

  private async fillForm(configTask: TaskConfigItem): Promise<[string, TaskForm]> {
    Logger.debug(`Starting Fill From whose Task's Name Like ${configTask.titleRegex}`);
    const taskRegex = new RegExp(configTask.titleRegex);
    const tasks = await this.getTasks();
    const task = tasks.unSignedTasks
      .concat(tasks.signedTasks)
      .find(task => taskRegex.test(task.taskName));
    if (!task) {
      throw new Error(`Not Found a Task's Name Like ${configTask.titleRegex}`);
    }
    Logger.info(`Found Task ${task.taskName}, Filling...`);
    let photoUrl = '';
    if (task.isPhoto && configTask.needPhoto) {
      photoUrl = await this.uploadPhoto(configTask.photoPath);
    }
    const form: TaskForm = {
      signInstanceWid: task.signInstanceWid,
      isMalposition: task.isMalposition,
      uaIsCpadaily: true,
      longitude: configTask.position.longitude,
      latitude: configTask.position.latitude,
      position: configTask.address,
      abnormalReason: configTask.abnormalReason,
      signPhotoUrl: photoUrl,
      isNeedExtra: task.isNeedExtra,
      extraFieldItems: task.isNeedExtra ? [] : undefined,
    };
    if (task.isNeedExtra) {
      for (
        let configIndex = 0, taskIndex = 0;
        configIndex < configTask.extraFields.length && taskIndex < task.extraField.length;
        configIndex++, taskIndex++
      ) {
        const configExtraFieldItem = configTask.extraFields[configIndex];
        const taskExtraFieldItem = task.extraField[taskIndex];
        if (configExtraFieldItem.title !== taskExtraFieldItem.title) {
          throw new Error('An Error Field Title On the Task Config File');
        }
        const option = taskExtraFieldItem.extraFieldItems.find(
          item => item.content === configExtraFieldItem.answer,
        );
        if (option) {
          form.extraFieldItems.push({
            extraFieldItemWid: option.wid,
            extraFieldItemValue: configExtraFieldItem.answer,
          });
        } else {
          if (taskExtraFieldItem.hasOtherItems) {
            const otherOption = taskExtraFieldItem.extraFieldItems.find(
              item => !!item.isOtherItems,
            );
            form.extraFieldItems.push({
              extraFieldItemWid: otherOption.wid,
              extraFieldItemValue: configExtraFieldItem.answer,
            });
          } else {
            throw new Error('An Error Option On the Task Config File');
          }
        }
      }
    }
    Logger.debug('Filling Task Form Finished');
    return [task.taskName, form];
  }

  private static DESEncrypt(data: string): string {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const iv = CryptoJS.enc.Hex.parse('0102030405060708');
    return CryptoJS.DES.encrypt(data, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  }

  private static encryptForm(form: TaskForm, extension: Extension): CryptTaskForm {
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const iv = CryptoJS.enc.Hex.parse('01020304050607080901020304050607');
    const bodyString = CryptoJS.AES.encrypt(JSON.stringify(form), key, { iv }).toString();
    const signBody = {
      appVersion: APP_VERSION,
      bodyString: bodyString,
      deviceId: extension.deviceId,
      lat: extension.lat,
      lon: extension.lon,
      model: extension.model,
      systemName: extension.systemName,
      systemVersion: extension.systemVersion,
      userId: extension.userId,
    };
    let signString = '';
    for (const key in signBody) {
      signString += `${key}=${signBody[key]}&`;
    }
    signString += AES_KEY;
    const sign = CryptoJS.MD5(signString).toString();
    return {
      ...extension,
      bodyString: bodyString,
      calVersion: 'firstv',
      version: 'first_v2',
      sign: sign,
    };
  }

  async submit(task: TaskConfigItem): Promise<SubmitResult> {
    const [name, form] = await this.fillForm(task);
    const extension: Extension = {
      lon: form.longitude,
      lat: form.latitude,
      model: 'Redmi K20 Pro',
      appVersion: APP_VERSION,
      systemVersion: '11',
      userId: this.userConfig.username,
      systemName: 'android',
      deviceId: UUIDv1(),
    };
    const cryptTaskForm = Sign.encryptForm(form, extension);
    const res = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/sign/submitSign',
      cryptTaskForm,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 11; Redmi K20 Pro Build/RKQ1.200826.002) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/89.0.4389.82 ' +
            'Safari/537.36',
          CpdailyStandAlone: '0',
          extension: '1',
          'Cpdaily-Extension': Sign.DESEncrypt(JSON.stringify(extension)),
          'Content-Type': 'application/json; charset=utf-8',
          Host: new URL(this.schoolUrl).host,
          Connection: 'Keep-Alive',
          'Accept-Encoding': 'gzip',
        },
      },
    );
    const response = res.data as SubmitSignApi;
    Logger.debug('Submitting Task Form Finished');
    return {
      name,
      success: response.message === 'SUCCESS',
      message: response.message,
    };
  }
}
