"use client"; // クライアントコンポーネントとしてマーク

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(new THREE.Clock()); // ClockをRefで管理

  useEffect(() => {
    console.log('useEffect started'); // useEffect の開始ログ
    if (!mountRef.current) {
      console.log('mountRef is not available yet.');
      return;
    }
    console.log('mountRef is available.');

    let scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        model: THREE.Group,
        mixer: THREE.AnimationMixer | null = null; // AnimationMixerを保持

    const currentMount = mountRef.current;

    function init() {
      console.log('init function started'); // init 関数の開始ログ
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
      console.log('Renderer initialized and appended.');

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 50;
      controls.target.set(0, 1, 0);
      controls.mouseButtons.RIGHT = null; // 右クリックを有効化
      controls.update();
      console.log('OrbitControls initialized.');

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);
      console.log('Lights added.');

      // Load GLB model
      const loader = new GLTFLoader();
      console.log('Attempting to load GLB model...'); // GLB読み込み開始ログ
      loader.load(
        '/fukurou.glb',
        function (gltf) {
          console.log('GLB model loaded successfully callback entered.'); // 成功コールバック開始ログ
          model = gltf.scene;
          scene.add(model);
          console.log('Model added to scene.'); // このログは表示されるはず

          // --- デバッグログ追加 ---
          console.log('Inspecting GLTF data...');
          try {
            console.log('gltf object:', gltf); // gltf オブジェクト全体を出力
            console.log('gltf.animations:', gltf.animations); // animations プロパティを出力
            console.log('gltf.animations exists:', !!gltf.animations); // animations プロパティの存在確認
            console.log('gltf.animations length:', gltf.animations ? gltf.animations.length : 'N/A'); // animations の長さを出力
          } catch (e) {
            console.error('Error inspecting GLTF data:', e);
          }
          // --- デバッグログ追加ここまで ---


          // Animation Mixer Setup
          console.log('Checking for animations...'); // このログが表示されるか？
          if (gltf.animations && gltf.animations.length) {
            console.log(`Found ${gltf.animations.length} animations.`); // このログが表示されるか？
            mixer = new THREE.AnimationMixer(model);
            console.log('AnimationMixer created.');
            const action = mixer.clipAction(gltf.animations[0]);
            console.log('AnimationClip action created.');
            action.play();
            console.log('Animation action.play() called.');
          } else {
            console.log('No animations found in the model OR condition evaluated to false.'); // 条件が false の場合のログ
          }
        },
        undefined, // Progress callback (optional)
        function (error) {
          console.error('An error happened during loading the GLB model:', error);
          if (error instanceof ErrorEvent) {
            console.error('ErrorEvent details:', {
              message: error.message,
              filename: error.filename,
              lineno: error.lineno,
              colno: error.colno,
              error: error.error
            });
          } else {
            console.error('Error details:', error);
          }
        }
      );

      // Handle window resize
      window.addEventListener('resize', onWindowResize, false);

      animate();
      console.log('animate function called initially.');
    }

    function onWindowResize() {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      // console.log('Window resized.');
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      controls.update();
      if (mixer) {
        mixer.update(delta);
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      } else {
        // console.log('Renderer, scene or camera not ready for rendering.');
      }
    }

    init();

    // クリーンアップ関数
    return () => {
      console.log('useEffect cleanup function called.');
      window.removeEventListener('resize', onWindowResize);
      if (renderer) {
        if (currentMount && renderer.domElement.parentNode === currentMount) {
          currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        console.log('Renderer disposed.');
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
        console.log('Scene resources disposed.');
      }
      if (controls) {
        controls.dispose();
        console.log('Controls disposed.');
      }
      mixer = null;
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
  );
}
