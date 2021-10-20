import { DetailSignInstanceApiDatas } from '@/sign/types/detail-sign-instance-api';

export class TasksResult {
  readonly signedTasks: DetailSignInstanceApiDatas[];
  readonly unSignedTasks: DetailSignInstanceApiDatas[];
}

class ExtraFieldItem {
  extraFieldItemWid: number;
  extraFieldItemValue: string;
}

export class TaskFrom {
  readonly signInstanceWid: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly position: string;
  readonly isMalposition: number;
  readonly uaIsCpadaily: boolean;
  readonly abnormalReason: string;
  readonly signPhotoUrl: string;
  readonly extraFieldItems?: ExtraFieldItem[];
}

export class SubmitResult {
  readonly success: boolean;
  readonly message: string;
}
