import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { File, Storage } from '@google-cloud/storage';

import {
  canAccessObject,
  getObjectAclPolicy,
  ObjectAclPolicy,
  ObjectPermission,
  setObjectAclPolicy,
} from './objectAcl';

// ─── GCS client factory ───────────────────────────────────────────────────────
// On Replit:   auth is handled by the local sidecar at 127.0.0.1:1106.
// On Railway:  auth uses a GCS service-account key stored in GCS_CREDENTIALS
//              (JSON string of the service account key file).

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

function createStorageClient(): Storage {
  const credentialsJson = process.env['GCS_CREDENTIALS'];

  if (credentialsJson) {
    // Railway / any non-Replit environment: standard service-account key
    let credentials: object;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch {
      throw new Error(
        'GCS_CREDENTIALS is not valid JSON. Paste the full service-account key file contents.',
      );
    }
    return new Storage({ credentials });
  }

  // Replit environment: federated auth via the local sidecar
  return new Storage({
    credentials: {
      audience: 'replit',
      subject_token_type: 'access_token',
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: 'external_account',
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: 'json',
          subject_token_field_name: 'access_token',
        },
      },
      universe_domain: 'googleapis.com',
    },
    projectId: '',
  });
}

export const objectStorageClient = createStorageClient();

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env['PUBLIC_OBJECT_SEARCH_PATHS'] || '';
    const paths = Array.from(
      new Set(
        pathsStr
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0),
      ),
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Set it to a comma-separated list of GCS paths (e.g. /my-bucket/public).",
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env['PRIVATE_OBJECT_DIR'] || '';
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Set it to a GCS path prefix (e.g. /my-bucket/private).",
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(
    file: File,
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === 'public';

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers: Record<string, string> = {
      'Content-Type':
        (metadata.contentType as string) || 'application/octet-stream',
      'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) {
      headers['Content-Length'] = String(metadata.size);
    }

    return new Response(webStream, { headers });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({ bucketName, objectName, method: 'PUT', ttlSec: 900 });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith('/objects/')) throw new ObjectNotFoundError();

    const parts = objectPath.slice(1).split('/');
    if (parts.length < 2) throw new ObjectNotFoundError();

    const entityId = parts.slice(1).join('/');
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith('/')) entityDir = `${entityDir}/`;

    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) throw new ObjectNotFoundError();
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('https://storage.googleapis.com/')) return rawPath;

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith('/')) objectEntityDir = `${objectEntityDir}/`;

    if (!rawObjectPath.startsWith(objectEntityDir)) return rawObjectPath;

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith('/')) return normalizedPath;

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith('/')) path = `/${path}`;
  const parts = path.split('/');
  if (parts.length < 3) {
    throw new Error('Invalid GCS path: must be /bucket-name/object-name');
  }
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

/**
 * Returns a presigned URL for the given GCS object.
 *
 * On Railway (GCS_CREDENTIALS set): uses the GCS SDK's built-in V4 signing.
 * On Replit  (no GCS_CREDENTIALS):  delegates to the local sidecar at 1106.
 *
 * The service account used on Railway must have the
 * `iam.serviceAccounts.signBlob` permission (included in roles/storage.admin
 * or roles/iam.serviceAccountTokenCreator).
 */
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  ttlSec: number;
}): Promise<string> {
  // ── Railway path: use GCS SDK V4 signing ─────────────────────────────────
  if (process.env['GCS_CREDENTIALS']) {
    const actionMap: Record<string, 'read' | 'write' | 'delete'> = {
      GET: 'read',
      PUT: 'write',
      DELETE: 'delete',
      HEAD: 'read',
    };
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: actionMap[method] ?? 'read',
      expires: Date.now() + ttlSec * 1000,
    });
    return url;
  }

  // ── Replit path: delegate to local sidecar ───────────────────────────────
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Replit sidecar signing failed (${response.status}). ` +
        `If deploying outside Replit, set GCS_CREDENTIALS.`,
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
