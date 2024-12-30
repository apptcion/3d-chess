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

    draw() {
        ctx.beginPath();
        let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        gradient.addColorStop(0, `rgba(255,255,255,${this.nowGradient / 100})`);
        gradient.addColorStop(this.shadowSize, `rgba(255,255,255,${(this.nowGradient / 100) * 0.6})`);
        gradient.addColorStop(1, `rgba(255,255,255,${this.nowGradient / 100})`);

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

class Meteor{
    x;
    y;
    stroke;
    speed;
    len;
    angle;
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

    draw(){
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
    amount: 1500,
    min_radius: 1,
    max_radius: 3,
    height : 2,
};

const starsDOM = document.getElementById('stars');
let stars = [];
let meteors = [];
const ctx = starsDOM.getContext('2d');
starsDOM.width = window.innerWidth;
starsDOM.height = window.innerHeight * config.height;
let animeFrameID = 0;

for (let i = 0; i < config.amount; i++) {
    stars.push(new Star());
}

const Anime = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight * config.height);

    stars.forEach((star) => {
        star.fade();
        star.updatePosition();
        star.draw();
    });

    meteors = meteors.filter((meteor) => {
        meteor.updatePosition();
        meteor.draw();
        return meteor.x > 0 && meteor.y < window.innerHeight * config.height; // 조건을 만족하는 메테오만 유지
    });
    if((Math.random() * 100 <= 1)) {
        meteors.push(new Meteor());
    }

    animeFrameID = requestAnimationFrame(Anime);
};

export default function resizeHandler() {
    starsDOM.width = window.innerWidth;
    starsDOM.height = window.innerHeight * config.height;
    stars = [];
    for (let i = 0; i < config.amount; i++) {
        stars.push(new Star());
    }
    cancelAnimationFrame(animeFrameID);
    Anime();
};

