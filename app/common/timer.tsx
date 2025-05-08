'use client'
import styles from '../../public/css/common/timer.module.css'
import { useEffect, useState } from 'react'

interface gameOverObj{
    gameover: boolean,
    winner: string,
    cause: string
}
export function Timer({turn, myTeam, gameover, setGameOver}:{turn: string, myTeam: string, gameover:boolean, setGameOver:React.Dispatch<gameOverObj>}){

    const [time, setTime] = useState(600);
    const parseTime = (time: number) =>{
        let hour = Math.floor(time/60).toString();
        if(hour.length < 2) hour = "0" + hour;
        let min = (time%60).toString();
        if(min.length < 2) min = "0" + min;
        return `${hour}:${min}`;
        
    }

    useEffect(() => {
        setTime(300); // 10분? 5분?

        const intervalId = setInterval(() => {
            setTime(prev => {
                if (prev <= 0) {
                    clearInterval(intervalId); // 0이 되면 인터벌 종료
                    setGameOver({gameover: true, winner: turn == 'white' ? 'black' : 'white', cause: 'timeout'})
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        if(gameover) {
            clearInterval(intervalId)
        }

        return () => clearInterval(intervalId); // turn 바뀔 때마다 기존 인터벌 제거
    }, [turn, gameover]);

    return (
        <div className={styles.timerWrap}>
            <svg className={`${styles.svg} ${styles.left}`} viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points="10,15 85,15 98,100" stroke="white" vectorEffect="non-scaling-stroke" fill='transparent' />
            </svg>
            <div className={`${styles.center}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio='none' className={styles.centerSVG}>
                    <polygon points="0,0 100,0 80,100 20,100" fill={turn} stroke={turn === 'white' ? '' : 'white'} vectorEffect="non-scaling-stroke"/>
                </svg> 
                <div className={`${styles.timer}`} style={{color: turn=='white' ? 'black' : 'white'}}>
                    <p className={styles.turn}>{myTeam == turn ? 'MY TURN' : 'ENEMY TURN'}</p>
                    <p className={styles.time}>{parseTime(time)}</p>
                </div>
            </div>
            <svg className={`${styles.svg} ${styles.right}`} viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points="2,100 15,15 90,15" stroke="white" vectorEffect="non-scaling-stroke" fill='transparent'/>
            </svg>
        </div>
    )
}
