import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import { Toaster } from "react-hot-toast"
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import VideoCall from './components/VideoCall'

const App = () => {
  const { authUser } = useContext(AuthContext);
  return (
    <div className="bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 min-h-screen">
      <Toaster />
      {authUser && <VideoCall />}
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
      </Routes>
    </div>
  )
}

export default App
