import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { join } from 'path';

import { TaskConfigSchema } from '@/config/task-config.schema';
import { UserConfig } from '@/user/types/common';

export class TaskConfig {
  private static readonly fileDir = join(__dirname, '..', '..', 'tasks');
  private readonly filePath;
  private config: TaskConfigSchema;

  constructor(private readonly userConfig: UserConfig) {
    if (!fs.existsSync(TaskConfig.fileDir)) {
      fs.mkdirSync(TaskConfig.fileDir);
    }
    this.filePath = join(
      TaskConfig.fileDir,
      `${userConfig.school}-${userConfig.username}.yaml`,
    );
    if (fs.existsSync(this.filePath)) {
      const config = yaml.load(fs.readFileSync(this.filePath).toString());
      this.config = TaskConfig.validateInput(config);
    }
  }

  update(config: TaskConfigSchema) {
    this.config = config;
  }

  async saveFile(): Promise<void> {
    if (this.config) {
      await fs.writeFile(this.filePath, yaml.dump(this.config));
    }
  }

  getConfig(): TaskConfigSchema {
    return this.config;
  }

  private static validateInput(inputConfig: unknown): TaskConfigSchema {
    const config = plainToClass(TaskConfigSchema, inputConfig);
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
