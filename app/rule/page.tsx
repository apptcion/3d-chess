"use client";
import styled from "styled-components";
import styles from "../../public/css/rule.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Raumschach from "./raumschach";
import Millennium from "./millennium";

// 이미지 임포트
import LogoImg from '../../public/img/logo.png'

import boardImg from '../../public/img/chess/board.png'
import boardImg2 from '../../public/img/chess/board_with_unit.png'
import PawnImg from '../../public/img/chess/unit/pawns_black.webp'
import RookImg from '../../public/img/chess/unit/rooks_black.webp'
import KnightImg from '../../public/img/chess/unit/knights_black.webp'
import BishopImg from '../../public/img/chess/unit/bishops_black.webp'
import QueenImg from '../../public/img/chess/unit/queen_black.webp'
import KingImg from '../../public/img/chess/unit/king_black.webp'

import MillenniumBoardImg from '../../public/img/chess/Millennium_init.png'
import RaumschachBoardImg from '../../public/img/chess/Raumschach_gameboard.png'

import MainPageImg1 from '../../public/img/guide/mainPage.png'
import MainPageImg2 from '../../public/img/guide/mainPage2.png'
import MatchingImg from '../../public/img/guide/matchPage.png'
import teamNoticeWhite from '../../public/img/guide/teamNoticeWhite.png'
import teamNoticeBlack from '../../public/img/guide/teamNoticeBlack.png'
import SettingImg from '../../public/img/guide/settingPage.png'

import TimerWhiteImg from '../../public/img/guide/timerWhite.png'
import TimerBlackImg from '../../public/img/guide/timerBlack.png'
import ResultDefeatImg from '../../public/img/guide/resultDefeat.png'
import ResultVictoryImg from '../../public/img/guide/resultVictory.png'
import UnvisibleBoardImg from '../../public/img/guide/unvisibleBoard.png'
import VisibleWallImg from '../../public/img/guide/visibleWall.png'
/////////////////////////////////////////////////////////////////////////////////


const MainTitle = styled.div`
  position: relative;
  width: 100%;
  height: 2%;
  font-size: 1vw;
  font-weight: bold;
  color: black;
`

const info = [
  {mainTitle: "게임 규칙",
   docs: ["기본 체스 규칙", "밀레니엄 체스 규칙", "우주 체스 규칙"]},
  {mainTitle: "조작법",
   docs: ["게임 진행", "설정창"]}
]
function Index({display, setDisplay}: {display: Array<number>, setDisplay: React.Dispatch<Array<number>>}){
  return (
    <div style={{width: '20%', paddingLeft: '2rem', paddingTop: '2.5rem', borderRight: 'solid 1px #e5e7eb'}}>
      {info.map(({mainTitle, docs}: {mainTitle:string, docs: Array<string>}, index) => {
        const mIdx = index;
        return <div key={`main-${mIdx}`} style={{cursor: 'pointer'}}>
          <MainTitle>{mainTitle}</MainTitle>
          {docs.map((data: string, index) => {
            const isSelect = mIdx+1 == display[0] && index+1 == display[1];
            return <div key={`doc-${mIdx}-${index}`} style={{margin: '10px', fontSize: '1.1vw',
              fontWeight: `${isSelect ? 'bold' : ''}`,
              }} 
              onClick={() => setDisplay([mIdx+1, index+1])}>
              {data}</div>
          })}
        </div>
      })}
    </div>
  )
}

const Title = styled.div`
  margin-top: 4vh;
  margin-bottom: 0.7vh;
  color: black;
`
const Summary = styled.div`
  color: rgb(107,110,120);
  font-size: 1.2vw;
  font-weight: 400
`

const SubTitle = styled.h2`
  color: black;
  font-size: 2.5vw;
  font-weight: 700;
  margin-top: 5vh;
  margin-bottom: 2vh;
`

const Detail = styled.div`
  color: black;
  font-size: 1.2vw;
  font-weight: 400;
  margin-top: 5vh;
`
const Explain = styled.div`
  color: black;
  margin-left: 1vw;
  display: flex;
  word-break: break-word;
  width: calc(100% - 10vw);
  margin-top: 1vh;
`

const SubExplain = styled.div`
  color: rgb(107,110,120);
  font-size: 0.9vw;
  margin-left: 1vw;
  display: flex;
  word-break: break-word;
  width: calc(100% - 10vw);
`

const TestButton = styled.div`
  background-color: black;
    color : white;
    padding : 10px;
    width: 7vw;
    display: flex;
    justify-content: center;
    cursor: pointer;
    border-radius: 0.5vw;
    margin-top : 10px;
    font-size : 0.9vw;
    transition: 0.1s;
`

const H3 = styled.div`
  color: black;
  font-size: 1.6vw;
  font-weight: 500;
  margin-bottom: 2vh;
`
function Docs({display}:{display: Array<number>}){

  const [showMillennium, setShowMillennium] = useState(false);
  const [showRaumschach, setShowRaumschach] = useState(false);

  const docsRef = useRef(null);

  useEffect(() => {
    if (docsRef.current) {  
      const element = docsRef.current as HTMLDivElement;
      element.scrollTop = 0; // 스크롤을 맨 위로 이동
    }
  }
  , [display]);

  const ViewList = info.map(({mainTitle, docs}:{mainTitle: string, docs: Array<string>}, index) => { // 타이틀
    const mIdx = index+1
    return docs.map((data: string, index) => {
        return <div ref={docsRef} style={{width: '100%', height: '100%', paddingLeft: '5rem', paddingBottom: '5rem',overflowY: 'scroll'}}>
          {showRaumschach ? <Raumschach setClose={setShowRaumschach}/> : null}
          {showMillennium ? <Millennium setClose={setShowMillennium}/> : null}
                  
          <Title>
            <div style={{fontSize: '0.9vw', fontWeight: 'bold'}}>{mainTitle}</div>
            <div style={{fontSize: '2.2vw', fontWeight: 'bold'}}>{data}</div>
          </Title>
          {
              mIdx === 1 && index+1 === 1 ? (
                <div>
                  <Summary>기본적인 체스에 대한 설명입니다.</Summary>
                  <Detail>
                    <SubTitle>1. 시작하기</SubTitle>
                    <Explain>체스는 8 x 8의 판에서 2명이 대결하는 1 : 1 턴제 보드게임입니다</Explain>
                    <Explain>각자 8개의 폰, 2개의 룩, 나이트, 비숍,
                       1개의 여왕과 왕을 가지고 시작합니다.</Explain>
                    <Explain>16개의 기물을 지정된 위치에 배치한 상태로 시작합니다.</Explain>
                    
                      <Image src={boardImg} alt='chess' className={styles.img}/>
                      <Image src={boardImg2} alt='chess' className={styles.img}/>
                    {/* //////////////////////////////////////////////////////////////// */}
                    <SubTitle>2. 게임 진행</SubTitle>
                    <Explain>플레이어는 한 번에 하나의 말을 움직일 수 있습니다.</Explain>
                    <Explain>기물은 종류별로 다른 움직임을 가지고 있습니다.</Explain>
                    <Explain>자신의 기물을 움직여 상대방의 기물을 잡을 수 있습니다.</Explain>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-1. 기물의 움직임</H3>
                      <Explain>각 기물은 기본적으로 다음과 같은 방식으로 움직입니다.</Explain><br />
                      <Explain><Image src={PawnImg} alt=''/>폰 : 앞으로 한 칸, 처음에는 두 칸 이동 가능</Explain>
                      <Explain><Image src={RookImg} alt=''/>룩 : 수직, 수평으로 이동 가능</Explain>
                      <Explain><Image src={KnightImg} alt=''/>나이트 : L자 형태로 이동 가능</Explain>
                      <Explain><Image src={BishopImg} alt=''/>비숍 : 대각선으로 이동 가능</Explain>
                      <Explain><Image src={QueenImg} alt=''/>퀸 : 수직, 수평, 대각선으로 이동 가능</Explain>
                      <Explain><Image src={KingImg} alt=''/>킹 : 한 칸씩 모든 방향으로 이동 가능</Explain>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-2. 특수 규칙</H3>
                      <Explain>폰은 반대쪽 끝에 도달하면 원하는 기물로 바꿀 수 있습니다. (현재는 퀸으로 변경)</Explain>
                    </div>
                    {/* //////////////////////////////////////////////////////////////// */}
                    <SubTitle>3. 게임 종료</SubTitle>
                    <Explain>상대방의 킹을 잡으면 게임이 종료됩니다.</Explain>
                  </Detail>
                </div>
              ) : mIdx === 1 && index+1 === 2 ? (
                <div>
                  <Summary>Millennium 모드 규칙에 대한 설명입니다.</Summary>
                  <Detail>
                    <SubTitle>1. 규칙</SubTitle>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                        <H3>1-1. 변형</H3>
                        <Explain>Millennium(밀레니엄) 모드는 체스의 변형 방식 중 하나입니다.</Explain>
                        <Explain>밀레니엄 체스의 판은  8 x 8 x 3의 형태를 가지고 있습니다.</Explain>
                        <Explain>각 기물들의 움직임은 3차원에 맞게 변형되어 있습니다.</Explain>
                        <Explain>체크메이트, 스테일메이트, 캐슬링, 앙파상은 없습니다.</Explain>
                        <Image src={MillenniumBoardImg} alt='chess' className={styles.img}/>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                        <H3>1-2. 타임 아웃</H3>
                        <Explain>5분안에 기물을 움직여야 합니다. 시간이 지나면 패배처리 됩니다.</Explain>
                        <Explain>차례를 넘기면 타이머가 초기화됩니다.</Explain>
                        <Explain>타이머의 색은 현재 차례를 의미합니다.</Explain>
                        <Image src={TimerWhiteImg} alt='chess' className={styles.img2}/>
                        <div style={{marginLeft: '2.5vw'}}><SubExplain>백팀의 차례</SubExplain></div>
                    
                        <Image src={TimerBlackImg} alt='chess' className={styles.img2}/>
                        <div style={{marginLeft: '2.5vw'}}><SubExplain>흑팀의 차례</SubExplain></div>
                    </div>

                    <SubTitle>2. 기물</SubTitle>
                    <Explain>각 기물은 기본적으로 다음과 같은 방식으로 움직입니다.</Explain>
                    <SubExplain>기물의 움직임을 흰 말(아래쪽) 기준으로 서술합니다.</SubExplain>
                    <SubExplain>좌우 이동을 X, 앞뒤 이동을 Z, 위 아래 이동을 Y로 나타냅니다.</SubExplain>
                      
                      <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                        <H3>2-1. 기물의 움직임</H3>
                        <Explain><Image src={PawnImg} alt=''/>폰 : X 축으로 한 칸 / Y 축으로 한 칸 / X,Y축으로 한 칸 이동<br />
                        처음에는 두 칸 이동 가능</Explain>
                        <Explain><Image src={RookImg} alt=''/>룩 : X 축으로 이동 / Y 축으로 이동 / Z 축으로 이동 / X,Y,Z 축으로 이동</Explain>
                        <Explain><Image src={KnightImg} alt=''/>나이트 : L자 형태로 이동</Explain>
                        <Explain><Image src={BishopImg} alt=''/>비숍 : X,Z 축으로 이동 / X,Y,Z 축으로 이동</Explain>
                        <Explain><Image src={QueenImg} alt=''/>퀸 : 모든 방향으로 이동</Explain>
                        <Explain><Image src={KingImg} alt=''/>킹 : 한 칸씩 모든 방향으로 이동</Explain>
                      </div>
                      <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                        <H3>2-2. 움직여보기</H3>
                        <Explain>게임 화면에서 기물을 클릭하면 기물의 움직임을 확인할 수 있습니다.</Explain>
                        <SubExplain>최적화 문제로 움직임 끊깁니다. 실제 게임에선 자연스럽게 움직입니다.</SubExplain>
                        <TestButton onClick={() => setShowMillennium(true)}>움직여보기</TestButton>
                      </div>

                  </Detail>
               </div>
              ) : mIdx === 1 && index+1 === 3 ? (
                <div>
                  <Summary>Raumschach 모드 규칙에 대한 설명입니다.</Summary>
                  <Detail>
                  <SubTitle>1. 규칙</SubTitle>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                        <H3>1-1. 변형</H3>
                        <Explain>Raumschach(우주) 모드는 체스의 변형 방식 중 하나입니다.</Explain>
                        <Explain>밀레니엄 체스의 판은  5 x 5 x 5의 형태를 가지고 있습니다.</Explain>
                        <Explain>각 기물들의 움직임은 3차원에 맞게 변형되어 있습니다.</Explain>
                        <Explain>체크메이트, 스테일메이트, 캐슬링, 앙파상은 없습니다.</Explain>
                        <Image src={RaumschachBoardImg} alt='chess' className={styles.img}/>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                    <H3>1-2. 타임 아웃</H3>
                        <Explain>5분안에 기물을 움직여야 합니다. 시간이 지나면 패배처리 됩니다.</Explain>
                        <Explain>차례를 넘기면 타이머가 초기화됩니다.</Explain>
                        <Explain>타이머의 색은 현재 차례를 의미합니다.</Explain>
                        <Image src={TimerWhiteImg} alt='chess' className={styles.img2}/>
                        <div style={{marginLeft: '2.5vw'}}><SubExplain>백팀의 차례</SubExplain></div>
                    
                        <Image src={TimerBlackImg} alt='chess' className={styles.img2}/>
                        <div style={{marginLeft: '2.5vw'}}><SubExplain>흑팀의 차례</SubExplain></div>
                    </div>

                    <SubTitle>2. 기물</SubTitle>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-1. 추가 기물</H3>
                      <Explain>Unicorn(유니콘), Knightmare(나이트메어) 또는 Nightrider(나이트라이더)라고 불리는 추가 기물이 존재합니다.</Explain>
                      <SubExplain>여기서는 Unicorn이라고 부르겠습니다. 인게임에서는 나이트 기물에 날개가 달린 형태로 표현됩니다.</SubExplain>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-2. 기물의 움직임</H3>
                      <Explain>각 기물은 기본적으로 다음과 같은 방식으로 움직입니다.</Explain>
                      <SubExplain>기물의 움직임을 흰 말(아래쪽) 기준으로 서술합니다.</SubExplain>
                      <SubExplain>좌우 이동을 X, 앞뒤 이동을 Z, 위 아래 이동을 Y로 나타냅니다.</SubExplain><br />
                      <Explain><Image src={PawnImg} alt=''/>폰 : X 축으로 한 칸 / Y 축으로 한 칸 이동<br />
                       처음에는 두 칸 이동 가능</Explain>
                      <Explain><Image src={RookImg} alt=''/>룩 : X 축으로 이동 / Y 축으로 이동 / Z 축으로 이동</Explain>
                      <Explain><Image src={KnightImg} alt=''/>나이트 : L자 형태로 이동</Explain>
                      <Explain><Image src={BishopImg} alt=''/>비숍 : X,Z 축으로 이동 / Z,Y 축으로 이동 / X,Y 축으로 이동</Explain>
                      <Explain><Image src={KnightImg} alt=''/>유니콘 : X,Y,Z 축으로 이동</Explain>
                      <Explain><Image src={QueenImg} alt=''/>퀸 : 모든 방향으로 이동</Explain>
                      <Explain><Image src={KingImg} alt=''/>킹 : 한 칸씩 모든 방향으로 이동 가능</Explain>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-3. 움직여보기</H3>
                      <Explain>게임 화면에서 기물을 클릭하면 기물의 움직임을 확인할 수 있습니다.</Explain>
                      <SubExplain>최적화 문제로 움직임 끊깁니다. 실제 게임에선 자연스럽게 움직입니다.</SubExplain>
                      <TestButton onClick={() => setShowRaumschach(true)}>움직여보기</TestButton>
                    </div>
                  </Detail>
                </div>
              ) : mIdx === 2 && index+1 === 1 ? (
                <div>
                  <Summary>게임 진행에 대한 설명입니다.</Summary>
                  <Detail>
                    <SubTitle>1. 모드 선택</SubTitle>
                    <Explain>카드를 눌러 원하는 모드를 설정합니다. 기본적으로 밀레니엄 모드가 설정되어 있습니다.</Explain>
                    <Image src={MainPageImg1} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>Millennium 모드가 설정된 화면</SubExplain></div>
                    <Image src={MainPageImg2} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>Raumschach 모드가 설정된 화면</SubExplain></div>
                    <Explain>원하는 모드를 선택한 후, 게임 시작 버튼을 클릭합니다.</Explain>

                    <SubTitle>2. 매칭 대기</SubTitle>
                    <Explain>게임 시작 버튼을 클릭하면 매칭 대기 화면으로 이동합니다.</Explain>
                    <Explain>현재 선택한 모드가 표시됩니다.</Explain>
                    <Image src={MatchingImg} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>Raumschach 모드가 선택된 매칭</SubExplain></div>
                  
                    <SubTitle>3. 게임 시작</SubTitle>
                    <Explain>상대방과 매칭이 완료되면 게임 화면으로 이동합니다.</Explain>
                    <Explain>팀이 정해지고, 곧 게임이 시작됩니다.</Explain>
                    <Image src={teamNoticeWhite} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>백팀으로 배정됨</SubExplain></div>
                    <Image src={teamNoticeBlack} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>흑팀으로 배정됨</SubExplain></div>

                    <SubTitle>4. 게임 진행</SubTitle>
                    <Explain>게임 규칙에 맞춰 한 턴씩 게임이 진행됩니다.</Explain>

                    <SubTitle>5. 게임 종료</SubTitle>
                    <Explain>다음 중 하나를 달성하면 승리합니다.</Explain>
                    <div style={{marginLeft: '1vw'}}>
                      <Explain>1) 상대방의 킹을 잡습니다.</Explain>
                      <Explain>2) 상대방이 제한시간 안에 기물을 이동하지 못합니다.</Explain> 
                      <Explain>3) 상대방이 항복하거나 게임을 비정상 종료합니다.</Explain> 
                    </div>
                    <Explain>게임 종료 후, 게임 결과와 방법을 확인할 수 있습니다.</Explain>
                    <Image src={ResultVictoryImg} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>항복으로 승리</SubExplain></div>

                    <Image src={ResultDefeatImg} alt='chess' className={styles.img2}/>
                    <div style={{marginLeft: '2.5vw'}}><SubExplain>제한시간 초과로 패배</SubExplain></div>
                  </Detail>
                </div>
              ) : mIdx === 2 && index+1 === 2 ? (
                <div>
                  <Summary>설정창에 존재하는 설정들에 대한 설명입니다.</Summary>
                  <Detail>
                    <SubTitle>1. 설정 표시</SubTitle>
                    <Explain>게임 화면에서 좌측 상단 설정 버튼을 클릭하면 설정창이 열립니다.</Explain>
                    <Image src={SettingImg} alt='chess' className={styles.img2}/>
                    <SubTitle>2. 메뉴</SubTitle>
                    <Explain>설정창에서 다음과 같은 행동을 할 수 있습니다.</Explain>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-1. 체스 판 표시</H3>
                      <Explain>체스 판을 반투명 상태로 변경합니다.</Explain>
                      <Image src={UnvisibleBoardImg} alt='chess' className={styles.img2}/>
                      <div style={{marginLeft: '2.5vw'}}><SubExplain>체스 판 표시 해제</SubExplain></div>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-2. 벽 표시</H3>
                      <Explain>칸에 맞는 벽을 표시합니다.</Explain>
                      <Image src={VisibleWallImg} alt='chess' className={styles.img2}/>
                      <div style={{marginLeft: '2.5vw'}}><SubExplain>벽 표시</SubExplain></div>
                    </div>
                    <div style={{marginLeft: '1vw', marginTop: '2vh'}}>
                      <H3>2-3. 나가기</H3>
                      <Explain>게임을 종료하고 메인화면으로 이동합니다. 게임은 패배 처리됩니다.</Explain>
                    </div>
                  </Detail>
                </div>
              ) : null
            }
        </div>
      })
    })

  return ViewList[display[0]-1][display[1]-1]
}

const Page = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
`

const Header = styled.div`
  position : fixed;
  z-index: 1000;
  top : 0;
  left: 0;
  width: 100vw;
  height: 8vh;
  border-bottom: solid 1px #e5e7eb;
  background-color: white;
  display: flex;
  justify-content: start;
  align-items: center;
  color: black;
`

const Content = styled.div`
  position: relative;
  margin-top: 8vh;
  width: 100%;
  height: calc(100% - 8vh);
  display: flex;
  background-color: white;
  display: flex;
`


// Main component
export default function Rule() {

  const [display, setDisplay] = useState([1,1]);

  return (
    <Page>
      <Header>
        <Image src={LogoImg} alt='3D-CHESS LOGO' style={{width: '2.625vw', height: '2.25vw', marginLeft: '2vw', marginRight: '1vw'}}/>
        <div style={{fontWeight: '600', fontSize: '1.3vw'}}>변형 체스 설명서</div>
      </Header>
      <Content>
        <Index display={display} setDisplay={setDisplay}/>
        <Docs display={display}/>
      </Content>
    </Page>
  );
}
