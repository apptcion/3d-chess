'use client'
import styles from '../../public/css/common/gameover.module.css'
import { useEffect, useRef, } from 'react'

export default function GameOver({win, cause}:{win:boolean, cause: string}){
    const goMainRef = useRef(null)

    useEffect(() => {
        if(goMainRef.current){
            (goMainRef.current as HTMLElement).addEventListener('click', () => {
                location.href = '/'
            })
        }
        setTimeout(() => {
            location.href='/'
        },3000)
    })
    
    return (
        <div className={styles.page}>
            <div className={styles.msgWrap}>
                <p className={`${styles.msg} ${win? styles.win : styles.defeat}`}>{win? 'VICTORY' : 'DEFEAT'}</p>
                <p className={styles.cause}>{cause}</p>
                {/* <div className={styles.goMain} ref={goMainRef}>NEW GAME</div> */}
            </div>
        </div>
    )
}