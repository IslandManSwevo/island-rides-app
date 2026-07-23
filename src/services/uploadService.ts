import * as ImagePicker from 'expo-image-picker';
import { keyloApi } from './keyloApi';
import { apiService } from './apiService';

export type UploadKind = 'vehicle_photo' | 'document' | 'avatar' | 'checkin_photo' | 'banner';

export interface UploadedPhoto {
  key: string;
  url: string;
}

const CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

const contentTypeFor = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return CONTENT_TYPE[ext] ?? 'image/jpeg';
};

/**
 * Upload a local file URI to R2 via a presigned PUT (design/04-backend-architecture.md).
 * Bytes go straight to R2 — never through the API. Returns the stored key + URL.
 */
export async function uploadUri(uri: string, kind: UploadKind): Promise<UploadedPhoto | null> {
  const token = await apiService.getToken();
  if (!token) return null;

  const contentType = contentTypeFor(uri);
  const { key, uploadUrl, publicUrl } = await keyloApi.presignUpload(kind, contentType, token);

  const blob = await (await fetch(uri)).blob();
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);

  return { key, url: publicUrl };
}

/** Launch the image picker and upload the chosen photo. Returns null if cancelled. */
export async function pickAndUpload(kind: UploadKind): Promise<UploadedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;

  return uploadUri(result.assets[0].uri, kind);
}
