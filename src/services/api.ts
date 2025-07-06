import axios, { AxiosError } from 'axios';
import { TaskSubmissionRequest, TaskSubmissionResponse, TaskStatusResponse, UserBalanceResponse, APIError, TaskStatus, GenerationParameters, UploadResponse } from '../types/api';

const API_BASE_URL = 'https://api.tripo3d.ai/v2/openapi';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
};

/**
 * Tripo3D API Service
 * 
 * Enhanced for Electron production environment with proper network configuration
 */
class TripoAPIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // Configure axios defaults for Electron
    if (isElectron()) {
      axios.defaults.timeout = 30000; // 30 second timeout
      axios.defaults.headers.common['User-Agent'] = 'Minimal3DStudio/1.0 (Electron)';
    }
  }

  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
    
    // Add user agent for Electron
    if (isElectron()) {
      headers['User-Agent'] = 'Minimal3DStudio/1.0 (Electron)';
    }
    
    return headers;
  }

  private getUploadHeaders() {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };
    
    // Add user agent for Electron
    if (isElectron()) {
      headers['User-Agent'] = 'Minimal3DStudio/1.0 (Electron)';
    }
    
    return headers;
  }

  private handleError(error: AxiosError): APIError {
    console.error('API Error:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data as any;
      return {
        code: errorData.code || error.response.status,
        message: errorData.message || 'API request failed',
        details: errorData.details || error.message,
      };
    }
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED' || !error.response) {
      return {
        code: 0,
        message: 'Network error - please check your internet connection',
        details: error.message,
      };
    }

    return {
      code: error.response?.status || 0,
      message: error.message || 'Unknown error occurred',
      details: error.response?.statusText,
    };
  }

  async getUserBalance(): Promise<UserBalanceResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/balance`, {
        headers: this.getHeaders(),
        timeout: 15000, // 15 second timeout for balance check
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async submitTask(request: TaskSubmissionRequest): Promise<TaskSubmissionResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/task`, request, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/task/${taskId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/upload/sts`, formData, {
        headers: this.getUploadHeaders(),
      });
      
      const uploadResponse: UploadResponse = response.data;
      return uploadResponse.data.image_token;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async generateImageToModel(imageSource: string, parameters: GenerationParameters, isUrl: boolean = false): Promise<string> {
    // Build the request according to API documentation
    const request: TaskSubmissionRequest = {
      type: 'image_to_model',
      model_version: 'v2.5-20250123', // Use latest stable version
      file: isUrl ? {
        type: 'jpeg', // Assume JPEG for URLs
        url: imageSource,
      } : {
        type: 'jpeg', // Assume JPEG, could be detected from file extension
        file_token: imageSource,
      },
      // Map UI parameters to API parameters correctly
      texture: parameters.generate_parts ? false : parameters.texture,
      pbr: parameters.pbr,
      texture_quality: parameters.texture_quality,
      smart_low_poly: parameters.smart_low_poly,
      quad: parameters.quad,
      generate_parts: parameters.generate_parts,
      face_limit: parameters.face_limit,
    };

    // Handle parameter constraints from API documentation
    if (parameters.generate_parts) {
      // generate_parts is not compatible with texture=true
      request.texture = false;
      // generate_parts is not compatible with quad=true  
      request.quad = false;
    }

    console.log('image2Model request', request);
    const response = await this.submitTask(request);
    console.log('image2Model response', response);
    return response.data.task_id;
  }

  async generateTextToImage(prompt: string): Promise<string> {
    const request: TaskSubmissionRequest = {
      type: 'text_to_image',
      prompt,
    };

    const response = await this.submitTask(request);
    return response.data.task_id;
  }

  async pollTaskStatus(
    taskId: string, 
    onUpdate: (status: TaskStatus) => void,
    onError: (error: APIError) => void
  ): Promise<void> {
    const poll = async () => {
      try {
        const response = await this.getTaskStatus(taskId);
        const status = response.data;
        
        onUpdate(status);
        
        if (status.status === 'queued' || status.status === 'running') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        onError(error as APIError);
      }
    };

    poll();
  }

  // Validate API key format
  static isValidApiKey(apiKey: string): boolean {
    // Tripo3D API keys typically start with "tcli_" or "tsk_"
    return apiKey.length > 10 && (apiKey.startsWith('tcli_') || apiKey.startsWith('tsk_'));
  }
}

export default TripoAPIService; 