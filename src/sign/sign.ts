import axios, { Axios } from 'axios';
import wrapper from 'axios-cookiejar-support';
import {
  DES as CryptoDES,
  enc as CryptoEnc,
  mode as CryptoMode,
  pad as CryptoPad,
} from 'crypto-js';
import { CookieJar } from 'tough-cookie';
import { v1 as UUIDv1 } from 'uuid';

import { UserConfig } from '@/config/app-config.schema';
import {
  TaskConfigExtraFieldsItem,
  TaskConfigItem,
  TaskConfigSchema,
} from '@/config/task-config.schema';
import { Logger } from '@/logger';
import { School } from '@/school/school';

import { SubmitResult, TaskFrom, TasksResult } from './types/common';
import {
  DetailSignInstanceApi,
  DetailSignInstanceApiDatas,
} from './types/detail-sign-instance-api';
import { GetStuSignInfosInOneDayApi } from './types/get-stu-sign-infos-in-one-day-api';
import { SubmitSignApi } from './types/submit-sign-api';

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

  private static DESEncrypt(data: string): string {
    const key = CryptoEnc.Utf8.parse('b3L26XNL');
    const iv = CryptoEnc.Hex.parse('0102030405060708');
    return CryptoDES.encrypt(data, key, {
      iv,
      mode: CryptoMode.CBC,
      padding: CryptoPad.Pkcs7,
    }).toString();
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
      taskConfigItem.address = '';
      taskConfigItem.position = { latitude: 0, longitude: 0 };
      taskConfigItem.abnormalReason = '';
      taskConfigItem.needPhoto = !!task.isPhoto;
      taskConfigItem.photoUrl = '';
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

  private async fillForm(configTask: TaskConfigItem): Promise<[string, TaskFrom]> {
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
    const form: TaskFrom = {
      signInstanceWid: task.signInstanceWid,
      isMalposition: task.isMalposition,
      uaIsCpadaily: true,
      longitude: configTask.position.longitude,
      latitude: configTask.position.latitude,
      position: configTask.address,
      abnormalReason: configTask.abnormalReason,
      signPhotoUrl: configTask.photoUrl,
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
        if (taskExtraFieldItem.hasOtherItems) {
          const otherOption = taskExtraFieldItem.extraFieldItems.find(
            item => !!item.isOtherItems,
          );
          form.extraFieldItems.push({
            extraFieldItemWid: otherOption.wid,
            extraFieldItemValue: configExtraFieldItem.answer,
          });
        } else {
          if (!option) {
            throw new Error('An Error Option On the Task Config File');
          }
          form.extraFieldItems.push({
            extraFieldItemWid: option.wid,
            extraFieldItemValue: configExtraFieldItem.answer,
          });
        }
      }
    }
    Logger.debug('Filling Task Form Finished');
    return [task.taskName, form];
  }

  async submit(task: TaskConfigItem): Promise<SubmitResult> {
    const [name, form] = await this.fillForm(task);
    const extension = {
      lon: form.longitude,
      lat: form.latitude,
      model: 'Redmi K20 Pro',
      appVersion: '8.2.21',
      systemVersion: '11.0',
      userId: this.userConfig.username,
      systemName: 'android',
      deviceId: UUIDv1(),
    };
    Logger.info('Submitting Task Form...');
    const res = await this.client.post(
      this.schoolUrl + '/wec-counselor-sign-apps/stu/sign/submitSign',
      form,
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
