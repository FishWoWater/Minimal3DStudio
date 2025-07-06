import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Model3D } from './Model3D';

interface ModelViewportProps {
  modelUrl: string | null;
  viewMode: '3d' | 'wireframe' | 'rendered';
  onViewModeChange: (mode: '3d' | 'wireframe' | 'rendered') => void;
  isGenerating: boolean;
}

export const ModelViewport: React.FC<ModelViewportProps> = ({
  modelUrl,
  viewMode,
  onViewModeChange,
  isGenerating,
}) => {
  console.log('modelUrl', modelUrl);
  return (
    <div className="viewport">
      <div className="viewport-header">
        <span className="viewport-title">3D Viewport</span>
        <div className="viewport-controls">
          <button 
            className={`btn btn-small ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => onViewModeChange('3d')}
          >
            Solid
          </button>
          <button 
            className={`btn btn-small ${viewMode === 'wireframe' ? 'active' : ''}`}
            onClick={() => onViewModeChange('wireframe')}
          >
            Wireframe
          </button>
          <button 
            className={`btn btn-small ${viewMode === 'rendered' ? 'active' : ''}`}
            onClick={() => onViewModeChange('rendered')}
          >
            Rendered
          </button>
        </div>
      </div>
      
      <div className="viewport-content">
        {modelUrl ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              <Model3D url={modelUrl} viewMode={viewMode} />
              
              <OrbitControls 
                enableDamping 
                dampingFactor={0.05}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                autoRotate={false}
              />
              
              {viewMode === 'rendered' && (
                <Environment preset="studio" />
              )}
            </Suspense>
          </Canvas>
        ) : (
          <div className="model-viewer">
            <div className="model-placeholder">
              <p>3D model will appear here</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Generate from image or text prompt
              </p>
            </div>
          </div>
        )}
        
        {isGenerating && (
          <div className="generating-overlay">
            <div className="spinner"></div>
            <p>Generating 3D model...</p>
          </div>
        )}
      </div>
    </div>
  );
}; 