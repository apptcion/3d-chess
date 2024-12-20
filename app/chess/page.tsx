'use client'
import styles from '../public/css/chess.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useState} from 'react'
import * as THREE from 'three'

interface cell {
    readonly color: "white" | "black";
    piece: "KING" | "QUEEN" | "ROOKS" | "BISHOPS" | "KNIGHTS" | "PAWNS" | "NONE";
    row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    ID: number
    visible: boolean
}

class Cell implements cell{
    public column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    public readonly color: "white" | "black";

    constructor(
        public piece : "KING" | "QUEEN" | "ROOKS" | "BISHOPS" | "KNIGHTS" | "PAWNS" | "NONE",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        columnNum:number,
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        color:boolean,
        public ID:number,
        public visible:boolean
    ){
        switch(columnNum){
            case 1:
                this.column = "a";
                break;
            case 2:
                this.column = "b";
                break;
            case 3:
                this.column = "c";
                break;
            case 4:
                this.column = "d";
                break;
            case 5:
                this.column = "e";
                break;
            case 6:
                this.column = "f";
                break;
            case 7:
                this.column = "g";
                break;
            default:
                this.column = "h";
        }
        if(color){
            this.color = "white";
        }else{
            this.color = "black";
        }
    }

    getCol(){
        switch(this.column){
            case "a":
                return 1;
            case "b":
                return 2;
            case "c":
                return 3;
            case "d":
                return 4;
            case "e":
                return 5;
            case "f":
                return 6;
            case "g":
                return 7;
            case "h":
                return 8;
        }
    }
}

interface board {
    readonly cells: Array<Array<Cell>>;
    //layer == index
    layer : 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

class Board implements board{
    constructor(
        public cells:Array<Array<Cell>>,
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){}
}

interface space {
    readonly boards: Array<Board>
}

class Space implements space{
    public readonly boards;
    constructor(){
        let cellID = 1;
        let isWhite = true;
        const Boards = [];
        for(let layer = 1; layer <= 8; layer++){
            const rows:Array<Array<Cell>> = [];
            let literalLayer = layer as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
            for(let row = 1; row <= 8; row++){
                const columns:Array<Cell> = [];
                for(let column = 1; column <= 8; column++){
                    let literalRow = row as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
                    columns.push(new Cell("NONE", literalRow, column, literalLayer, isWhite, cellID, true));
                    isWhite = !isWhite;
                }
                isWhite = !isWhite;
                rows.push(columns);
            }
            isWhite = !isWhite
            Boards.push(new Board(rows, literalLayer));
        }

        this.boards = Boards;
    }

    public getSpace(){
        const returnVal = this.boards
        return returnVal
    }
}

function ThreeBoard(){

    const { scene, camera } = useThree();

    useEffect(() => {
        const gameSpace = new Space()
            gameSpace.getSpace().forEach(board=> {

                board.cells.forEach(rows => {
                    rows.forEach(cell => {
                        console.log(cell);
                        if(cell.visible){
                            
                            const geometry = new THREE.PlaneGeometry(5,5);
                            const material = new THREE.MeshBasicMaterial({color : cell.color, side : THREE.DoubleSide})
                            const plane = new THREE.Mesh(geometry, material)
                            plane.rotation.x = Math.PI / 2;
                     
                            plane.position.set( cell.getCol() * 5 - 20, cell.layer * 5 - 20, cell.row * 5 - 20)
                            scene.add(plane)
                        }
                 })
             })
         })

        camera.position.set(20, 20, 20);
        camera.lookAt(0, 0, 0); // 카메라가 중심을 향하도록
    }, [])

    return (
        <></>
    )
}

export default function Chess(){
    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}>
                
                {/** dev */}
                <axesHelper></axesHelper>

                {/** temp */}
                <directionalLight position={[1,1,1]}></directionalLight>
                <mesh>
                    <boxGeometry></boxGeometry>
                </mesh>
    
                {/** Code */}
                <OrbitControls />
                <ThreeBoard />
            
            </Canvas>
            <div className={styles.UI}></div>
        </div>
    )
}