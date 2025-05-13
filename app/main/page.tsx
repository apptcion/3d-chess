'use client'
import styles from '../../public/css/main.module.css'
import matchStyle from '../../public/css/match.module.css'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import styled from 'styled-components'
import Chess_Raumschach from '../Raumschach/page'
import Chess_Millennium from '../Millennium_remote/page'
import ErrorPage from '../common/error'
import Image from 'next/image'
import queenImg from '../../public/img/queen_rm.png'
import kingImg from '../../public/img/king_rm.png'

class Dot {
  public x: number
  public y: number
  public z: number
  public fov = 150
  public speed = 0

  constructor() {
    this.x = Math.random() * window.innerWidth - window.innerWidth / 2
    this.y = Math.random() * window.innerHeight - window.innerHeight / 2
    this.z = (window.innerWidth + window.innerHeight) / Math.random()
    this.speed = Math.random() * 8 + 2
  }

  draw(context: CanvasRenderingContext2D) {
    this.z -= this.speed
    if (this.z < -this.fov) {
      this.z += (innerWidth + innerHeight) / 2
    }
    const scale = this.fov / (this.fov + this.z)
    const x2d = this.x * scale + innerWidth / 2
    const y2d = this.y * scale + innerHeight / 2
    context.fillRect(x2d, y2d, scale * 4, scale * 3)
  }
}

function Match({
  mode,
  username,
}: {
  mode: string
  username: string
}) {
  const [team, setTeam] = useState<'white' | 'black' | null>(null)
  const socket = useRef(io('https://chessback.apptcion.site') /*io('http://localhost:49152')*/ ) 
  const [target, setTarget] = useState<string | null>(null)
  const [matched, setMatched] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let context: CanvasRenderingContext2D | null = null
    let animationFrameId = 0
    let dots: Dot[] = []

    const initCanvas = () => {
      if (!canvasRef.current) return
      dots = []
      context = canvasRef.current.getContext('2d')
      canvasRef.current.width = window.innerWidth
      canvasRef.current.height = window.innerHeight
      if (context) context.fillStyle = '#ffffff'
      for (let i = 0; i <= 800; i++) {
        dots.push(new Dot())
      }
    }

    const render = () => {
      if(matched){
        console.log("별 애니메이션 정지됨")
        cancelAnimationFrame(animationFrameId)
      }else{
        if (context) {
          context.clearRect(0, 0, window.innerWidth, window.innerHeight)
          dots.forEach((dot) => dot.draw(context!))
        }
        animationFrameId = requestAnimationFrame(render)
      }
    }

    initCanvas()
    window.addEventListener('resize', initCanvas)
    render()

    if (socket.current) {
      socket.current.emit('join', { mode })
      socket.current.on('matched', ({ target, team }) => {
        setTeam(team)
        setTarget(target)
        setMatched(true)
      })
    }

    if(matched){
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', initCanvas);
    }

    return () => {
      window.removeEventListener('resize', initCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [mode, matched])

  return (
    <div className={matchStyle.wrap}>
      {!matched && (
        <div className={matchStyle.matching}>
          <canvas ref={canvasRef} className={matchStyle.canvas} />
          <div className={matchStyle.text}>
            <div className={matchStyle.h1}>Matching</div>
            <div className={matchStyle.mode}>{mode} mode</div>
          </div>
        </div>
      )}
      {matched &&
        team &&
        socket.current &&
        target &&
        mode === 'Raumschach' && (
          <Chess_Raumschach
            params={{ team, socket: socket.current, target, username }}
          />
        )}
      {matched &&
        team &&
        socket.current &&
        target &&
        mode === 'Millennium' && (
          <Chess_Millennium
            params={{ team, socket: socket.current, target, username }}
          />
        )}
    </div>
  )
}

function Circle() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ height: '700px', width: '700px' }}
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id="grad1" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0.2" stopColor="#6e1680" />
          <stop offset="0.5" stopColor="#3d1f7a" />
          <stop offset="1" stopColor="#331666" />
        </linearGradient>
      </defs>
      <g fill="none">
        <circle
          cx="50%"
          cy="50%"
          r="49.8%"
          stroke="url(#grad1)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

function Card({modeName}: { modeName: string }) {
  return (
    <div className={`${styles.card} ${modeName == 'Millennium' ? styles.front : styles.back}`}>
      <div className={styles.imgWrap}>
        <Image
          className={styles.img}
          src={modeName === 'Millennium' ? kingImg : queenImg}
          alt=''
        />
      </div>
      <div className={styles.modeName}>{`${modeName} mode`}</div>
      <div className={styles.describe}>
        {modeName === 'Millennium' ? '8 x 8 x 3' : '5 x 5 x 5'}
      </div>
    </div>
  )
}

const Background = styled.div`
  position: absolute;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`

const Content = styled.div`
  position: absolute;
  width: 100vw;
  z-index: 2;
  perspective: 1000px;
`

const Header = styled.div`
  position: absolute;
  top : 0px;
  left: 0px;
  margin-top: 1vh;
  width: 100vw;
  height: 5vh;
  display: flex;
  justify-content: space-between;
`

export default function Main() {
  const [username, setUsername] = useState<string | null>(null)
  const mode = useRef('Millennium')
  const [gameStart, setGameStart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const StartBtnRef = useRef(null);
  const cardRef = useRef(null);

  // circle 애니메이션용 상태(ref)
  const circleData = useRef([
    { pos: 0, forward: 0.05 },
    { pos: 1, forward: 0.1 },
    { pos: -1, forward: 0.075 },
  ])

  const removeAllEventListeners = (el: Element) => {
    const clone = el.cloneNode(true)
    el.parentNode?.replaceChild(clone, el)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      location.href = '/login'
      return
    }

    fetch('https://chessback.apptcion.site/login/getPayload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data.data) setUsername(data.data.username)
        else location.href = '/login'
      })
    const circleList = document.getElementById('circleList')!

    // 애니메이션 루프
    let animId: number = 0;
    const animate = () => {
      if (gameStart) {
        cancelAnimationFrame(animId)
      }else{
        circleData.current.forEach((d, i) => {
          const next = d.pos + d.forward
          if (next > 10 || next < -10) {
            d.forward = -d.forward
          }
          d.pos += d.forward
          const [tx, ty] =
            i === 0
              ? [0, -d.pos]
              : i === 1
              ? [d.pos, d.pos]
              : [-d.pos, d.pos]
          ;(circleList.children[i] as HTMLElement).style.transform = `matrix(1,0,0,1,${tx},${ty})`
        })
        animId = requestAnimationFrame(animate)
      }
    }
    animate()

    if(cardRef.current){
      const card = cardRef.current as HTMLElement;
        card.addEventListener('click', () => {
          if(mode.current == 'Millennium' || mode.current == null){
            mode.current = 'Raumschach';
            card.classList.add(`${styles.flip}`);
          }else if(mode.current == 'Raumschach'){
            mode.current = 'Millennium';
            card.classList.remove(`${styles.flip}`);
          }
        })
    }

    if(StartBtnRef.current){
      const startBtn = StartBtnRef.current as HTMLButtonElement;
      startBtn.addEventListener('click', () => {
        if (mode.current) {
          cancelAnimationFrame(animId)
          setGameStart(true)
        } else setError('Please Select Mode')
      })
    }

    return () => {
      if(StartBtnRef.current) removeAllEventListeners(StartBtnRef.current);
      if(cardRef.current) removeAllEventListeners(cardRef.current);
      cancelAnimationFrame(animId)

    }
  }, [gameStart])

  return (
    <main className={styles.main}>
      {error && <ErrorPage params={{ cause: error, closeActionFunc: setError }} />}
      {gameStart && mode.current && username && (
        <Match mode={mode.current} username={username} />
      )}
      {!gameStart && (
        <>
          <Background>
            <ul id="circleList" style={{ width: 700, height: 700 }}>
              <li style={{ position: 'absolute' }}> <Circle /> </li>
              <li style={{ position: 'absolute' }}> <Circle /> </li>
              <li style={{ position: 'absolute' }}> <Circle /> </li>
            </ul>
          </Background>
          <Content>
            <Header>
              <div className={styles.title}>3D CHESS</div>
              <div className={styles.right}>
                <div className={styles.menu} onClick={() => {
                  localStorage.removeItem('token');
                  location.href='/login'
                }}>Log out</div>
                <div className={styles.menu} onClick={() => {
                  location.href='/rule'
                }}>Rule</div>
              </div>
            </Header>
            <div className={styles.notice}>select mode</div>
            <div className={styles.select} id="select" ref={cardRef}>
                <Card modeName='Millennium' />
                <Card modeName='Raumschach'/>
            </div>
            <div className={styles.start} ref={StartBtnRef}>
              <div className={styles.mode}>Start Game</div>
            </div>
          </Content>
        </>
      )}
    </main>
  )
}