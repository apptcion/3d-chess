'use client'
import styles from '../../public/css/chess.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { v4 as uuidv4} from 'uuid'
import { DefaultEventsMap } from 'socket.io';
import { Socket } from 'socket.io-client';
import Chat from '../common/chat';
import { BackGround, Planet } from '../common/space_3d';
import TeamNotice from '../common/team_notice';
import SettingPage from '../common/setting';

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

type piece = "KING" | "QUEEN" | "ROOKS" | "BISHOPS" | "KNIGHTS" | "PAWNS" | "NONE";

interface cell {
    readonly color: "white" | "black";
    piece: Unit | null;
    row: number;
    column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    layer: number;
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
    public column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
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
        public row: number,
        columnNum:number,
        public layer: number,
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
                this.column = "e"
                break;
            case 6:
                this.column = "f"
                break;
            case 7:
                this.column = "g"
                break;
            default:
                this.column = "h";
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
            (this.getCol()*1.001) * mapConfig.cellSize.x - 22.5,
            (this.layer*1.001) * mapConfig.cellSize.Gap - 35,
            (this.row*1.001) * -mapConfig.cellSize.y + 22.5  
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
            (this.getCol()*1.001) * mapConfig.cellSize.x - 22.5,
            this.layer * mapConfig.cellSize.Gap - 31.5,
            (this.row*1.001) * -mapConfig.cellSize.y + 22.5  
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
            case "f":
                return 6;
            case "g":
                return 7;
            default:
                return 8
        }
    }

    addToScene(scene: THREE.Scene, wallVisible:boolean) {
        
        if(wallVisible){
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
    layer : number;
}

class Board implements board{
    constructor(
        public cells:Array<Array<Cell>>,
        public layer:number
    ){}
}

////////////////////////////////////////////////////////

abstract class Unit{ // == piece ( 체스 기물 )
    public death:boolean = false;
    protected showingCell:Array<Cell> = []
    public model:THREE.Group;
    public turn:"white" | "black" = "white"
    constructor(
        public team: "white" | "black",
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
        public board:Array<Board>,
        public piece:piece,
        public wasHandled:boolean,
        public ID:string
    ){
        
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnit = true;
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnitTeam = team
        board[layer - 1].cells[row - 1][this.convertCol() - 1].piece = this
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
            cell.normalOpacity =  colorConfig.opacity.normal;
            tempMaterial.opacity = visibleGlobal ? colorConfig.opacity.normal : 0.1;
            tempMaterial.color.set(`${cell.color}`)

            const cube_tempMaterial = cell.cubeMesh.material as THREE.MeshBasicMaterial;
            cube_tempMaterial.color.set(`${cell.color}`)
        })
        this.showingCell = [];
    }

    public update(scene:THREE.Scene, myTeam:string){
        if(this.death){
            if(this.team == myTeam){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
            }else{
                enemyUnits = enemyUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
            }
            if(this.piece == "KING" && this.team == myTeam){
                console.log("Kill King")
                alert("you are lose")
                //location.href="/"
                //setGameOver
            }else if(this.piece == "KING" && this.team != myTeam){
                alert("you are win")
                //location.href="/"
            }
            scene.remove(this.model)
        }
    }

    move(cell:Cell, scene:THREE.Scene, myTeam:"white"|"black", socket:Socket<DefaultEventsMap, DefaultEventsMap>, myMove:boolean, _target:string){
        
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

        if(this.team == myTeam){
            distanceY += 3;
        }
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
            this.model.position.setX((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2);
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01)
            this.model.position.setZ((this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
            if(targetPiece){
                targetPiece.update(scene, myTeam)
            }
        }, 300)
        this.wasHandled = true;
        if(myMove){
            socket.emit('moveUnit', {
                unitID: this.ID,
                moveData: `${this.row}_${this.convertCol()}_${this.layer}`
            })
        }
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
            case "f":
                return 6;
            case "g":
                return 7;
            default:
                return 8;
        }
    }

}

class Queen extends Unit {
    public wasHandled = false;
    private config = {};
    constructor(
        public team: "white" | "black",
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "QUEEN", false, `${team}_QUEEN_${uuidv4()}`)
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            `/3D/QUEEN_${this.team}.glb`,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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
        
        const cells = this.board[this.layer - 1].cells
        for(let i = 1; i <= 8; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 8){
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

        for(let i = 1; i <= 8; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 8){
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

        for(let i = 1; i <= 8; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 8){
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

        for(let i = 1; i <= 8; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 8){
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

        
        for(let i = 1; i <= 3; i++){    //Up
            if(1 <= this.layer + i && this.layer + i <= 3){
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

                
        for(let i = 1; i <= 3; i++){    //Down
            if(1 <= this.layer - i && this.layer - i <= 3){
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

        // X + Y
            for(let i = 1; i <= 8; i++){// 좌 상향
                if(this.row + i <= 8 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 8; i++){// 좌 하향
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
            for(let i = 1; i <= 8; i++){// 우 상향
                if(this.row + i <= 8 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 8; i++){// 우 하향
                if(this.row - i >= 1 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){ // 우 상향
                if(this.layer + i <= 3 && this.convertCol() + i <= 8){
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
            
            for(let i = 1; i <= 3; i++){  // 우 하향
                if(this.layer - i >= 1 && this.convertCol() + i <= 8){
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

            for(let i = 1; i <= 3; i++){ //좌 하향
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

            for(let i = 1; i <= 3; i++){ // 좌 상향
                if(this.layer + i <= 3 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 3; i++){ // 우 상향
                if(this.layer + i <= 3 && this.row + i <= 8){
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

            for(let i = 1; i <= 3; i++){ // 우 하향
                if(this.layer - i >= 1 && this.row + i <= 8){
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

            for(let i = 1; i <= 3; i++){ // 좌 하향
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

            for(let i = 1; i <= 3; i++){ //좌 상향
                if(this.layer + i <= 3 && this.row - i >= 1){
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
        
        //3차원
            for(let i = 1; i <= 3; i++){//  + + +
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// + + -
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 3; i++){// + - +
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// - + +
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - - +
                if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - + -
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// + - -
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// - - -
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
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" ,
        public layer: number,
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
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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
            for(let i = 1; i <= 8; i++){// 좌 상향
                if(this.row + i <= 8 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 8; i++){// 좌 하향
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
            for(let i = 1; i <= 8; i++){// 우 상향
                if(this.row + i <= 8 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 8; i++){// 우 하향
                if(this.row - i >= 1 && this.convertCol() + i <= 8){
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
        
        //3차원
            for(let i = 1; i <= 3; i++){//  + + +
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// + + -
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 3; i++){// + - +
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// - + +
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - - +
                if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - + -
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// + - -
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// - - -
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

class Rooks extends Unit {
    public wasHandled = false;
    private config = {};
    constructor(
        public team: "white" | "black",
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
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
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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
        for(let i = 1; i <= 8; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 8){
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

        for(let i = 1; i <= 8; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 8){
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

        for(let i = 1; i <= 8; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 8){
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

        for(let i = 1; i <= 8; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 8){
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

        
        for(let i = 1; i <= 3; i++){    //Up
            if(1 <= this.layer + i && this.layer + i <= 3){
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

                
        for(let i = 1; i <= 3; i++){    //Down
            if(1 <= this.layer - i && this.layer - i <= 3){
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

        {//3차원
            for(let i = 1; i <= 3; i++){//  + + +
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// + + -
                if(this.layer + i <= 3 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
            for(let i = 1; i <= 3; i++){// + - +
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
            for(let i = 1; i <= 3; i++){// - + +
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - - +
                if(this.layer - i >= 1 && this.row - i >= 1 && this.convertCol() + i <= 8){
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
    
            for(let i = 1; i <= 3; i++){// - + -
                if(this.layer - i >= 1 && this.row + i <= 8 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// + - -
                if(this.layer + i <= 3 && this.row - i >= 1 && this.convertCol() - i >= 1){
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
    
            for(let i = 1; i <= 3; i++){// - - -
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
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
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
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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

            if(( 0 <= goFoward && goFoward <= 7) && ( 0 <= goLR && goLR <= 7 ) && ( 0 <= goLayer && goLayer <= 2)){
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
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
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
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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

            if(( 0 <= goFoward && goFoward <= 7) && ( 0 <= goLR && goLR <= 7 ) && ( 0 <= goLayer && goLayer <= 2)){
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
        public row: number,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: number,
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
                this.model.position.set((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2,(this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01, (this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
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
        //base
        const thisLayer = this.board[this.layer -1].cells;
        if(this.team == "white" && this.row <= 7){
            let upLayer = null;
            let upLayer2 = null;
            let downLayer =null
            if(this.layer > 1){
                downLayer = this.board[this.layer-2].cells;
            }
            if(this.layer < 3){
                upLayer = this.board[this.layer].cells;
            }
            if(this.layer == 1){
                upLayer2 = this.board[this.layer + 1].cells;
            }

            if(downLayer != null && !downLayer[this.row][this.convertCol() -1].onUnit){
                downLayer[this.row][this.convertCol() -1].makeGoCell(this.showingCell)
            }

            if(downLayer != null && !downLayer[this.row-1][this.convertCol() -1].onUnit){
                downLayer[this.row-1][this.convertCol() -1].makeGoCell(this.showingCell)
            }

            if(!thisLayer[this.row][this.convertCol() -1].onUnit){
                thisLayer[this.row][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && !thisLayer[this.row + 1][this.convertCol() -1].onUnit){
                    thisLayer[this.row + 1][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }
            if(upLayer != null && !upLayer[this.row-1][this.convertCol() -1].onUnit){
                upLayer[this.row-1][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && upLayer2 != null && !upLayer2[this.row-1][this.convertCol() -1].onUnit){
                    upLayer2[this.row -1][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }
            if(upLayer != null && !upLayer[this.row][this.convertCol() -1].onUnit){
                upLayer[this.row][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && upLayer2 != null && !upLayer2[this.row + 1][this.convertCol() -1].onUnit){
                    upLayer2[this.row + 1][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }

            if(this.convertCol() != 1){
                if(thisLayer[this.row][this.convertCol() -2].onUnit && thisLayer[this.row][this.convertCol() -2].onUnitTeam != this.team){
                    thisLayer[this.row][this.convertCol()-2].makeAttackCell(this.showingCell)
                }
                if(upLayer != null && upLayer[this.row][this.convertCol() -2].onUnit && upLayer[this.row][this.convertCol() -2].onUnitTeam != this.team){
                    upLayer[this.row][this.convertCol() -2].makeAttackCell(this.showingCell)
                }
                if(downLayer != null && downLayer[this.row][this.convertCol() -2].onUnit && downLayer[this.row][this.convertCol() -2].onUnitTeam != this.team){
                    downLayer[this.row][this.convertCol() -2].makeAttackCell(this.showingCell)
                }
            }

            if(this.convertCol() != 8){
                if(thisLayer[this.row][this.convertCol()].onUnit && thisLayer[this.row][this.convertCol()].onUnitTeam != this.team){
                    thisLayer[this.row][this.convertCol()].makeAttackCell(this.showingCell)
                }
                if(upLayer != null && upLayer[this.row][this.convertCol()].onUnit && upLayer[this.row][this.convertCol()].onUnitTeam != this.team){
                    upLayer[this.row][this.convertCol()].makeAttackCell(this.showingCell)
                }
                if(downLayer != null && downLayer[this.row][this.convertCol()].onUnit && downLayer[this.row][this.convertCol()].onUnitTeam != this.team){
                    downLayer[this.row][this.convertCol()].makeAttackCell(this.showingCell)
                }
            }
        }else if(this.team == "black" && this.row >= 2){
            let downLayer =null
            let downLayer2 = null;
            let upLayer = null;
            if(this.layer < 3){
                upLayer = this.board[this.layer].cells;
            }

            if(this.layer > 1){
                downLayer = this.board[this.layer-2].cells;
            }
            if(this.layer == 3){
                downLayer2 = this.board[this.layer -3].cells;
            }

            if(upLayer != null && !upLayer[this.row-1][this.convertCol() -1].onUnit){
                upLayer[this.row-1][this.convertCol() -1].makeGoCell(this.showingCell)
            }

            if(upLayer != null && !upLayer[this.row -2][this.convertCol() -1].onUnit){
                upLayer[this.row -2][this.convertCol() -1].makeGoCell(this.showingCell)
            }
            
            if(!thisLayer[this.row-2][this.convertCol() -1].onUnit){
                thisLayer[this.row-2][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && !thisLayer[this.row-3][this.convertCol() -1].onUnit){
                    thisLayer[this.row - 3][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }
            if(downLayer != null && !downLayer[this.row-1][this.convertCol() -1].onUnit){
                downLayer[this.row-1][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && downLayer2 !=null && !downLayer2[this.row -1][this.convertCol() -1].onUnit){
                    downLayer2[this.row -1][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }
            if(downLayer != null && !downLayer[this.row-2][this.convertCol() -1].onUnit){
                downLayer[this.row-2][this.convertCol() -1].makeGoCell(this.showingCell)
                if(!this.wasHandled && downLayer2 != null && !downLayer2[this.row - 3][this.convertCol() -1].onUnit){
                    downLayer2[this.row -3][this.convertCol() -1].makeGoCell(this.showingCell)
                }
            }

            if(this.convertCol() != 1){
                if(thisLayer[this.row-2][this.convertCol() -2].onUnit && thisLayer[this.row-2][this.convertCol() -2].onUnitTeam != this.team){
                    thisLayer[this.row-2][this.convertCol()-2].makeAttackCell(this.showingCell)
                }
                if(upLayer != null && upLayer[this.row-2][this.convertCol() -2].onUnit && upLayer[this.row-2][this.convertCol() -2].onUnitTeam != this.team){
                    upLayer[this.row-2][this.convertCol() -2].makeAttackCell(this.showingCell)
                }
                
                if(downLayer != null && downLayer[this.row-2][this.convertCol() -2].onUnit && downLayer[this.row-2][this.convertCol() -2].onUnitTeam != this.team){
                    downLayer[this.row-2][this.convertCol() -2].makeAttackCell(this.showingCell)
                }
            }

            if(this.convertCol() != 8){
                if(thisLayer[this.row-2][this.convertCol()].onUnit && thisLayer[this.row-2][this.convertCol()].onUnitTeam != this.team){
                    thisLayer[this.row-2][this.convertCol()].makeAttackCell(this.showingCell)
                }
                if(upLayer != null && upLayer[this.row-2][this.convertCol()].onUnit && upLayer[this.row-2][this.convertCol()].onUnitTeam != this.team){
                    upLayer[this.row-2][this.convertCol()].makeAttackCell(this.showingCell)
                }
                if(downLayer != null && downLayer[this.row-2][this.convertCol()].onUnit && downLayer[this.row-2][this.convertCol()].onUnitTeam != this.team){
                    downLayer[this.row-2][this.convertCol()].makeAttackCell(this.showingCell)
                }
            }
        }

    }

    move(cell:Cell, scene:THREE.Scene, myTeam:"white"|"black", socket:Socket, myMove:boolean, target:string){
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

        if(this.team == myTeam){
            distanceY += 3;
        }
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
            this.model.position.setX((this.convertCol()*1.001) * mapConfig.cellSize.x -22.5 + 2);
            this.model.position.setY((this.layer*1.001) * mapConfig.cellSize.Gap - 34.5 + 0.01)
            this.model.position.setZ((this.row*1.001) * -mapConfig.cellSize.y + 22.5 - 6)
            if(targetPiece){
                targetPiece.update(scene, myTeam)
            }
            if(this.team == "white" && cell.row == 8 && cell.layer == 3 && myMove){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
                
                scene.remove(this.model)
                const newObj = new Queen(myTeam, 8 , this.column, 3, this.board)
                newObj.addToScene(scene)
                myUnits.push(newObj)
                if(myMove){    
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                }
            }
            else if(this.team == "black"  && cell.row == 1 && cell.layer == 1 && myMove){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
                scene.remove(this.model)
                const newObj = new Queen(myTeam, 1, this.column, 1, this.board)
                newObj.addToScene(scene);
                myUnits.push(newObj)
                if(myMove){    
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                }
            }
        }, 300)
        this.wasHandled = true;
        if(myMove){
            socket.emit('moveUnit', {
                unitID: this.ID,
                moveData: `${this.row}_${this.convertCol()}_${this.layer}`
            })
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

        for (let layer = 1; layer <= 3; layer++) {
            const rows: Array<Array<Cell>> = [];

            for (let row = 1; row <= 8; row++) {
                const columns: Array<Cell> = [];

                for (let column = 1; column <= 8; column++) {
                    columns.push(new Cell(null, row, column, layer, isWhite, cellID++, true));
                    isWhite = !isWhite;
                }
                isWhite = !isWhite;
                rows.push(columns);
            }
            
            isWhite = !isWhite;
            Boards.push(new Board(rows, layer));
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
let enemyUnits:any = [];
let selUnit:Unit | null = null;
let turn: "white" | "black" = "white"
let visibleGlobal = true;
function ThreeBoard({spaceRef, myTeam, socket, target} :
    {spaceRef: React.MutableRefObject<Space | null>,
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    myTeam: "white" | "black", target:string}) {
    const { scene, camera } = useThree();
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
            case 5:
                return "e"
            case 6:
                return "f"
            case 7:
                return "g"
            default:
                return "h"
        }
    }
    const clickHandler = (event: MouseEvent) => {

        if(!(event.target as HTMLElement).closest('canvas')) return;
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            if(event.button == 0) {//좌클릭
                for(let i = 0; i < intersects.length; i++){
                    if(intersects[i].object.userData.type == 'units' && intersects[i].object.userData.unit.team == turn && intersects[i].object.userData.unit.team == myTeam){
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
                                console.log(`selUnit Team ${myTeam}`)
                                selUnit.move(cellData, scene, myTeam, socket, true, target)
                                turn = turn == "white" ? "black" : "white"
                            }
                            selUnit = null;
                        }/////////////////////////////////////////////////////////////////////////////////////////////////////////
                        else if(cellData.onUnit && cellData.piece instanceof Unit && cellData.piece.team == turn && cellData.piece.team == myTeam){
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
                        // else if(cellData.visible){        
                        //     cellData.setVisible(false)
                        //     break;
                        // }
                    }
                }
            }
        }
    };

    useEffect(() => {
        const gameSpace = new Space(scene);
        spaceRef.current = gameSpace;
        gameSpace.addToScene(false);
        
        socket.on('moveUnit', ({unitID, moveData}:{unitID:string, moveData:string})=>{
            enemyUnits.forEach((unit:Unit) => {
                if(unit.ID == unitID){
                    const arr= moveData.split("_")
                    const layer = parseInt(arr[2]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
                    const row = parseInt(arr[0]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
                    const column = parseInt(arr[1]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

                    const targetCell = gameSpace.boards[layer-1].cells[row -1][column -1]
                    targetCell.canGo = true;
                    targetCell.canAttack = true
                    unit.move(targetCell, scene, myTeam, socket, false, target)
                    turn = turn == "white" ? "black" : "white"
                }
            })
        })

        socket.on('getEnemy', ({unit}:{unit:string[]}) => {

            enemyUnits.forEach((unit:Unit) => {
                scene.remove(unit.model)
            })
            enemyUnits = []
            unit.forEach((unit_data:string) => {
                const arr = unit_data.split("_")
                switch(arr[1]){
                    case 'PAWNS':
                        const obj = new Pawns(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                        obj.ID = `${arr[0]}_PAWNS_${arr[2]}`

                        enemyUnits.push(obj)
                        break;
                    case 'BISHOPS':
                        const obj2 = new Bishops(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                            obj2.ID = `${arr[0]}_BISHOPS_${arr[2]}`
                        enemyUnits.push(obj2)
                        break;
                    case 'QUEEN':
                        const obj3 = new Queen(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                            obj3.ID = `${arr[0]}_QUEEN_${arr[2]}`
                        enemyUnits.push(obj3)
                        break;
                    case 'ROOKS':
                        const obj4 = new Rooks(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                            obj4.ID = `${arr[0]}_ROOKS_${arr[2]}`
                        enemyUnits.push(obj4)
                        break;
                    case 'KNIGHTS':
                        const obj5 = new Knights(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                            obj5.ID = `${arr[0]}_KNIGHTS_${arr[2]}`
                        enemyUnits.push(obj5)
                        break;
                    case 'KING':
                        const obj6 = new King(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            arr[4] as "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                            gameSpace.boards)
                            obj6.ID = `${arr[0]}_KING_${arr[2]}`
                        enemyUnits.push(obj6)
                        break;
                }
            })
            enemyUnits.forEach((unit: any) => {
                unit.addToScene(scene)
            })
        })

        const initGame = () =>{
            if(myTeam == "white"){         
                for(let i = 1; i <= 8; i++){
                    myUnits.push(new Pawns(myTeam, 2, changeNumToCol(i), 1, gameSpace.boards))
                }
                myUnits.push(new Rooks(   myTeam, 1, "a", 1, gameSpace.boards))
                myUnits.push(new Knights( myTeam, 1, "b", 1, gameSpace.boards))
                myUnits.push(new Bishops( myTeam, 1, "c", 1, gameSpace.boards))
                myUnits.push(new Queen(   myTeam, 1, "d", 1, gameSpace.boards))
                myUnits.push(new King(    myTeam, 1, "e", 1, gameSpace.boards))
                myUnits.push(new Bishops( myTeam, 1, "f", 1, gameSpace.boards))
                myUnits.push(new Knights( myTeam, 1, "g", 1, gameSpace.boards))
                myUnits.push(new Rooks(   myTeam, 1, "h", 1, gameSpace.boards))

                myUnits.forEach((unit: Unit) => {
                    unit.addToScene(scene)
                })

                const intervalID = setInterval(() => {
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                    if(enemyUnits.length == 16){
                        clearInterval(intervalID)
                    }
                },500)
                camera.position.set(0,0,60)
            }else{
                for(let i = 1; i <= 8; i++){
                    myUnits.push(new Pawns("black", 7, changeNumToCol(i), 3, gameSpace.boards))
                }

                myUnits.push(new Rooks(   "black", 8, "a", 3, gameSpace.boards))
                myUnits.push(new Knights( "black", 8, "b", 3, gameSpace.boards))
                myUnits.push(new Bishops( "black", 8, "c", 3, gameSpace.boards))
                myUnits.push(new Queen(   "black", 8, "d", 3, gameSpace.boards))
                myUnits.push(new King(    "black", 8, "e", 3, gameSpace.boards))
                myUnits.push(new Bishops( "black", 8, "f", 3, gameSpace.boards))
                myUnits.push(new Knights( "black", 8, "g", 3, gameSpace.boards))
                myUnits.push(new Rooks(   "black", 8, "h", 3, gameSpace.boards))

                myUnits.forEach((unit: Unit) => {
                    unit.addToScene(scene)
                })
                const intervalID = setInterval(() => {
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                    if(enemyUnits.length == 16){
                        clearInterval(intervalID)
                    }
                },500)
                camera.position.set(0,0,-60)
            }
        }
        initGame()

        document.addEventListener("mousedown", clickHandler);

        return () => {
            document.removeEventListener("mousedown", clickHandler);
        };
    }, [camera, scene, spaceRef]);

    return null;
}

interface Props {
    team: "white" | "black",
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    target:string,
    username:string
}
  
export default function Chesspage({ params }: { params: Props }) {
    const { team, socket, target, username } = params;

    const spaceRef = useRef<Space | null>(null);
    const [visible, setVisible] = useState(true);
    const [wallVisible, setWallVisible] = useState(false)

    useEffect(() => {

        if(spaceRef.current){
            spaceRef.current.setAllVisible(visible)
            spaceRef.current.addToScene(wallVisible)
        }
        visibleGlobal = visible;

    },[visible, wallVisible, spaceRef])

    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}
                onCreated={(state) => {
                    state.gl.setClearColor('black');
            }} >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                
                <directionalLight position={[0,100,0]}></directionalLight>
                <directionalLight position={[0,-100,0]}></directionalLight>
                <directionalLight position={[-100,-14,0]}></directionalLight>
                <directionalLight position={[100,-14,0]}></directionalLight>
                <directionalLight position={[0,-14,-100]}></directionalLight>
                <directionalLight position={[0,-14,100]}></directionalLight>

    
                {/** Code */}
                <OrbitControls 
                    mouseButtons={{
                        LEFT: THREE.MOUSE.LEFT,
                        MIDDLE: THREE.MOUSE.MIDDLE,
                        RIGHT: THREE.MOUSE.RIGHT
                    }}
                    maxDistance={100}
                />
                <BackGround />
                <Planet url="/img/planet1.png" position={[40, 25, -35]} size={12}/>
                <Planet url="/img/planet2.png" position={[-35, 0, -70]} size={11}/>
                <Planet url="/img/planet4.png" position={[100, -110, -110]} size={14}/>
                
                <Planet url="/img/planet3.png" position={[-50, -60, 40]} size={9}/>
                <Planet url="/img/planet5.jpg" position={[50, 50, 100]} size={20}/>
                <Planet url="/img/planet6.jpg" position={[-50, 0, 100]} size={10}/>
                <ThreeBoard spaceRef={spaceRef} myTeam={team} socket={socket} target={target}/>
            
            </Canvas>
            <div className={styles.UI} style={{color:'white'}}>
                {/* <div className={styles.visible}>
                    setVisible
                    <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                </div>
                <div className={styles.wall}>
                    show Wall
                    <input type="checkbox" checked={wallVisible} onChange={(e) => setWallVisible(e.target.checked)} />
                </div> */}
                <SettingPage showCell={visible} showWall={wallVisible} setVisible={setVisible} setShowWall={setWallVisible }/>
                <TeamNotice mode={'Millennium'} team={team}/>
                <Chat params={{socket, username}}></Chat>
            </div>
        </div>
    )
}