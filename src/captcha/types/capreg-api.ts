export interface CapregApi {
  readonly RetCode: string;
  readonly ErrMsg?: string;
  readonly RequestId: string;
  readonly RspData: string;
}

export interface CapjustApi {
  readonly RetCode: string;
  readonly ErrMsg?: string;
}
