import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageViewport } from './components/ImageViewport';
import { ModelViewport } from './components/ModelViewport';
import { ControlPanel } from './components/ControlPanel';
import { SettingsModal } from './components/SettingsModal';
import { GenerationParameters, TaskStatus, AppState, APIError } from './types/api';
import TripoAPIService from './services/api';
import './App.css';

const defaultParameters: GenerationParameters = {
  texture: true,
  texture_quality: 'standard',
  generate_parts: false,
  smart_low_poly: false,
  quad: false,
  face_limit: undefined,
  pbr: false,
};

// Development API key provided by user
const DEVELOPMENT_API_KEY = 'you-tripo-api-key';

// Local storage keys
const STORAGE_KEYS = {
  API_KEY: 'tripo_api_key',
  THEME: 'app_theme',
  PARAMETERS: 'generation_parameters',
};

function App() {
  const [state, setState] = useState<AppState>({
    selectedImage: null,
    selectedImageUrl: null,
    imageToken: null,
    textPrompt: '',
    generationParameters: {
      texture: true,
      texture_quality: 'standard',
      generate_parts: false,
      smart_low_poly: false,
      quad: false,
      face_limit: 20000,
      pbr: false,
    },
    currentTask: null,
    isGenerating: false,
    credits: 0,
    viewMode: 'rendered',
    generatedModel: null,
    theme: 'dark',
    apiKey: localStorage.getItem('tripo_api_key') || DEVELOPMENT_API_KEY,
    error: null,
    isSettingsOpen: false,
  });

  const [apiService, setApiService] = useState(() => new TripoAPIService(DEVELOPMENT_API_KEY));
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light';
    const savedParameters = localStorage.getItem(STORAGE_KEYS.PARAMETERS);

    setState(prev => ({
      ...prev,
      apiKey: savedApiKey || DEVELOPMENT_API_KEY,
      theme: savedTheme || 'dark',
      generationParameters: savedParameters ? JSON.parse(savedParameters) : defaultParameters,
    }));

    // Update API service if saved API key exists
    if (savedApiKey) {
      const service = new TripoAPIService(savedApiKey);
      setApiService(service);
      fetchCredits(service);
    } else {
      // Use development API key and fetch credits
      fetchCredits(apiService);
    }
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

  const fetchCredits = useCallback(async (service: TripoAPIService, retryCount = 0) => {
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
    
    // Update API service
    const newService = new TripoAPIService(newApiKey);
    setApiService(newService);
    
    // Fetch credits with new API key
    fetchCredits(newService);
  }, [fetchCredits]);

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

    // Upload the image to get the token
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
  }, [apiService]);

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
            // Refresh credits after successful generation
            fetchCredits(apiService);
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
  }, [state.textPrompt, apiService, fetchCredits]);

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
      const taskId = await apiService.generateImageToModel(
        state.imageToken || state.selectedImageUrl!, // Use token if available, otherwise use URL
        state.generationParameters,
        !state.imageToken // If no token, then we're using a URL
      );
      console.log('image2Model taskId', taskId);
      
      apiService.pollTaskStatus(
        taskId, 
        (status: TaskStatus) => {
          setState(prev => ({
            ...prev,
            currentTask: status,
          }));

          // console.log('image2Model status', status);

          if (status.status === 'success' && (status.output.pbr_model || status.output.model || status.output.base_model)) {
            // Priority order: pbr_model -> model -> base_model
            const modelUrl = status.output.pbr_model || status.output.model || status.output.base_model;
            setState(prev => ({
              ...prev,
              generatedModel: modelUrl!,
              isGenerating: false, // Reset generating state
              currentTask: status,
            }));
            // Refresh credits after successful generation
            fetchCredits(apiService);
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
  }, [state.imageToken, state.selectedImageUrl, state.generationParameters, apiService, fetchCredits]);

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
      />
      
      <main className="main-content">
        <ImageViewport
          selectedImage={state.selectedImageUrl}
          onImageSelect={handleImageSelect}
          isGenerating={state.isGenerating && state.currentTask?.type === 'text_to_image'}
        />
        
        <ModelViewport
          modelUrl={state.generatedModel}
          // modelUrl="https://tripo-data.rg1.data.tripo3d.com/tcli_a3babff9fddb49bdbd9df34f9044ec96/20250705/6e13a1d3-701f-40e0-ac12-d2e1fdd6b6db/tripo_pbr_model_6e13a1d3-701f-40e0-ac12-d2e1fdd6b6db.glb?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmlwby1kYXRhLnJnMS5kYXRhLnRyaXBvM2QuY29tL3RjbGlfYTNiYWJmZjlmZGRiNDliZGJkOWRmMzRmOTA0NGVjOTYvMjAyNTA3MDUvNmUxM2ExZDMtNzAxZi00MGUwLWFjMTItZDJlMWZkZDZiNmRiL3RyaXBvX3Bicl9tb2RlbF82ZTEzYTFkMy03MDFmLTQwZTAtYWMxMi1kMmUxZmRkNmI2ZGIuZ2xiIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzUxNzYwMDAwfX19XX0_&Signature=e7QWreKvxGmKK5UZs4xjQ7KsXMmaRoopQ6WpViCmQnIYqBETh5OjVXh-MXcRIk7TKREk3e-7817m1sey8i5g6f8W9r8-Lsh2NhbxggB~od-GvS4qKl5oFQFiP0LbRV2RHHTQfSxc75vC0Kys26xaSGJ4heTixW7~OChBniV-QgC2lfGmJLXHqKeWonHBKbVKs5CzaD~cgd-~tLRr0Kc-y2DntUJsySgAHlft5nN5VALByHmdVNwBQvRFKNXmAh7fWQALz6tEaEkujW3Z6Z-vEruWLNXewwFSJq5V2N2z8oIQa-zflEKe61ZolwQPABDG1NgtD~x7cCFEg3eD-jLyew__&Key-Pair-Id=K1676C64NMVM2J"
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
      />

      <SettingsModal
        isOpen={state.isSettingsOpen}
        onClose={handleSettingsClose}
        apiKey={state.apiKey}
        onApiKeyChange={handleApiKeyChange}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default App; 