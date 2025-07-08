export type APIProvider = 'tripo' | 'replicate';

export interface GenerationParameters {
  texture: boolean;
  texture_quality: 'standard' | 'detailed';
  generate_parts: boolean;
  smart_low_poly: boolean;
  quad: boolean;
  face_limit?: number;
  pbr: boolean;
  // Replicate-specific parameters
  texture_size?: number; // 512-2048
  mesh_simplify?: number; // 0.9-0.95
}

export interface UploadResponse {
  code: number;
  data: {
    image_token: string;
  };
}

export interface TaskSubmissionRequest {
  type: 'text_to_image' | 'image_to_model';
  prompt?: string;
  file?: {
    type: string;
    file_token?: string;
    url?: string;
  };
  model_version?: string;
  
  // Image-to-model specific parameters (from API documentation)
  model_seed?: number;
  face_limit?: number;
  texture?: boolean;
  pbr?: boolean;
  texture_seed?: number;
  texture_alignment?: 'original_image' | 'geometry';
  texture_quality?: 'standard' | 'detailed';
  auto_size?: boolean;
  style?: string;
  orientation?: 'default' | 'align_image';
  quad?: boolean;
  compress?: '' | 'geometry';
  smart_low_poly?: boolean;
  generate_parts?: boolean;
  
  // Text-to-image specific parameters
  negative_prompt?: string;
}

export interface TaskSubmissionResponse {
  code: number;
  data: {
    task_id: string;
  };
}

export interface TaskStatus {
  task_id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
  input: any;
  output: {
    model?: string;
    base_model?: string;
    pbr_model?: string;
    rendered_image?: string;
    generated_image?: string;
  };
  progress: number;
  create_time: number;
}

export interface TaskStatusResponse {
  code: number;
  data: TaskStatus;
}

export interface UserBalance {
  balance: number;
  frozen: number;
}

export interface UserBalanceResponse {
  code: number;
  data: UserBalance;
}

export interface APIError {
  code: number;
  message: string;
  details?: string;
}

export interface CreditCost {
  base: number;
  texture: number;
  textureQuality: number;
  generateParts: number;
  smartLowPoly: number;
  quadTopology: number;
}

export interface AppState {
  selectedImage: File | null;
  selectedImageUrl: string | null;
  imageToken: string | null;
  textPrompt: string;
  generationParameters: GenerationParameters;
  currentTask: TaskStatus | null;
  isGenerating: boolean;
  credits: number;
  viewMode: '3d' | 'wireframe' | 'rendered';
  generatedModel: string | null;
  theme: 'dark' | 'light';
  apiKey: string;
  error: string | null;
  isSettingsOpen: boolean;
  // New provider-related state
  apiProvider: APIProvider;
  replicateApiKey: string;
} 