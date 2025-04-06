'use client'
import styles from '../../public/css/login.module.css'
import ErrorPage from './error'

import {useEffect, useRef, useState} from 'react'

//Space
class Star {
    x;
    y;
    r;
    nowGradient;
    maxGradient;
    speed;
    shadowSize;
    angle;
    radius;
    rotationSpeed;
    centerX = window.innerWidth / 2;
    centerY = window.innerHeight * config.height + 300;

    constructor() {

        this.angle = Math.random() * 2 * Math.PI;
        this.radius = Math.random() * (window.innerWidth * config.height) + (Math.random() * config.height * 200);

        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;

        this.r = Math.random() * (config.max_radius - config.min_radius) + config.min_radius;
        this.speed = Math.random() + 0.5;
        this.shadowSize = Math.random() * (0.6 - 0.4) + 0.4;
        this.maxGradient = (Math.random() * (100 - this.r * 33)) + (this.r * 33);
        this.nowGradient = this.maxGradient;
        this.rotationSpeed = Math.random() * 0.0001 + 0.00001;
    }

    fade() {
        this.nowGradient += this.speed;
        if (this.nowGradient > this.maxGradient || this.nowGradient < 0) {
            this.speed *= -1;
        }
    }

    updatePosition() {

        this.angle += this.rotationSpeed;
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
    }

    draw(ctx:CanvasRenderingContext2D) {
        ctx.beginPath();
        //const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        // gradient.addColorStop(0, `rgba(255,255,255,${this.nowGradient / 100})`);
        // gradient.addColorStop(this.shadowSize, `rgba(255,255,255,${(this.nowGradient / 100) * 0.6})`);
        // gradient.addColorStop(1, `rgba(255,255,255,${this.nowGradient / 100})`);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

class Meteor{
    public x:number;
    public y:number;
    public stroke:number;
    public speed:number;
    public len:number;
    public angle:number;
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight * 0.5;
        this.stroke = Math.random() * (2) + 1;
        this.speed = Math.random() * (0.5 - 0.3) + 0.3;
        this.len = Math.random() * 30 * this.speed + 50;
        this.angle = Math.random() * (135 - 133) + 133;
        this.angle = this.angle*  Math.PI/180;
    }

    updatePosition() {
        this.x += Math.cos(this.angle) * this.len * (this.speed);
        this.y += Math.sin(this.angle) * this.len * (this.speed);
    }

    draw(ctx:CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.strokeStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.5) + ')';
        ctx.lineWidth = this.stroke;
        ctx.lineTo(this.x - this.len * Math.cos(this.angle), this.y - this.len * Math.sin(this.angle));
        ctx.stroke();  // 실제로 경로를 그리는 부분
        ctx.closePath();
    }

}

const config = {
    amount: 750,
    min_radius: 0.2,
    max_radius: 1.5,
    height : 1,
};

//const starsDOM = document.getElementById('stars');
let stars:Array<Star> = [];
let meteors:Array<Meteor> = [];
let animeFrameID = 0;

for (let i = 0; i < config.amount; i++) {
    stars.push(new Star());
}



export default function Login(){

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [error, SetError] = useState<string | null>(null)
    
    const loginHandler = () => {
        const username = document.querySelector('#id') as HTMLInputElement;
        const password = document.querySelector('#pw') as HTMLInputElement;
        console.log(username.value, password.value)
        if(username.value && password.value){
            fetch('https://chessback.apptcion.site/login/',{
                method: "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify({
                    username : username.value,
                    password : password.value
                })
            }).then((response) =>{
                if(response.ok){
                    return response.json()
                }
            }).then((data) => {
                console.log(data)
                if(data.token != null){                
                    localStorage.setItem('token', data.token);
                    location.href = '/'
                }else{
                    //TODO Error
                    SetError("Username or Password is invalid")
                }
            })
        }
    }

    const keyDownHandler = (e:React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            loginHandler()
        }
    }
    useEffect(() => {

        let context = null;

        if(canvasRef.current){
            context = canvasRef.current.getContext('2d')
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight * config.height;
        }

        const Anime = () => {
            if(context){
                context.clearRect(0, 0, window.innerWidth, window.innerHeight * config.height);
        
                stars.forEach((star) => {
                    star.fade();
                    star.updatePosition();
                    star.draw(context);
                });
            
                meteors = meteors.filter((meteor) => {
                    meteor.updatePosition();
                    meteor.draw(context);
                    return meteor.x > 0 && meteor.y < window.innerHeight * config.height; // 조건을 만족하는 메테오만 유지
                });
                if((Math.random() * 200 <= 1)) {
                    meteors.push(new Meteor());
                }
            
                animeFrameID = requestAnimationFrame(Anime);
            }
        };

        function resizeHandler() {
            if(canvasRef.current){
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight * config.height;
            }
            stars = [];
            for (let i = 0; i < config.amount; i++) {
                stars.push(new Star());
            }
            cancelAnimationFrame(animeFrameID);
            Anime();
        };
        

        const button = document.querySelector('#sub_btn') as HTMLDivElement;
        button.addEventListener('click', loginHandler)

        resizeHandler()
        window.addEventListener('resize', resizeHandler)
        console.log(styles.canvas)
        return () => {
            button.removeEventListener('click', loginHandler)
            window.removeEventListener('resize', resizeHandler)
        }
    },[])

    return (
        <main className={styles.main} id="main">
            <canvas id="stars" ref={canvasRef} className={styles.canvas}></canvas>
            <div className={styles.loginForm}>
                <img src='/img/logo.svg' className={styles.logo}/>
                <div className={styles.input}>
                    <div><input id="id" type="text" placeholder='username' onKeyDown={keyDownHandler}/></div>
                    <div><input id="pw" type="password" placeholder='password' onKeyDown={keyDownHandler}/></div>
                </div>
                <div className={styles.login_wrap}>
                    <div id="sub_btn" className={styles.login}>Login</div>
                    <div id="go_signup" className={styles.signup} onClick={() => {
                        location.href="/signup"
                    }}>Sign up</div>
                </div>
            </div>
            {error && <ErrorPage params={{cause : error, closeActionFunc : SetError}}/>}
        </main>
    )
}