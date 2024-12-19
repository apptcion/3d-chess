'use client'
import { Canvas } from '@react-three/fiber'

import styles from '../public/css/chess.module.css'

export default function Chess(){
    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}>
                <mesh>
                    <boxGeometry></boxGeometry>
                </mesh>
            </Canvas>
            <div className={styles.UI}></div>
        </div>
    )
}