"use client"; // クライアントコンポーネントとしてマーク

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(new THREE.Clock()); // ClockをRefで管理

  useEffect(() => {
    if (!mountRef.current) return;

    let scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        model: THREE.Group,
        mixer: THREE.AnimationMixer | null = null; // AnimationMixerを保持

    const currentMount = mountRef.current;

    function init() {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeeeeee);

      // Camera
      camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 1, 5);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(renderer.domElement);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 50;
      controls.target.set(0, 1, 0);
      controls.update();

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      // Load GLB model
      const loader = new GLTFLoader();
      loader.load(
        '/fukurou.glb',
        function (gltf) {
          model = gltf.scene;
          scene.add(model);
          console.log('Model loaded successfully');

          // Animation Mixer Setup
          if (gltf.animations && gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            // 最初のアニメーションだけ再生する場合
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            console.log('Animation started');
          } else {
            console.log('No animations found in the model');
          }
        },
        undefined,
        function (error) {
          console.error('An error happened during loading the GLB model:', error);
          // エラーオブジェクトの詳細を出力
          if (error instanceof ErrorEvent) {
            console.error('ErrorEvent details:', {
              message: error.message,
              filename: error.filename,
              lineno: error.lineno,
              colno: error.colno,
              error: error.error // ネストされたエラーオブジェクト
            });
          } else {
            console.error('Error details:', error); // その他のエラータイプ
          }
        }
      );

      // Handle window resize
      window.addEventListener('resize', onWindowResize, false);

      animate();
    }

    function onWindowResize() {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta(); // Clockから経過時間を取得
      controls.update();
      if (mixer) {
        mixer.update(delta); // Mixerを更新
      }
      renderer.render(scene, camera);
    }

    init();

    // クリーンアップ関数
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (renderer) {
        // Check if currentMount and renderer.domElement exist before removing
        if (currentMount && renderer.domElement.parentNode === currentMount) {
          currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      if (scene) {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
      }
      if (controls) {
        controls.dispose();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
  );
}
