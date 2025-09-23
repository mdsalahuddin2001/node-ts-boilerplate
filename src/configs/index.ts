import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import z from 'zod';
import logger from '../libraries/log/logger';
import schema from './config.schema';

type ConfigSchema = z.infer<typeof schema>;

class Config {
  private static instance: Config | null = null;
  public config: ConfigSchema;

  private constructor() {
    logger.info('Loading and validating config for the first time...');
    this.config = this.loadAndValidateConfig();
    Config.instance = this;
    logger.info('Config loaded and validated');
  }

  private loadAndValidateConfig(): ConfigSchema {
    const environment: string = process.env.NODE_ENV || 'development';

    // 1. Load environment file from project root
    const envFile: string = `.env.${environment}`;
    const envPath: string = path.join(process.cwd(), envFile);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(envPath)) {
      logger.warn(`Environment file not found: ${envPath}`);
      // Try to load default .env if specific environment file doesn't exist
      const defaultEnvPath = path.join(process.cwd(), '.env');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(defaultEnvPath)) {
        dotenv.config({ path: defaultEnvPath });
        logger.info(`Loaded default .env file: ${defaultEnvPath}`);
      }
    } else {
      dotenv.config({ path: envPath });
      logger.info(`Loaded environment file: ${envPath}`);
    }

    // 2. Load config file from root config directory
    const configFile: string = path.join(process.cwd(), 'config', `config.${environment}.json`);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(configFile)) {
      throw new Error(`Config file not found: ${configFile}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let config: ConfigSchema = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    logger.info(`Loaded config file: ${configFile}`);

    // 3. Load shared config file
    const sharedConfigFile: string = path.join(process.cwd(), 'config', 'config.shared.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(sharedConfigFile)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const sharedConfig: ConfigSchema = JSON.parse(fs.readFileSync(sharedConfigFile, 'utf-8'));
      config = { ...sharedConfig, ...config };
      logger.info(`Loaded shared config: ${sharedConfigFile}`);
    }

    // 4. Build final config with environment variable overrides
    const finalConfig: Record<string, unknown> = {};
    const schemaKeys = Object.keys(schema.shape);

    for (const key of schemaKeys) {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        // eslint-disable-next-line security/detect-object-injection
        finalConfig[key] = process.env[key];
      } else if (Object.prototype.hasOwnProperty.call(config, key)) {
        // eslint-disable-next-line security/detect-object-injection
        finalConfig[key] = (config as Record<string, unknown>)[key];
      }
    }

    // 5. Validate against schema
    if (!schema) {
      throw new Error('Schema file not found');
    }
    const parsed = schema.safeParse(finalConfig);

    if (!parsed.success) {
      const missingProperties = parsed.error.issues.map(issue => issue.path.join('.'));
      throw new Error(
        `Config validation error: missing or invalid properties ${missingProperties.join(', ')}`
      );
    }

    return parsed.data;
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

export default Config.getInstance().config;
