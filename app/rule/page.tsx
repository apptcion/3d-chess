'use client'
import styles from '../../public/css/rule.module.css'
import Raumschach from './raumschach'

import {useEffect, useState} from 'react'

export default function Rule(){

    const [showRaum, setRaum] = useState(false)

    useEffect(() => {
        console.log(showRaum)
        if(showRaum){
            const RaumWrap = document.querySelector('#RaumWrap') as HTMLDivElement
            RaumWrap.style.width = '100vw'
        }else{
            const RaumWrap = document.querySelector('#RaumWrap') as HTMLDivElement
            RaumWrap.style.width = '0vw'    
        }
    }, [showRaum])

    return (
        <main className={styles.main}>
            <ol className={styles.index}>
                <li>기본 체스 룰</li>
                <li>변형 체스 룰</li>
                <li>게임 플레이 방법</li>
                <li>기타</li>
            </ol>
            <div className={styles.rules}>
                <div>
                    <h1 className={`${styles.title_lev1}`} id="NORMAL_RULE">기본 체스 규칙</h1>
                    <h5>3D-CHESS를 이해하기 위한 간단한 규칙만을 설명합니다. <a href="https://www.chess.com/learn-how-to-play-chess" target='_blank' className={styles.a}>자세한 규칙</a></h5>
                    <div className={styles.content}>
                        <div className={styles.doc}>
                            <h2 className={`${styles.title_lev2}`}>게임 시작</h2>
                            <div className={styles.content}>
                                체스는 8 x 8의 판에서 진행되는 <b>1 : 1 턴제 보드 게임입니다.</b><br />
                                각 플레이어는 흰 팀 또는 검은 팀이 됩니다. (3D-CHESS에서는 랜덤으로 배정)<br />
                                각 플레이어는 <b>8개의 폰, 2개의 룩, 2개의 나이트, 2개의 비숍, 1개의 여왕, 1개의 왕</b>으로 구성된<br />
                                16개의 <a href="#UNITS" className={`${styles.a}`}>기물</a>을 지정된 위치에 배치하고 시작하며 (각 팀이 가지는 종류별 기물의 개수는 같습니다.)<br />
                                <b>상대의 <a href="#UNIT_KING" className={`${styles.a}`}>왕</a>을 먼저 잡는 것을 목표로 합니다.</b><br />
                                <img src="/img/chess/board.png" className={`${styles.img}`}/>
                                <img src="/img/chess/board_with_unit.png" className={`${styles.img}`}/>
                            </div>
                        </div>
                        <div>
                            <h2 className={`${styles.title_lev2}`}>게임 진행</h2>
                            <div className={styles.content}>
                                플레이어는 번갈아가며 한 번씩 <b>자신의 기물을 1회 움직입니다.</b><br />
                                시작은 항상 흰 팀이 먼저 시작합니다. <b>각 기물은 종류에 따라 다른 움직임을 가집니다.</b><br />
                                기물이 움직일 수 있는 칸에 적 기물이 있다면,<b> 적 기물을 잡을(공격 할) 수 있습니다.</b>
                            </div>
                        </div>
                        <div>
                            <h2 className={`${styles.title_lev2}`}>게임 종료</h2>
                            <div className={styles.content}>
                                자신의 기물을 움직여 적의 <b><a href="#UNIT_KING" className={`${styles.a}`}>왕</a>을 잡으면 승리합니다.</b>
                            </div>
                        </div>
                        <div id="UNITS">
                        <h2 className={`${styles.title_lev2}`}>기물</h2>
                            <div className={styles.content}>
                                <div className={styles.doc}>
                                    <h3 className={`${styles.title_lev3}`}>
                                        <img src="/img/chess/unit/pawns_black.webp" className={`${styles.icon}`}/>폰(PAWNS)
                                    </h3>
                                    <div className={styles.content}>
                                        폰은 각 플레이어가 8개를 가지고 시작합니다.<br />
                                        앞에 다른 기물(아군, 적) 이 없다면 앞으로 한칸 이동할 수 있습니다.<br />
                                        또한, 각각의 폰이 해당 게임에서 처음 움직이며, 바로 앞/두 칸 앞에 다른 기물이 없다면,<br />
                                        한 번에 앞으로 두칸 이동할 수 도 있습니다.<br />
                                        대각선 방향(한 칸 앞, 양옆 한 칸)에 적이 있다면 공격할 수 있습니다.<br />
                                        <img src="/img/chess/unit/pawns_explain.png" className={`${styles.img}`}/>
                                    </div>  
                                </div>

                                <div>
                                    <h3 className={`${styles.title_lev3}`}>
                                        <img src="/img/chess/unit/rooks_black.webp" className={`${styles.icon}`}/>룩(ROOKS)
                                    </h3>
                                    <div className={styles.content}>
                                        룩은 각 플레이어가 2개를 가지고 시작합니다.<br />
                                        룩은 앞으로, 또는 옆 방향으로 원하는 칸 만큼 움직일 수 있습니다.<br />
                                        다만 방향에 아군이 있다면 그 바로 앞까지,<br />
                                        적 기물이 있다면 해당 칸까지 움직일 수 있습니다(이 경우 적을 공격합니다).<br />
                                        <img src="/img/chess/unit/rooks_explain.png" className={`${styles.img}`}/>
                                    </div>  
                                </div>

                                <div>
                                    <h3 className={`${styles.title_lev3}`}>
                                        <img src="/img/chess/unit/bishops_black.webp" className={`${styles.icon}`}/>비숍(BISHOPS)
                                    </h3>
                                    <div className={styles.content}>
                                        비숍은 각 플레이어가 2개를 가지고 시작합니다.<br />
                                        비숍은 대각선 방향으로 원하는 칸 만큼 움직일 수 있습니다.<br />
                                        다만 방향에 아군이 있다면 그 바로 앞까지,<br />
                                        적 기물이 있다면 해당 칸까지 움직일 수 있습니다(이 경우 적을 공격합니다).<br />
                                        <img src="/img/chess/unit/bishops_explain.png" className={`${styles.img}`}/>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className={`${styles.title_lev3}`}>
                                        <img src="/img/chess/unit/knights_black.webp" className={`${styles.icon}`}/>나이트(KNIGHTS)
                                    </h3>
                                    <div className={styles.content}>
                                        나이트는 각 플레이어가 2개를 가지고 시작합니다.<br />
                                        나이트는 앞 또는 뒤로 두 칸 이동 후 양 옆 한 칸,<br />
                                        또는 양 옆으로 두 칸 이동 후 앞 뒤 한 칸 움직일 수 있습니다.<br />
                                        중간에 어떤 기물이 있어도 상관없이 움직일 수 있지만,<br />
                                        도착 지점에 아군 기물이 있다면 갈 수 없습니다.<br />
                                        도착 지점에 적이 있다면 공격합니다.<br />
                                        <img src="/img/chess/unit/knights_explain.png" className={`${styles.img}`}/>
                                    </div>
                                </div>
                                
                                <div id="UNIT_KING">
                                    <h3 className={`${styles.title_lev3}`}>
                                        <img src="/img/chess/unit/king_black.webp" className={`${styles.icon}`}/>왕(KING)
                                    </h3>
                                    <div className={styles.content}>
                                        왕은 각 플레이어가 1개를 가지고 시작합니다.<br />
                                        왕은 모든 방향으로 한 칸 움직입니다.<br />
                                        단 아군 기물이 있는 칸은 이동 불가능합니다.<br />
                                        적이 있다면 공격합니다.<br />
                                        <img src="/img/chess/unit/king_explain.png" className={`${styles.img}`}/>
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`${styles.title_lev3}`}><img src="/img/chess/unit/queen_black.webp" className={`${styles.icon}`}/>여왕(QUEEN)</h3>
                                    <div className={styles.content}>
                                        여왕은 각 플레이어가 1개를 가지고 시작합니다.<br />
                                        여왕은 모든 방향으로 원하는 만큼 움직입니다.<br />
                                        다만 방향에 아군이 있다면 그 바로 앞까지,<br />
                                        적 기물이 있다면 해당 칸까지 움직일 수 있습니다(이 경우 적을 공격합니다).<br />
                                        <img src="/img/chess/unit/queen_explain.png" className={`${styles.img}`}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h1 className={styles.title_lev1}>변형 체스</h1>
                    <div className={styles.content}>
                        <div className={styles.doc}>
                            <h2 className={styles.title_lev2}>Raumschach ( 우주체스 )</h2>
                            <div className={styles.content}>
                                <h3 className={`${styles.title_lev3}`}>규칙</h3>
                                    우주체스는 5 x 5 x 5 판에서 각 플레이어가 20개의 기물을 가지고 시작합니다.<br />
                                    기물들은 10개의 폰, 2개의 룩, 2개의 나이트, 2개의 비숍, 2개의 유니콘, 1개의 왕, 1개의 여왕으로 구성되어있습니다.<br />
                                    각 기물의 움직임은 <a href="#UNITS" className={styles.a}>기본 체스 움직임을</a> 기반으로 3차원에 맞게 변형되어 있습니다.<br />
                                    그 외에는 <a href="#NORMAL_RULE" className={styles.a}>일반 체스</a>와 동일합니다.<br />
                                    <div className={styles.button} id="showRaumschach"
                                        onClick={() => setRaum(true)}>움직여 보기</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="RaumWrap" style={{overflow:'hidden', position:'fixed', top:'0px'}}><Raumschach team='white' setClose={setRaum}/></div>
        </main>
    )
}