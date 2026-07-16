import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary SDK configuration and upload helpers.
 *
 * Environment variables required:
 * - CLOUDINARY_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/* ── Folder constants ────────────────────────────────────────── */
export const CloudinaryFolders = {
  products: 'stressnes/products',
  categories: 'stressnes/categories',
  users: 'stressnes/users',
  banners: 'stressnes/banners',
} as const;

export type CloudinaryFolder = (typeof CloudinaryFolders)[keyof typeof CloudinaryFolders];

/* ── Upload result type ──────────────────────────────────────── */
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a file buffer or base64 string to Cloudinary.
 *
 * @param source  - File buffer, base64 string, or URL
 * @param folder  - Cloudinary folder to upload to
 * @param options - Additional Cloudinary upload options
 */
export async function uploadImage(
  source: Buffer | string,
  folder: CloudinaryFolder,
  options: Record<string, unknown> = {},
): Promise<UploadResult> {
  const input =
    Buffer.isBuffer(source) ? `data:image/jpeg;base64,${source.toString('base64')}` : source;

  const result = await cloudinary.uploader.upload(input, {
    folder,
    ...options,
  });

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
