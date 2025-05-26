'use client'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import styles from '../../public/css/test.module.css'

const Wheel = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 100%;
  border: 3px solid black;
`

const StickWrap = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Stick = styled.div`
  width: 10px;
  height: 200px;
  background-color: gray;
`

export default function Page() {
  const [count, setCount] = useState(50)
  const intervalId = useRef<number | NodeJS.Timeout | null>(null)
  const rangeRef = useRef(null)

  const stick1Ref = useRef(null)
  const stick2Ref = useRef(null)

  useEffect(() => { 
    if(rangeRef.current) {
      (rangeRef.current as HTMLInputElement).addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value
        setCount(parseInt(value))
      })
    }

    if(stick1Ref.current && stick2Ref.current) {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current)
      }
      const stick1 = stick1Ref.current as HTMLDivElement
      const stick2 = stick2Ref.current as HTMLDivElement

      let rotate = 0
      intervalId.current = setInterval(() => {
        rotate += count
        stick1.style.transform = `rotate(${rotate}deg)`
        stick2.style.transform = `rotate(${rotate}deg)`
      }, 10)
    }

  }, [count])

  return (
    <div>
      <Wheel />
      <StickWrap ref={stick1Ref}><Stick className={styles.rotate}/></StickWrap>
      <StickWrap ref={stick2Ref}><Stick /></StickWrap>
      <input type="range" max={10} min={0} ref={rangeRef}/>
    </div>
  )
}