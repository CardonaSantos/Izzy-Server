import { Module } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import {
  DELETE_FILE_USECASE,
  SPACES_CFG,
  SPACES_S3,
  STORAGE_PORT,
  UPLOAD_FILE_USECASE,
} from './tokens';

import { SpacesConfig } from './spaces.config';
import { SpacesAdapter } from './infra/spaces.adapter';
import { FileStoragePort } from './domain/ports/file-storage-port';
import { UploadFileUseCase } from './app/upload-file.usecase';
import { DeleteFileUseCase } from './app/delete-file.usecase';

@Module({
  providers: [
    {
      provide: SPACES_CFG,
      useFactory: (): SpacesConfig => {
        const config: SpacesConfig = {
          region: process.env.DO_SPACES_REGION!,
          endpoint: process.env.DO_SPACES_ENDPOINT!,
          accessKeyId: process.env.DO_SPACES_KEY!,
          secretAccessKey: process.env.DO_SPACES_SECRET!,
          defaultBucket: process.env.DO_SPACES_BUCKET!,
          cdnBase: process.env.DO_SPACES_CDN_BASE!,
          projectPrefix: process.env.DO_SPACES_PROJECT_PREFIX ?? 'nova-erp',
        };

        for (const [key, value] of Object.entries(config)) {
          if (!value) {
            throw new Error(`Falta variable de entorno: ${key}`);
          }
        }

        return config;
      },
    },

    {
      provide: SPACES_S3,
      useFactory: (config: SpacesConfig) =>
        new S3Client({
          region: config.region,
          endpoint: config.endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }),
      inject: [SPACES_CFG],
    },

    {
      provide: 'SPACES_BOOT_CHECK',
      useFactory: async (s3: S3Client, config: SpacesConfig) => {
        try {
          await s3.send(
            new HeadBucketCommand({
              Bucket: config.defaultBucket,
            }),
          );

          console.log('[Spaces] Bucket validado correctamente');

          return { ok: true };
        } catch (error) {
          const err = error as any;

          console.error('[Spaces] No se pudo validar el bucket', {
            name: err?.name,
            message: err?.message,
            statusCode: err?.$metadata?.httpStatusCode,
            bucket: config.defaultBucket,
            endpoint: config.endpoint,
          });

          return {
            ok: false,
            error: err?.name ?? 'UNKNOWN_SPACES_ERROR',
            statusCode: err?.$metadata?.httpStatusCode,
          };
        }
      },
      inject: [SPACES_S3, SPACES_CFG],
    },

    {
      provide: STORAGE_PORT,
      useFactory: (s3: S3Client, config: SpacesConfig): FileStoragePort =>
        new SpacesAdapter(s3, {
          defaultBucket: config.defaultBucket,
          cdnBase: config.cdnBase,
        }),
      inject: [SPACES_S3, SPACES_CFG],
    },

    {
      provide: UPLOAD_FILE_USECASE,
      useFactory: (storage: FileStoragePort, config: SpacesConfig) =>
        new UploadFileUseCase(storage, {
          bucket: config.defaultBucket,
          cdnBase: config.cdnBase,
          projectPrefix: config.projectPrefix,
        }),
      inject: [STORAGE_PORT, SPACES_CFG],
    },

    {
      provide: DELETE_FILE_USECASE,
      useFactory: (storage: FileStoragePort) => new DeleteFileUseCase(storage),
      inject: [STORAGE_PORT],
    },
  ],
  exports: [STORAGE_PORT, UPLOAD_FILE_USECASE, DELETE_FILE_USECASE],
})
export class DigitalOceanStorageModule {}
