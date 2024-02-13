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
            ws.send(JSON.stringify({ type: 'message', content: newMessage, senderId: currentUser.uid, receiver: friend, receiverId: friendId, sender: currUserName }));
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
                    const ws = new WebSocket("ws://192.168.0.101:3002");

                    ws.onopen = () => {
                        console.log("WebSocket connection opened");
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
            className="w-full h-full "
        >

            {
                friendSelected && (

                    <div className="w-full h-full overflow-hidden flex flex-col justify-center">

                        {/* header */}

                        <div className="w-full h-16 bg-white flex items-center px-2 md:px-3 lg:px-4">

                            <div className="lg:w-1/2 h-full flex justify-items-start items-center space-x-4 ">
                                <div className="">
                                    <MdKeyboardBackspace className="text-2xl text-black cursor-pointer " onClick={handleBackClick} />
                                </div>

                                <div className="flex justify-center items-center">
                                    <img
                                        className="w-10 h-10 rounded-full me-4 object-contain"
                                        src={friendProfileImg}
                                        alt=""

                                    />
                                    <h1 className="text-md md:text-lg lg:text-xl font-bold font-serif text-black uppercase">{friend}</h1>

                                </div>

                            </div>

                            <div className="lg:w-1/2 flex ms-auto justify-end items-center h-full py-3 md:py-2 md:pe-4 ">

                                <div className="flex items-center me-5 text-center w-28 md:w-32 bg-gray-300 h-full rounded-md ">


                                    <button className="h-full w-1/2 rounded-md cursor-pointer group hover:bg-green-400 hover:text-white transition-all ease-in-out duration-300">

                                        <IoVideocamOutline className="text-2xl mx-auto group-hover:scale-105" />

                                    </button>

                                    <div className="w-[2px] h-1/2 bg-gray-600 group-hover:hidden"></div>

                                    <button
                                        className="w-1/2 h-full rounded-md group hover:bg-cyan-400 cursor-pointer hover:text-white transition-all ease-in-out duration-300">
                                        <IoCallOutline className="text-2xl  mx-auto group-hover:scale-105" />
                                    </button>
                                </div>

                                <CiMenuKebab className="text-2xl hover:tet-3xl transition-all ease-in-out duration-200 text-black cursor-pointer hover:scale-110  h-full " />

                            </div>

                        </div>


                        <div className="h-full w-full relative overflow-x-hidden"
                        style={{
                            maxHeight: "calc(100vh - 8rem)"
                        }}
                        >

                            <div
                                className="absolute w-full h-full bg-cover   bg-center"
                                style={{
                                    backgroundImage: "url('https://res.cloudinary.com/dfsvudyfv/image/upload/v1707239858/1325726_ipzhlg.png')",
                                    filter: "blur(6px)" // Apply the blur effect,                                    

                                }}
                            />

                            <div className="relative w-full h-full flex justify-center overflow-y-auto ">
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

                        </div>

                        {/* Footer Msg typer input*/}

                        <div className="h-16 bg-slate-950 w-full p-1">

                            <div className="w-full h-full py-2 px-4 bg-gray-900 rounded-full ">

                                <div className="flex w-full h-full justify-center">

                                    <div className="flex relative items-center w-full h-full md:px-2">

                                        <div className="flex justify-center h-full cursor-pointer me-4 md:me-6 ">
                                            <button
                                                className="w-fit rounded-md text-yellow-300 group"
                                            >
                                                <BsEmojiSmile
                                                    className="w-full mx-auto group-hover:scale-125 transition duration-300 ease-in-out "
                                                    size={20} />
                                            </button>
                                        </div>

                                        <div className="w-full h-full flex space-x-4">

                                            <div className="w-11/12 md:w-9/12 md:me-16 xl:me-40  md:ms-4  pe-2 my-1 bg-transparent rounded-sm  border-b border-cyan-400 text-white flex justify-center items-center">
                                                <input
                                                    type="text"
                                                    className="w-full h-full focus:outline-none caret-white bg-transparent"
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

                                                <button
                                                    className="rounded-md text-cyan-400 group"
                                                >
                                                    <GoPaperclip
                                                        className="w-full mx-auto group-hover:scale-125 transition duration-300 ease-in-out"
                                                        size={20} />
                                                </button>
                                            </div>

                                            {micToggle && (
                                                <>
                                                    <span className="text-green-400 font-bold absolute right-3 lg:right-9 rotate-90 w-fit -translate-y-12 ">. . .</span>
                                                    <BsMic
                                                        className={`w-10 h-10 p-2 rounded-full absolute right-2 lg:right-8 transition-all bg-green-500 duration-300 ease-in-out ${micToggle ? '-translate-y-24' : 'translate-y-0'
                                                            }`}
                                                        size={20}
                                                        color={micToggle ? 'white' : 'black'}
                                                    />
                                                </>

                                            )}



                                            <button
                                                className="px-5 h-full tracking-wider bg-sky-600 select-none rounded-md text-white font-semibold hover:text-sky-500 border-sky-500 hover:border hover:bg-transparent"
                                                onClick={() => sendMessage(newMessage)}
                                                onTouchStart={() => setMicToggle(true)}
                                                onTouchEnd={() => setMicToggle(false)}
                                            >
                                                {
                                                    micToggle ? <span className="text-green-500 select-none">...</span> : <LuSendHorizonal
                                                        className="w-full mx-auto group-hover:scale-125 select-none  transition duration-300 ease-in-out"
                                                        size={20} />
                                                }
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            </div>


                        </div>



                    </div>

                )
            }
        </div>


    )
}

export default Message