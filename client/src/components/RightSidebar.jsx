import React, { useContext, useEffect, useState } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {
    const {selectedUser,messages}=useContext(ChatContext);
    const {logout,onlineUsers}=useContext(AuthContext);
    const [messageImages,setMessageImages]=useState([]);

    //Get all the images from the messages and set them to state

    useEffect(()=>{
        setMessageImages(messages.filter(msg=>msg.image).map(msg=>msg.image))
    },[messages])

  return selectedUser && (
    <div className={`bg-gradient-to-b from-emerald-900/40 to-slate-900/40 text-white w-full relative overflow-y-scroll rounded-r-3xl ${selectedUser?'max-md:hidden':''}`}>
        <div className='pt-8 flex flex-col items-center gap-3 text-xs font-light mx-auto' >
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt='' className='w-24 aspect-[1/1] rounded-full ring-4 ring-emerald-500/40 shadow-lg' />
            <h1 className='px-10 text-2xl font-semibold mx-auto flex items-center gap-2 text-white'>
                {onlineUsers.includes(selectedUser._id) && <p className='w-3 h-3 rounded-full bg-emerald-400 animate-pulse'></p>}{selectedUser.fullName}</h1>
            <p className='px-10 mx-auto text-slate-300 text-sm leading-relaxed'>{selectedUser.bio}</p>
        </div>
        <hr className='border-emerald-500/20 my-6'/>
        <div className='px-6 text-sm'>
            <p className='font-semibold text-emerald-300 mb-3'>Media</p>
            <div className='mt-3 max-h-[250px] overflow-y-scroll grid grid-cols-2 gap-3 opacity-90'>
                {messageImages.map((url,index)=>(
                    <div key={index} onClick={()=>window.open(url)} className='cursor-pointer rounded-xl overflow-hidden hover:scale-105 transition transform'>
                        <img src={url} alt='' className='h-full rounded-xl hover:shadow-lg transition'/>
                    </div>
                ))}
            </div>
        </div>
        <button onClick={()=>logout()} className='absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white border-none text-sm font-medium py-2 px-6 rounded-full cursor-pointer transition shadow-lg'>
            Logout
        </button>
    </div>
  )
}

export default RightSidebar
