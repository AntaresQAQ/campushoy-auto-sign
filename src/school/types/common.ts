import { TenantInfoApiDataItem } from './tenant-info-api';

export class SchoolListItem {
  readonly id: string;
  readonly name: string;
}

export class SchoolInfo implements TenantInfoApiDataItem {
  readonly id: string;
  readonly name: string;
  readonly tenantCode: string;
  readonly joinType: string;
  readonly idsUrl: string;
  readonly ampUrl: string;
}
