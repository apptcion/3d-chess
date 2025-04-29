import styles from '../../public/css/test.module.css'

export default function Test(){
  return (
    <main>
      <div className={styles.glitch_wrapper}>
       <div className={styles.glitch} data-text="Glitch Text">Glitch Text</div>
      </div>
    </main>
  )
}