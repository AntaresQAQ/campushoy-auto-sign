import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import { AppConfigSchema } from '@/config/app-config.schema';

export class AppConfig {
  readonly config: AppConfigSchema;

  constructor() {
    const filePath = process.env.AUTO_SIGN_CONFIG_FILE;
    if (!filePath) {
      throw new Error(
        'Please specify configuration file with environment variable AUTO_SIGN_CONFIG_FILE',
      );
    }
    const config = yaml.load(fs.readFileSync(filePath).toString());
    this.config = AppConfig.validateInput(config);
  }

  private static validateInput(inputConfig: unknown): AppConfigSchema {
    const config = plainToClass(AppConfigSchema, inputConfig);
    const errors = validateSync(config, {
      validationError: {
        target: false,
      },
    });

    if (errors.length > 0) {
      throw new Error(`Config validation error: ${JSON.stringify(errors, null, 2)}`);
    }
    return config;
  }
}
