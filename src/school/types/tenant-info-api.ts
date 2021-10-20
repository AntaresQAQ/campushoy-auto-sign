export interface TenantInfoApiDataItem {
  readonly id: string;
  readonly name: string;
  readonly tenantCode: string;
  readonly joinType: string;
  readonly idsUrl: string;
  readonly ampUrl: string;
}

export interface TenantInfoApi {
  readonly errCode: number;
  readonly errMsg: string;
  readonly data: TenantInfoApiDataItem[];
}
