"use client"
import { useEffect, useRef } from 'react'
import styles from '../../public/css/common/error.module.css'

interface Props{
    cause:string,
    closeActionFunc: React.Dispatch<React.SetStateAction<string | null>>
}

export default function Error({params}:{params:Props}){
    const {cause} = params
    const closeBtn = useRef(null)

    useEffect(() => {
        const btn = closeBtn.current as SVGElement | null
        const handleClick = () => {
            params.closeActionFunc(null)
        }
        
        if(btn instanceof SVGElement){
            btn.addEventListener('click', handleClick)
        }
    },[])

    return (
        <div className={styles.wrap}>
            <svg className={styles.exclamation} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className={styles.text}>{cause}</p>
            <svg className={styles.close} ref={closeBtn} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
        </div>
    )
}