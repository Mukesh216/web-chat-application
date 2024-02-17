import { useEffect, useState } from "react";
import { IoVideocamOutline } from "react-icons/io5";
import { IoCallOutline } from "react-icons/io5";
import { CiMenuKebab } from "react-icons/ci";
import { MdKeyboardBackspace } from "react-icons/md";
import { LuSendHorizonal } from "react-icons/lu";
import { BsEmojiSmile } from "react-icons/bs";
import { GoPaperclip } from "react-icons/go";
import { BsMic } from "react-icons/bs";

import { doc, getDoc, getDocs, query, collection, where, setDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";


const Message = ({ friend, friendId, friendProfileImg, friendSelected, userData, currentUserUid, setFriendSelect }) => {

    const [chats, setChats] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userDataMsg, setUserDataMsg] = useState(userData || {});

    const [currUserName, setCurrUserName] = useState(userData.providerData[0].displayName || "");


    const [currentUser, setCurrentUser] = useState(currentUserUid || {});

    const [micToggle, setMicToggle] = useState(false);

    const [ws, setWs] = useState(null);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                if (!currentUser.uid) return;


                const chatDocRef = doc(db, "chats", currentUser.uid);
                const chatDocSnapshot = await getDoc(chatDocRef);
                if (chatDocSnapshot.exists()) {
                    const chatHistoryRef = collection(chatDocRef, "chatHistory");
                    const chatHistorySnapshot = await getDocs(chatHistoryRef);
                    if (!chatHistorySnapshot.empty) {
                        const chatHistoryData = {};
                        chatHistorySnapshot.forEach((doc) => {
                            chatHistoryData[doc.id] = doc.data();
                        });
                        setChats(chatHistoryData);
                        console.log("Chat history fetched", chatHistoryData);
                    }
                } else {
                    console.log("Chat document does not exist");
                }

                if (friend) {
                    handleConversationWithFriend(friend);
                }

                const chatHistoryRef = collection(chatDocRef, "chatHistory");
                const unsubscribeChat = onSnapshot(chatHistoryRef, (snapshot) => {
                    const updatedChats = {};
                    snapshot.forEach((doc) => {
                        updatedChats[doc.id] = doc.data();
                    });
                    setChats(updatedChats);
                    console.log("Chat history updated", updatedChats);
                });

                const unsubscribeUserData = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
                    setUserDataMsg(doc.data());
                });

                return () => {
                    unsubscribeChat();
                    unsubscribeUserData();
                };
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        fetchChatHistory();
    }, [currentUser]); // Dependency on currentUser


    const sendMessage = (newMessage) => {

        if (ws && newMessage.trim() !== "") {
            console.log("Sending message: " + friend);
            // Send the message to the WebSocket server
            const data = { content: newMessage, senderId: currentUser.uid, receiver: friend, receiverId: friendId, sender: currUserName };
            ws.send(JSON.stringify({ type: 'message', data: data }));
        }
        setNewMessage("");
    };



    const handleConversationWithFriend = async (friend, friendId) => {

        const chatDocRef = doc(db, "chats", currentUser.uid);

        const chatDocSnapshot = await getDoc(chatDocRef);


        if (chatDocSnapshot.exists()) {

            //check if chatHistory collection exists
            const chatHistoryRef = collection(chatDocRef, "chatHistory");
            const chatHistorySnapshot = await getDocs(chatHistoryRef);

            if (!chatHistorySnapshot.empty) {

                //check if chat document exists for the recipient
                const recipientChatDocRef = doc(chatHistoryRef, friend);
                const recipientChatDocSnapshot = await getDoc(recipientChatDocRef);

                if (recipientChatDocSnapshot.exists()) {


                    //create websocket connection
                    const ws = new WebSocket("wss://render-chat-backend.onrender.com");

                    ws.onopen = () => {
                        console.log("WebSocket connection opened for messaging");
                        // Once the connection is open, send a message to the server indicating the friend selected
                    };

                    ws.onmessage = (event) => {
                        console.log("WebSocket message received");
                        const receivedMessage = JSON.parse(event.data);
                        console.log("receivedMessage = ", receivedMessage);
                        // setChats((prevChats) =>[prevChats, receivedMessage]);
                    };


                    ws.onclose = () => {

                        console.log("WebSocket connection closed");
                        const data = { uid: currentUser.uid, online: false };
                        ws.send(JSON.stringify({ data: data, type: "presence" }));
                    };

                    // Store the WebSocket connection in state
                    setWs(ws);


                    console.log("Chat document exists for the recipient");
                } else {

                    console.log("Chat document does not exist for the recipient");
                    //create a new chat document for the recipient with recipientUid as the document id
                    const recipientChatDocRef = doc(chatHistoryRef, friend);
                    await setDoc(recipientChatDocRef, {
                        messages: []
                    });
                }
            } else {
                console.log("Chat history collection does not exist");
                //create a new chat document for the recipient with recipientUid as the document id
                const recipientChatDocRef = doc(chatHistoryRef, friend);
                await setDoc(recipientChatDocRef, {
                    receiverId: friendId,
                    messages: []
                });
            }
        } else {
            console.log("Chat document does not exist for the current user");
        }
    }


    const handleBackClick = () => {
        console.log(currentUser.providerData[0].photoURL);
        setFriendSelect(false);
    }



    return (

        <div
            className="w-full h-full"
        >

            {
                friendSelected && (

                    <div className="w-full h-full bg-gray-700 overflow-hidden flex  flex-col justify-center">

                        {/* header */}

                        <div className="w-full flex h-16 bg-white lg:flex items-center px-2 md:px-3 lg:px-4">

                            <div className="w-1/2 flex h-full items-center">

                                <button className="mr-4 ">
                                    <MdKeyboardBackspace className="text-2xl text-black cursor-pointer " onClick={handleBackClick} />
                                </button>

                                <div className="flex justify-center items-center ">
                                    <img
                                        className="w-10 h-10 rounded-full me-4 object-contain"
                                        src={friendProfileImg}
                                        alt=""

                                    />
                                    <h1 className="text-md md:text-lg lg:text-xl font-bold font-serif text-black uppercase">{friend}</h1>
                                </div>

                            </div>

                            <div className="flex w-fit justify-end items-center ms-auto">

                                <div className="flex rounded-md divide-x  sm:me-4 md:me-6 lg:me-8 hover:divide-gray-600 bg-gray-300 overflow-hidden">

                                    <button className="px-2 py-1 sm:px-4 sm:py-2 hover:bg-cyan-400 hover:text-white  transition ease-in-out duration-300">
                                        <IoVideocamOutline className="text-2xl md:text-3xl" />
                                    </button>

                                    <button className="px-2 py-1 sm:px-4 sm:py-2 hover:bg-green-500 hover:text-white  transition ease-in-out duration-300">
                                        <IoCallOutline className="text-2xl md:text-3xl" />
                                    </button>

                                </div>

                                <button className="w-6 h-6 sm:w-10 sm:h-10 rounded-md shadow-md hover:border-2 border-gray-500 mx-2 transition ease-in-out duration-300">
                                    <CiMenuKebab className="mx-auto w-full text-2xl md:text-3xl" />
                                </button>

                            </div>

                        </div>


                        {/* conversation */}

                        <div className="w-full text-white overflow-y-auto"
                            style={{
                                minHeight: "calc(100vh - 8rem)",
                                maxHeight: "calc(100vh - 8rem)"
                            }}
                        >
                            <div className="w-full h-full flex justify-center ">
                                <div className="w-full px-4 pt-2"

                                >
                                    {friend && (
                                        <div>
                                            {chats[friend] && (
                                                <div>
                                                    <div className="w-full md:p-4 ">
                                                        {chats[friend].messages.map((conversation, index) => (
                                                            <div key={index} className="text-black py-2 ">
                                                                {
                                                                    conversation.sender === currUserName ? (
                                                                        <div className="w-full flex flex-col justify-end items-end relative">
                                                                            <h1 className="text-white font-bold text-sm mb-2">YOU</h1>
                                                                            <div className="w-fit trun bg-blue-500  rounded-tr-none rounded-br-xl rounded-xl">
                                                                                <p className="me-2 pe-20  text-lg  text-white px-4 py-2 max-w-2xl h-1/2">{conversation.content}
                                                                                    <span className="absolute bottom-0 right-4  text-white text-sm">
                                                                                        {
                                                                                            (() => {
                                                                                                const date = new Date(conversation.timestamp);
                                                                                                let hour = date.getHours();
                                                                                                const minute = date.getMinutes().toString().padStart(2, '0'); // Ensure two-digit format
                                                                                                const period = hour >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
                                                                                                hour = hour % 12 || 12; // Convert hour to 12-hour format
                                                                                                const ISTtime = `${hour}:${minute} ${period}`;
                                                                                                return ISTtime;
                                                                                            })()
                                                                                        }
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full flex flex-col justify-start items-start relative text-left">
                                                                            <h1 className="text-sm font-bold mb-2 text-white uppercase">{friend}</h1>
                                                                            <div className="w-fit bg-red-500  rounded-tr-3xl  rounded-tl-none rounded-b-3xl ">
                                                                                <p className="ms-2 pe-24 text-lg relative p-2  text-white h-fit ">{conversation.content}
                                                                                    <span className="absolute bottom-1 right-4 text-white text-sm">
                                                                                        {
                                                                                            (() => {
                                                                                                const date = new Date(conversation.timestamp);
                                                                                                let hour = date.getHours();
                                                                                                const minute = date.getMinutes().toString().padStart(2, '0'); // Ensure two-digit format
                                                                                                const period = hour >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
                                                                                                hour = hour % 12 || 12; // Convert hour to 12-hour format
                                                                                                const ISTtime = `${hour}:${minute} ${period}`;
                                                                                                return ISTtime;
                                                                                            })()
                                                                                        }
                                                                                    </span>

                                                                                </p>
                                                                            </div>

                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>


                        {/* footer message input */}

                        <div className=" w-full h-16 px-2 bg-slate-950">
                            <div className="w-full bg-slate-950 h-full overflow-hidden py-1">

                                <div className="w-full px-4 h-full bg-gray-900  border border-white rounded-full flex items-center overflow-hidden">

                                    <div className="flex justify-center items-center h-full w-9/12">


                                        <button className="text-yellow-400  transition ease-in-out duration-300 lg:p-2">
                                            <BsEmojiSmile className="text-2xl" />
                                        </button>
                                        <input
                                            type="text"
                                            className="w-full h-full text-white ms-4 focus:outline-none caret-white bg-transparent"
                                            value={newMessage}
                                            placeholder="Type a message..."
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    sendMessage(newMessage);
                                                }
                                            }
                                            }

                                        />
                                    </div>

                                    <div className=" flex justify-center items-center ms-auto  overflow-hidden space-x-2 text-white me-4">

                                        <button
                                            className="px-2 py-1 sm:px-4 sm:py-2 hover:bg-green-400 rounded-md transition ease-in-out duration-300 hover:text-black"
                                        >
                                            <GoPaperclip className="text-2xl md:text-3xl" />
                                        </button>

                                        <button
                                            className="px-2 py-1 sm:px-4 sm:py-2 rounded-sm transition ease-in-out duration-300 hover:text-cyan-400 "
                                            onClick={() => sendMessage(newMessage)}
                                            onTouchStart={() => setMicToggle(true)}
                                            onTouchEnd={() => setMicToggle(false)}
                                        >
                                            <LuSendHorizonal className="text-2xl md:text-3xl" />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>


                        {/* <div className="h-full w-full bg-gray-800 overflow-y-auto "
                        >

                            <div className="w-full h-full flex justify-center ">
                                <div className="w-full px-4 pt-6"

                                >
                                    {friend && (
                                        <div>
                                            {chats[friend] && (
                                                <div>
                                                    <div className="w-full md:p-4 ">
                                                        {chats[friend].messages.map((conversation, index) => (
                                                            <div key={index} className="text-black py-2 ">
                                                                {
                                                                    conversation.sender === currUserName ? (
                                                                        <div className="w-full flex flex-col justify-end items-end relative">
                                                                            <h1 className="text-white font-bold text-sm mb-2">YOU</h1>
                                                                            <div className="w-fit trun bg-blue-500  rounded-tr-none rounded-br-xl rounded-xl">
                                                                                <p className="me-2 pe-20  text-lg  text-white px-4 py-2 max-w-2xl h-1/2">{conversation.content}
                                                                                    <span className="absolute bottom-0 right-4  text-white text-sm">
                                                                                        {
                                                                                            (() => {
                                                                                                const date = new Date(conversation.timestamp);
                                                                                                let hour = date.getHours();
                                                                                                const minute = date.getMinutes().toString().padStart(2, '0'); // Ensure two-digit format
                                                                                                const period = hour >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
                                                                                                hour = hour % 12 || 12; // Convert hour to 12-hour format
                                                                                                const ISTtime = `${hour}:${minute} ${period}`;
                                                                                                return ISTtime;
                                                                                            })()
                                                                                        }
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full flex flex-col justify-start items-start relative text-left">
                                                                            <h1 className="text-sm font-bold mb-2 text-white uppercase">{friend}</h1>
                                                                            <div className="w-fit bg-red-500  rounded-tr-3xl  rounded-tl-none rounded-b-3xl ">
                                                                                <p className="ms-2 pe-24 text-lg relative p-2  text-white h-fit ">{conversation.content}
                                                                                    <span className="absolute bottom-1 right-4 text-white text-sm">
                                                                                        {
                                                                                            (() => {
                                                                                                const date = new Date(conversation.timestamp);
                                                                                                let hour = date.getHours();
                                                                                                const minute = date.getMinutes().toString().padStart(2, '0'); // Ensure two-digit format
                                                                                                const period = hour >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
                                                                                                hour = hour % 12 || 12; // Convert hour to 12-hour format
                                                                                                const ISTtime = `${hour}:${minute} ${period}`;
                                                                                                return ISTtime;
                                                                                            })()
                                                                                        }
                                                                                    </span>

                                                                                </p>
                                                                            </div>

                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div> */}



                    </div>

                )
            }
        </div>


    )
}

export default Message