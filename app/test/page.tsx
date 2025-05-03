import Image from 'next/image'
import styles from '../../public/css/test.module.css'
import bg from '../../public/img/tmp.png'

export default function Test(){

    const result = 'win'

    return (
        <div className={styles.whole}>
            <Image src={bg} alt="" style={{position: 'absolute', zIndex: -1, width: '100vw', height: '100vh', objectFit: 'fill' }}/>
            <div>Game Over</div>
            <div>you are {` ${result}`}</div>
        </div>
    )
}