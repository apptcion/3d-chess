'use client'
import {useState} from 'react'
import styles from '../../public/css/common/setting.module.css'
import settingIcon from '../../public/img/setting.png'
import Image from 'next/image'

function Setting({content, setState, value}: {content:string, setState: React.Dispatch<boolean>, value: boolean}){
    return (
        <div className={styles.setting}>
            <div className={styles.content}>{content}</div>
            <input className={styles.button} type="checkbox" checked={value} onChange={() => setState(!value)}></input>
        </div>
    )
}

export default function SettingPage({showCell, showWall, setVisible, setShowWall}:
    {setVisible: React.Dispatch<boolean>, setShowWall: React.Dispatch<boolean>,
    showCell: boolean, showWall: boolean}){

    const [closed, setClosed] = useState(true);


    return(
        <div className={styles.pageWrap}>
            <div className={`${styles.IconWrap} ${closed ? styles.closed : styles.show}`}>
                <Image className={styles.settingIcon} src={settingIcon} alt="setting icon"
                onClick={() => setClosed(prev => !prev)} /></div>
            <div className={`${closed ? styles.closed : styles.show} ${styles.page}`}>
                <Setting content={'보드 표시'} setState={setVisible} value={showCell} />
                <Setting content={'벽 표시'} setState={setShowWall} value={showWall} />
            </div>
        </div>
    )
}