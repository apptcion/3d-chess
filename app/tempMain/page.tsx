'use client'
import {useEffect} from 'react'

export default function Main(){

    useEffect(() => {
        fetch('http://localhost:3000/login',{
            method: "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({
                username : 'apptcion',
                password : 'this is password'
            })
        })
    })

    return (
        <div>

        </div>
    )
}