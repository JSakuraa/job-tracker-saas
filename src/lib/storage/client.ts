// T053: Azure Blob Storage Client Configuration

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

/**
 * Get the Azure Blob Service client
 */
export function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  return blobServiceClient;
}

/**
 * Get the container client for resume uploads
 */
export function getContainerClient(): ContainerClient {
  if (!containerClient) {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'resumes';
    containerClient = getBlobServiceClient().getContainerClient(containerName);
  }

  return containerClient;
}

/**
 * Ensure the container exists
 */
export async function ensureContainerExists(): Promise<void> {
  const client = getContainerClient();
  await client.createIfNotExists({
    access: 'blob', // Private access, use SAS for downloads
  });
}

/**
 * Get the storage account name from the connection string
 */
export function getStorageAccountName(): string {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
  const match = connectionString.match(/AccountName=([^;]+)/);
  return match?.[1] ?? '';
}

/**
 * Get the container name
 */
export function getContainerName(): string {
  return process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'resumes';
}
