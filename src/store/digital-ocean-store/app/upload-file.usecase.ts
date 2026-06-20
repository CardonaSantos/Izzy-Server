import { FileStoragePort } from '../domain/ports/file-storage-port';
import { generarStorageKey, inferExtension } from './utils/key.util';

export type UploadFileCommand = {
  buffer: Buffer;
  mime: string;
  fileName?: string;

  basePrefix?: string;

  empresaId?: number;
  sucursalId?: number;
  productoId?: number;
  presentacionId?: number;

  tipo?: 'IMAGEN' | 'VIDEO' | 'AUDIO' | 'DOCUMENTO' | string;
  acl?: 'public-read' | 'private';
};

export type UploadFileResult = {
  provider: 'do-spaces';
  bucket: string;
  key: string;
  cdnUrl: string;
  mimeType: string;
  extension: string;
  size?: number;
};

export class UploadFileUseCase {
  constructor(
    private readonly storage: FileStoragePort,
    private readonly defaults: {
      bucket: string;
      cdnBase: string;
      projectPrefix: string;
    },
  ) {}

  async execute(cmd: UploadFileCommand): Promise<UploadFileResult> {
    if (!cmd.buffer?.length) {
      throw new Error('Archivo vacío');
    }

    if (!cmd.mime?.includes('/')) {
      throw new Error('mime inválido');
    }

    const extension = inferExtension(cmd.mime, cmd.fileName);

    const key = generarStorageKey({
      basePrefix: cmd.basePrefix ?? this.defaults.projectPrefix,
      empresaId: cmd.empresaId,
      sucursalId: cmd.sucursalId,
      productoId: cmd.productoId,
      tipo: cmd.tipo ?? 'IMAGEN',
      extension,
    });

    const uploaded = await this.storage.upload({
      bucket: this.defaults.bucket,
      key,
      body: cmd.buffer,
      contentType: cmd.mime,
      cacheControl: 'public, max-age=31536000, immutable',
      acl: cmd.acl ?? 'public-read',
    });

    return {
      provider: 'do-spaces',
      bucket: uploaded.bucket,
      key: uploaded.key,
      cdnUrl: uploaded.cdnUrl ?? `${this.defaults.cdnBase}/${uploaded.key}`,
      mimeType: cmd.mime,
      extension: extension.replace('.', ''),
      size: uploaded.size,
    };
  }
}
