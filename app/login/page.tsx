'use client'
import {useEffect} from 'react'

export default function Login(){

    useEffect(() => {

        const button = document.querySelector('#sub_btn') as HTMLDivElement
        button.addEventListener('click', () => {
            const username = document.querySelector('#id') as HTMLInputElement;
            const password = document.querySelector('#pw') as HTMLInputElement;
            
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
                if(data.token != null){                
                    localStorage.setItem('token', data.token);
                    location.href = '/tempMain'
                }else{
                    //TODO Error
                    const wrap = document.querySelector('#wrap') as HTMLDivElement;
                    const error = document.createElement('div')
                    error.innerHTML = "Invaild Username or Password"
                    error.style.color = 'red'
                    wrap.appendChild(error)
                }
            })
        })
    })

    return (
        <div>
            ID : <input id="id"/><br />
            PW : <input id="pw"/><br />
            <div id="sub_btn">Button</div>
        </div>
    )
}