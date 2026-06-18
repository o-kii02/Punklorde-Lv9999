import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

function VrmModel({ url }) {
  const vrmRef = useRef(null);
  const { scene } = useThree();
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(url, (gltf) => {
      const vrm = gltf.userData.vrm;
      if (!vrm) return;

      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);

      vrm.scene.rotation.y = Math.PI;
      scene.add(vrm.scene);
      vrmRef.current = vrm;
    });

    return () => {
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url, scene]);

  useFrame(() => {
    if (!vrmRef.current) return;
    const delta = clockRef.current.getDelta();
    vrmRef.current.update(delta);
  });

  return null;
}

export default function VrmViewer({ url = '/chil.vrm', height = 320 }) {
  return (
    <div style={{ width: '100%', height }}>
      <Canvas
        camera={{ position: [0, 1.3, 2.2], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[1, 2, 2]} intensity={1.5} />
        <Suspense fallback={null}>
          <VrmModel url={url} />
        </Suspense>
        <OrbitControls
          target={[0, 1.1, 0]}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
