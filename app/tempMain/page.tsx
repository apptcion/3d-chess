'use client'
import styles from '../../public/css/selMode.module.css'
import matchStyle from '../../public/css/match.module.css'

import { useEffect, useRef, useState } from "react"
import { io } from 'socket.io-client'
import Chess_Raumschach from '../Raumschach/page'
import Chess_Millennium from '../Millennium_remote/page'


class Dot{
  
  public x:number;
  public y:number;
  public z:number
  public fov = 150;
  public speed = 0;

  constructor(){
    this.x = Math.random()*window.innerWidth - window.innerWidth/2;
    this.y = Math.random()*window.innerHeight - window.innerHeight/2;
    this.z = (window.innerWidth+window.innerHeight)/Math.random();
    this.speed = Math.random()*8+2;
  }

  draw(context:CanvasRenderingContext2D){
    this.z -= this.speed
    if (this.z < -this.fov) {
      this.z += (innerWidth+innerHeight)/2;
    }
    const scale = this.fov / (this.fov + this.z);
    const x2d = this.x * scale + innerWidth/2;
    const y2d = this.y * scale + innerHeight/2;
    if(this.x < window.innerWidth /2){
      context.fillRect(x2d, y2d, scale*4, scale*3);
    }else{    
      context.fillRect(x2d, y2d, scale*4, scale*3);
    }
  }
}

function Match({mode, username}:{mode:string,username:string}) {

    const [team, setTeam] = useState<"white" | "black" | null>(null)
    //const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(io('http://localhost:49152'))
    const socket = useRef(io('https://chessback.apptcion.site'))
    const [target, setTarget] = useState<string | null>(null)
    const [matched, setMatched] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)


    useEffect(() => {
      
      let context:CanvasRenderingContext2D | null = null
      let animationFrameId = 0;
      
      let dots:Array<Dot> = []
      const initCanvas = () => {
        if(canvasRef.current){
          dots = []
          context = canvasRef.current.getContext('2d')
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
          if(context) context.fillStyle = '#ffffff';
          for(let i = 0; i <= 800; i++){
            dots.push(new Dot())
          }
        }
      }

      initCanvas()
      window.addEventListener('resize', initCanvas)

      const render = () => {
        if(context){
          context.clearRect(0,0,window.innerWidth, window.innerHeight)
          dots.forEach((dot:Dot) => {
            dot.draw(context as CanvasRenderingContext2D);
          })
        }  
        animationFrameId = requestAnimationFrame(render);
      }

      render()
      if(socket.current){
        socket.current.emit('join', {mode});
    
        socket.current.on('matched', ({target, team}) => {
          setTeam(team)
//          setSocket(socket)
          setTarget(target)
          setMatched(true)
      
        });
      }

      return () => {
        window.removeEventListener('resize', initCanvas)
        cancelAnimationFrame(animationFrameId);
      }
    }, [team,socket,matched, target]);

  return (
    <div className={matchStyle.wrap}>
      {!matched && 
        <div className={matchStyle.matching}>
          <canvas ref={canvasRef} className={matchStyle.canvas}/>
          <div className={matchStyle.text}>
            <div className={matchStyle.h1}>Matching</div>
            <div className={matchStyle.mode}>{mode} mode </div>
          </div>
        </div> }
      {matched && team && socket.current && target && mode=="Raumschach" && <Chess_Raumschach params={
        {team,socket: socket.current,target, username}
      } />}
      {matched && team && socket && target && mode=="Millennium" && <Chess_Millennium params={
        {team,socket: socket.current,target, username}
      } />}
    </div>
  )
}

export default function Main() {
  const [username, setUsername] = useState(null)
  const mode = useRef<string | null>(null)
  const [gameStart, setGameStart] = useState(false)

  useEffect(() => {
    console.log(username)
    const token = localStorage.getItem('token')
    if (token) {
      fetch('https://chessback.apptcion.site/login/getPayload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      }).then(response => {
        if (response.ok) {
          return response.json()
        }
      }).then(data => {
        if (data.data != null) {
          setUsername(data.data.username)
        } else {
          location.href = "/login"
        }
      })
    } else {
      location.href = "/login"
    }

    const Millennium = document.querySelector("#Millennium") as HTMLDivElement
    const Raumschach = document.querySelector("#Raumschach") as HTMLDivElement
    const startGame = document.querySelector("#startGame") as HTMLButtonElement

    Millennium.addEventListener('click', () => {
      mode.current = "Millennium"
      Raumschach.classList.remove(`${styles.selected}`)
      Millennium.classList.add(`${styles.selected}`)
    })
    Raumschach.addEventListener('click', () => {
      Millennium.classList.remove(`${styles.selected}`)
      Raumschach.classList.add(`${styles.selected}`)
      mode.current = "Raumschach"
    })
    startGame.addEventListener('click', () => { 
      if(mode.current != null){
        setGameStart(true)
      }else{
        alert("select Mode")
      }
    })

  }, [])

  return (
    <main className={styles.main}>
      {gameStart && mode.current && username && <Match mode={mode.current} username={username}/>}
      {!gameStart && 
        <div>
          <div className={styles.title}>
            3D-CHESS
          </div>
          <div className={styles.selMode} id="selMode">
            <div id="Millennium" className={`${styles.Millennium} ${styles.mode}`}>Millennium</div>
            <div id="Raumschach" className={`${styles.Raumschach} ${styles.mode}`}>Raumschach</div>
          </div>
          <button id="startGame" className={styles.start}>Start Game</button>
          <a href="/rule" className={styles.howToPlay}>How to play</a>
        </div>
      }
    </main>
  )
}
