'use client'
import {useEffect} from 'react'

export default function Login(){

    useEffect(() => {

        const button = document.querySelector('#sub_btn') as HTMLDivElement
        button.addEventListener('click', () => {
            const username = document.querySelector('#id') as HTMLInputElement;
            const password = document.querySelector('#pw') as HTMLInputElement;
            
            fetch('http://localhost:3000/login',{
                method: "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify({
                    username : username.value,
                    password : password.value
                })
            }).then((response) =>{
                console.log(response)
                if(response.ok){
                    return response.json()
                }
            }).then((data) => {
                console.log(data)
                if(data.token != null){                
                    localStorage.setItem('token', data.token);
                    location.href = '/tempMain'
                }else{
                    //TODO Error
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