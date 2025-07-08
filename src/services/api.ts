import axios, { AxiosError } from 'axios';
import { TaskSubmissionRequest, TaskSubmissionResponse, TaskStatusResponse, UserBalanceResponse, APIError, TaskStatus, GenerationParameters, UploadResponse } from '../types/api';
import Replicate from 'replicate';

const API_BASE_URL = 'https://api.tripo3d.ai/v2/openapi';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
};

// Abstract interface for API services
export interface APIServiceInterface {
  updateApiKey(apiKey: string): void;
  getUserBalance(): Promise<UserBalanceResponse>;
  uploadImage(file: File): Promise<string>;
  generateImageToModel(imageSource: string, parameters: GenerationParameters, isUrl?: boolean): Promise<string>;
  generateTextToImage(prompt: string): Promise<string>;
  getTaskStatus(taskId: string): Promise<TaskStatusResponse>;
  pollTaskStatus(
    taskId: string,
    onUpdate: (status: TaskStatus) => void,
    onError: (error: APIError) => void
  ): Promise<void>;
}

/**
 * Tripo3D API Service
 * 
 * Enhanced for Electron production environment with proper network configuration
 */
class TripoAPIService implements APIServiceInterface {
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

/**
 * Replicate API Service
 * 
 * Implements the same interface as TripoAPIService for consistent usage
 */
class ReplicateAPIService implements APIServiceInterface {
  private apiKey: string;
  private replicate: Replicate;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.replicate = new Replicate({
      auth: apiKey,
    });
  }

  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.replicate = new Replicate({
      auth: apiKey,
    });
  }

  private handleError(error: any): APIError {
    console.error('Replicate API Error:', error);
    
    return {
      code: error.status || 500,
      message: error.message || 'Replicate API request failed',
      details: error.detail || error.toString(),
    };
  }

  async getUserBalance(): Promise<UserBalanceResponse> {
    // Replicate doesn't have a balance API, return a mock response
    return {
      code: 200,
      data: {
        balance: 999, // Mock balance
        frozen: 0,
      },
    };
  }

  async uploadImage(file: File): Promise<string> {
    // For Replicate, we return a special marker since we don't upload
    // The actual file will be handled in generateImageToModel
    return Promise.resolve('replicate-file-ready');
  }

  async generateImageToModel(imageSource: string, parameters: GenerationParameters, isUrl: boolean = false): Promise<string> {
    try {
      let imageData: string;
      
      if (isUrl || imageSource.startsWith('http')) {
        // Use URL directly
        imageData = imageSource;
      } else if (imageSource === 'replicate-file-ready') {
        // This means we need to get the file from the app state
        throw new Error('File should be passed directly to Replicate generateImageToModel');
      } else {
        // Assume it's a data URL
        imageData = imageSource;
      }

      // Extract Replicate-specific parameters with defaults
      const replicateParams = {
        images: [imageData],
        texture_size: parameters.texture_size || 1024,
        mesh_simplify: parameters.mesh_simplify || 0.9,
        generate_model: true,
        save_gaussian_ply: true,
      };

      console.log('Replicate image2Model request', replicateParams);

      const prediction = await this.replicate.predictions.create({
        version: "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
        input: replicateParams,
      });

      console.log('Replicate image2Model response', prediction);
      return prediction.id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // New method to handle file directly
  async generateImageToModelFromFile(file: File, parameters: GenerationParameters): Promise<string> {
    try {
      // Convert file to data URL for Replicate
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Extract Replicate-specific parameters with defaults
      const replicateParams = {
        images: [imageData],
        texture_size: parameters.texture_size || 1024,
        mesh_simplify: parameters.mesh_simplify || 0.9,
        generate_model: true,
        save_gaussian_ply: true,
      };

      console.log('Replicate image2Model request from file', replicateParams);

      const prediction = await this.replicate.predictions.create({
        version: "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
        input: replicateParams,
      });

      console.log('Replicate image2Model response', prediction);
      return prediction.id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateTextToImage(prompt: string): Promise<string> {
    try {
      const prediction = await this.replicate.predictions.create({
        version: "black-forest-labs/flux-schnell",
        input: { prompt },
      });

      return prediction.id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const prediction = await this.replicate.predictions.get(taskId);
      
      // Convert Replicate response to our standard format
      const status: TaskStatus = {
        task_id: prediction.id,
        type: (prediction.input as any)?.images ? 'image_to_model' : 'text_to_image',
        status: this.mapReplicateStatus(prediction.status),
        input: prediction.input,
        output: this.mapReplicateOutput(prediction.output),
        progress: this.calculateProgress(prediction.status),
        create_time: new Date(prediction.created_at).getTime(),
      };

      return {
        code: 200,
        data: status,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private mapReplicateStatus(status: string): TaskStatus['status'] {
    switch (status) {
      case 'starting':
      case 'processing':
        return 'running';
      case 'succeeded':
        return 'success';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'queued';
    }
  }

  private mapReplicateOutput(output: any) {
    if (!output) return {};
    
    // Handle different output formats
    if (Array.isArray(output)) {
      // Text-to-image typically returns an array of URLs
      return { generated_image: output[0] };
    } else if (typeof output === 'object') {
      // Image-to-model returns an object with model_file
      return { 
        model: output.model_file,
        base_model: output.model_file,
        pbr_model: output.model_file,
      };
    }
    
    return {};
  }

  private calculateProgress(status: string): number {
    switch (status) {
      case 'starting':
        return 10;
      case 'processing':
        return 50;
      case 'succeeded':
        return 100;
      case 'failed':
      case 'canceled':
        return 0;
      default:
        return 0;
    }
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
          setTimeout(poll, 3000); // Poll every 3 seconds (Replicate is slower)
        }
      } catch (error) {
        console.error('Error polling Replicate task status:', error);
        onError(error as APIError);
      }
    };

    poll();
  }

  // Validate API key format
  static isValidApiKey(apiKey: string): boolean {
    // Replicate API keys start with "r8_"
    return apiKey.length > 10 && apiKey.startsWith('r8_');
  }
}

// Factory function to create the appropriate API service
export function createAPIService(provider: 'tripo' | 'replicate', apiKey: string): APIServiceInterface {
  switch (provider) {
    case 'tripo':
      return new TripoAPIService(apiKey);
    case 'replicate':
      return new ReplicateAPIService(apiKey);
    default:
      throw new Error(`Unsupported API provider: ${provider}`);
  }
}

export default TripoAPIService;
export { ReplicateAPIService }; 