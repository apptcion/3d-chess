'use client'
import styles from '../../public/css/test.module.css'
import { useEffect, useRef, } from 'react'

export default function GameOver({win}:{win:boolean}){
    const goMainRef = useRef(null)

    useEffect(() => {
        if(goMainRef.current){
            (goMainRef.current as HTMLElement).addEventListener('click', () => {
                location.href = '/'
            })
        }
    })

    
    return (
        <div className={styles.page}>
            <div className={styles.msgWrap}>
                <p className={`${styles.msg} ${win? styles.win : styles.defeat}`}>{win? 'VICTORY' : 'DEFEAT'}</p>
                <div className={styles.goMain} ref={goMainRef}>NEW GAME</div>
            </div>
        </div>
    )
}