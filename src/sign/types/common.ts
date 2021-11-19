import { DetailSignInstanceApiDatas } from './detail-sign-instance-api';

export interface TasksResult {
  readonly signedTasks: DetailSignInstanceApiDatas[];
  readonly unSignedTasks: DetailSignInstanceApiDatas[];
}

interface ExtraFieldItem {
  extraFieldItemWid: number;
  extraFieldItemValue: string;
}

export interface Extension {
  readonly lon: number;
  readonly lat: number;
  readonly model: string;
  readonly appVersion: string;
  readonly systemVersion: string;
  readonly userId: string;
  readonly systemName: string;
  readonly deviceId: string;
}

export interface TaskForm {
  readonly signInstanceWid: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly position: string;
  readonly isMalposition: number;
  readonly uaIsCpadaily: boolean;
  readonly abnormalReason: string;
  readonly signPhotoUrl: string;
  readonly isNeedExtra: number;
  readonly extraFieldItems?: ExtraFieldItem[];
}

export interface CryptTaskForm extends Extension {
  readonly bodyString: string;
  readonly sign: string;
  readonly calVersion: string;
  readonly version: string;
}

export interface SubmitResult {
  readonly name: string;
  readonly success: boolean;
  readonly message: string;
}
