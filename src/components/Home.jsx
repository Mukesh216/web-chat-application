import { useState, useEffect } from "react";

import { auth } from "../../firebase";

import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "../../firebase";
import SideNav from "./Interface/SideNav";
import Message from "./Interface/Message";

function Home() {

    const [ws, setWs] = useState(null);

    const [onlineStatus, setOnlineStatus] = useState({});

    const [currentUser, setCurrentUser] = useState(null);

    const [userData, setUserData] = useState(null);


    const [friendSelected, setFriendSelected] = useState(false);
    const [friend, setFriend] = useState("");
    const [friendId, setFriendId] = useState("");
    const [friendProfileImg, setFriendProfileImg] = useState("");


    // Define an environment variable for WebSocket URL



    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("User is signed in", user.email);
                setCurrentUser(user);

                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                setUserData(docSnap.data());

                // User entry websocket connection
                const UserEntry = new WebSocket("wss://render-chat-backend.onrender.com");

                UserEntry.onopen = () => {
                    console.log("User Entry WebSocket connection opened");
                    const data = { uid: user.uid, online: true};
                    UserEntry.send(JSON.stringify({ data: data,  type: "presence" }));
                    setWs(UserEntry);  
                };

                UserEntry.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    setOnlineStatus((prevStatus) => ({
                        ...prevStatus,
                        [message.friendId]: message.online,
                    }));
                };

                UserEntry.onclose = () => {
                    console.log("User Entry WebSocket connection closed");
                    const data = { uid: user.uid, online: false };
                    UserEntry.send(JSON.stringify({ data: data, type: "presence" }));
                }

                const unsubscribeUserData = onSnapshot(docRef, (doc) => {
                    setUserData(doc.data());
                });

                // Timeout for automatic signout after 10 minutes of inactivity
                const timeout = setTimeout(async () => {
                    try {
                        // Send online status as false to backend
                        if (UserEntry && UserEntry.readyState === WebSocket.OPEN) {
                            UserEntry.send(JSON.stringify({ uid: user.uid, online: false }));
                        }
                        // Sign out the user
                        await auth.signOut();
                    } catch (error) {
                        console.error("Error signing out:", error);
                    }
                }, 10 * 60 * 10000); // 5 seconds for testing, change to 10 minutes in milliseconds for production

                // Cleanup function
                return () => {
                    unsubscribeUserData();
                    clearTimeout(timeout);
                };
            } else {
                window.location.href = "/";
            }

        });

        return () => {
            console.log("Unsubscribing from auth changes");
            unsubscribe(); // Unsubscribe from the auth state changes
        };
    }, []);








    const handleConversationWithFriend = (friendid, friend, friendPhotoURL) => {

        setFriend(friend);

        setFriendId(friendid);

        setFriendSelected(true);

        setFriendProfileImg(friendPhotoURL);
    }





    return (
        <div className="flex h-screen w-full">

            <div className="w-full bg-black relative lg:grid grid-cols-5 xl:grid-cols-4">

                {/* Sidebar */}
                <div className="w-full h-full flex col-span-2 xl:col-span-1 ">

                    <div className="w-full h-full ">


                        {userData && <SideNav ws={ws} onlineStatus={onlineStatus} currentUser={currentUser} userData={userData} handleConversationWithFriend={handleConversationWithFriend} />}

                    </div>



                </div>



                {/* Main content */}
                <div className="hidden lg:block col-span-3 xl:col-span-3 h-full w-full">
                    {
                        friendSelected ? (

                            <div className="w-full h-full z-10">
                                {
                                    friend &&
                                    (
                                        <Message friend={friend} friendId={friendId} friendProfileImg={friendProfileImg} friendSelected={friendSelected} userData={userData} currentUserUid={currentUser} setFriendSelect={setFriendSelected} />
                                    )
                                }
                            </div>

                        ) : (
                            <div className="w-full h-full hidden md:flex justify-center items-center text-center bg-slate-300">
                                <div className="space-y-6">
                                    <h1 className="text-5xl font-serif font-bold text-black">Welcome to chat-RT</h1>

                                    <p className="text-lg text-gray-700">Chat-RT is a real-time chat application that allows you to send with your friends in real-time</p>

                                    <p className="text-lg text-gray-700">Select your friend and start chatting</p>

                                </div>
                            </div>
                        )
                    }
                </div>



                {/* Mobile view */}

                {
                    friendSelected &&
                    <div className=" w-full h-full absolute left-0 top-0 block lg:hidden">

                        <div className=" h-full">

                            <div className="w-full h-full ">
                                {
                                    friend && <Message friend={friend} friendId={friendId} friendProfileImg={friendProfileImg} friendSelected={friendSelected} userData={userData} currentUserUid={currentUser} setFriendSelect={setFriendSelected} />
                                }
                            </div>

                        </div>
                    </div>
                }

            </div>

        </div>
    );

}

export default Home;        
