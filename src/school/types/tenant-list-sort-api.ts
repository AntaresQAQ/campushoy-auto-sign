interface SchoolItem {
  readonly id: string;
  readonly name: string;
  readonly img: string;
}

interface TenantListSortDataItem {
  readonly sectionName: string;
  readonly datas: SchoolItem[];
}

export interface TenantListSortApi {
  readonly errCode: number;
  readonly errMsg: string;
  readonly data: TenantListSortDataItem[];
}
