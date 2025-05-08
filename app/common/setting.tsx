'use client'
import {useEffect, useRef, useState} from 'react'
import styles from '../../public/css/common/setting.module.css'
import settingIcon from '../../public/img/setting.png'
import Image from 'next/image'
import styled from 'styled-components'

function Setting({content, setState, value}: {content:string, setState: React.Dispatch<boolean>, value: boolean}){
    return (
        <div className={styles.setting}>
            <div className={styles.content}>{content}</div>
            <input className={styles.button} type="checkbox" checked={value} onChange={() => setState(!value)}></input>
        </div>
    )
}

const ExitButton = styled.div`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    bottom: 5vh;
    width: 10vw;
    left: 1.2vw;
    height: 5vh;
    color: white;
    border-radius: 10px;
    background-color: #ff5555;
    cursor: pointer;
    
`

export default function SettingPage({showCell, showWall, setVisible, setShowWall}:
    {setVisible: React.Dispatch<boolean>, setShowWall: React.Dispatch<boolean>,
    showCell: boolean, showWall: boolean}){

    const [closed, setClosed] = useState(true);
    const exitButtonRef = useRef(null)

    useEffect(() => {
        if(exitButtonRef.current){
            (exitButtonRef.current as HTMLDivElement).addEventListener('click', () => {
                location.href='/'
            })
        }
    })

    return(
        <div className={styles.pageWrap}>
            <div className={`${styles.IconWrap} ${closed ? styles.closed : styles.show}`}>
                <Image className={styles.settingIcon} src={settingIcon} alt="setting icon"
                onClick={() => setClosed(prev => !prev)} /></div>
            <div className={`${closed ? styles.closed : styles.show} ${styles.page}`}>
                <Setting content={'보드 표시'} setState={setVisible} value={showCell} />
                <Setting content={'벽 표시'} setState={setShowWall} value={showWall} />
                <ExitButton ref={exitButtonRef}>나가기</ExitButton>
            </div>
        </div>
    )
}