import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Model3DProps {
  url: string;
  viewMode: '3d' | 'wireframe' | 'rendered';
}

export const Model3D: React.FC<Model3DProps> = ({ url, viewMode }) => {
  console.log('Model3D url', url);
  const meshRef = useRef<THREE.Group>(null);
  const [originalMaterials, setOriginalMaterials] = useState<(THREE.Material | THREE.Material[])[]>([]);
  
  // Load the GLB model - useGLTF handles loading automatically
  const { scene } = useGLTF(url);
  
  // Store original materials when scene loads or URL changes
  useEffect(() => {
    if (!scene) return;
    
    // Cleanup function to dispose of old materials
    const cleanup = () => {
      originalMaterials.forEach(material => {
        if (Array.isArray(material)) {
          material.forEach(mat => mat.dispose());
        } else {
          material.dispose();
        }
      });
    };
    
    const materials: (THREE.Material | THREE.Material[])[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        // Clone and store materials in traversal order
        if (Array.isArray(object.material)) {
          materials.push(object.material.map(mat => mat.clone()));
        } else {
          materials.push(object.material.clone());
        }
      }
    });
    setOriginalMaterials(materials);
    
    // Return cleanup function
    return cleanup;
  }, [scene, url]); // Only scene and url, not originalMaterials to avoid infinite loop
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!scene) {
    // Loading state - show a simple placeholder
    return (
      <group ref={meshRef}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color={0x666666} />
        </mesh>
      </group>
    );
  }

  // Clone the scene to avoid modifying the original
  const clonedScene = scene.clone();
  
  // Apply materials to the cloned scene based on view mode
  let materialIndex = 0;
  clonedScene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material) {
      switch (viewMode) {
        case 'wireframe':
          // Create wireframe material that shows structure clearly
          object.material = new THREE.MeshBasicMaterial({ 
            color: 0x888888, 
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
          });
          
          // Add wireframe overlay
          const wireframeGeometry = new THREE.WireframeGeometry(object.geometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
          const wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
          object.add(wireframeHelper);
          break;
        case 'rendered':
          // Restore original material using traversal order
          if (materialIndex < originalMaterials.length) {
            const originalMaterial = originalMaterials[materialIndex];
            if (Array.isArray(originalMaterial)) {
              object.material = originalMaterial.map(mat => mat.clone());
            } else {
              object.material = originalMaterial.clone();
            }
          }
          break;
        default: // '3d'
          object.material = new THREE.MeshLambertMaterial({ 
            color: 0x888888 
          });
          break;
      }
      materialIndex++;
    }
  });
  
  return (
    <group ref={meshRef}>
      <primitive object={clonedScene} />
    </group>
  );
}; 