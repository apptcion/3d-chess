'use client'
import styles from '../../public/css/test2.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useRef} from 'react'
import * as THREE from 'three'
import { v4 as uuidv4} from 'uuid'

const colorConfig = {
    opacity : {
        black : 0.9,
        white : 0.4,
        normal : 1
    }
}

const mapConfig = {
    cellSize : {
        x : 5,
        y : 5,
        Gap : 7
    }
}

type piece = "KING" | "QUEEN" | "ROOKS" | "BISHOPS" | "KNIGHTS" | "PAWNS" | "UNICORNS" | "NONE";

interface cell {
    readonly color: "white" | "black";
    piece: Unit | null;
    row: 1 | 2 | 3 | 4 | 5;
    column: "a" | "b" | "c" | "d" | "e";
    layer: 1 | 2 | 3 | 4 | 5;
    ID: number
    visible: boolean
    mesh : THREE.Mesh,
    cubeMesh : THREE.Mesh,
    onUnit: boolean
    onUnitTeam: "white" | "black" | "none"
    canAttack: boolean
    canGo: boolean
    normalOpacity :number
}

class Cell implements cell{
    public column: "a" | "b" | "c" | "d" | "e" ;
    public readonly color: "white" | "black";
    public mesh: THREE.Mesh; 
    public cubeMesh: THREE.Mesh;
    public onUnit;
    public canAttack;
    public canGo;
    public onUnitTeam: "white" | "black" | "none";
    public normalOpacity:number

    constructor(
        public piece : Unit | null,
        public row: 1 | 2 | 3 | 4 | 5,
        columnNum:number,
        public layer: 1 | 2 | 3 | 4 | 5,
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
            default:
                this.column = "e";
        }
        if(color){
            this.color = "white";
        }else{
            this.color = "black";
        }

        const geometry = new THREE.BoxGeometry(mapConfig.cellSize.x, mapConfig.cellSize.y);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            side: THREE.DoubleSide,
        });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.set(
            (this.getCol()*1.001) * mapConfig.cellSize.x - 15,
            (this.layer*1.001) * mapConfig.cellSize.Gap - 35,
            (this.row*1.001) * -mapConfig.cellSize.y + 15  
        );

        // CubeMesh

        const cubeMaterial = new THREE.MeshBasicMaterial({
            color : this.color,
            side : THREE.DoubleSide,
            transparent : true,
            opacity : 0.1
        })

        const cubeSideGeometry = new THREE.BoxGeometry(
            mapConfig.cellSize.x,
            mapConfig.cellSize.Gap - 1,
            mapConfig.cellSize.y
        )

        this.cubeMesh = new THREE.Mesh(cubeSideGeometry, cubeMaterial)

        this.cubeMesh.position.set(
            (this.getCol()*1.001) * mapConfig.cellSize.x - 15,
            this.layer * mapConfig.cellSize.Gap - 31.5,
            (this.row*1.001) * -mapConfig.cellSize.y + 15  
        );


        this.mesh.renderOrder = 1; // 바닥
        this.cubeMesh.renderOrder = 2; // 벽
        // 셀 데이터를 메쉬에 저장
        this.mesh.userData.cell = this;

        this.onUnit = false;
        this.canAttack = false;
        this.canGo = false;
        this.onUnitTeam = "none"
        this.normalOpacity = colorConfig.opacity.normal
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
        }
    }

    addToScene(scene: THREE.Scene, wallVisible:boolean) {
        if(wallVisible){
            // const cubeMaterial = this.cubeMesh.material as Array<THREE.MeshBasicMaterial>;
            // for(let i = 0; i < 6; i++){
            //     cubeMaterial[i]
            // }

            scene.add(this.cubeMesh)
        }else{
            scene.remove(this.cubeMesh)
        }
        scene.add(this.mesh);
    }

    setVisible(visible: boolean) {
        this.visible = visible;
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.transparent = true;
        material.opacity = visible ? this.normalOpacity : 0.1; // 투명도 설정
        const cube_material = this.cubeMesh.material as THREE.MeshBasicMaterial
        cube_material.opacity = visible ? 0.2 : 0.1
    }

    makeGoCell(showingCell:Array<Cell>){
        this.canGo = true;
        this.canAttack = false;
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.transparent = true;
        this.normalOpacity = material.opacity = this.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white   
        material.color.set('yellow')
        const cube_material = this.cubeMesh.material as THREE.MeshBasicMaterial
        cube_material.color.set('yellow')
        showingCell.push(this)
    }

    makeAttackCell(showingCell:Array<Cell>){
        this.makeGoCell(showingCell)
        this.canAttack = true;
        const material = this.mesh.material as THREE.MeshBasicMaterial;
        material.color.set('red')
        const cube_material = this.cubeMesh.material as THREE.MeshBasicMaterial
        cube_material.color.set('red')
        showingCell.push(this)
    }
}

interface board {
    readonly cells: Array<Array<Cell>>;
    //layer == index
    layer : 1 | 2 | 3 | 4 | 5;
}

class Board implements board{
    constructor(
        public cells:Array<Array<Cell>>,
        public layer: 1 | 2 | 3 | 4 | 5
    ){}
}

////////////////////////////////////////////////////////

abstract class Unit{ // == piece ( 체스 기물 )
    public death:boolean;
    public showingCell:Array<Cell> = []
    public model:THREE.Group;
    public turn:"white" | "black" = "white";
    public cell:Cell;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        public board:Array<Board>,
        public piece:piece,
        public wasHandled:boolean,
        public ID:string
    ){
        this.death = false;
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnit = true;
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnitTeam = team
        board[layer - 1].cells[row - 1][this.convertCol() - 1].piece = this

        this.cell = board[layer -1].cells[row -1][this.convertCol() -1]
        this.cell.piece = this
        this.model = new THREE.Group()
    }
    
    public abstract showCanCell():void;
    public abstract addToScene(scene: THREE.Scene):void;

    public unitUp(){
        const animeId = setInterval(() => {
            this.model.position.setY(this.model.position.y + 0.2)
        },10)
        setTimeout(() => {
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01 + 3)
            clearInterval(animeId)
        },150)
    }

    public unitDown(){
        const animeId = setInterval(() => {
            this.model.position.setY(this.model.position.y - 0.2)
        },10)
        setTimeout(() => {
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01)
            clearInterval(animeId)
        },150)
    }


    public hideCanCell(){
        this.showingCell.forEach(cell => {
            const tempMaterial = cell.mesh.material as THREE.MeshBasicMaterial;
            cell.canGo = false;
            cell.canAttack = false;
            cell.normalOpacity = colorConfig.opacity.normal;
            tempMaterial.opacity = visibleGlobal ? colorConfig.opacity.normal : 0.2;
            tempMaterial.color.set(`${cell.color}`)
            const cube_material = cell.cubeMesh.material as THREE.MeshBasicMaterial
            cube_material.color.set(`${cell.color}`)
        })
        this.showingCell = [];
    }

    public update(scene:THREE.Scene){
        if(this.death){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
            scene.remove(this.model)
        }
    }

    move(cell:Cell, scene:THREE.Scene){
        //현재 칸에 기물 정보 삭제 ( onUnit, onUnitTeam, piece)
        const nowCell = this.board[this.layer - 1].cells[this.row - 1][this.convertCol() - 1];
        nowCell.onUnit = false;
        nowCell.onUnitTeam = "none"
        nowCell.piece = null

        const targetPiece = cell.piece;
        if(cell.canAttack && cell.piece){
            console.log(cell.piece.ID)
            cell.piece.death = true;
        }
        //이동한 칸에 기물 정보 추가
        cell.onUnit = true;
        cell.onUnitTeam = this.team;
        cell.piece = this;

        //이동 가능 칸 숨기기
        this.hideCanCell()
        //기물 옮기기 애니메이션

        const distanceX = ( this.convertCol() - cell.getCol() )*1.001*mapConfig.cellSize.x;
        let distanceY = ( this.layer - cell.layer)*1.001*mapConfig.cellSize.Gap;
        const distanceZ = ( this.row - cell.row)*1.001*mapConfig.cellSize.y

            distanceY += 3;
        //내 위치 변경
        this.layer = cell.layer;
        this.row = cell.row;
        this.column = cell.column;

        const animeId = setInterval(() => {// X : 왼쪽 오른쪽, Y: 위쪽 아래쪽, Z: 앞쪽 뒤쪽
            this.model.position.setX(this.model.position.x - distanceX/30)
            this.model.position.setY(this.model.position.y - distanceY/30)
            this.model.position.setZ(this.model.position.z + distanceZ/30)
        }, 10)

        setTimeout(() => {
            clearInterval(animeId)
            this.model.position.setX((this.convertCol()*1.001) * mapConfig.cellSize.x -15 + 2);
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01)
            this.model.position.setZ((this.row*1.001) * -mapConfig.cellSize.y + 15 - 6)
            if(targetPiece){
                targetPiece.update(scene)
            }
        }, 300)
        this.wasHandled = true;
    }

    public convertCol(){
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
        }
    }

}

class Queen extends Unit {
    public wasHandled = false;
    private config = {};
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "QUEEN", false,`${team}_QUEEN_${uuidv4()}` )
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/QUEEN_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4);
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        // X + Y
            for(let i = 1; i <= 5; i++){// 좌 상향
                if(this.row + i <= 5 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer -1].cells[this.row + i - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
            for(let i = 1; i <= 5; i++){// 좌 하향
                if(this.row - i >= 1 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer -1].cells[this.row - i - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
            for(let i = 1; i <= 5; i++){// 우 상향
                if(this.row + i <= 5 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer -1].cells[this.row + i - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
            for(let i = 1; i <= 5; i++){// 우 하향
                if(this.row - i >= 1 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer -1].cells[this.row - i - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
        
         // X + Z
            for(let i = 1; i <= 5; i++){ // 우 상향
                if(this.layer + i <= 5 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
            
            for(let i = 1; i <= 5; i++){  // 우 하향
                if(this.layer - i >= 1 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ //좌 하향
                if(this.layer - i >= 1 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 좌 상향
                if(this.layer + i <= 5 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
        
        // Y + Z
            for(let i = 1; i <= 5; i++){ // 우 상향
                if(this.layer + i <= 5 && this.row + i <= 5){
                    const cell = this.board[this.layer + i - 1].cells[this.row + i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 우 하향
                if(this.layer - i >= 1 && this.row + i <= 5){
                    const cell = this.board[this.layer - i - 1].cells[this.row + i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 좌 하향
                if(this.layer - i >= 1 && this.row - i >= 1){
                    const cell = this.board[this.layer - i - 1].cells[this.row - i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ //좌 상향
                if(this.layer + i <= 5 && this.row - i >= 1){
                    const cell = this.board[this.layer + i - 1].cells[this.row - i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
        

        const cells = this.board[this.layer - 1].cells
        for(let i = 1; i <= 5; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 5){
                const cell = cells[this.row + i - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

        for(let i = 1; i <= 5; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 5){
                const cell = cells[this.row - i - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

        for(let i = 1; i <= 5; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 5){
                const cell = cells[this.row - 1][this.convertCol() - i - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }
                
            }
        }

        for(let i = 1; i <= 5; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 5){
                const cell = cells[this.row - 1][this.convertCol() + i - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }
            }
        }
        
        for(let i = 1; i <= 5; i++){    //Up
            if(1 <= this.layer + i && this.layer + i <= 5){
                const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

                
        for(let i = 1; i <= 5; i++){    //Down
            if(1 <= this.layer - i && this.layer - i <= 5){
                const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }

            }
        }


        for(let i = 1; i <= 5; i++){//  + + +
            if(this.layer + i <= 5 && this.row + i <= 5 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer + i -1].cells[this.row + i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// + + -
            if(this.layer + i <= 5 && this.row + i <= 5 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer + i -1].cells[this.row + i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// + - +
            if(this.layer + i <= 5 && this.row - i >= 1 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer + i -1].cells[this.row - i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// - + +
            if(this.layer - i >= 1 && this.row + i <= 5 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer - i -1].cells[this.row + i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - - +
            if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer - i -1].cells[this.row - i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - + -
            if(this.layer - i >= 1 && this.row + i <= 5 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer - i -1].cells[this.row + i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// + - -
            if(this.layer + i <= 5 && this.row - i >= 1 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer + i -1].cells[this.row - i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - - -
            if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer - i -1].cells[this.row - i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }


    }
}

class Bishops extends Unit {
    public wasHandled = false;
    private config = {}
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e" ,
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){        
        super(team,row,column,layer, board, "BISHOPS", false, `${team}_BISHOPS_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/BISHOPS_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4);
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        // X + Y
            for(let i = 1; i <= 5; i++){// 좌 상향
                if(this.row + i <= 5 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer -1].cells[this.row + i - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
            for(let i = 1; i <= 5; i++){// 좌 하향
                if(this.row - i >= 1 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer -1].cells[this.row - i - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
            for(let i = 1; i <= 5; i++){// 우 상향
                if(this.row + i <= 5 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer -1].cells[this.row + i - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
            for(let i = 1; i <= 5; i++){// 우 하향
                if(this.row - i >= 1 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer -1].cells[this.row - i - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)    
                }
            }
        
         // X + Z
            for(let i = 1; i <= 5; i++){ // 우 상향
                if(this.layer + i <= 5 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
            
            for(let i = 1; i <= 5; i++){  // 우 하향
                if(this.layer - i >= 1 && this.convertCol() + i <= 5){
                    const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() + i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ //좌 하향
                if(this.layer - i >= 1 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 좌 상향
                if(this.layer + i <= 5 && this.convertCol() - i >= 1){
                    const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() - i -1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
        
        // Y + Z
            for(let i = 1; i <= 5; i++){ // 우 상향
                if(this.layer + i <= 5 && this.row + i <= 5){
                    const cell = this.board[this.layer + i - 1].cells[this.row + i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 우 하향
                if(this.layer - i >= 1 && this.row + i <= 5){
                    const cell = this.board[this.layer - i - 1].cells[this.row + i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ // 좌 하향
                if(this.layer - i >= 1 && this.row - i >= 1){
                    const cell = this.board[this.layer - i - 1].cells[this.row - i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }

            for(let i = 1; i <= 5; i++){ //좌 상향
                if(this.layer + i <= 5 && this.row - i >= 1){
                    const cell = this.board[this.layer + i - 1].cells[this.row - i -1][this.convertCol() - 1];
                    if(cell.onUnit){
                        if(cell.onUnitTeam != this.team){
                            cell.makeAttackCell(this.showingCell)
                        }
                        break;
                    }
                    cell.makeGoCell(this.showingCell)
                }
            }
        
    }
}

class Rooks extends Unit {
    public wasHandled = false;
    private config = {}
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "ROOKS", false, `${team}_ROOKS_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/ROOKS_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4);
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
    
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        const cells = this.board[this.layer - 1].cells
        for(let i = 1; i <= 5; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 5){
                const cell = cells[this.row + i - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

        for(let i = 1; i <= 5; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 5){
                const cell = cells[this.row - i - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

        for(let i = 1; i <= 5; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 5){
                const cell = cells[this.row - 1][this.convertCol() - i - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }
                
            }
        }

        for(let i = 1; i <= 5; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 5){
                const cell = cells[this.row - 1][this.convertCol() + i - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }
            }
        }

        
        for(let i = 1; i <= 5; i++){    //Up
            if(1 <= this.layer + i && this.layer + i <= 5){
                const cell = this.board[this.layer + i - 1].cells[this.row - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }

            }
        }

                
        for(let i = 1; i <= 5; i++){    //Down
            if(1 <= this.layer - i && this.layer - i <= 5){
                const cell = this.board[this.layer - i - 1].cells[this.row - 1][this.convertCol() - 1];
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                        break;
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    cell.makeGoCell(this.showingCell)
                }

            }
        }
    }
}

class King extends Unit{
    
    public wasHandled = false;
    private config = {
        moving : {
            points : [
                // 같은 계층
                [1,0,0],
                [-1,0,0],
                [0,0,1],
                [0,0,-1],
                [1,0,1],
                [1,0,-1],
                [-1,0,1],
                [-1,0,-1],

                // 한 계층 위
                [0,1,0],
                [1,1,0],
                [-1,1,0],
                [0,1,1],
                [0,1,-1],
                [1,1,1],
                [1,1,-1],
                [-1,1,1],
                [-1,1,-1],

                //한 계층 아래
                [0,-1,0],
                [1,-1,0],
                [-1,-1,0],                
                [0,-1,1],
                [0,-1,-1],
                [1,-1,1],
                [1,-1,-1],
                [-1,-1,1],
                [-1,-1,-1],
            ]
        }
    }
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "KING", false, `${team}_KING_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/KING_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4)
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        this.config.moving.points.forEach(goTo => {
            const goFoward = this.row + goTo[2] -1;
            const goLR = this.convertCol() + goTo[0] -1;
            const goLayer = this.layer + goTo[1] -1;

            if(( 0 <= goFoward && goFoward <= 4) && ( 0 <= goLR && goLR <= 4 ) && ( 0 <= goLayer && goLayer <=4)){
                const cells = this.board[goLayer].cells
                const cell = cells[goFoward][goLR];
                
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                }
                if(cell.canGo && !cell.canAttack){
                    cell.makeGoCell(this.showingCell)
                }
            }
        })
    }
}

class Knights extends Unit{

    public wasHandled = false;
    private config = {
        moving : {
            points : [
                [1,0,-2],
                [-1,0,-2],
                [2,0,-1],
                [2,0,1],
                
                [-2,0,-1],
                [-2,0,1],
                [1,0,2],
                [-1,0,2],

                [1,-2,0],
                [-1,-2,0],
                [0,-2,1],
                [0,-2,-1],

                [1,2,0],
                [-1,2,0],
                [0,2,1],
                [0,2,-1],

                [-2,1,0],
                [2,1,0],
                [0,1,-2],
                [0,1,2],

                [-2,-1,0],
                [2,-1,0],
                [0,-1,2],
                [0,-1,-2]
            ]
        }
    }
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "KNIGHTS", false, `${team}_KNIGHTS_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/KNIGHTS_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4);
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        this.config.moving.points.forEach(goTo => {
            const goFoward = this.row + goTo[2] -1;
            const goLR = this.convertCol() + goTo[0] -1;
            const goLayer = this.layer + goTo[1] -1;

            if(( 0 <= goFoward && goFoward <= 4) && ( 0 <= goLR && goLR <= 4 ) && ( 0 <= goLayer && goLayer <= 4)){
                const cells = this.board[goLayer].cells
                const cell = cells[goFoward][goLR];
                
                const material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                }
                if(cell.canGo && !cell.canAttack){
                    cell.makeGoCell(this.showingCell)
                }
            }
        })
    }
}

class Pawns extends Unit{
    public wasHandled = false;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e",
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "PAWNS", false, `${team}_PAWNS_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/PAWNS_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4,0.4,0.4);
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }
    public showCanCell(){
        this.hideCanCell()

            const cells = this.board[this.layer - 1].cells;
            let frontCell = null;
            let frontRow = null;
            if(this.team == "white" && this.row != 5){
                frontCell = cells[this.row][this.convertCol() - 1];
                frontRow = cells[this.row]
            }else if(this.team == "black" && this.row != 1){
                frontCell = cells[this.row - 2][this.convertCol() - 1];
                frontRow = cells[this.row - 2]
            }
            if(frontCell != null && !frontCell.onUnit){
                frontCell.makeGoCell(this.showingCell)
            }

            if(frontRow != null){
                const leftCell = frontRow[this.convertCol() - 2];
                const rightCell = frontRow[this.convertCol()];

                if(leftCell != null && leftCell.onUnit){
                    if(leftCell.onUnitTeam != this.team){
                        leftCell.makeAttackCell(this.showingCell)
                    }
                }
                if(rightCell != null && rightCell.onUnit){
                    if(rightCell.onUnitTeam != this.team){
                        rightCell.makeAttackCell(this.showingCell)
                    }
                }
            }

            let upCell = null;
            let upFrontCell= null;
            let upRow = null;

            if(this.team == "white" && this.layer != 5){
                upCell = this.board[this.layer].cells[this.row -1][this.convertCol() - 1]
                upRow = this.board[this.layer].cells[this.row - 1]
                if(this.row != 5){
                    upFrontCell = this.board[this.layer].cells[this.row][this.convertCol() - 1]
                }
            
            }else if(this.team == "black" && this.layer != 1){
                upCell = this.board[this.layer-2].cells[this.row -1][this.convertCol() - 1];
                upRow = this.board[this.layer-2].cells[this.row -1]
                if(this.row != 1){
                    upFrontCell = this.board[this.layer-2].cells[this.row-2][this.convertCol() - 1]
                }
            }
            if(upCell != null && !upCell.onUnit){
                upCell.makeGoCell(this.showingCell)
            }

            if(upRow != null){
                if(this.convertCol() != 1){
                    const upLeftCell = upRow[this.convertCol() - 2]
                    if(upLeftCell.onUnit && upLeftCell.onUnitTeam != this.team){
                        upLeftCell.makeAttackCell(this.showingCell)
                    }
                } 
                if(this.convertCol() != 5){
                    const upRightCell = upRow[this.convertCol()]
                    if(upRightCell.onUnit && upRightCell.onUnitTeam != this.team){
                        upRightCell.makeAttackCell(this.showingCell)
                    }
                }

                if(upFrontCell != null && upFrontCell.onUnit && upFrontCell.onUnitTeam != this.team){
                    upFrontCell.makeAttackCell(this.showingCell)
                }
            }
    }
    move(cell:Cell, scene:THREE.Scene){
        //현재 칸에 기물 정보 삭제 ( onUnit, onUnitTeam, piece)
        const nowCell = this.board[this.layer - 1].cells[this.row - 1][this.convertCol() - 1];
        nowCell.onUnit = false;
        nowCell.onUnitTeam = "none"
        nowCell.piece = null
        
        const targetPiece = cell.piece;
        if(cell.canAttack && cell.piece){
            cell.piece.death = true;
        }

        //이동한 칸에 기물 정보 추가
        cell.onUnit = true;
        cell.onUnitTeam = this.team;
        cell.piece = this;

        //이동 가능 칸 숨기기
        this.hideCanCell()
        //기물 옮기기 애니메이션
        const distanceX = ( this.convertCol() - cell.getCol() )*1.001*mapConfig.cellSize.x;
        let distanceY = ( this.layer - cell.layer)*1.001*mapConfig.cellSize.Gap;
        const distanceZ = ( this.row - cell.row)*1.001*mapConfig.cellSize.y

            distanceY += 3;
        //내 위치 변경
        this.layer = cell.layer;
        this.row = cell.row;
        this.column = cell.column;

        const animeId = setInterval(() => {// X : 왼쪽 오른쪽, Y: 위쪽 아래쪽, Z: 앞쪽 뒤쪽
            this.model.position.setX(this.model.position.x - distanceX/30)
            this.model.position.setY(this.model.position.y - distanceY/30)
            this.model.position.setZ(this.model.position.z + distanceZ/30)
        }, 10)

        setTimeout(() => {
            clearInterval(animeId)
            this.model.position.setX((this.convertCol()*1.001) * mapConfig.cellSize.x -15 + 2);
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01)
            this.model.position.setZ((this.row*1.001) * -mapConfig.cellSize.y + 15 - 6)
            if(targetPiece){
                targetPiece.update(scene)
            }
            if(this.team == "white" && cell.row == 5 && cell.layer == 5){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
                scene.remove(this.model)
                const newObj = new Queen('white', 5 , this.column, 5, this.board)
                newObj.addToScene(scene)
                myUnits.push(newObj)
            }
        }, 300)
        this.wasHandled = true;
    }

}

class Unicorns extends Unit{
    public wasHandled = false;
    private config = {}
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5,
        public column : "a" | "b" | "c" | "d" | "e" ,
        public layer: 1 | 2 | 3 | 4 | 5,
        board: Array<Board>
    ){        
        super(team,row,column,layer, board, "UNICORNS", false, `${team}_UNICORNS_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/UNICORN_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -15 + 2,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01, this.row * -mapConfig.cellSize.y + 15 - 6)
                this.model.scale.set(0.4, 0.4, 0.4);
                
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData.type = 'units'; // 타입 설정
                        child.userData.unit = this;    // 현재 유닛 객체 저장
                    }
                });
                this.model.userData.type = 'units'
                this.model.userData.unit = this
                scene.add(this.model)
            }
        )
    }

    public showCanCell(): void {
        this.hideCanCell()
        for(let i = 1; i <= 5; i++){//  + + +
            if(this.layer + i <= 5 && this.row + i <= 5 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer + i -1].cells[this.row + i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// + + -
            if(this.layer + i <= 5 && this.row + i <= 5 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer + i -1].cells[this.row + i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// + - +
            if(this.layer + i <= 5 && this.row - i >= 1 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer + i -1].cells[this.row - i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        for(let i = 1; i <= 5; i++){// - + +
            if(this.layer - i >= 1 && this.row + i <= 5 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer - i -1].cells[this.row + i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - - +
            if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() + i <= 5){
                const cell = this.board[this.layer - i -1].cells[this.row - i - 1][this.convertCol() + i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - + -
            if(this.layer - i >= 1 && this.row + i <= 5 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer - i -1].cells[this.row + i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// + - -
            if(this.layer + i <= 5 && this.row - i >= 1 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer + i -1].cells[this.row - i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }

        for(let i = 1; i <= 5; i++){// - - -
            if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() - i >= 1){
                const cell = this.board[this.layer - i -1].cells[this.row - i - 1][this.convertCol() - i -1];
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.makeAttackCell(this.showingCell)
                    }
                    break;
                }
                cell.makeGoCell(this.showingCell)
            }
        }
        
    }
}
////////////////////////////////////////////////////////

interface space {
    readonly boards: Array<Board>
}

class Space implements space {
    public readonly boards;

    constructor(
        public scene:THREE.Scene
    ) {
        let cellID = 1;
        let isWhite = true;
        const Boards = [];

        for (let layer = 1; layer <= 5; layer++) {
            const rows: Array<Array<Cell>> = [];
            const literalLayer = layer as 1 | 2 | 3 | 4 | 5;

            for (let row = 1; row <= 5; row++) {
                const columns: Array<Cell> = [];
                const literalRow = row as 1 | 2 | 3 | 4 | 5;

                for (let column = 1; column <= 5; column++) {
                    columns.push(new Cell(null, literalRow, column, literalLayer, isWhite, cellID++, true));
                    isWhite = !isWhite;
                }
                rows.push(columns);
            }
            Boards.push(new Board(rows, literalLayer));
        }

        this.boards = Boards;
    }

    public addToScene(wallVisible:boolean) {
        this.boards.forEach(board => {
            board.cells.forEach(rows => {
                rows.forEach(cell => {
                    cell.addToScene(this.scene, wallVisible);
                });
            });
        });
    }

    public removeAtScene(scene:THREE.Scene){
        this.boards.forEach(board => {
            board.cells.forEach(rows => {
                rows.forEach(cell => {
                    scene.remove(cell.cubeMesh)
                    scene.remove(cell.mesh)
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

let myUnits:any = []
let selUnit:Unit | null = null;
const visibleGlobal = true;
function ThreeBoard() {
        
    const { scene, camera } = useThree();
    const turn = useRef('white')

    const changeNumToCol = (columnNum:number) => {
        switch(columnNum){
            case 1:
                return "a";
            case 2:
                return "b";
            case 3:
                return "c"
            case 4:
                return "d"
            default:
                return "e"
        }
    }

    const clickHandler = (event: MouseEvent) => {
        const canvasBounds = (event.target as HTMLCanvasElement).getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            if(event.button == 0) {//좌클릭
                for(let i = 0; i < intersects.length; i++){
                    if(intersects[i].object.userData.type == 'units'){
                        const unit = intersects[i].object.userData.unit;
                        if(selUnit instanceof Unit){
                            if(selUnit != unit){
                                selUnit.hideCanCell()
                                selUnit.unitDown()

                                unit.showCanCell();
                                unit.unitUp();
                                selUnit = unit;
                            }else{
                                unit.unitDown();
                                unit.hideCanCell();
                                selUnit = null
                            }
                        }else{
                            unit.showCanCell();
                            unit.unitUp();
                            selUnit = unit
                        }
                        break;
                    }else if(intersects[i].object.userData?.cell instanceof Cell){
                        const cellData: Cell = intersects[i].object.userData.cell;
                        if(cellData.canGo){
                            if(selUnit instanceof Unit){
                                selUnit.move(cellData, scene)
                                turn.current = turn.current == "white" ? "black" : "white"
                            }
                            selUnit = null;
                        }/////////////////////////////////////////////////////////////////////////////////////////////////////////
                        else if(cellData.onUnit && cellData.piece instanceof Unit){
                            const unit = cellData.piece;
                            if(selUnit instanceof Unit){
                                if(selUnit != unit){
                                    selUnit.hideCanCell()
                                    selUnit.unitDown()
    
                                    unit.showCanCell();
                                    unit.unitUp();
                                    selUnit = unit;
                                }else{
                                    unit.unitDown();
                                    unit.hideCanCell();
                                    selUnit = null
                                }
                            }else{
                                unit.showCanCell();
                                unit.unitUp();
                                selUnit = unit
                            }
                            break;
                        }
                    }
                }
            }
        }
    };

    useEffect(() => {
        const gameSpace = new Space(scene);
        gameSpace.addToScene(false)

        const initGame = () =>{
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns('white', 2, changeNumToCol(i), 1, gameSpace.boards))
                }
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns('white', 2, changeNumToCol(i), 2, gameSpace.boards))
                }
                myUnits.push(new Bishops( 'white', 1, "a", 2, gameSpace.boards))
                myUnits.push(new Unicorns('white', 1, "b", 2, gameSpace.boards))
                myUnits.push(new Queen(   'white', 1, "c", 2, gameSpace.boards))
                myUnits.push(new Bishops( 'white', 1, "d", 2, gameSpace.boards))
                myUnits.push(new Unicorns('white', 1, "e", 2, gameSpace.boards))

                myUnits.push(new Rooks(   'white', 1, "a", 1, gameSpace.boards))
                myUnits.push(new Knights( 'white', 1, "b", 1, gameSpace.boards))
                myUnits.push(new King(    'white', 1, "c", 1, gameSpace.boards))
                myUnits.push(new Knights( 'white', 1, "d", 1, gameSpace.boards))
                myUnits.push(new Rooks(   'white', 1, "e", 1, gameSpace.boards))
    
                myUnits.forEach((unit: Unit) => {
                    unit.addToScene(scene)
                })
                camera.position.set(0,10,50)
        }

        initGame()


        document.addEventListener("mousedown", clickHandler);

        return () => {
            document.removeEventListener("click", clickHandler);
        };
    }, [camera, scene]);

    return null;
}

interface Props {
    setClose: React.Dispatch<boolean>
}

export default function Chess({setClose}: Props){
    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}>

                <directionalLight position={[0,400,0]}    ></directionalLight>
                <directionalLight position={[0,-400,0]}   ></directionalLight>
                <directionalLight position={[-400,-14,0]} ></directionalLight>
                <directionalLight position={[400,-14,0]}  ></directionalLight>
                <directionalLight position={[0,-14,-400]} ></directionalLight>
                <directionalLight position={[0,-14,400]}  ></directionalLight>
    
                <OrbitControls maxDistance={100} />
                <ThreeBoard />
            
            </Canvas>
            <div className={styles.UI} style={{color:'white'}}>
                <div onClick={() => setClose(false)} className={styles.close}>&times;</div>
            </div>
        </div>
    )
}