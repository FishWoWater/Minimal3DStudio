import React, { useCallback } from 'react';
import { Sparkles, Download, Zap, AlertCircle, Info } from 'lucide-react';
import { GenerationParameters, TaskStatus } from '../types/api';

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
}) => {
  const handleParameterToggle = useCallback((parameter: keyof GenerationParameters) => {
    onParametersChange({
      ...parameters,
      [parameter]: !parameters[parameter],
    });
  }, [parameters, onParametersChange]);

  const calculateTotalCost = useCallback(() => {
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
  }, [parameters]);

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

  const hasParameterConstraints = (parameters.generate_parts && (parameters.texture || parameters.quad)) || 
                                  (parameters.pbr && parameters.texture);

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
          Advanced Parameters
        </h3>
        
        <div className="parameters-grid">
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
      </div>
    </div>
  );
}; 