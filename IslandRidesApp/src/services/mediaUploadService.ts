import { apiService } from './apiService';

class MediaUploadService {
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', { uri, name: filename, type } as any);

    const response = await apiService.uploadFile<{ url: string }>('/upload/image', formData);
    return response.url;
  }

  async uploadAudio(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'audio.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : `audio`;

    formData.append('file', { uri, name: filename, type } as any);

    const response = await apiService.uploadFile<{ url: string }>('/upload/audio', formData);
    return response.url;
  }
}

export const mediaUploadService = new MediaUploadService();