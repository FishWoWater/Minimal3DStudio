import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageViewport } from './components/ImageViewport';
import { ModelViewport } from './components/ModelViewport';
import { ControlPanel } from './components/ControlPanel';
import { SettingsModal } from './components/SettingsModal';
import { GenerationParameters, TaskStatus, AppState, APIError, APIProvider } from './types/api';
import { createAPIService, APIServiceInterface } from './services/api';
import './App.css';

const defaultParameters: GenerationParameters = {
  texture: true,
  texture_quality: 'standard',
  generate_parts: false,
  smart_low_poly: false,
  quad: false,
  face_limit: undefined,
  pbr: false,
  // Replicate defaults
  texture_size: 1024,
  mesh_simplify: 0.9,
};

// Development API keys from environment variables
const DEVELOPMENT_TRIPO_API_KEY = process.env.REACT_APP_TRIPO_API_KEY || '';
const DEVELOPMENT_REPLICATE_API_KEY = process.env.REACT_APP_REPLICATE_API_KEY || '';

// Local storage keys
const STORAGE_KEYS = {
  API_KEY: 'tripo_api_key',
  REPLICATE_API_KEY: 'replicate_api_key',
  API_PROVIDER: 'api_provider',
  THEME: 'app_theme',
  PARAMETERS: 'generation_parameters',
};

function App() {
  const [state, setState] = useState<AppState>({
    selectedImage: null,
    selectedImageUrl: null,
    imageToken: null,
    textPrompt: '',
    generationParameters: defaultParameters,
    currentTask: null,
    isGenerating: false,
    credits: 0,
    viewMode: 'rendered',
    generatedModel: null,
    theme: 'dark',
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '', // TODO: replace the latter with your development key above
    replicateApiKey: localStorage.getItem(STORAGE_KEYS.REPLICATE_API_KEY) || '', // TODO: replace the latter with your development key above
    apiProvider: (localStorage.getItem(STORAGE_KEYS.API_PROVIDER) as APIProvider) || 'tripo',
    error: null,
    isSettingsOpen: false,
  });

  const [apiService, setApiService] = useState<APIServiceInterface>(() => {
    const provider = (localStorage.getItem(STORAGE_KEYS.API_PROVIDER) as APIProvider) || 'tripo';
    const apiKey = provider === 'tripo' 
      ? localStorage.getItem(STORAGE_KEYS.API_KEY) || DEVELOPMENT_TRIPO_API_KEY
      : localStorage.getItem(STORAGE_KEYS.REPLICATE_API_KEY) || DEVELOPMENT_REPLICATE_API_KEY;
    return createAPIService(provider, apiKey);
  });
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedReplicateApiKey = localStorage.getItem(STORAGE_KEYS.REPLICATE_API_KEY);
    const savedApiProvider = localStorage.getItem(STORAGE_KEYS.API_PROVIDER) as APIProvider;
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light';
    const savedParameters = localStorage.getItem(STORAGE_KEYS.PARAMETERS);

    setState(prev => ({
      ...prev,
      apiKey: savedApiKey || DEVELOPMENT_TRIPO_API_KEY,
      replicateApiKey: savedReplicateApiKey || DEVELOPMENT_REPLICATE_API_KEY,
      apiProvider: savedApiProvider || 'tripo',
      theme: savedTheme || 'dark',
      generationParameters: savedParameters ? { ...defaultParameters, ...JSON.parse(savedParameters) } : defaultParameters,
    }));

    // Create appropriate API service
    const provider = savedApiProvider || 'tripo';
    const apiKey = provider === 'tripo' 
      ? savedApiKey || DEVELOPMENT_TRIPO_API_KEY
      : savedReplicateApiKey || DEVELOPMENT_REPLICATE_API_KEY;
    
    if (apiKey) {
      const service = createAPIService(provider, apiKey);
      setApiService(service);
      // Only fetch credits for Tripo provider
      if (provider === 'tripo') {
        fetchCredits(service);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
  }, [state.theme]);

  // Save parameters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(state.generationParameters));
  }, [state.generationParameters]);

  const fetchCredits = useCallback(async (service: APIServiceInterface, retryCount = 0) => {
    setIsLoadingCredits(true);
    try {
      const balanceResponse = await service.getUserBalance();
      setState(prev => ({
        ...prev,
        credits: balanceResponse.data.balance,
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching credits:', error);
      const apiError = error as APIError;
      
      // Retry network errors up to 2 times with exponential backoff
      if (apiError.code === 0 && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchCredits(service, retryCount + 1), delay);
        return;
      }
      
      setState(prev => ({
        ...prev,
        error: `Failed to fetch credits: ${apiError.message}`,
      }));
    } finally {
      setIsLoadingCredits(false);
    }
  }, []);

  const handleApiKeyChange = useCallback((newApiKey: string) => {
    setState(prev => ({ ...prev, apiKey: newApiKey }));
    localStorage.setItem(STORAGE_KEYS.API_KEY, newApiKey);
    
    // Update API service if current provider is Tripo
    if (state.apiProvider === 'tripo') {
      const newService = createAPIService('tripo', newApiKey);
      setApiService(newService);
      fetchCredits(newService);
    }
  }, [state.apiProvider, fetchCredits]);

  const handleReplicateApiKeyChange = useCallback((newApiKey: string) => {
    setState(prev => ({ ...prev, replicateApiKey: newApiKey }));
    localStorage.setItem(STORAGE_KEYS.REPLICATE_API_KEY, newApiKey);
    
    // Update API service if current provider is Replicate
    if (state.apiProvider === 'replicate') {
      const newService = createAPIService('replicate', newApiKey);
      setApiService(newService);
      // Don't fetch credits for Replicate
    }
  }, [state.apiProvider]);

  const handleApiProviderChange = useCallback((newProvider: APIProvider) => {
    setState(prev => ({ ...prev, apiProvider: newProvider }));
    localStorage.setItem(STORAGE_KEYS.API_PROVIDER, newProvider);
    
    // Switch API service
    const apiKey = newProvider === 'tripo' ? state.apiKey : state.replicateApiKey;
    if (apiKey) {
      const newService = createAPIService(newProvider, apiKey);
      setApiService(newService);
      // Only fetch credits for Tripo
      if (newProvider === 'tripo') {
        fetchCredits(newService);
      }
    }
  }, [state.apiKey, state.replicateApiKey, fetchCredits]);

  const handleSettingsSave = useCallback(() => {
    // Settings are automatically saved via other handlers
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleImageSelect = useCallback(async (file: File) => {
    // Set the image immediately for UI feedback
    setState(prev => ({
      ...prev,
      selectedImage: file,
      selectedImageUrl: URL.createObjectURL(file),
      imageToken: null, // Reset token when new image is selected
      error: null,
    }));

    // Only upload image for Tripo provider
    if (state.apiProvider === 'tripo') {
      try {
        const imageToken = await apiService.uploadImage(file);
        setState(prev => ({
          ...prev,
          imageToken: imageToken,
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to upload image. Please try again.',
        }));
      }
    } else {
      // For Replicate, store the file directly
      setState(prev => ({
        ...prev,
        imageToken: 'replicate-file-ready', // Flag to indicate file is ready
      }));
    }
  }, [apiService, state.apiProvider]);

  const handleTextPromptChange = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      textPrompt: prompt,
    }));
  }, []);

  const handleParametersChange = useCallback((parameters: GenerationParameters) => {
    setState(prev => ({
      ...prev,
      generationParameters: parameters,
    }));
  }, []);

  const handleError = useCallback((error: APIError) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      isGenerating: false,
    }));
  }, []);

  const handleClearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!state.textPrompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null, currentTask: null }));

    try {
      const taskId = await apiService.generateTextToImage(state.textPrompt);
      
      apiService.pollTaskStatus(
        taskId, 
        (status: TaskStatus) => {
          setState(prev => ({
            ...prev,
            currentTask: status,
          }));

          console.log('text2Image status', status);

          if (status.status === 'success' && status.output.generated_image) {
            // Clear the selected file since we now have a generated image
            setState(prev => ({
              ...prev,
              selectedImage: null, // Clear the file object
              selectedImageUrl: status.output.generated_image!, // Set the generated image URL
              imageToken: null, // Clear the image token since we're using a generated image
              isGenerating: false, // Reset generating state
              currentTask: status,
            }));
            // Refresh credits after successful generation (only for Tripo)
            if (state.apiProvider === 'tripo') {
              fetchCredits(apiService);
            }
          } else if (status.status === 'failed') {
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              currentTask: status,
              error: 'Image generation failed. Please try again.'
            }));
          } else if (status.status === 'cancelled' || status.status === 'unknown') {
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              currentTask: status,
              error: 'Image generation was cancelled or encountered an unknown error.'
            }));
          }
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: error.message,
            isGenerating: false,
            currentTask: null,
          }));
        }
      );
    } catch (error) {
      handleError(error as APIError);
    }
  }, [state.textPrompt, state.apiProvider, apiService, fetchCredits, handleError]);

  const handleGenerate3DModel = useCallback(async () => {
    // Check if we have either an image token (uploaded image) or image URL (generated image)
    if (!state.imageToken && !state.selectedImageUrl) {
      setState(prev => ({
        ...prev,
        error: 'Please select an image or generate an image first.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null, currentTask: null }));

    try {
      let taskId: string;

      if (state.apiProvider === 'replicate') {
        // For Replicate, handle file vs URL differently
        if (state.selectedImage && state.imageToken === 'replicate-file-ready') {
          // Use file directly for Replicate
          const replicateService = apiService as any; // Type assertion to access generateImageToModelFromFile
          taskId = await replicateService.generateImageToModelFromFile(state.selectedImage, state.generationParameters);
        } else if (state.selectedImageUrl) {
          // Use URL for generated images
          taskId = await apiService.generateImageToModel(
            state.selectedImageUrl,
            state.generationParameters,
            true // isUrl = true
          );
        } else {
          throw new Error('No valid image source for Replicate');
        }
      } else {
        // Original Tripo logic
        taskId = await apiService.generateImageToModel(
          state.imageToken || state.selectedImageUrl!, // Use token if available, otherwise use URL
          state.generationParameters,
          !state.imageToken // If no token, then we're using a URL
        );
      }

      console.log('image2Model taskId', taskId);
      
      apiService.pollTaskStatus(
        taskId, 
        (status: TaskStatus) => {
          setState(prev => ({
            ...prev,
            currentTask: status,
          }));

          if (status.status === 'success' && (status.output.pbr_model || status.output.model || status.output.base_model)) {
            // Priority order: pbr_model -> model -> base_model
            const modelUrl = status.output.pbr_model || status.output.model || status.output.base_model;
            setState(prev => ({
              ...prev,
              generatedModel: modelUrl!,
              isGenerating: false, // Reset generating state
              currentTask: status,
            }));
            // Refresh credits after successful generation (only for Tripo)
            if (state.apiProvider === 'tripo') {
              fetchCredits(apiService);
            }
          } else if (status.status === 'failed') {
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              currentTask: status,
              error: '3D model generation failed. Please try again.'
            }));
          } else if (status.status === 'cancelled' || status.status === 'unknown') {
            setState(prev => ({ 
              ...prev, 
              isGenerating: false,
              currentTask: status,
              error: '3D model generation was cancelled or encountered an unknown error.'
            }));
          }
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: error.message,
            isGenerating: false,
            currentTask: null,
          }));
        }
      );
    } catch (error) {
      handleError(error as APIError);
    }
  }, [state.imageToken, state.selectedImageUrl, state.selectedImage, state.generationParameters, state.apiProvider, apiService, fetchCredits, handleError]);

  const handleViewModeChange = useCallback((mode: '3d' | 'wireframe' | 'rendered') => {
    setState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const handleThemeToggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const handleSettingsOpen = useCallback(() => {
    setState(prev => ({ ...prev, isSettingsOpen: true }));
  }, []);

  const handleSettingsClose = useCallback(() => {
    setState(prev => ({ ...prev, isSettingsOpen: false }));
  }, []);

  const handleExportModel = useCallback(() => {
    if (state.generatedModel) {
      // Create a download link
      const link = document.createElement('a');
      link.href = state.generatedModel;
      link.download = 'generated-model.glb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [state.generatedModel]);

  return (
    <div className={`app-container ${state.theme}`} data-theme={state.theme}>
      <Header
        credits={state.credits}
        theme={state.theme}
        onThemeToggle={handleThemeToggle}
        onSettingsClick={handleSettingsOpen}
        isLoadingCredits={isLoadingCredits}
        apiProvider={state.apiProvider}
      />
      
      <main className="main-content">
        <ImageViewport
          selectedImage={state.selectedImageUrl}
          onImageSelect={handleImageSelect}
          isGenerating={state.isGenerating && state.currentTask?.type === 'text_to_image'}
        />
        
        <ModelViewport
          modelUrl={state.generatedModel}
          viewMode={state.viewMode}
          onViewModeChange={handleViewModeChange}
          isGenerating={state.isGenerating && state.currentTask?.type === 'image_to_model'}
        />
      </main>
      
      <ControlPanel
        textPrompt={state.textPrompt}
        onTextPromptChange={handleTextPromptChange}
        parameters={state.generationParameters}
        onParametersChange={handleParametersChange}
        onGenerateImage={handleGenerateImage}
        onGenerate3DModel={handleGenerate3DModel}
        onExportModel={handleExportModel}
        isGenerating={state.isGenerating}
        currentTask={state.currentTask}
        hasImage={!!state.selectedImageUrl}
        hasModel={!!state.generatedModel}
        error={state.error}
        onClearError={handleClearError}
        apiProvider={state.apiProvider}
      />

      <SettingsModal
        isOpen={state.isSettingsOpen}
        onClose={handleSettingsClose}
        apiKey={state.apiKey}
        onApiKeyChange={handleApiKeyChange}
        replicateApiKey={state.replicateApiKey}
        onReplicateApiKeyChange={handleReplicateApiKeyChange}
        apiProvider={state.apiProvider}
        onApiProviderChange={handleApiProviderChange}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default App; 