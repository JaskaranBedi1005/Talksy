import React, { useContext, useState } from 'react'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import Sidebar from '../components/Sidebar'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {
    const {selectedUser}=useContext(ChatContext);
  return (
    <div className='w-full h-screen sm:px-[4%] sm:py-[2%] bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950'>
      <div className={`backdrop-blur-md border border-emerald-500/30 shadow-2xl rounded-3xl overflow-hidden h-[100%] grid grid-cols-1 relative bg-slate-900/40 ${selectedUser?'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]':'md:grid-cols-2'}`}>
        <Sidebar/>
        <ChatContainer/>
        <RightSidebar />
      </div>
    </div>
  )
}

export default HomePage
