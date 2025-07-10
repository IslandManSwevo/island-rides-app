import { apiService } from './apiService';

interface UploadableFile {
  uri: string;
  name: string;
  type: string;
}

class MediaUploadService {
  private async _uploadFile(uri: string, endpoint: string, fileType: 'image' | 'audio'): Promise<string> {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || `${fileType}.${fileType === 'image' ? 'jpg' : 'm4a'}`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `${fileType}/${match[1]}` : fileType;

      const file: UploadableFile = { uri, name: filename, type };
      formData.append('file', file);

      const response = await apiService.uploadFile<{ url: string }>(endpoint, formData);
      return response.url;
    } catch (error) {
      console.error(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} upload failed:`, error);
      throw new Error(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} upload failed`);
    }
  }

  async uploadImage(uri: string): Promise<string> {
    return this._uploadFile(uri, '/upload/image', 'image');
  }

  async uploadAudio(uri: string): Promise<string> {
    return this._uploadFile(uri, '/upload/audio', 'audio');
  }
}

export const mediaUploadService = new MediaUploadService();