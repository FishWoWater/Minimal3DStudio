import React, { Suspense, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useViewport, useStoreActions } from '../../store';
import ViewportPlaceholder from './ViewportPlaceholder';
import TransformGizmo from '../ui/TransformGizmo';
import ModelRenderer from '../ui/ModelRenderer';
import { SelectionManager } from '../../utils/selection';

const ViewportContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

const ViewportHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: ${props => props.theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
`;

const ViewportInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};

  .separator {
    color: ${props => props.theme.colors.text.muted};
    margin: 0 ${props => props.theme.spacing.sm};
  }
`;

const TestButton = styled.button`
  background: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.colors.primary[500]};
  }
`;

const ViewportContent = styled.div`
  flex: 1;
  position: relative;
  background: ${props => props.theme.colors.background.primary};
  
  canvas {
    outline: none;
  }
`;

// Enhanced 3D Scene Component with Selection and Transform
const Scene: React.FC = () => {
  const viewport = useViewport();
  const { selectModel, setTransforming, transformSelectedModels, clearSelection } = useStoreActions();
  const { camera, gl } = useThree();
  
  const selectionManager = useMemo(() => new SelectionManager(), []);
  const objectRefs = useRef<{ [key: string]: THREE.Object3D }>({});
  
  // Handle click selection
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    
    if (viewport.currentTool !== 'select') return;
    
    const modelObjects = Object.values(objectRefs.current);
    const result = selectionManager.getClosestIntersection(
      camera,
      event.clientX,
      event.clientY,
      gl.domElement,
      modelObjects
    );
    
    if (result && result.modelId) {
      const isMultiSelect = event.ctrlKey || event.metaKey;
      selectModel(result.modelId, isMultiSelect);
    } else if (!event.ctrlKey && !event.metaKey) {
      clearSelection();
    }
  }, [viewport.currentTool, camera, gl.domElement, selectionManager, selectModel, clearSelection]);

  // Handle transform gizmo interactions
  const handleTransformStart = useCallback(() => {
    setTransforming(true);
  }, [setTransforming]);

  const handleTransform = useCallback((transform: any) => {
    transformSelectedModels(transform);
  }, [transformSelectedModels]);

  const handleTransformEnd = useCallback(() => {
    setTransforming(false);
  }, [setTransforming]);

  // Get selection center for gizmo positioning - use actual world position
  const selectionCenter = useMemo(() => {
    const selectedModels = viewport.loadedModels.filter(m => m.selected);
    if (selectedModels.length === 0) return [0, 0, 0] as [number, number, number];
    
    // Calculate the world-space bounding box center
    const boundingBox = new THREE.Box3();
    
    selectedModels.forEach(model => {
      if (model.object3D) {
        // Update world matrix to get accurate world positions
        model.object3D.updateMatrixWorld(true);
        
        // Get the bounding box of this object in world space
        const objectBox = new THREE.Box3().setFromObject(model.object3D);
        boundingBox.union(objectBox);
      }
    });
    
    // Get the center of the combined bounding box
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    return [center.x, center.y, center.z] as [number, number, number];
  }, [viewport.loadedModels]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={viewport.lighting.ambientIntensity * 0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={viewport.lighting.directionalIntensity * 1.5}
        castShadow={viewport.lighting.enableShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight intensity={0.4} groundColor="#404040" />

      {/* Environment */}
      {viewport.background === 'default' && (
        <Environment preset="studio" />
      )}

      {/* Grid */}
      {viewport.snapToGrid && (
        <Grid 
          infiniteGrid
          cellSize={viewport.gridSize}
          cellThickness={0.5}
          cellColor="#404040"
          sectionSize={viewport.gridSize * 10}
          sectionThickness={1}
          sectionColor="#606060"
          fadeDistance={30}
          fadeStrength={1}
        />
      )}

      {/* Models with Enhanced Material Handling */}
      {viewport.loadedModels.map((model) => (
        <ModelRenderer
          key={model.id}
          model={model}
          renderMode={viewport.renderMode}
          onRef={(ref: THREE.Group | null) => {
            if (ref) {
              ref.userData.modelId = model.id;
              objectRefs.current[model.id] = ref;
            }
          }}
          onPointerDown={handlePointerDown}
        />
      ))}

      {/* Transform Gizmo */}
      {viewport.selection.length > 0 && viewport.gizmoVisible && (
        <TransformGizmo
          position={selectionCenter}
          tool={viewport.currentTool}
          transformMode={viewport.transformMode}
          visible={!viewport.isTransforming}
          onTransform={handleTransform}
          onTransformStart={handleTransformStart}
          onTransformEnd={handleTransformEnd}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        maxPolarAngle={Math.PI * 0.75}
        minDistance={1}
        maxDistance={100}
        enabled={!viewport.isTransforming} // Disable when transforming
      />
    </>
  );
};

const Viewport: React.FC = () => {
  const viewport = useViewport();
  const { addModel, clearSelection } = useStoreActions();

  const addTestModel = () => {
      const group = new THREE.Group();
      
      // Create different parts with different materials
      const parts = [
        { geometry: new THREE.BoxGeometry(1, 1, 1), position: [0, 0, 0], material: { color: '#aaaaaa', metalness: 0.8, roughness: 0.2 } },
      ];
      
      parts.forEach(part => {
        const material = new THREE.MeshStandardMaterial(part.material);
        const mesh = new THREE.Mesh(part.geometry, material);
        mesh.position.set(part.position[0], part.position[1], part.position[2]);
        group.add(mesh);
      });
      
    addModel({
      id: `test-${Date.now()}`,
      name: 'Test Cube',
      url: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      selected: false,
      object3D: group
    });
  };

  const addTestGLBModel = async () => {
    try {
      // For demo purposes, we'll create a procedural model with multiple materials
      const THREE = await import('three');
      
      // Create a group with multiple meshes to simulate imported GLB structure
      const group = new THREE.Group();
      
      // Create different parts with different materials
      const parts = [
        { geometry: new THREE.BoxGeometry(1, 0.2, 1), position: [0, 0, 0], material: { color: '#ff6b6b', metalness: 0.8, roughness: 0.2 } },
        { geometry: new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8), position: [0, 0.85, 0], material: { color: '#4ecdc4', metalness: 0.2, roughness: 0.8 } },
        { geometry: new THREE.SphereGeometry(0.3, 8, 6), position: [0, 1.8, 0], material: { color: '#45b7d1', metalness: 0.5, roughness: 0.3 } }
      ];
      
      parts.forEach(part => {
        const material = new THREE.MeshStandardMaterial(part.material);
        const mesh = new THREE.Mesh(part.geometry, material);
        mesh.position.set(part.position[0], part.position[1], part.position[2]);
        group.add(mesh);
      });
      
      // Position the group
      group.position.set(2, 0, 0);
      
      addModel({
        id: `test-glb-${Date.now()}`,
        name: 'Test Complex Model',
        url: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        object3D: group
      });
    } catch (error) {
      console.error('Failed to create test GLB model:', error);
    }
  };

  return (
    <ViewportContainer>
      <ViewportHeader>
        <ViewportInfo>
          {/* <span>Scene: Untitled</span> */}
          {/* <span className="separator">•</span> */}
          <span>Objects: {viewport.loadedModels.length}</span>
          <span className="separator">•</span>
          <span>Render: {viewport.renderMode}</span>
        </ViewportInfo>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TestButton onClick={addTestModel}>Cube</TestButton>
          <TestButton onClick={addTestGLBModel}>Dummy Model</TestButton>
        </div>
      </ViewportHeader>
      
      <ViewportContent>
        {viewport.loadedModels.length === 0 ? (
          <ViewportPlaceholder />
        ) : (
          <Canvas
            camera={{
              position: viewport.camera.position,
              fov: viewport.camera.fov,
              near: viewport.camera.near,
              far: viewport.camera.far
            }}
            shadows={viewport.lighting.enableShadows}
            gl={{ 
              antialias: true, 
              alpha: false,
              toneMapping: 1, // ACESFilmicToneMapping
              toneMappingExposure: 1.2
            }}
            onPointerMissed={(event) => {
              // Clear selection when clicking on empty space
              if (viewport.currentTool === 'select' && !event.ctrlKey && !event.metaKey) {
                clearSelection();
              }
            }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </ViewportContent>
    </ViewportContainer>
  );
};

export default Viewport; 