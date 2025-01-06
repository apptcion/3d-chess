import dynamic from 'next/dynamic';
import { DefaultEventsMap } from 'socket.io';
import { Socket } from 'socket.io-client';

const Chess = dynamic(() => import('./chess'),{ssr:false})
type Props = {
    team: "white" | "black",
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    target : string,
    username: string
}
export default function Chesspage({ params }: { params: Props }) {
    const { team, socket, target, username } = params;
    return <Chess params={
        {
            team,
            socket,
            target,
            username
        }
    } />;
  }