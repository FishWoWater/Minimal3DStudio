// Base API Response Types
export interface BaseApiResponse {
  job_id?: string;
  status: JobStatus;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  detail?: string;
}

// Job Management Types
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobInfo {
  job_id: string;
  status: JobStatus;
  created_at: string;
  completed_at?: string;
  processing_time?: number;
  result?: {
    output_mesh_path?: string;
    thumbnail_path?: string;
    mesh_url?: string; 
    thumbnail_url?: string;
    generation_info?: {
      model_used: string;
      parameters: Record<string, any>;
      thumbnail_generated?: boolean;
    };
  };
}

export interface JobResultInfo {
  job_id: string;
  status: JobStatus;
  file_info: {
    file_exists: boolean;
    file_size_mb: number;
    file_format: string;
    content_type: string;
  };
  generation_info: {
    model_used: string;
    processing_time: number;
  };
  mesh_download_urls: {
    direct_download: string;
    base64_download: string;
  };
  thumbnail_download_urls: {
    direct_download: string;
    base64_download: string;
  };
}

// Jobs History Types
export interface HistoricalJob {
  job_id: string;
  status: JobStatus;
  feature: string;
  created_at: string;
  completed_at?: string;
  model_preference?: string;
  processing_time?: number;
  output_mesh_path?: string;
  thumbnail_path?: string;
  mesh_url?: string;
  thumbnail_url?: string;
}

export interface JobsHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface JobsHistoryFilters {
  status?: JobStatus | null;
  feature?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface JobsHistoryResponse {
  jobs: HistoricalJob[];
  pagination: JobsHistoryPagination;
  filters: JobsHistoryFilters;
  timestamp: number;
}

export interface JobsHistoryParams {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  feature?: string;
  start_date?: string;
  end_date?: string;
}

// System Status Types
export interface SystemStatus {
  timestamp: string;
  system: {
    cpu_usage: number;
    memory: {
      total: number;
      available: number;
      used: number;
      percent: number;
    };
    disk: {
      total: number;
      free: number;
      used: number;
      percent: number;
    };
  };
  gpu: Array<{
    id: number;
    name: string;
    memory_total: number;
    memory_used: number;
    memory_free: number;
    memory_utilization: number;
    gpu_utilization: number;
    temperature: number;
  }>;
  models: {
    loaded: number;
    available: number;
    total_vram_used: number;
  };
  queue: {
    pending_jobs: number;
    processing_jobs: number;
    completed_jobs: number;
  };
}

export interface SchedulerStatus {
  scheduler: {
    running: boolean;
    queue_status: {
      queued_jobs: number;
      processing_jobs: number;
      completed_jobs: number;
    };
    gpu_status: Array<{
      id: number;
      memory_used: number;
      memory_total: number;
    }>;
    models: Record<string, {
      status: string;
      vram_usage: number;
    }>;
  };
  adapters_registered: number;
  active_jobs: number;
  queued_jobs: number;
  completed_jobs: number;
}

// Available Models Types
export interface AvailableModels {
  available_models: Record<string, string[]>;
  total_features: number;
  total_models: number;
}

export interface FeatureInfo {
  name: string;
  model_count: number;
  models: string[];
}

export interface FeaturesResponse {
  features: FeatureInfo[];
  total_features: number;
}

// File Upload Types - NEW
export interface FileUploadResponse {
  file_id: string;
  filename: string;
  file_type: 'image' | 'mesh';
  file_size_mb: number;
  upload_time: string;
  expires_at: string;
}

export interface FileMetadata {
  file_id: string;
  filename: string;
  file_type: 'image' | 'mesh';
  file_size_mb: number;
  upload_time: string;
  expires_at: string;
  is_available: boolean;
}

// Mesh Generation Types - UPDATED
export interface TextToMeshRequest {
  text_prompt: string;
  output_format: OutputFormat;
  model_preference?: string;
}

export interface TextToTexturedMeshRequest {
  text_prompt: string;
  texture_prompt?: string;
  texture_resolution?: number;
  output_format: OutputFormat;
  model_preference?: string;
}

export interface ImageToMeshRequest {
  image_path?: string;
  image_base64?: string;
  image_file_id?: string; // preferred method
  output_format: OutputFormat;
  model_preference?: string;
}

export interface ImageToTexturedMeshRequest {
  image_path?: string;
  image_base64?: string;
  image_file_id?: string; // preferred method
  texture_image_path?: string;
  texture_image_base64?: string;
  texture_image_file_id?: string; //preferred method
  texture_resolution?: number;
  output_format: OutputFormat;
  model_preference?: string;
}

export interface MeshPaintingRequest {
  text_prompt?: string;
  image_path?: string;
  image_base64?: string;
  image_file_id?: string; // preferred method
  mesh_path?: string;
  mesh_base64?: string;
  mesh_file_id?: string; // preferred method
  texture_resolution?: number;
  output_format: OutputFormat;
  model_preference?: string;
}

export interface PartCompletionRequest {
  mesh_path?: string;
  mesh_base64?: string;
  mesh_file_id?: string; // preferred method
  output_format: OutputFormat;
  model_preference?: string;
}

// Mesh Segmentation Types - UPDATED
export interface MeshSegmentationRequest {
  mesh_path?: string;
  mesh_base64?: string;
  mesh_file_id?: string; // preferred method
  num_parts: number;
  output_format: 'glb' | 'json';
  model_preference?: string;
}

// Auto Rigging Types - UPDATED
export interface AutoRiggingRequest {
  mesh_path?: string;
  mesh_file_id?: string; // preferred method
  rig_mode: 'skeleton' | 'skin' | 'full';
  output_format: 'fbx' | 'glb';
  model_preference?: string;
}

// Legacy Upload Types (keeping for backward compatibility)
export interface UploadResponse {
  file_id?: string;
  filename?: string;
  file_path?: string;
  original_filename?: string;
  file_type?: string;
  file_size_mb?: number;
  size?: number;
  content_type?: string;
  message?: string;
}

// Supported Formats Types
export interface SupportedFormats {
  input_formats: {
    text?: string[];
    image?: string[];
    mesh?: string[];
    base64?: string[];
  };
  output_formats: {
    mesh?: string[];
    texture?: string[];
  };
  upload_limits?: {
    image_max_size_mb: number;
    mesh_max_size_mb: number;
    image_max_resolution: [number, number];
  };
}

// Common Types
export type OutputFormat = 'glb' | 'obj' | 'fbx' | 'ply';
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'bmp' | 'tiff';

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
}

// File Upload Types
export interface FileUploadOptions {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// API Client Configuration
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
  retries?: number;
}

// Error Types
export interface ApiError extends Error {
  code?: string;
  status?: number;
  response?: ErrorResponse;
} 