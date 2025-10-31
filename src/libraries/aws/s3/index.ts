import configs from '@/configs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandOutput,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';

export interface UploadParams {
  key: string;
  body: Buffer | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  location: string;
  bucket: string;
  etag?: string;
  result?: PutObjectCommandOutput;
}

export const createS3Client = (): S3Client =>
  new S3Client({
    region: configs.AWS_S3_REGION,
    credentials: {
      accessKeyId: configs.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: configs.AWS_S3_SECRET_ACCESS_KEY,
    },
  });

export const uploadToS3 = async (params: UploadParams): Promise<UploadResult> => {
  const s3Client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: configs.AWS_S3_BUCKET,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  const result = await s3Client.send(command);

  return {
    key: params.key,
    location: `https://${configs.AWS_S3_BUCKET}.s3.${configs.AWS_S3_REGION}.amazonaws.com/${params.key}`,
    bucket: configs.AWS_S3_BUCKET,
    etag: result.ETag,
    result,
  };
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const s3Client = createS3Client();

  const command = new DeleteObjectCommand({
    Bucket: configs.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};
export const deleteManyFromS3 = async (keys: string[]): Promise<void> => {
  if (!keys.length) return;

  const s3Client = createS3Client();

  const command = new DeleteObjectsCommand({
    Bucket: configs.AWS_S3_BUCKET,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: true, // suppresses verbose success output
    },
  });

  await s3Client.send(command);
};
export const generatePresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const s3Client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: configs.AWS_S3_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};
