import dynamic from 'next/dynamic';
import { DefaultEventsMap } from 'socket.io';
import { Socket } from 'socket.io-client';

const Chess = dynamic(() => import('./chess'),{ssr:false})
interface Props {
    team: "white" | "black",
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    target : string
}
export default function Chesspage ({team, socket, target}:Props){
    return <Chess team={team} socket={socket} target={target}/>
}