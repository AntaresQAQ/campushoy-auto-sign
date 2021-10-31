import axios from 'axios';

import { Logger } from '@/logger';

import type { SchoolInfo, SchoolListItem } from './types/common';
import type { TenantInfoApi } from './types/tenant-info-api';
import type { TenantListSortApi } from './types/tenant-list-sort-api';

export class School {
  private static readonly schoolList: SchoolListItem[] = [];

  private schoolItem: SchoolListItem;
  private schoolInfo: SchoolInfo;

  constructor(schoolName) {
    this.getSchoolItem(schoolName);
  }

  static async initSchoolList(): Promise<void> {
    Logger.debug('Loading School List...');
    const res = await axios.get('https://static.campushoy.com/apicache/tenantListSort');
    const response = res.data as TenantListSortApi;
    if (response.errCode !== 0) {
      throw new Error(`Can Not Get Schools List: ${response.errMsg}`);
    }
    response.data.forEach(section => {
      School.schoolList.push(...section.datas);
    });
    Logger.debug(`Successfully Get ${this.schoolList.length} Schools`);
  }

  private getSchoolItem(schoolName): void {
    const school = School.schoolList.find(value => value.name === schoolName);
    if (!school) {
      throw new Error(`Could not find the school: ${schoolName}`);
    }
    this.schoolItem = school;
    Logger.debug(`Your School Id is "${this.schoolItem.id}"`);
  }

  async loadSchoolInfo(): Promise<void> {
    const res = await axios.get(
      'https://mobile.campushoy.com/v6/config/guest/tenant/info',
      {
        params: { ids: this.schoolItem.id },
      },
    );
    const response = res.data as TenantInfoApi;
    if (response.errCode !== 0) {
      throw new Error(
        `Could not get the school information with id ${this.schoolItem.id}`,
      );
    }
    this.schoolInfo = response.data[0];

    if (this.schoolInfo.joinType !== 'CLOUD') {
      throw new Error('Only Support Cloud School');
    }

    Logger.debug(
      `Your School Name is ${this.schoolInfo.name} And Url is ${this.schoolInfo.idsUrl}`,
    );
  }

  getSchoolUrl(): string {
    return new URL(this.schoolInfo.idsUrl).origin;
  }
}
