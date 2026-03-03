import { useEffect, useState } from "react";
import { useContext } from "react";
import { Children } from "react";
import { createContext } from "react";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();
export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({}) // will store key value pair userId:with number of mssgs
    const { socket, axios } = useContext(AuthContext);
    //function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users")
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        }
        catch (err) {
            toast.error(err.message)
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        }
        catch (error) {
            toast.error(error.message);
        }
    }

    const sendMessage = async (body) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, body);
            if (data.success) {
                setMessages((prevmessages) => [...prevmessages, data.newMessage])
            }
            else {
                toast.error(data.message);
            }
        }
        catch (error) {
            toast.error(error.message);
        }
    }
    const [incomingCall, setIncomingCall] = useState(null)
    const [activeCall, setActiveCall] = useState(null)

    // function to subscribe to messages for selected User
    const subscribeToMessages = async () => {
        if (!socket) return;
        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevmessages) => [...prevmessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]:
                        prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    const subscribeToCalls = () => {
        if (!socket) return;
        socket.on("incoming-call", (data) => {
            setIncomingCall(data);
        });
        socket.on("call-ended", () => {
            setIncomingCall(null);
            setActiveCall(null);
            toast.success("Call ended");
        });
    }

    //function to unsubscribe from mssgs
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("incoming-call");
            socket.off("call-ended");
        }
    }
    useEffect(() => {
        subscribeToMessages();
        subscribeToCalls();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages,
        incomingCall, setIncomingCall, activeCall, setActiveCall
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}