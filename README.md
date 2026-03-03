# Talksy 

Talksy is a feature-rich, real-time communication platform that supports instant messaging, high-quality video calls, and crystal-clear voice calls. Built with the MERN stack and WebRTC, it provides a seamless and responsive experience across devices.

## Live Demo
- **Frontend:** [https://talksy-dusky.vercel.app](https://talksy-dusky.vercel.app)
- **Backend:** [https://talksy-bngw.onrender.com](https://talksy-bngw.onrender.com)

## Features
- **Real-time Messaging:** Powered by Socket.io for instant text delivery.
- **WebRTC Video & Voice Calls:** Peer-to-peer calls with volume boosting and auto-gain control.
- **Online Status:** Real-time visibility of active users.
- **Multimedia Support:** Share images effortlessly via Cloudinary integration.
- **User Authentication:** Secure JWT-based login and signup.
- **Profile Management:** Customizable avatars and bios.
- **Responsive Design:** Optimized for both mobile and desktop views using TailwindCSS.

## Tech Stack
- **Frontend:** React, TailwindCSS, Axios, Lucide React, React Hot Toast
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Real-time:** Socket.io, Simple-Peer (WebRTC)
- **Storage:** Cloudinary (for profile and chat images)
- **Deployment:** Vercel (Frontend), Render (Backend)

## Environment Variables

### Server (`/server/.env`)
```env
PORT=5000
MONGO_URL=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=your_vercel_deployment_url
```

### Client (`/client/.env`)
```env
VITE_BACKEND_URL=your_render_backend_url
```

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JaskaranBedi1005/Talksy.git
   cd Talksy
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   npm run server
   ```

3. **Setup Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   
