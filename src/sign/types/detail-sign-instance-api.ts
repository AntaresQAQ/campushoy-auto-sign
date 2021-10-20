interface ExtraFieldItem {
  content: string;
  wid: number;
  isOtherItems: number;
  value: string;
  isSelected: boolean;
  isAbnormal: boolean;
}

interface ExtraField {
  readonly wid: number;
  readonly title: string;
  readonly description: string;
  readonly hasOtherItems: number;
  readonly extraFieldItems: ExtraFieldItem[];
}

interface SignPlace {
  readonly address: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly radius: number;
}

export interface DetailSignInstanceApiDatas {
  readonly signInstanceWid: string;
  readonly taskName: string;
  readonly signPlaceSelected: SignPlace[];
  readonly isMalposition: number;
  readonly isPhoto: number;
  readonly isNeedExtra: number;
  readonly extraField: ExtraField[];
}

export interface DetailSignInstanceApi {
  readonly code: string;
  readonly messgae: string;
  readonly datas: DetailSignInstanceApiDatas;
}
