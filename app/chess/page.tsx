'use client'
import styles from '../public/css/chess.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useState, useRef} from 'react'
import * as THREE from 'three'

type piece = "KING" | "QUEEN" | "ROOKS" | "BISHOPS" | "KNIGHTS" | "PAWNS" | "NONE";

interface cell {
    readonly color: "white" | "black";
    piece: piece
    row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    ID: number
    visible: boolean
    mesh : THREE.Mesh
    onUnit: boolean
}

class Cell implements cell{
    public column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    public readonly color: "white" | "black";
    public mesh: THREE.Mesh; 
    public onUnit;

    constructor(
        public piece : piece,
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

        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            side: THREE.DoubleSide,
        });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.set(
            this.getCol() * 5 - 22.5,
            this.layer * 7 - 35,
            this.row * 5 - 22.5
        );

        // 셀 데이터를 메쉬에 저장
        this.mesh.userData.cell = this;

        this.onUnit = false;
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

    addToScene(scene: THREE.Scene) {
        scene.add(this.mesh);
    }

    setVisible(visible: boolean) {
        this.visible = visible;
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.transparent = true;
        material.opacity = visible ? 1 : 0.1; // 투명도 설정
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

////////////////////////////////////////////////////////

// + action, showCanCell
class Unit{ // == piece ( 체스 기물 )
    public death:boolean;
    public wasHandled:boolean;
    protected move:{always : Array<Array<number>>, option?:Array<(boards:Array<Board>, toX:number, toZ:number, toY:number, toColor:string, wasHandled:boolean) => void>};
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        this.death = false;
        this.move = {always : []};
        this.wasHandled = false;
    }

    addToScene(scene:THREE.Scene){

    }

    showCanCell(boards:Array<Board>){
            this.hideCanCell(boards)
            const materiali = boards[this.layer-1].cells[this.row -1][this.convertCol() -1].mesh.material as THREE.MeshBasicMaterial
            materiali.color.set('red');

            this.move.always.forEach(moveConfig => {
                let toX, toY, toZ;
                toX = this.convertCol() + moveConfig[0] - 1;
                toZ = this.row + moveConfig[2] - 1
                toY = this.layer + moveConfig[1] - 1;

                if( (0<= toX && toX <= 7 ) && (0 <= toY && toY <= 7 ) && (0 <= toZ && toZ <= 7) ){
                    console.log(boards[this.layer + moveConfig[1] - 1].cells)
                    const material = boards[toY].cells[toZ][toX].mesh.material as THREE.MeshBasicMaterial
                    material.color.set('yellow')
                }
            }) 

            if(this.move.option){
                this.move.option.forEach(action => {
                    action(boards, this.convertCol(), this.row, this.layer, 'yellow', this.wasHandled)
                })
            }
    }
    
    hideCanCell(boards:Array<Board>){
            this.move.always.forEach(moveConfig => {

                let toX, toY, toZ;
                toX = this.convertCol() + moveConfig[0] - 1;
                toZ = this.row + moveConfig[2] - 1
                toY = this.layer + moveConfig[1] - 1;

                if( (0<= toX && toX <= 7 ) && (0 <= toY && toY <= 7 ) && (0 <= toZ && toZ <= 7) ){
                    const cell = boards[toY].cells[toZ][toX]
                    const material = cell.mesh.material as THREE.MeshBasicMaterial;
                    material.color.set(`${cell.color}`)
                }
            })

            if(this.move.option){
                this.move.option.forEach(action => {
                    action(boards, this.convertCol(), this.row, this.layer, 'origin', this.wasHandled)
                })
            }
    }

    moveAct(){
        this.wasHandled = true;
    }

    convertCol(){
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

class Pawns extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    ){
        super(team,row, column,layer);
        this.unitType = "PAWNS";
        this.move = {
            always : [
                [0,0,1]
            ],
            option : [
                function existEnemy(boards:Array<Board>, nowCol:number, nowRow:number, nowLayer:number, toColor:string, wasHandled:boolean){
                    let tempArray = [
                        [1,0,1],
                        [-1,0,1]
                    ]
                    tempArray.forEach(moveConfig => {
                        let toX, toY, toZ;
                        toX = nowCol + moveConfig[0] - 1;
                        toZ = nowRow + moveConfig[2] - 1
                        toY = nowLayer + moveConfig[1] - 1;
        
                        if( (0<= toX && toX <= 7 ) && (0 <= toY && toY <= 7 ) && (0 <= toZ && toZ <= 7) ){
                            if(boards[toY].cells[toZ][toX].onUnit){
                                const material = boards[toY].cells[toZ][toX].mesh.material as THREE.MeshBasicMaterial
                                const cell = boards[toY].cells[toZ][toX]
                                if(toColor == 'origin'){
                                    material.color.set(`${cell.color}`)
                                }else{
                                    material.color.set(toColor)
                                }
                            }
                        }
                    }) 

                },
                function firstHandle(boards:Array<Board>, nowCol:number, nowRow:number, nowLayer:number,toColor:string,  wasHandled:boolean){
                    let toX, toY, toZ;
                    toX = nowCol - 1;
                    toZ = nowRow + 1;
                    toY = nowLayer - 1;
    
                    if( (0<= toX && toX <= 7 ) && (0 <= toY && toY <= 7 ) && (0 <= toZ && toZ <= 7) ){
                        if(!wasHandled){
                            const material = boards[toY].cells[toZ][toX].mesh.material as THREE.MeshBasicMaterial
                            const cell = boards[toY].cells[toZ][toX]
                            if(toColor == 'origin'){
                                material.color.set(`${cell.color}`)
                            }else{
                                material.color.set(toColor)
                            }
                        }
                    }
                }
            ]
        }
    }
}

class ROOKS extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        super(team,row, column,layer)
        this.unitType = "ROOKS"
        this.move = {
            always : [
                [1,0,0],
                [2,0,0],
                [3,0,0],
                [4,0,0],
                [5,0,0],
                [6,0,0],
                [7,0,0],
                [8,0,0],

                
                [-1,0,0],
                [-2,0,0],
                [-3,0,0],
                [-4,0,0],
                [-5,0,0],
                [-6,0,0],
                [-7,0,0],
                [-8,0,0],

                [0,0,1],
                [0,0,2],
                [0,0,3],
                [0,0,4],
                [0,0,5],
                [0,0,6],
                [0,0,7],
                [0,0,8],

                [0,0,-1],
                [0,0,-2],
                [0,0,-3],
                [0,0,-4],
                [0,0,-5],
                [0,0,-6],
                [0,0,-7],
                [0,0,-8],
            ]
        }
    }
}


class Bishops extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        super(team,row, column,layer)
        this.unitType = "BISHOPS"
        this.move = {
            always : [
                [1,0,1],
                [2,0,2],
                [3,0,3],
                [4,0,4],
                [5,0,5],
                [6,0,6],
                [7,0,7],
                [8,0,8],

                [1,0,-1],
                [2,0,-2],
                [3,0,-3],
                [4,0,-4],
                [5,0,-5],
                [6,0,-6],
                [7,0,-7],
                [8,0,-8],

                
                [-1,0,1],
                [-2,0,2],
                [-3,0,3],
                [-4,0,4],
                [-5,0,5],
                [-6,0,6],
                [-7,0,7],
                [-8,0,8],

                
                [-1,0,-1],
                [-2,0,-2],
                [-3,0,-3],
                [-4,0,-4],
                [-5,0,-5],
                [-6,0,-6],
                [-7,0,-7],
                [-8,0,-8],

            ]
        }
    }
}

class Knight extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        super(team,row, column,layer)
        this.unitType = "KNIGHTS"
        this.move = {
            always : [
                [1,0,-2], //앞 2칸, 오른쪽 1칸 
                [-1,0,-2],
                
                [2,0,-1],
                [2,0,1],
                
                [-2,0,-1],
                [-2,0,1],
                
                [1,0,2],
                [-1,0,2]
            ]
        }
    }
}


class Queen extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        super(team,row, column,layer)
        this.unitType = "QUEEN"
        this.move = {
            always : [
                [1,0,0],
                [2,0,0],
                [3,0,0],
                [4,0,0],
                [5,0,0],
                [6,0,0],
                [7,0,0],
                [8,0,0],
                
                [-1,0,0],
                [-2,0,0],
                [-3,0,0],
                [-4,0,0],
                [-5,0,0],
                [-6,0,0],
                [-7,0,0],
                [-8,0,0],
                
                [0,0,1],
                [0,0,2],
                [0,0,3],
                [0,0,4],
                [0,0,5],
                [0,0,6],
                [0,0,7],
                [0,0,8],

                [0,0,-1],
                [0,0,-2],
                [0,0,-3],
                [0,0,-4],
                [0,0,-5],
                [0,0,-6],
                [0,0,-7],
                [0,0,-8],

                [1,0,1],
                [2,0,2],
                [3,0,3],
                [4,0,4],
                [5,0,5],
                [6,0,6],
                [7,0,7],
                [8,0,8],
            
                [1,0,-1],
                [2,0,-2],
                [3,0,-3],
                [4,0,-4],
                [5,0,-5],
                [6,0,-6],
                [7,0,-7],
                [8,0,-8],
                
                [-1,0,1],
                [-2,0,2],
                [-3,0,3],
                [-4,0,4],
                [-5,0,5],
                [-6,0,6],
                [-7,0,7],
                [-8,0,8],
            
                [-1,0,-1],
                [-2,0,-2],
                [-3,0,-3],
                [-4,0,-4],
                [-5,0,-5],
                [-6,0,-6],
                [-7,0,-7],
                [-8,0,-8],
            ]
        }
    }
}


class King extends Unit{
    
    public readonly unitType: piece
    constructor(
        team: "white" | "black", // 팀 정보
        row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ){
        super(team,row, column,layer)
        this.unitType = "KING"
        this.move = {
            always : [
                [1,0,0],
                [-1,0,0],
                [0,0,1],
                [0,0,-1],

                [1,0,1],
                [1,0,-1],
                [-1,0,1],
                [-1,0,-1]
            ]
        }
    }
}

////////////////////////////////////////////////////////

interface space {
    readonly boards: Array<Board>
}

class Space implements space {
    public readonly boards;

    constructor() {
        let cellID = 1;
        let isWhite = true;
        const Boards = [];

        for (let layer = 1; layer <= 8; layer++) {
            const rows: Array<Array<Cell>> = [];
            const literalLayer = layer as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

            for (let row = 1; row <= 8; row++) {
                const columns: Array<Cell> = [];
                const literalRow = row as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

                for (let column = 1; column <= 8; column++) {
                    columns.push(new Cell("NONE", literalRow, column, literalLayer, isWhite, cellID++, true));
                    isWhite = !isWhite;
                }
                isWhite = !isWhite;
                rows.push(columns);
            }
            isWhite = !isWhite;
            Boards.push(new Board(rows, literalLayer));
        }

        this.boards = Boards;
    }

    public addToScene(scene: THREE.Scene) {
        this.boards.forEach(board => {
            board.cells.forEach(rows => {
                rows.forEach(cell => {
                    cell.addToScene(scene);
                });
            });
        });
    }

    public setAllVisible(visible: boolean){
        this.boards.forEach(board => {
            board.cells.forEach(rows => {
                rows.forEach(cell => {
                    cell.setVisible(visible)
                })
            })
        })
    }
}

function ThreeBoard({spaceRef} : {spaceRef: React.MutableRefObject<Space | null>}) {
    const { scene, camera } = useThree();

    useEffect(() => {
        const gameSpace = new Space();
        spaceRef.current = gameSpace;
        gameSpace.addToScene(scene);

        ////////////////////////////////
        const KnightTestUnit = new Pawns("white", 4,"d", 8)
        KnightTestUnit.showCanCell(gameSpace.boards)
        ////////////////////////////////////////


        const clickHandler = (event: MouseEvent) => {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(scene.children);

            if (intersects.length > 0) {
                if(event.button == 0) {//좌클릭
                    for(let i = 0; i < intersects.length; i++){
                        if(intersects[i].object.userData?.cell instanceof Cell){
                            const cellData: Cell = intersects[i].object.userData.cell;
                            console.log(cellData)
                            if(cellData.visible){
                                intersects[i].object.userData.cell.setVisible(false)
                                break;
                            }
                        }
                    }
                }else if(event.button == 2){
                    for(let i = intersects.length - 1; i >=0; i--){
                        if(intersects[i].object.userData?.cell instanceof Cell){
                            const cellData: Cell = intersects[i].object.userData.cell;
                            if(!cellData.visible){
                                intersects[i].object.userData.cell.setVisible(true)
                                break;
                            }
                        }
                    }
                }
            }
        };
        const disableContextMenu = (event: MouseEvent) => event.preventDefault();

        document.addEventListener("mousedown", clickHandler);
        document.addEventListener("contextmenu", disableContextMenu);

        camera.position.set(35, 35, 35);
        camera.lookAt(0, 0, 0);

        return () => {
            document.removeEventListener("click", clickHandler);
        };
    }, []);

    return null;
}


export default function Chess(){

    const spaceRef = useRef<Space | null>(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if(spaceRef.current){
            spaceRef.current.setAllVisible(visible)
        }
    })

    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}>
                
                {/** dev */}
                <axesHelper></axesHelper>

                {/** temp */}
                <directionalLight position={[1,100,1]}></directionalLight>
                <mesh>
                    <boxGeometry></boxGeometry>
                </mesh>
    
                {/** Code */}
                <OrbitControls 
                    mouseButtons={{
                        LEFT: THREE.MOUSE.LEFT,
                        MIDDLE: THREE.MOUSE.MIDDLE,
                        RIGHT: undefined, // 우클릭 방지
                    }}
                />
                <ThreeBoard spaceRef={spaceRef} />
            
            </Canvas>
            <div className={styles.UI}>
                         <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                    />
            </div>
        </div>
    )
}