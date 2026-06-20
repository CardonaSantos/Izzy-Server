import { FileStoragePort } from '../domain/ports/file-storage-port';

export class DeleteFileUseCase {
  constructor(private readonly storage: FileStoragePort) {}

  async execute(cmd: { bucket?: string; key: string }) {
    if (!cmd.key?.trim()) {
      throw new Error('key requerido para eliminar archivo');
    }

    await this.storage.delete({
      bucket: cmd.bucket,
      key: cmd.key,
    });

    return {
      key: cmd.key,
      eliminado: true,
    };
  }
}
