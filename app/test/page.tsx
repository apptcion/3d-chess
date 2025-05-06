'use client'
import styles from '../../public/css/test.module.css'
import { Timer } from '../common/timer'
import Millenium from '../rule/millennium'
import { useEffect, useRef, useState } from 'react'

export function GameOver({win}:{win:boolean}){
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

export default function Test(){
    const [close, setClose] = useState(true)
    const [gameover, setGameOver] = useState({gameover: false, winner: 'white'})
    const myTeam = 'white'

    return (
        <div>
            <Timer myTeam='white' turn='white' setGameOver={setGameOver}/>
            {!close && <Millenium team={'white'} setClose={setClose} />}
            <GameOver win={gameover.winner == myTeam}/>
        </div>
    )
}