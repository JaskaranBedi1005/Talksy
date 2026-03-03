import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, setActiveCall } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)
    const scrollEnd = useRef()
    const [input, setInput] = useState('');

    const startCall = (callType) => {
        setActiveCall({
            userId: selectedUser._id,
            callType: callType,
            isReceiving: false
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null;
        await sendMessage({ text: input.trim() });
        setInput("")
    }
    //Hndle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file")
            return
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])
    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])
    return selectedUser ? (
        <div className='h-full overflow-hidden relative bg-gradient-to-b from-slate-900/50 to-slate-900/80 flex flex-col'>
            {/* header */}
            <div className='flex items-center gap-3 py-4 px-6 border-b border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt='' className='w-10 rounded-full ring-2 ring-emerald-500/30' />
                <p className='flex-1 text-lg text-white flex items-center gap-2 font-medium'>{selectedUser.fullName}
                    {onlineUsers.includes(selectedUser._id) && <span className='w-3 h-3 rounded-full bg-emerald-400 animate-pulse'></span>}
                </p>

                <div className="flex gap-4 mr-4">
                    {/* Audio Call Icon */}
                    <svg
                        onClick={() => onlineUsers.includes(selectedUser._id) ? startCall('audio') : null}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 transition ${onlineUsers.includes(selectedUser._id) ? 'text-emerald-400 cursor-pointer hover:text-emerald-300' : 'text-slate-600 cursor-not-allowed opacity-40'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        title={onlineUsers.includes(selectedUser._id) ? 'Audio Call' : 'User is offline'}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {/* Video Call Icon */}
                    <svg
                        onClick={() => onlineUsers.includes(selectedUser._id) ? startCall('video') : null}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-6 h-6 transition ${onlineUsers.includes(selectedUser._id) ? 'text-emerald-400 cursor-pointer hover:text-emerald-300' : 'text-slate-600 cursor-not-allowed opacity-40'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        title={onlineUsers.includes(selectedUser._id) ? 'Video Call' : 'User is offline'}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>

                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt='' className='md:hidden max-w-7 cursor-pointer hover:opacity-70 transition' />
                <img src={assets.help_icon} alt='' className='max-md:hidden max-w-5 cursor-pointer hover:opacity-70 transition' />
            </div>
            {/* chatarea */}
            <div className='flex flex-col h-[calc(100%-130px)] overflow-y-scroll p-4 pb-6'>
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
                        {msg.image ? (<img src={msg.image} alt='' className='max-w-[240px] border border-emerald-500/30 rounded-2xl overflow-hidden mb-2 hover:border-emerald-500/60 transition shadow-lg' />) : (<p className={`p-3 max-w-[240px] md:text-sm font-light rounded-2xl mb-2 break-all transition ${msg.senderId === authUser._id ? 'rounded-br-none bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg' : 'rounded-bl-none bg-slate-700/80 text-gray-100 border border-emerald-500/20'}`}>{msg.text}</p>)}
                        <div className='text-center text-xs'>
                            <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt='' className='w-8 rounded-full ring-1 ring-emerald-500/20' />
                            <p className='text-slate-400 text-xs mt-1'>{formatMessageTime(msg.createdAt)}</p>
                        </div>
                    </div>
                ))}
                <div ref={scrollEnd}></div>
            </div>
            {/* bottomarea */}
            <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-4 bg-gradient-to-t from-slate-900 to-transparent'>
                <div className='flex-1 flex items-center bg-slate-800/60 px-4 rounded-full border border-emerald-500/30 hover:border-emerald-500/50 transition'>
                    <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type='text' placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-slate-500 bg-transparent' />
                    <input
                        onChange={handleSendImage}
                        type='file'
                        id='image'
                        accept='image/png, image/jpg, image/jpeg'
                        hidden
                    />

                    <label htmlFor='image'>
                        <img src={assets.gallery_icon} alt='' className='w-5 mr-2 cursor-pointer hover:opacity-70 transition' />
                    </label>
                </div>
                <img onClick={handleSendMessage} src={assets.send} alt='' className='w-12 cursor-pointer hover:scale-110 transition' />
            </div>
        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-4 text-gray-400 bg-gradient-to-b from-slate-900/50 to-slate-900/80 max-md:hidden h-full'>
            <img src={assets.main} className='max-w-25 opacity-50' alt='' />
            <p className='text-xl font-medium text-slate-300 '>Chat anytime, anywhere</p>
            <p className='text-sm text-slate-500'>Select a conversation to start messaging</p>
        </div>
    )
}

export default ChatContainer
