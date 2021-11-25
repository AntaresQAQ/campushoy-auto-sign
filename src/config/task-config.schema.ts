import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TaskConfigExtraFieldsItem {
  @IsString()
  title: string;

  @IsBoolean()
  hasOther: boolean;

  @IsArray()
  @Type(() => String)
  options: string[];

  @IsString()
  answer: string;
}

export class TaskConfigPosition {
  @IsNumber()
  @Min(-90)
  @Max(90)
  longitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  latitude: number;
}

export class TaskConfigItem {
  @IsBoolean()
  enable: boolean;

  @IsString()
  cron: string;

  @IsString()
  titleRegex: string;

  @IsString()
  address: string;

  @ValidateNested()
  @Type(() => TaskConfigPosition)
  position: TaskConfigPosition;

  @IsString()
  @IsOptional()
  abnormalReason: string;

  @IsBoolean()
  needPhoto: boolean;

  @IsString()
  @IsOptional()
  photoPath: string;

  @IsBoolean()
  needExtra: boolean;

  @ValidateNested()
  @Type(() => TaskConfigExtraFieldsItem)
  extraFields: TaskConfigExtraFieldsItem[];
}

export class TaskConfigSchema {
  @ValidateNested()
  @Type(() => TaskConfigItem)
  tasks: TaskConfigItem[];
}
