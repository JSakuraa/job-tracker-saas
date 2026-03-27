// T054: SAS Token Generation Utilities

import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { getContainerName, getStorageAccountName } from './client';

/**
 * Generate a SAS token for uploading a blob
 */
export async function generateUploadSasUrl(
  blobName: string,
  expiresInMinutes = 30
): Promise<{ url: string; blobKey: string }> {
  // Generate SAS token with write permission
  const sasUrl = await generateSasUrl(blobName, 'w', expiresInMinutes);

  return {
    url: sasUrl,
    blobKey: blobName,
  };
}

/**
 * Generate a SAS token for downloading a blob
 */
export async function generateDownloadSasUrl(
  blobKey: string,
  expiresInMinutes = 60
): Promise<string> {
  return generateSasUrl(blobKey, 'r', expiresInMinutes);
}

/**
 * Generate a SAS URL for a blob with specified permissions
 */
async function generateSasUrl(
  blobName: string,
  permissions: string,
  expiresInMinutes: number
): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }

  // Parse connection string to get account key
  const accountName = getStorageAccountName();
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
  const accountKey = accountKeyMatch?.[1];

  if (!accountName || !accountKey) {
    throw new Error('Invalid Azure Storage connection string');
  }

  const containerName = getContainerName();
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

  const sasPermissions = new BlobSASPermissions();
  if (permissions.includes('r')) sasPermissions.read = true;
  if (permissions.includes('w')) sasPermissions.write = true;
  if (permissions.includes('d')) sasPermissions.delete = true;
  if (permissions.includes('c')) sasPermissions.create = true;

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: sasPermissions,
      startsOn,
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

  return `${blobUrl}?${sasToken}`;
}
