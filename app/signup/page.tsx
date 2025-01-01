import dynamic from 'next/dynamic';

const SignUp = dynamic(() => import('./signup'),{ssr:false})
export default function LoginPage(){
    return (
        <SignUp />
    )
}