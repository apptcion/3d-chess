'use client'

import { useEffect, useState } from "react"
import { io, Socket } from 'socket.io-client'
import Chess from '../Raumschach/page'
import { DefaultEventsMap } from "socket.io"

function Match() {

    const [team, setTeam] = useState<"white" | "black" | null>(null)
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)
    const [target, setTarget] = useState<string | null>(null)
    const [matched, setMatched] = useState(false)


    useEffect(() => {
      const socket = io('http://localhost:3000');
    
      socket.emit('join');
    
      socket.on('matched', ({target, team}) => {
        setTeam(team)
        setSocket(socket)
        setTarget(target)
        setMatched(true)
    
      });
    }, [team,socket,matched, target]);  // 빈 배열을 넣어 한 번만 실행되게 설정

  return (
    <div>
      {matched && team && socket && target &&<Chess team={team} socket={socket} target={target} />}
    </div>
  )
}

export default function Main() {
  const [username, setUsername] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('http://localhost:3000/login/getPayload', {
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
        console.log(data)
        if (data.data != null) {
          setUsername(data.data.username)
        } else {
          location.href = "/login"
        }
      })
    } else {
      location.href = "/login"
    }
  }, [])

  return (
    <main>
      {username}
      <Match></Match>
    </main>
  )
}
