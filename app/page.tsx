'use client'
import { useEffect } from "react";
import {getCookie, setCookie} from '../public/js/cookie'
import Main from './main/page'

export default function Home() {

  useEffect(() => {
    if(process.env.NEXT_PUBLIC_ISPROD === "true"){
      if(getCookie('ticket') === undefined){
        setCookie('from','https://chess.apptcion.site');
        console.log("토큰 없음", getCookie('ticket'))
        location.href = 'https://apptcion.site/filter';
      }else{
        fetch('https://apptcion.site/isValid',{
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            ticket:getCookie('ticket'),
          })
        }).then((response) => {
            if(response.ok) return response.json();
        }).then((data) => {
          if(!data){
            setCookie('from','https://chess.apptcion.site/');
            location.href = 'https://apptcion.site/filter';
          }
        })
      }
    }
  })

  return (
    <Main />
  );
}
