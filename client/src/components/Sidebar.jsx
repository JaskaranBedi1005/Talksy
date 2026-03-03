import React, { useEffect, useState } from 'react'
import assets, { userDummyData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = () => {

  const {getUsers,users,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages}=useContext(ChatContext)
    const {logout,onlineUsers} =useContext(AuthContext)
  const [input,setInput]=useState("");
    const navigate=useNavigate();
    const filteredUsers=input?users.filter((user)=>user.fullName.toLowerCase().includes(input.toLowerCase())):users;

    useEffect(()=>{
      getUsers()
    },[onlineUsers])
  return (
    <div className={`bg-gradient-to-b from-emerald-900/40 to-slate-900/40 h-full p-3 rounded-l-3xl overflow-y-scroll text-white ${selectedUser?'max-md:hidden':""}`}>
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
            <img src={assets.newheader} alt='logo' className='max-w-40' />
            <div className='relative py-2 group'>
            <img src={assets.menu_icon} alt='menu' className='max-h-5 cursor-pointer hover:opacity-80 transition' />
            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-lg bg-slate-800 border border-emerald-500/50 text-gray-100 hidden group-hover:block shadow-xl pt-8'>
                <p onClick={()=>navigate('./profile')} className='cursor-pointer text-sm hover:text-emerald-400 transition'>Edit Profile</p>
                <hr className='my-2 border-t border-emerald-500/20'/>
                <p  onClick={()=>logout()} className='cursor-pointer text-sm hover:text-emerald-400 transition'>Logout</p>
            </div>
            </div>
        </div>
        <div className='bg-slate-800/60 rounded-full flex items-center gap-2 py-2 px-3 mt-5 border border-emerald-500/30 hover:border-emerald-500/50 transition'>
            <img src={assets.search_icon} alt='Search' className='w-3 opacity-60'/>
            <input onChange={(e)=>setInput(e.target.value)} type='text' className='bg-transparent border-none outline-none text-white text-sm placeholder-slate-500 flex-1' placeholder='Search User ...'/>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        {filteredUsers.map((user,index)=>(
            <div onClick={()=>{setSelectedUser(user),setUnseenMessages(prev=>({...prev,[user._id]:0}))}} key={index} className={`relative flex items-center gap-3 p-3 pl-2 rounded-xl cursor-pointer max-sm:text-sm transition duration-200 ${selectedUser?._id===user._id ? 'bg-emerald-600/40 border border-emerald-500/50' : 'hover:bg-emerald-500/20'}`}>
                <img src={user?.profilePic || assets.avatar_icon} alt='' className='w-10 aspect-[1/1] rounded-full ring-2 ring-emerald-500/30'/>
                <div className='flex flex-col leading-6'>
                    <p className='font-medium text-sm'>{user.fullName}</p>{
                        onlineUsers.includes(user._id)?<span className='text-emerald-400 text-xs font-medium'>● Online</span>:<span className='text-slate-500 text-xs'>● Offline</span>
                    }
                </div>
                {unseenMessages?.[user._id]>0 && <p className='absolute top-2 right-3 text-xs h-6 w-6 flex justify-center items-center rounded-full bg-rose-500 font-bold'>{unseenMessages[user._id]}</p>}
            </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
