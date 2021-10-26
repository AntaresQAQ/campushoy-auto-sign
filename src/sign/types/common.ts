import { DetailSignInstanceApiDatas } from './detail-sign-instance-api';

export class TasksResult {
  readonly signedTasks: DetailSignInstanceApiDatas[];
  readonly unSignedTasks: DetailSignInstanceApiDatas[];
}

class ExtraFieldItem {
  extraFieldItemWid: number;
  extraFieldItemValue: string;
}

export class Extension {
  readonly lon: number;
  readonly lat: number;
  readonly model: string;
  readonly appVersion: string;
  readonly systemVersion: string;
  readonly userId: string;
  readonly systemName: string;
  readonly deviceId: string;
}

export class TaskForm {
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

export class CryptTaskForm extends Extension {
  readonly bodyString: string;
  readonly sign: string;
  readonly calVersion: string;
  readonly version: string;
}

export class SubmitResult {
  readonly name: string;
  readonly success: boolean;
  readonly message: string;
}
