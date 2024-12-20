'use client'
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function ClickableCube() {
  const { camera, scene } = useThree();
  const [isClicked, setIsClicked] = useState(false);
  const cubeRef = useRef(null);

  useEffect(() => {
    // 마우스 클릭 시, raycasting을 위한 이벤트 리스너 추가
    const handleMouseClick = (event:MouseEvent) => {
      // 마우스 좌표를 NDC (Normalized Device Coordinates)로 변환
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Raycaster 생성
      const raycaster = new THREE.Raycaster();
      
      // 카메라와 마우스의 위치를 기준으로 광선 쏘기
      raycaster.setFromCamera(mouse, camera);

      // 3D 씬의 오브젝트와 광선이 교차하는지 확인
      const intersects = raycaster.intersectObjects(scene.children);

      // 교차되는 첫 번째 오브젝트를 클릭한 것 처리
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject === cubeRef.current) {
          setIsClicked(!isClicked);
          console.log('Cube clicked');
        }
      }
    };

    // 마우스 클릭 이벤트 리스너 등록
    window.addEventListener('click', handleMouseClick);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('click', handleMouseClick);
    };
  }, [camera, scene]);

  return (
    <mesh ref={cubeRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={isClicked ? 'red' : 'blue'} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight />
      <directionalLight position={[10, 10, 10]} />
      <ClickableCube />
    </Canvas>
  );
}
