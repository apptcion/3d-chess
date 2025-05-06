import styles from '../../public/css/common/gameover.module.css'

export default function GameOverPage({win}:{win: boolean}){
    return (
        <div className={styles.page}>
            <div className={styles.background}></div>
            <div className={styles.notice}></div>
        </div>
    )
}