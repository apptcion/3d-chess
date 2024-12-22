import dynamic from 'next/dynamic';

const Chess = dynamic(() => import('./chess'),{ssr:false})

export default function Chesspage (){
    return <Chess />
}