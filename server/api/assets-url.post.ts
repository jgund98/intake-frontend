/**
 * API Route: Generate Presigned S3 URL
 *
 * This endpoint generates presigned URLs for uploading files directly to S3.
 * This approach bypasses the Lambda 6MB payload limit by allowing clients
 * to upload files directly to S3 using a temporary signed URL.
 */
import { defineEventHandler, readBody } from 'h3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createApiResponse } from '~/server/lib/appErrors';
import {
  ResponseType,
  type ApiResp,
  type PresignedUrlData,
} from '~/models/apiResponse.model';

interface PresignedUrlRequest {
  sessionId: string;
  fileName: string;
  fileType: string;
}

export default defineEventHandler(
  async (event): Promise<ApiResp<PresignedUrlData>> => {
    try {
      // Parse request body
      const body = await readBody<PresignedUrlRequest>(event);
      const { sessionId, fileName, fileType } = body;

      // Validate required fields
      if (!sessionId || !fileName || !fileType) {
        return createApiResponse<PresignedUrlData>(
          event,
          { errors: [{ extensions: { code: 'BAD_REQUEST' } }] },
          null,
          ResponseType.ERROR
        );
      }

      // Get runtime config for AWS credentials
      const config = useRuntimeConfig();
      const awsRegion = config.awsRegion;
      const awsAccessKeyId = config.awsAccessKeyId;
      const awsSecretAccessKey = config.awsSecretAccessKey;
      const s3BucketName = config.awsS3BucketName;

      // Validate AWS configuration
      if (
        !awsRegion ||
        !awsAccessKeyId ||
        !awsSecretAccessKey ||
        !s3BucketName
      ) {
        return createApiResponse<PresignedUrlData>(
          event,
          { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
          null,
          ResponseType.ERROR
        );
      }

      // Generate S3 key: sessionId/fileName
      // Keep original filename as-is to preserve user's naming
      const s3Key = `${sessionId}/${fileName}`;

      // Initialize S3 client
      const s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      // Create PutObject command
      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        ContentType: fileType,
      });

      // Generate presigned URL for PUT operation (expires in 15 minutes)
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900,
      });

      // Generate public download URL
      // Note: This will only work if the bucket allows public access
      // For private buckets, you'll need to generate another presigned URL for GET
      const downloadUrl = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${s3Key}`;

      const presignedData: PresignedUrlData = {
        uploadUrl,
        downloadUrl,
        s3Key,
      };

      // Success response
      return createApiResponse<PresignedUrlData>(
        event,
        {},
        presignedData,
        ResponseType.SUCCESS
      );
    } catch (error: unknown) {
      return createApiResponse<PresignedUrlData>(
        event,
        error,
        null,
        ResponseType.ERROR
      );
    }
  }
);
