import type { TenantInfoApiDataItem } from './tenant-info-api';

export interface SchoolListItem {
  readonly id: string;
  readonly name: string;
}

export interface SchoolInfo extends TenantInfoApiDataItem {
  readonly id: string;
  readonly name: string;
  readonly tenantCode: string;
  readonly joinType: string;
  readonly idsUrl: string;
  readonly ampUrl: string;
}
