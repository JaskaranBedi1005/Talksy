import React, { useState } from 'react'
import assets from '../assets/assets'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {
    const [currState,setCurrState]=useState("Sign Up")
    const [fullName,setFullName]=useState("")
    const [email,setEmail]=useState("")
    const [password,setPassword]=useState("")
    const [bio,setBio]=useState("")
    const [dataSubmitted,setDataSubmitted]=useState(false)


    const{login}=useContext(AuthContext)
    const onSubmitHandler=(e)=>{
        e.preventDefault()
        if(currState==="Sign Up" && !dataSubmitted){
            setDataSubmitted(true);
            return;
        }

        login(currState==="Sign Up"? 'signup':'login',{fullName,email,password,bio})

    }
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 flex items-center justify-center gap-12 sm:justify-evenly max-sm:flex-col backdrop-blur-sm px-4'>
      {/* left */}
      <img src={assets.talky} alt='' className='w-[min(50vh,380px)] drop-shadow-2xl'/>
      {/* right */}
      <form onSubmit={onSubmitHandler} className='border border-emerald-500/40 bg-slate-900/60 text-white p-8 flex flex-col gap-6 rounded-2xl shadow-2xl backdrop-blur-md max-w-md w-full'>
        <h2 className='font-bold text-3xl flex justify-between items-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400'>
        {currState}{dataSubmitted && <img onClick={()=>setDataSubmitted(false)} src={assets.arrow_icon} alt='' className='w-6 cursor-pointer hover:opacity-70 transition text-white'/>}
        </h2>
        {currState==="Sign Up" && !dataSubmitted && (<input type='text' onChange={(e)=>setFullName(e.target.value)} value={fullName} className='p-3 border border-emerald-500/30 bg-slate-800/60 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-slate-400 transition' placeholder='Full name' required/>
)}
        {!dataSubmitted && (
            <>
            <input onChange={(e)=>setEmail(e.target.value)} value={email} type='email' placeholder='Email Address' required className='p-3 border border-emerald-500/30 bg-slate-800/60 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-slate-400 transition'/>
            <input onChange={(e)=>setPassword(e.target.value)} value={password} type='password' placeholder='Password' required className='p-3 border border-emerald-500/30 bg-slate-800/60 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-slate-400 transition'/>
            </>
        )}
        {currState==="Sign Up" && dataSubmitted &&(
            <textarea  onChange={(e)=>setBio(e.target.value)} value={bio}rows={4} className='p-3 border border-emerald-500/30 bg-slate-800/60 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-slate-400 transition resize-none' placeholder='Provide a short bio' required></textarea>
        )}
        <button type='submit' className='py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg cursor-pointer font-semibold transition shadow-lg transform hover:scale-105'> 
            {currState==="Sign Up"?dataSubmitted?"Create Account" :"Next":"Login Now"}
        </button>
        <div className='flex items-center gap-3 text-sm text-slate-400'>
            <input type='checkbox' className='w-4 h-4 rounded border-emerald-500/30 cursor-pointer'/>
            <p>Agree to the terms of use and privacy policy</p>
        </div>
        <div className='flex flex-col gap-3'>
        {currState=="Sign Up"?(<p className='text-sm text-slate-400'>
            Already have an account? <span onClick={()=>{setCurrState("Login");setDataSubmitted(false)}} className='font-semibold text-emerald-400 cursor-pointer hover:text-emerald-300 transition'>
                 Login here
            </span>
        </p>):(<p className='text-sm text-slate-400'>
            Create an account <span onClick={()=>setCurrState("Sign Up")} className='font-semibold text-emerald-400 cursor-pointer hover:text-emerald-300 transition'>
                Click here
            </span>
        </p>)}
        </div>
          </form>
    </div>
  )
}

export default LoginPage
