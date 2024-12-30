import dynamic from 'next/dynamic';

const Login = dynamic(() => import('./login'),{ssr:false})
export default function LoginPage(){
    return (
        <Login />
    )
}