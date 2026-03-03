import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';

const VideoCall = () => {
    const { incomingCall, setIncomingCall, activeCall, setActiveCall } = useContext(ChatContext);
    const { socket, authUser, selectedUser } = useContext(AuthContext);

    const [stream, setStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [minimized, setMinimized] = useState(false);

    const connectionRef = useRef();
    const myVideoRef = useRef();
    const userVideoRef = useRef();
    const audioRef = useRef(); // dedicated audio object for remote audio

    // Attach local stream to video element
    useEffect(() => {
        if (myVideoRef.current && stream) {
            myVideoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Attach remote stream to video element AND play audio via a DOM audio element
    useEffect(() => {
        let audioCtx;
        if (remoteStream) {
            // Attach to video element for visual
            if (userVideoRef.current) {
                userVideoRef.current.srcObject = remoteStream;
            }

            // Web Audio API to boost volume beyond 100%
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(remoteStream);
                const gainNode = audioCtx.createGain();

                // Boost volume by 250% (2.5x)
                gainNode.gain.value = 2.5;

                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                if (audioCtx.state === 'suspended') {
                    // Resume context (browsers often suspend until interaction)
                    audioCtx.resume().catch(e => console.error("AudioContext resume failed:", e));
                }
                console.log("Volume booster initialized: 2.5x gain applied");
            } catch (e) {
                console.error("Web Audio API not supported or failed:", e);
                // Fallback to simple audio element if Web Audio fails
                if (!audioRef.current) {
                    const audioEl = document.createElement('audio');
                    audioEl.style.display = 'none';
                    audioEl.autoplay = true;
                    document.body.appendChild(audioEl);
                    audioRef.current = audioEl;
                }
                audioRef.current.srcObject = remoteStream;
                audioRef.current.muted = false;
                audioRef.current.volume = 1.0;
                audioRef.current.play().catch(playErr => console.error("Fallback audio play FAILED:", playErr));
            }
        }
        return () => {
            if (audioCtx) {
                audioCtx.close().catch(e => { });
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
                audioRef.current.remove();
                audioRef.current = null;
            }
        };
    }, [remoteStream]);

    useEffect(() => {
        if (!activeCall && !incomingCall) return;

        const callType = activeCall?.callType || incomingCall?.callType || 'video';
        let localStream = null;

        navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        })
            .then((currentStream) => {
                localStream = currentStream;
                setStream(currentStream);

                if (activeCall && !incomingCall) {
                    // We are initiating the call
                    const peer = new Peer({
                        initiator: true,
                        trickle: true,
                        stream: currentStream
                    });

                    peer.on('signal', (data) => {
                        if (data.type === 'offer') {
                            socket.emit('call-user', {
                                userToCall: activeCall.userId,
                                signalData: data,
                                from: authUser._id,
                                name: authUser.fullName,
                                callType: callType
                            });
                        } else {
                            // Trickle ICE candidates
                            socket.emit('ice-candidate', { candidate: data, to: activeCall.userId });
                        }
                    });

                    peer.on('stream', (userStream) => {
                        console.log("Initiator received stream. Audio tracks:", userStream.getAudioTracks());
                        setRemoteStream(userStream);
                    });
                    // Fallback to track event listener just in case audio is routed later
                    peer.on('track', (track, userStream) => {
                        console.log("Initiator received track:", track.kind, track.label);
                        setRemoteStream(userStream);
                    });

                    socket.on('call-accepted', (signal) => {
                        setCallAccepted(true);
                        peer.signal(signal);
                    });

                    connectionRef.current = peer;
                }
            })
            .catch(err => {
                console.log('Failed to get local stream', err);
                toast.error('Could not access camera/microphone');
            });

        const handleIceCandidate = (candidate) => {
            if (connectionRef.current) {
                connectionRef.current.signal(candidate);
            }
        };

        socket.on('ice-candidate', handleIceCandidate);

        return () => {
            if (connectionRef.current) {
                try { connectionRef.current.destroy(); } catch (e) { }
                connectionRef.current = null;
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            setStream(undefined);
            setRemoteStream(undefined);
            setCallAccepted(false);
            setCallEnded(false);

            socket.off('call-accepted');
            socket.off('ice-candidate', handleIceCandidate);
        };
    }, [activeCall, incomingCall]);

    const answerCall = () => {
        setCallAccepted(true);

        // Pre-unlock audio in user gesture context so .play() works when stream arrives
        const audioEl = document.createElement('audio');
        audioEl.style.display = 'none';
        audioEl.muted = false;
        audioEl.volume = 1.0;
        document.body.appendChild(audioEl);
        audioEl.play().catch(() => { }); // unlock
        audioRef.current = audioEl;

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: stream
        });

        peer.on('signal', (data) => {
            if (data.type === 'answer') {
                socket.emit('answer-call', { signal: data, to: incomingCall.from });
            } else {
                // Trickle ICE candidates
                socket.emit('ice-candidate', { candidate: data, to: incomingCall.from });
            }
        });

        peer.on('stream', (userStream) => {
            console.log("Answerer received stream. Audio tracks:", userStream.getAudioTracks());
            setRemoteStream(userStream);
        });
        // Fallback to track event listener just in case audio is routed later
        peer.on('track', (track, userStream) => {
            console.log("Answerer received track:", track.kind, track.label);
            setRemoteStream(userStream);
        });

        peer.signal(incomingCall.signal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);

        const toUser = activeCall ? activeCall.userId : incomingCall?.from;
        if (toUser) {
            socket.emit('end-call', { to: toUser });
        }

        setActiveCall(null);
        setIncomingCall(null);
    };

    if (!activeCall && !incomingCall) return null;

    return (
        <>
            {/* Floating minimized pill — stays in DOM, shown/hidden via CSS */}
            <div className={`fixed bottom-6 right-6 z-50 items-center gap-3 bg-slate-800/95 border border-emerald-500/30 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-sm ${callAccepted && minimized ? 'flex' : 'hidden'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white text-sm font-medium">Call in progress</span>
                <button onClick={() => setMinimized(false)} className="text-emerald-400 hover:text-emerald-300 transition ml-1" title="Expand">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <button onClick={leaveCall} className="text-red-400 hover:text-red-300 transition" title="End Call">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                </button>
            </div>

            {/* Full-screen call UI — stays in DOM, hidden via CSS when minimized so video refs stay alive */}
            <div className={`fixed inset-0 z-50 bg-slate-900/95 flex-col items-center justify-center backdrop-blur-md ${minimized ? 'hidden' : 'flex'}`}>

                {/* 3-column header: spacer | centered title | minimize button */}
                <div className="w-full grid grid-cols-3 items-center px-6 py-3">
                    <div />
                    <h2 className="text-white text-2xl font-semibold text-center">
                        {activeCall ? `Calling ${activeCall.name || 'User'}...` : `${incomingCall?.name} is calling...`}
                    </h2>
                    <div className="flex justify-end">
                        {callAccepted && (
                            <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white transition" title="Minimize">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6 items-center">
                    {stream && (
                        <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 w-64 h-48 md:w-[320px] md:h-[240px] bg-black shadow-lg shadow-emerald-500/10">
                            <video playsInline muted ref={myVideoRef} autoPlay className="w-full h-full object-cover" />
                            <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur">You</span>
                        </div>
                    )}
                    {callAccepted && !callEnded && remoteStream && (
                        <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500 w-64 h-48 md:w-[320px] md:h-[240px] bg-black shadow-lg shadow-emerald-500/30">
                            <video playsInline ref={userVideoRef} autoPlay className="w-full h-full object-cover" />
                            <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur">Remote</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-6 items-center">
                    {incomingCall && !callAccepted && stream && (
                        <button onClick={answerCall} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full transition shadow-lg shadow-emerald-500/20 font-medium tracking-wide">Answer Call</button>
                    )}
                    {incomingCall && !callAccepted && !stream && (
                        <span className="text-emerald-400 font-medium animate-pulse">Accessing camera/microphone...</span>
                    )}
                    {(activeCall || callAccepted) && (
                        <button onClick={leaveCall} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full transition shadow-lg shadow-red-500/20 font-medium tracking-wide">End Call</button>
                    )}
                    {!callAccepted && incomingCall && (
                        <button onClick={leaveCall} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full transition font-medium tracking-wide">Decline</button>
                    )}
                </div>
            </div>
        </>
    );
};

export default VideoCall;

