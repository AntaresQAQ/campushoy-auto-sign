interface GetUploadPolicyApiDatas {
  readonly accessid: string;
  readonly dir: string;
  readonly host: string;
  readonly policy: string;
  readonly signature: string;
  readonly fileName: string;
}

export interface GetUploadPolicyApi {
  readonly code: string;
  readonly datas: GetUploadPolicyApiDatas;
  readonly message: string;
}
