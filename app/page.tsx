'use client'
import Image from "next/image";
import styles from "./page.module.css";
import { useEffect } from "react";
import {getCookie, setCookie} from '../public/js/cookie'
import Main from './tempMain/page'

export default function Home() {

  useEffect(() => {
    if(getCookie('ticket') === undefined){
      setCookie('from','http://chess.apptcion.site');
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
          setCookie('from','http://chess.apptcion.site/');
          location.href = 'https://apptcion.site/filter';
          console.log("토큰 잘못됨", getCookie('ticket'))
        }
      })
    }
  })

  return (
    <Main />
  );
}
