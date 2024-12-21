'use client'
import styles from '../../public/css/chess.module.css'

import { Canvas, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '@react-three/drei'
import React, {useEffect, useState, useRef} from 'react'
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
    onUnitTeam: "white" | "black" | "none"
    canAttack: boolean
    canGo: boolean
    normalOpacity :number
}

class Cell implements cell{
    public column: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
    public readonly color: "white" | "black";
    public mesh: THREE.Mesh; 
    public onUnit;
    public canAttack;
    public canGo;
    public onUnitTeam: "white" | "black" | "none";
    public normalOpacity:number

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

        const geometry = new THREE.PlaneGeometry(mapConfig.cellSize.x, mapConfig.cellSize.y);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            side: THREE.DoubleSide,
        });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.set(
            this.getCol() * mapConfig.cellSize.x - 22.5,
            this.layer * mapConfig.cellSize.Gap - 35,
            this.row * -mapConfig.cellSize.y + 22.5  
        );

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
        material.opacity = visible ? this.normalOpacity : 0.1; // 투명도 설정
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

abstract class Unit{ // == piece ( 체스 기물 )
    public death:boolean;
    protected showingCell:Array<Cell> = []
    public model:THREE.Group;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public board:Array<Board>,
        public piece:piece
    ){
        this.death = false;
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnit = true;
        board[layer - 1].cells[row - 1][this.convertCol() - 1].onUnitTeam = team
        board[layer - 1].cells[row - 1][this.convertCol() - 1].piece = piece
        this.model = new THREE.Group()
    }
    
    public abstract showCanCell():void;
    public abstract addToScene(scene: THREE.Scene):void;

    public hideCanCell(){
        this.showingCell.forEach(cell => {
            let tempMaterial = cell.mesh.material as THREE.MeshBasicMaterial;
            tempMaterial.color.set(`${cell.color}`)
        })
        this.showingCell = [];
    }

    public move(){
        
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
            case "h":
                return 8;
        }
    }

}

class Queen extends Unit {
    private wasHandled = false;
    private config = {};
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){
        
        super(team,row,column,layer, board, "QUEEN")
        this.ID = `${team}_BISHOPS_${uuidv4()}`
        
    }


    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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
        for(let i = 1; i <= 7; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 8){
                let cell = cells[this.row + i - 1][this.convertCol() - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;                           
                        
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){       
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ?colorConfig.opacity.black : colorConfig.opacity.white;              
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 8){
                let cell = cells[this.row - i - 1][this.convertCol() - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')     
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;       
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){       
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 8){
                let cell = cells[this.row - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                   
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;       
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
                
            }
        }

        for(let i = 1; i <= 7; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 8){
                let cell = cells[this.row - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){         
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }

        for(let i = 1; i <= 7; i++){    // 우 상향
            if((1 <= this.row + i && this.row + i <= 8 ) && (1 <= this.convertCol() + i && this.convertCol() + i <= 8)){
                let cell = cells[this.row + i - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    // 우 하향
            if((1 <= this.row - i && this.row - i <= 8 ) && (1 <= this.convertCol() + i && this.convertCol() + i <= 8)){
                let cell = cells[this.row - i - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    // 좌 상향
            if((1 <= this.row + i && this.row + i <= 8 ) && (1 <= this.convertCol() - i && this.convertCol() - i <= 8)){
                let cell = cells[this.row + i - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }

        for(let i = 1; i <= 7; i++){    // 좌 하향
            if((1 <= this.row - i && this.row - i <= 8 ) && (1 <= this.convertCol() - i && this.convertCol() - i <= 8)){
                let cell = cells[this.row - i - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        material.color.set('red')                        
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){           
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }
    }
}

class Bishops extends Unit {
    private wasHandled = false;
    private config = {}
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){        
        super(team,row,column,layer, board, "BISHOPS")
        this.ID = `${team}_BISHOPS_${uuidv4()}`
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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
        for(let i = 1; i <= 7; i++){    // 우 상향
            if((1 <= this.row + i && this.row + i <= 8 ) && (1 <= this.convertCol() + i && this.convertCol() + i <= 8)){
                let cell = cells[this.row + i - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    // 우 하향
            if((1 <= this.row - i && this.row - i <= 8 ) && (1 <= this.convertCol() + i && this.convertCol() + i <= 8)){
                let cell = cells[this.row - i - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    // 좌 상향
            if((1 <= this.row + i && this.row + i <= 8 ) && (1 <= this.convertCol() - i && this.convertCol() - i <= 8)){
                let cell = cells[this.row + i - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }

        for(let i = 1; i <= 7; i++){    // 좌 하향
            if((1 <= this.row - i && this.row - i <= 8 ) && (1 <= this.convertCol() - i && this.convertCol() - i <= 8)){
                let cell = cells[this.row - i - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }
    }
}

class Rooks extends Unit {
    private wasHandled = false;
    private config = {}
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "ROOKS")
        this.ID = `${team}_ROOKS_${uuidv4()}`
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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
        for(let i = 1; i <= 7; i++){    //foward
            if(1 <= this.row + i && this.row + i <= 8){
                let cell = cells[this.row + i - 1][this.convertCol() - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    //backward
            if(1 <= this.row - i && this.row - i <= 8){
                let cell = cells[this.row - i - 1][this.convertCol() - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }

            }
        }

        for(let i = 1; i <= 7; i++){    //left
            if(1 <= this.convertCol() - i && this.convertCol()- i <= 8){
                let cell = cells[this.row - 1][this.convertCol() - i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
                
            }
        }

        for(let i = 1; i <= 7; i++){    //right
            if(1 <= this.convertCol() +  i && this.convertCol() + i <= 8){
                let cell = cells[this.row - 1][this.convertCol() + i - 1];
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit) {
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.color.set('red')                        
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        this.showingCell.push(cell)
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                    break;
                }
                if(cell.canGo){                
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        }
    }
}

class King extends Unit{
    
    private wasHandled = false;
    private config = {
        moving : {
            points : [
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
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "KING")
        this.ID = `${team}_KING_${uuidv4()}`
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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
            let goFoward = this.row + goTo[2] -1;
            let goLR = this.convertCol() + goTo[0] -1;
            let goLayer = this.layer + goTo[1] -1;

            if(( 0 <= goFoward && goFoward <= 7) && ( 0 <= goLR && goLR <= 7 ) && ( 0 <= goLayer && goLayer <= 7)){
                const cells = this.board[goLayer].cells
                const cell = cells[goFoward][goLR];
                
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true;
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){                    
                        cell.canAttack = true;
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        material.color.set('red')
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                }
                if(cell.canGo){
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        })
    }
}

class Knights extends Unit{

    private wasHandled = false;
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
                [-1,0,2]
            ]
        }
    }
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "KNIGHTS")
        this.ID = `${team}_KNIGHTS_${uuidv4()}`
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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
            let goFoward = this.row + goTo[2] -1;
            let goLR = this.convertCol() + goTo[0] -1;
            let goLayer = this.layer + goTo[1] -1;

            if(( 0 <= goFoward && goFoward <= 7) && ( 0 <= goLR && goLR <= 7 ) && ( 0 <= goLayer && goLayer <= 7)){
                const cells = this.board[goLayer].cells
                const cell = cells[goFoward][goLR];
                
                let material = cell.mesh.material as THREE.MeshBasicMaterial;
                material.color.set('yellow')
                cell.canGo = true
                if(cell.onUnit){
                    if(cell.onUnitTeam != this.team){
                        cell.canAttack = true;
                        material.transparent = true;
                        cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        material.color.set('red')
                    }else{
                        cell.canGo = false;
                        material.color.set(cell.color)
                    }
                }
                if(cell.canGo){
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    this.showingCell.push(cell)
                }
            }
        })
    }
}

class Pawns extends Unit{
    private wasHandled = false;
    private config = {
        moving : {
            points : [
                [0,0,1]
            ]
        }
    }
    private ID:string;
    constructor(
        public team: "white" | "black",
        public row: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        public column : "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h",
        public layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        board: Array<Board>
    ){
        super(team,row,column,layer, board, "PAWNS")
        this.ID = `${team}_PAWNS_${uuidv4()}`
    }

    public addToScene(scene: THREE.Scene): void {
        const loader = new GLTFLoader();
        loader.load(
            '/3D/chess.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(this.convertCol() * mapConfig.cellSize.x -22.5,this.layer * mapConfig.cellSize.Gap - 35, this.row * -mapConfig.cellSize.y + 22.5)
                this.model.scale.set(0.01, 0.01, 0.01);
                this.model.rotateX(-Math.PI / 2)
                this.model.rotateZ(Math.PI / 2)
                if(this.team == 'black'){
                    this.model.rotateZ(Math.PI)
                }
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

    public move(){
        this.wasHandled = true;
    }

    public showCanCell(){
        this.hideCanCell()
        this.config.moving.points.forEach(goTo => {
            
            let goForward = this.row + goTo[2] -1;
            let optForward = 0;
            if(!this.wasHandled ){
                optForward = goForward + 1;
            }
            let goLR = this.convertCol() + goTo[0] -1;
            let goLayer = this.layer + goTo[1] -1;
            if(this.team == 'black'){
                goForward = this.row - goTo[2] -1;
                if(!this.wasHandled ){
                    optForward = goForward - 1;
                }
            }
                
            if(( 0 <= goForward && goForward <= 7) && ( 0 <= optForward && optForward <= 7) && ( 0 <= goLR && goLR <= 7 ) && ( 0 <= goLayer && goLayer <= 7)){
                const cells = this.board[goLayer].cells
                const cell = cells[goForward][goLR];
                if(!cell.onUnit){
                    let material = cell.mesh.material as THREE.MeshBasicMaterial;
                    material.color.set('yellow')
                    material.transparent = true;
                    cell.normalOpacity = material.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    cell.canGo = true;
                    this.showingCell.push(cell)
                }

                if(optForward != 0 && !cells[optForward][goLR].onUnit && !cells[goForward][goLR].onUnit){
                    let material2 = cells[optForward][goLR].mesh.material as THREE.MeshBasicMaterial;
                    material2.color.set('yellow')
                    material2.transparent = true;
                    cells[optForward][goLR].normalOpacity = material2.opacity = cell.color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                    cells[optForward][goLR].canGo = true;    
                    this.showingCell.push(cells[optForward][goLR])
                }
                
                if(goLR != 7){
                    if(cells[goForward][goLR + 1].onUnit && cells[goForward][goLR +1].onUnitTeam != this.team){
                        let material_onRight= cells[goForward][goLR + 1].mesh.material as THREE.MeshBasicMaterial
                        material_onRight.color.set('red')
                        material_onRight.transparent = true;
                        cells[goForward][goLR + 1].normalOpacity = material_onRight.opacity = cells[goForward][goLR + 1].color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        
                        cells[goForward][goLR - 1].canAttack = true;
                        cells[goForward][goLR - 1].canGo = true;
                        this.showingCell.push(cells[goForward][goLR + 1])
                    }
                }
                if(goLR != 0){
                    if(cells[goForward][goLR - 1].onUnit && cells[goForward][goLR -1].onUnitTeam != this.team){
                        let material_onLeft= cells[goForward][goLR - 1].mesh.material as THREE.MeshBasicMaterial
                        material_onLeft.color.set('red')
                        material_onLeft.transparent = true;
                        cells[goForward][goLR - 1].normalOpacity = material_onLeft.opacity = cells[goForward][goLR - 1].color == "black" ? colorConfig.opacity.black : colorConfig.opacity.white;
                        
                        cells[goForward][goLR - 1].canAttack = true;
                        cells[goForward][goLR - 1].canGo = true;
                        this.showingCell.push(cells[goForward][goLR - 1])
                    }
                }
            }
        })
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
        let isWhite = false;
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

const myUnits:any = []
const myTeam: "white" | "black" = 'white'
let selUnit:Unit;
function ThreeBoard({spaceRef} : {spaceRef: React.MutableRefObject<Space | null>}) {
    const { scene, camera } = useThree();

    const chageNumToCol = (columnNum:number) => {
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

    useEffect(() => {
        const gameSpace = new Space();
        spaceRef.current = gameSpace;
        gameSpace.addToScene(scene);

        const initGame = () =>{
            for(let i = 1; i <= 8; i++){
                myUnits.push(new Pawns(myTeam, 2, chageNumToCol(i), 8, gameSpace.boards))
            }
            myUnits.push(new Rooks(myTeam, 1, "a", 8, gameSpace.boards))
            myUnits.push(new Knights(myTeam, 1, "b", 8, gameSpace.boards))
            myUnits.push(new Bishops(myTeam, 1, "c", 8, gameSpace.boards))
            myUnits.push(new King(myTeam, 1, "d", 8, gameSpace.boards))
            myUnits.push(new Queen(myTeam, 1, "e", 8, gameSpace.boards))
            myUnits.push(new Bishops(myTeam, 1, "f", 8, gameSpace.boards))
            myUnits.push(new Knights(myTeam, 1, "g", 8, gameSpace.boards))
            myUnits.push(new Rooks(myTeam, 1, "h", 8, gameSpace.boards))

            myUnits.forEach((unit: any) => {
                unit.addToScene(scene)
            })
        }

        initGame()

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
                        console.log(intersects[i].object.userData)
                        if(intersects[i].object.userData.type == 'units' ){
                            console.log(intersects[i].object.userData.unit)
                            const unit = intersects[i].object.userData.unit.showCanCell()
                        }else if(intersects[i].object.userData?.cell instanceof Cell){
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
        //const disableContextMenu = (event: MouseEvent) => event.preventDefault();

        document.addEventListener("mousedown", clickHandler);
        //document.addEventListener("contextmenu", disableContextMenu);

        camera.position.set(0,50,0);
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
                        RIGHT: THREE.MOUSE.RIGHT, // 우클릭 방지
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