import { Readable } from 'stream';

export type UploadFileInput = {
  bucket?: string;
  key: string;
  body: Buffer | Readable;
  contentType: string;
  cacheControl?: string;
  acl?: 'public-read' | 'private';
};

export type UploadFileOutput = {
  bucket: string;
  key: string;
  size?: number;
  contentType?: string;
  etag?: string;
  cdnUrl?: string;
};

export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;

  delete(input: { bucket?: string; key: string }): Promise<void>;
}
