'use client'
import { useEffect, useRef } from 'react'
import styles from '../../public/css/common/noticeTeam.module.css'

export default function TeamNotice({mode, team}:{mode:string, team:string}){

    const teamRef = useRef(null);
    const teamWrapRef = useRef(null);

    useEffect(()=> {
        setTimeout(() => {
            if(teamWrapRef.current){
                (teamWrapRef.current as HTMLDivElement).classList.add(`${styles.delete2}`);
            }
            if(teamRef.current){
                (teamRef.current as HTMLDivElement).classList.add(`${styles.delete}`)
            }
        },4000)
    })

    return(
        <div className={styles.notice_team} ref={teamRef}>
        <div className={styles.notice}>
            <div className={`${styles.mode}`} data-text={`${mode} mode`}>{`${mode} mode`}</div>
            <div className={`${styles.team_text}`} data-text='YOUR TEAM'>YOUR TEAM</div>
            <div className={`${team == 'white' ? styles.white : styles.black} ${styles.team_wrap}`} ref={teamWrapRef}>
                <p className={`${styles.team}`} data-text={team}>{team}</p>
            </div>
            <div className={`${styles.strategy}`}
            data-text={team == 'white' ? 'FIRST MOVE ADVANTAGE' : 'SECOND MOVE STRATEGY'}>
                {team == 'white' ? 'FIRST MOVE ADVANTAGE' : 'SECOND MOVE STRATEGY'}
            </div>
        </div>
    </div>
    )
}