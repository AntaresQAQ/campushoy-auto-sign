import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class UserConfig {
  @IsString()
  @IsNotEmpty()
  readonly school: string;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @IsNumber()
  @IsOptional()
  readonly qq: number;
}

class CaptchaLoginConfig {
  @IsBoolean()
  readonly enable: boolean;

  @IsString()
  @IsOptional()
  readonly pdId: string;

  @IsString()
  @IsOptional()
  readonly pdKey: string;
}

class LoginConfig {
  @IsNumber()
  @Min(0)
  readonly retryTimes: number;

  @ValidateNested()
  @Type(() => CaptchaLoginConfig)
  readonly captcha: CaptchaLoginConfig;
}

export class AppConfigSchema {
  @ValidateNested()
  @Type(() => UserConfig)
  readonly users: UserConfig[];

  @ValidateNested()
  @Type(() => LoginConfig)
  readonly login: LoginConfig;

  @IsIn(['debug', 'info', 'warn', 'error'])
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}
