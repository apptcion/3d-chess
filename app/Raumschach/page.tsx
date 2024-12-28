import dynamic from 'next/dynamic';
import { DefaultEventsMap } from 'socket.io';
import { Socket } from 'socket.io-client';

const Chess = dynamic(() => import('./chess'),{ssr:false})
interface Props {
    team: "white" | "black",
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    target : string
}
export default function Chesspage({ searchParams }: { searchParams: Props }) {
    const { team, socket, target } = searchParams;
    return <Chess team={team} socket={socket} target={target} />;
  }