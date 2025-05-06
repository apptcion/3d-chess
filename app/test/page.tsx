'use client'
import styles from '../../public/css/test.module.css'
import { Timer } from '../common/timer'
import Millenium from '../rule/millennium'
import { useEffect, useState } from 'react'

function Win(){

}

function Defeat(){
    return (
        <div className={styles.page}>
            <div className={styles.msgWrap}>
                <p className={styles.msg} data-text='GAME OVER'>GAME OVER</p>
            </div>
        </div>
    )
}

function GameOver({win}:{win:boolean}){
    return (
        <div>
            <Defeat />
        </div>
    )
}

export default function Test(){
    const [close, setClose] = useState(true)
    const [gameover, setGameOver] = useState({gameover: false, winner: ''})
    const myTeam = 'white'

    return (
        <div>
            <Timer myTeam='white' turn='white' setGameOver={setGameOver}/>
            <Millenium team={'white'} setClose={setClose} />
            <GameOver win={gameover.winner == myTeam}/>
        </div>
    )
}