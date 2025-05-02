import { useLoader, useThree } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from 'three'
interface PlanetProps{
    url: string,
    position: [number, number, number],
    size?: number
}
export function Planet({
    url,
    position,
    size = 3,
  }: PlanetProps) {
    const texture = useLoader(THREE.TextureLoader, url)

    return (
      <mesh position={position} key={texture.uuid}>
        <sphereGeometry args={[size, 128, 128]} />
        <meshPhongMaterial
          map={texture}
          transparent={false}
          side={THREE.FrontSide}
          shininess={50}
        />
      </mesh>
    )
}

export function BackGround(){
    const {scene} = useThree();

    class Background{
        delta:number;
        clock: THREE.Clock
        textureLoader: THREE.TextureLoader

        constructor() {
            this.delta = 0;
            this.clock = new THREE.Clock();
            this.textureLoader = new THREE.TextureLoader();
        }

        async init(){
            const geometrySphereBg = new THREE.SphereGeometry(400, 50, 50);
            const materialSphereBg = new THREE.MeshBasicMaterial({
                side: THREE.BackSide,
            });

            const textureLoader = new THREE.TextureLoader();
            const sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
            sphereBg.material.map = textureLoader.load(
                "https://i.ibb.co/HC0vxMw/sky2.jpg",
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.anisotropy = 16;
                },
            )

            sphereBg.position.set(0, 0, 0);
            scene.add(sphereBg);
        }
    }

    useEffect(() => {
        const bg = new Background();
        bg.init()
    },[])

    return null;
}