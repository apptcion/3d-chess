'use client'
import styles from '../../public/css/chess.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import { v4 as uuidv4} from 'uuid'
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io';
import Chat from './chat';

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
            clearInterval(animeId)
        },150)
    }

    public unitDown(){
        this.model.position.set(this.convertCol() * mapConfig.cellSize.x -13,this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01 + 3, this.row * -mapConfig.cellSize.y + 9)
        let tempCount = 3;
        const animeId = setInterval(() => {
            this.model.position.setY(this.layer * mapConfig.cellSize.Gap - 34.5 + 0.01 + tempCount)
            tempCount -= 0.2
        },10)
        setTimeout(() => {
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

    public update(scene:THREE.Scene, myTeam:string){
        scene.remove(this.model)
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
                //setGameOver
            }else if(this.piece == "KING" && this.team != myTeam){
                alert("you are win")
            }
        }else{        
            scene.add(this.model)
        }
    }

    move(cell:Cell, scene:THREE.Scene, myTeam:"white"|"black", socket:Socket<DefaultEventsMap, DefaultEventsMap>, myMove:boolean, target:string){
        const nowCell = this.board[this.layer - 1].cells[this.row - 1][this.convertCol() - 1];
        nowCell.onUnit = false;
        nowCell.onUnitTeam = "none"
        nowCell.piece = null
        console.log(target)

        if(cell.canAttack && cell.piece){
            cell.piece.death = true;
            console.log("Kill")
            cell.piece.update(scene, myTeam)
        }
        //이동한 칸에 기물 정보 추가
        cell.onUnit = true;
        cell.onUnitTeam = this.team;
        cell.piece = this;

        //이동 가능 칸 숨기기
        this.hideCanCell()
        //기물 옮기기 애니메이션
        const onceX = ( this.convertCol() - cell.getCol() ) / 30;
        const onceY = ( this.layer - cell.layer ) / 30;
        const onceZ = ( this.row - cell.row ) / 30;

        //내 위치 변경
        this.layer = cell.layer;
        this.row = cell.row;
        this.column = cell.column;
        
        const animeId = setInterval(() => {
            this.model.position.setX(this.model.position.x - onceX * mapConfig.cellSize.x)
            this.model.position.setY(this.model.position.y - onceY * mapConfig.cellSize.Gap - 0.0745)
            this.model.position.setZ(this.model.position.z + onceZ * mapConfig.cellSize.y)
        }, 10)

        setTimeout(() => {
            this.model.position.setX(this.convertCol() * mapConfig.cellSize.x - 13)
            this.model.position.setY(this.layer *  mapConfig.cellSize.Gap - 34.5 + 0.01)
            this.model.position.setZ(this.row * -mapConfig.cellSize.y + 9)
            clearInterval(animeId)
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
    move(cell:Cell, scene:THREE.Scene, myTeam:"white"|"black", socket:Socket, myMove:boolean, target:string){
        //현재 칸에 기물 정보 삭제 ( onUnit, onUnitTeam, piece)
        const nowCell = this.board[this.layer - 1].cells[this.row - 1][this.convertCol() - 1];
        nowCell.onUnit = false;
        nowCell.onUnitTeam = "none"
        nowCell.piece = null
        if(cell.canAttack && cell.piece){
            cell.piece.death = true;
            console.log("Kill")
            cell.piece.update(scene, myTeam)
        }

        //이동한 칸에 기물 정보 추가
        cell.onUnit = true;
        cell.onUnitTeam = this.team;
        cell.piece = this;

        //이동 가능 칸 숨기기
        this.hideCanCell()
        //기물 옮기기 애니메이션
        const onceX = ( this.convertCol() - cell.getCol() ) / 30;
        const onceY = ( this.layer - cell.layer ) / 30;
        const onceZ = ( this.row - cell.row ) / 30;

        //내 위치 변경
        this.layer = cell.layer;
        this.row = cell.row;
        this.column = cell.column;
        
        const animeId = setInterval(() => {
            this.model.position.setX(this.model.position.x - onceX * mapConfig.cellSize.x)
            this.model.position.setY(this.model.position.y - onceY * mapConfig.cellSize.Gap - 0.0745)
            this.model.position.setZ(this.model.position.z + onceZ * mapConfig.cellSize.y)
        }, 10)

        setTimeout(() => {
            this.model.position.setX(this.convertCol() * mapConfig.cellSize.x - 13)
            this.model.position.setY(this.layer * mapConfig.cellSize.Gap - 35 + 0.01)
            this.model.position.setZ(this.row * -mapConfig.cellSize.y + 9)
            clearInterval(animeId)
            if(this.team == "white" && cell.row == 5 && cell.layer == 5 && myMove){
                myUnits = myUnits.filter((unit:Unit) => {
                    return unit.ID != this.ID
                })
                scene.remove(this.model)
                const newObj = new Queen(myTeam, 5 , this.column, 5, this.board)
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
let enemyUnits:any = [];
// const myTeam: "white" | "black" = 'white'
let selUnit:unknown = null;
let turn: "white" | "black" = "white"
let clickHandler:(event:MouseEvent) => void;
let visibleGlobal = true;
function ThreeBoard({spaceRef, /*turn, setTurn,*/ wallVisible, myTeam, socket, target} : {spaceRef: React.MutableRefObject<Space | null>,/* turn:"white" | "black", setTurn:React.Dispatch<React.SetStateAction<"white" | "black">>,*/ wallVisible:boolean, myTeam: "white" | "black", socket:Socket<DefaultEventsMap, DefaultEventsMap>, target:string}) {
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
            default:
                return "e"
        }
    }
    

    useEffect(() => {
        const gameSpace = new Space(scene);
        spaceRef.current = gameSpace;
        gameSpace.addToScene(wallVisible)

        socket.on('moveUnit', ({unitID, moveData}:{unitID:string, moveData:string})=>{
            enemyUnits.forEach((unit:Unit) => {
                const arr= moveData.split("_")
                const layer = parseInt(arr[2]) as 1 | 2 | 3 | 4 | 5;
                const row = parseInt(arr[0]) as 1 | 2 | 3 | 4 | 5;
                const column = parseInt(arr[1]) as 1 | 2 | 3 | 4 | 5;
                if(unit.ID == unitID){
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
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                        obj.ID = `${arr[0]}_PAWNS_${arr[2]}`

                        enemyUnits.push(obj)
                        break;
                    case 'UNICORNS':
                        const obj1 = new Unicorns(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                            obj1.ID = `${arr[0]}_UNICORNS_${arr[2]}`
                        enemyUnits.push(obj1)
                        break;
                    case 'BISHOPS':
                        const obj2 = new Bishops(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                            obj2.ID = `${arr[0]}_BISHOPS_${arr[2]}`
                        enemyUnits.push(obj2)
                        break;
                    case 'QUEEN':
                        const obj3 = new Queen(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                            obj3.ID = `${arr[0]}_QUEEN_${arr[2]}`
                        enemyUnits.push(obj3)
                        break;
                    case 'ROOKS':
                        const obj4 = new Rooks(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                            obj4.ID = `${arr[0]}_ROOKS_${arr[2]}`
                        enemyUnits.push(obj4)
                        break;
                    case 'KNIGHTS':
                        const obj5 = new Knights(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
                            gameSpace.boards)
                            obj5.ID = `${arr[0]}_KNIGHTS_${arr[2]}`
                        enemyUnits.push(obj5)
                        break;
                    case 'KING':
                        const obj6 = new King(
                            arr[0] as "white" | "black",
                            parseInt(arr[3]) as 1 | 2 | 3 | 4 | 5,
                            arr[4] as "a" | "b" | "c" | "d" | "e" ,
                            parseInt(arr[5]) as 1 | 2 | 3 | 4 | 5,
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
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns(myTeam, 2, changeNumToCol(i), 1, gameSpace.boards))
                }
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns(myTeam, 2, changeNumToCol(i), 2, gameSpace.boards))
                }
                myUnits.push(new Bishops( myTeam, 1, "a", 2, gameSpace.boards))
                myUnits.push(new Unicorns(myTeam, 1, "b", 2, gameSpace.boards))
                myUnits.push(new Queen(   myTeam, 1, "c", 2, gameSpace.boards))
                myUnits.push(new Bishops( myTeam, 1, "d", 2, gameSpace.boards))
                myUnits.push(new Unicorns(myTeam, 1, "e", 2, gameSpace.boards))
                                          
                myUnits.push(new Rooks(   myTeam, 1, "a", 1, gameSpace.boards))
                myUnits.push(new Knights( myTeam, 1, "b", 1, gameSpace.boards))
                myUnits.push(new King(    myTeam, 1, "c", 1, gameSpace.boards))
                myUnits.push(new Knights( myTeam, 1, "d", 1, gameSpace.boards))
                myUnits.push(new Rooks(   myTeam, 1, "e", 1, gameSpace.boards))
    
                myUnits.forEach((unit: Unit) => {
                    unit.addToScene(scene)
                })

                const intervalID = setInterval(() => {
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                    if(enemyUnits.length == 20){
                        clearInterval(intervalID)
                    }
                },500)

            }else{
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns("black", 4, changeNumToCol(i), 5, gameSpace.boards))
                }
                for(let i = 1; i <= 5; i++){
                    myUnits.push(new Pawns("black", 4, changeNumToCol(i), 4, gameSpace.boards))
                }

                myUnits.push(new Unicorns( "black", 5, "a", 4, gameSpace.boards))
                myUnits.push(new Bishops(  "black", 5, "b", 4, gameSpace.boards))
                myUnits.push(new Queen(    "black", 5, "c", 4, gameSpace.boards))
                myUnits.push(new Unicorns( "black", 5, "d", 4, gameSpace.boards))
                myUnits.push(new Bishops(  "black", 5, "e", 4, gameSpace.boards))
    
                myUnits.push(new Rooks(    "black", 5, "a", 5, gameSpace.boards))
                myUnits.push(new Knights(  "black", 5, "b", 5, gameSpace.boards))
                myUnits.push(new King(     "black", 5, "c", 5, gameSpace.boards))
                myUnits.push(new Knights(  "black", 5, "d", 5, gameSpace.boards))
                myUnits.push(new Rooks(    "black", 5, "e", 5, gameSpace.boards))    

                myUnits.forEach((unit: Unit) => {
                    unit.addToScene(scene)
                })

                const intervalID = setInterval(() => {
                    socket.emit('exchangeUnit', {target, unit : myUnits.map((unit:Unit) => {
                        return `${unit.ID}_${unit.row}_${unit.column}_${unit.layer}`
                    })})
                    if(enemyUnits.length == 20){
                        clearInterval(intervalID)
                    }
                },500)
            }
        }

        initGame()

        clickHandler = (event: MouseEvent) => {
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
                            if(selUnit instanceof Unit){ //unknown type Unit으로 변환, == 기존에 잡은 유닛이 있다면,
                                selUnit.hideCanCell()
                                selUnit.unitDown()
                            }
                            const unit = intersects[i].object.userData.unit;
                            if(selUnit != unit){        //다른 유닛 잡기             
                                unit.showCanCell();
                                unit.unitUp();
                                selUnit = unit;
                            }else{ // 잡기 취소
                                unit.unitDown();
                                unit.hideCanCell();
                                selUnit = null;
                            }
                            break;
                        }else if(intersects[i].object.userData?.cell instanceof Cell){
                            const cellData: Cell = intersects[i].object.userData.cell;
                            if(cellData.canGo){
                                if(selUnit instanceof Unit){
                                    selUnit.move(cellData, scene, myTeam, socket, true, target)
                                    turn = turn == "white" ? "black" : "white"
                                }
                                selUnit = null;
                            }/////////////////////////////////////////////////////////////////////////////////////////////////////////
                            else if(cellData.onUnit && cellData.piece instanceof Unit && cellData.piece.team == turn && cellData.piece.team == myTeam){
                                if(selUnit instanceof Unit){ //unknown type Unit으로 변환, == 기존에 잡은 유닛이 있다면,
                                    selUnit.hideCanCell()
                                    selUnit.unitDown()
                                }
                                const unit = cellData.piece;
                                if(unit != null){
                                    if(selUnit != unit){        //다른 유닛 잡기             
                                        unit.showCanCell();
                                        unit.unitUp();
                                        selUnit = unit;
                                    }else{ // 잡기 취소
                                        unit.unitDown();
                                        selUnit = null;
                                    }
                                }
                                break;
                            }
                            // else if(cellData.visible){
                            //     cellData.setVisible(false)
                            //     break;
                            // }
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
        //const disableContextMenu = (event: MouseEvent) => event.preventDefault();
        document.addEventListener("mousedown", clickHandler);
        //document.addEventListener("contextmenu", disableContextMenu);

        camera.position.set(0,50,0);
        camera.lookAt(0, 0, 0);

        return () => {
            document.removeEventListener("click", clickHandler);
        };
    }, [camera, scene, spaceRef, target]);

    return null;
}

interface Props {
    team: "white" | "black",
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    target:string,
    username:string
}

export default function Chess({team, socket, target, username}: Props){

    const spaceRef = useRef<Space | null>(null);
    const [visible, setVisible] = useState(true);
    const [wallVisible, setWallVisible] = useState(false)
    //const [win, setWin] = useState<"white"|"black"|"none">("none");

    useEffect(() => {

        if(spaceRef.current){
            spaceRef.current.setAllVisible(visible)
            spaceRef.current.addToScene(wallVisible)
        }
        visibleGlobal = visible

    },[visible, wallVisible])

    return (
        <div className={styles.WRAP}>
            <Canvas className={styles.SPACE}>
                
                {/** dev */}
                <axesHelper></axesHelper>

                {/** temp */}
                <directionalLight position={[0,400,0]}    ></directionalLight>
                <directionalLight position={[0,-400,0]}   ></directionalLight>
                <directionalLight position={[-400,-14,0]} ></directionalLight>
                <directionalLight position={[400,-14,0]}  ></directionalLight>
                <directionalLight position={[0,-14,-400]} ></directionalLight>
                <directionalLight position={[0,-14,400]}  ></directionalLight>
                {/* <mesh position={[0,200,0]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[0,400,0]} rotation-x={Math.PI * 0.5}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh>
                
                <mesh position={[0,-200,0]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[0,-400,0]} rotation-x={-Math.PI * 0.5}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh>
                
                <mesh position={[200,-14,0]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[400,0,0]} rotation-y={-Math.PI * 0.5}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh>


                
                <mesh position={[-200,-14,0]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[-400,0,0]} rotation-y={Math.PI * 0.5}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh>

                
                <mesh position={[0,-14,200]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[0,0,400]} rotation-y={Math.PI}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh>

                
                <mesh position={[0,-14,-200]}>
                    <boxGeometry></boxGeometry>
                    <meshBasicMaterial color={'black'}></meshBasicMaterial>
                </mesh>
                <mesh position={[0,0,-400]}>
                    <planeGeometry args={[800,800]}></planeGeometry>
                    <meshBasicMaterial map={new THREE.TextureLoader().load( 'img/space.jpg')}></meshBasicMaterial>
                </mesh> */}
    
                {/** Code */}
                <OrbitControls 
                    mouseButtons={{
                        LEFT: THREE.MOUSE.LEFT,
                        MIDDLE: THREE.MOUSE.MIDDLE,
                        RIGHT: THREE.MOUSE.RIGHT, // 우클릭 방지
                    }}
                />
                <ThreeBoard spaceRef={spaceRef} /*turn={turn} setTurn={setTurn}*/ wallVisible={wallVisible} myTeam={team} socket={socket} target={target}/>
            
            </Canvas>
            <div className={styles.UI} style={{color:'white'}}>
                    <div className={styles.visible}>
                        setVisible
                        <input 
                            type="checkbox"
                            checked={visible}
                            onChange={(e) => setVisible(e.target.checked)}
                        />
                    </div>
                    <div className={styles.wall}>
                        show Wall
                        <input
                            type="checkbox"
                            checked={wallVisible}
                            onChange={(e) => {
                                setWallVisible(e.target.checked)
                            }}
                        />
                    </div>
                    <div className={styles.myTeam}>myTeam : {team}</div>
                    <Chat params={
                        {socket, username}
                    }></Chat>
            </div>
        </div>
    )
}