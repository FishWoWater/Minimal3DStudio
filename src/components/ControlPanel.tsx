import React, { useCallback } from 'react';
import { Sparkles, Download, Zap, AlertCircle, Info } from 'lucide-react';
import { GenerationParameters, TaskStatus, APIProvider } from '../types/api';

interface ControlPanelProps {
  textPrompt: string;
  onTextPromptChange: (prompt: string) => void;
  parameters: GenerationParameters;
  onParametersChange: (parameters: GenerationParameters) => void;
  onGenerateImage: () => void;
  onGenerate3DModel: () => void;
  onExportModel: () => void;
  isGenerating: boolean;
  currentTask: TaskStatus | null;
  hasImage: boolean;
  hasModel: boolean;
  error: string | null;
  onClearError: () => void;
  apiProvider: APIProvider;
}

const CREDIT_COSTS = {
  base: 20,
  texture: 10,
  textureQuality: 10,
  generateParts: 20,
  smartLowPoly: 10,
  quadTopology: 5,
  pbr: 0,
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  textPrompt,
  onTextPromptChange,
  parameters,
  onParametersChange,
  onGenerateImage,
  onGenerate3DModel,
  onExportModel,
  isGenerating,
  currentTask,
  hasImage,
  hasModel,
  error,
  onClearError,
  apiProvider,
}) => {
  const handleParameterToggle = useCallback((parameter: keyof GenerationParameters) => {
    onParametersChange({
      ...parameters,
      [parameter]: !parameters[parameter],
    });
  }, [parameters, onParametersChange]);

  const calculateTotalCost = useCallback(() => {
    // For Replicate, we don't show credit costs
    if (apiProvider === 'replicate') {
      return 0;
    }

    let cost = CREDIT_COSTS.base;
    
    // Handle parameter constraints: if generate_parts is true, texture will be forced to false
    // If PBR is true, texture will be ignored and used as true
    const effectiveTexture = parameters.generate_parts ? false : (parameters.pbr || parameters.texture);
    
    if (effectiveTexture) cost += CREDIT_COSTS.texture;
    if (effectiveTexture && parameters.texture_quality === 'detailed') cost += CREDIT_COSTS.textureQuality;
    if (parameters.generate_parts) cost += CREDIT_COSTS.generateParts;
    if (parameters.smart_low_poly) cost += CREDIT_COSTS.smartLowPoly;
    if (parameters.pbr) cost += CREDIT_COSTS.pbr;
    
    // Handle quad constraint: if generate_parts is true, quad will be forced to false
    const effectiveQuad = parameters.generate_parts ? false : parameters.quad;
    if (effectiveQuad) cost += CREDIT_COSTS.quadTopology;
    
    return cost;
  }, [parameters, apiProvider]);

  const getStatusText = () => {
    if (error) return '';
    if (!currentTask) return 'Ready to generate';
    
    switch (currentTask.status) {
      case 'queued':
        return 'Queued for processing...';
      case 'running':
        return `Processing... ${currentTask.progress}%`;
      case 'success':
        return 'Generation completed successfully!';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Ready to generate';
    }
  };

  const getStatusClass = () => {
    if (error) return 'error';
    if (!currentTask) return '';
    
    switch (currentTask.status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return '';
    }
  };

  const getProgressPercentage = () => {
    return currentTask?.progress || 0;
  };

  const hasParameterConstraints = apiProvider === 'tripo' && (
    (parameters.generate_parts && (parameters.texture || parameters.quad)) || 
    (parameters.pbr && parameters.texture)
  );

  const renderTripoParameters = () => (
    <>
      <div 
        className={`parameter-btn ${parameters.texture ? 'active' : ''} ${parameters.generate_parts ? 'disabled' : ''}`}
        onClick={() => !parameters.generate_parts && handleParameterToggle('texture')}
      >
        <span>Generate Texture</span>
        <span className="credit-cost">+{CREDIT_COSTS.texture}</span>
        <div className="tooltip">
          Adds realistic texture to the model (+{CREDIT_COSTS.texture} credits)
        </div>
      </div>

      <div 
        className={`parameter-btn ${parameters.pbr ? 'active' : ''}`}
        onClick={() => handleParameterToggle('pbr')}
      >
        <span>PBR</span>
        <span className="credit-cost">+{CREDIT_COSTS.pbr}</span>
        <div className="tooltip">
          Physically Based Rendering texture with advanced materials (+{CREDIT_COSTS.pbr} credits)
        </div>
      </div>
      
      <div 
        className={`parameter-btn ${parameters.texture_quality === 'detailed' ? 'active' : ''}`}
        onClick={() => onParametersChange({
          ...parameters,
          texture_quality: parameters.texture_quality === 'detailed' ? 'standard' : 'detailed'
        })}
      >
        <span>HD Texture</span>
        <span className="credit-cost">+{CREDIT_COSTS.textureQuality}</span>
        <div className="tooltip">
          High-definition texture quality (+{CREDIT_COSTS.textureQuality} credits)
        </div>
      </div>
      
      <div 
        className={`parameter-btn ${parameters.generate_parts ? 'active' : ''}`}
        onClick={() => handleParameterToggle('generate_parts')}
      >
        <span>Generate In Parts</span>
        <span className="credit-cost">+{CREDIT_COSTS.generateParts}</span>
        <div className="tooltip">
          Creates model with separate components (+{CREDIT_COSTS.generateParts} credits)
        </div>
      </div>
      
      <div 
        className={`parameter-btn ${parameters.smart_low_poly ? 'active' : ''}`}
        onClick={() => handleParameterToggle('smart_low_poly')}
      >
        <span>Low Poly</span>
        <span className="credit-cost">+{CREDIT_COSTS.smartLowPoly}</span>
        <div className="tooltip">
          Optimized geometry for gaming/AR (+{CREDIT_COSTS.smartLowPoly} credit)
        </div>
      </div>
      
      <div 
        className={`parameter-btn ${parameters.quad ? 'active' : ''} ${parameters.generate_parts ? 'disabled' : ''}`}
        onClick={() => !parameters.generate_parts && handleParameterToggle('quad')}
      >
        <span>Quad</span>
        <span className="credit-cost">+{CREDIT_COSTS.quadTopology}</span>
        <div className="tooltip">
          Clean quad-based mesh topology (+{CREDIT_COSTS.quadTopology} credits)
        </div>
      </div>
    </>
  );

  const renderReplicateParameters = () => (
    <>
      <div className="parameter-group">
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Texture Size: {parameters.texture_size || 1024}px
        </label>
        <input
          type="range"
          min="512"
          max="2048"
          step="256"
          value={parameters.texture_size || 1024}
          onChange={(e) => onParametersChange({
            ...parameters,
            texture_size: parseInt(e.target.value, 10)
          })}
          disabled={isGenerating}
          className="slider"
        />
        <div className="slider-labels">
          <span>512</span>
          <span>1024</span>
          <span>2048</span>
        </div>
      </div>

      <div className="parameter-group">
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Mesh Simplify: {((parameters.mesh_simplify || 0.9) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.9"
          max="0.99"
          step="0.01"
          value={parameters.mesh_simplify || 0.9}
          onChange={(e) => onParametersChange({
            ...parameters,
            mesh_simplify: parseFloat(e.target.value)
          })}
          disabled={isGenerating}
          className="slider"
        />
        <div className="slider-labels">
          <span>50%</span>
          <span>70%</span>
          <span>95%</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="control-panel">
      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            className="text-input"
            placeholder="Enter text prompt to generate image (optional)"
            value={textPrompt}
            onChange={(e) => onTextPromptChange(e.target.value)}
            disabled={isGenerating}
          />
          <button 
            className="btn btn-primary"
            onClick={onGenerateImage}
            disabled={isGenerating || !textPrompt.trim()}
          >
            <Sparkles size={16} /> Generate Image
          </button>
        </div>
        
        <div className="input-group">
          <button 
            className="btn btn-primary"
            onClick={onGenerate3DModel}
            disabled={isGenerating || !hasImage}
            style={{ flex: '0 0 auto' }}
          >
            <Zap size={16} /> Generate 3D Model
          </button>
          <button 
            className="btn"
            onClick={onExportModel}
            disabled={!hasModel}
          >
            <Download size={16} /> Export Model
          </button>
        </div>
        
        {isGenerating && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <AlertCircle size={16} className="error-icon" />
            <span>{error}</span>
            <button 
              className="btn-icon" 
              onClick={onClearError}
              style={{ marginLeft: 'auto' }}
            >
              ×
            </button>
          </div>
        )}

        {hasParameterConstraints && (
          <div className="warning-message">
            <Info size={16} className="warning-icon" />
            <span>
              Note: "Generate In Parts" is not compatible with "Generate Texture" and "Quad Topology". 
              {parameters.pbr && parameters.texture && "PBR Texture overrides regular texture generation and will force texture generation. "}
              Conflicting options will be automatically handled for your generation.
            </span>
          </div>
        )}
        
        <div className={`status-text ${getStatusClass()}`}>{getStatusText()}</div>
      </div>

      <div className="parameters-section">
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Advanced Parameters ({apiProvider === 'tripo' ? 'Tripo3D' : 'Replicate'})
        </h3>
        
        {apiProvider === 'tripo' ? (
          <>
            <div className="parameters-grid">
              {renderTripoParameters()}
            </div>
            
            <div className="input-group" style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Face Limit: {parameters.face_limit ? parameters.face_limit.toLocaleString() : 'Auto'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={parameters.face_limit || 10000}
                  onChange={(e) => onParametersChange({
                    ...parameters,
                    face_limit: parseInt(e.target.value, 10)
                  })}
                  disabled={isGenerating}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-icon"
                  onClick={() => onParametersChange({
                    ...parameters,
                    face_limit: undefined
                  })}
                  disabled={isGenerating}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  title="Reset to Auto"
                >
                  Auto
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Base generation: {CREDIT_COSTS.base} credits • Selected options: +{calculateTotalCost() - CREDIT_COSTS.base} credits
            </div>
          </>
        ) : (
          <div className="replicate-parameters">
            {renderReplicateParameters()}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Replicate API - pay per generation(around $0.003 per text2image and $0.04 per image2model)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 