import { useState, useRef, useEffect } from "react"


import { IoSettingsOutline, IoCallOutline, IoArchiveOutline, IoInformationCircle, } from "react-icons/io5";
import { BsChatDots } from "react-icons/bs";
import { ImSpinner10 } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";
import { MdLogout, MdOutlineEdit, MdSort } from "react-icons/md";
import { IoMdCheckmark } from "react-icons/io";
import { FaRegBell } from "react-icons/fa";
import { HiSearch, HiOutlinePlus } from "react-icons/hi";
import { FiHeart } from "react-icons/fi";


import { doc, getDoc, getDocs, query, collection, where, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { auth, storage } from "../../../firebase";


import { sendEmailVerification, updateEmail } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";



const SideNav = ({ ws, userData, currentUser, handleConversationWithFriend, onlineStatus }) => {


    const { friendRequests, friends, email } = userData;

    const { phoneNumber, displayName } = userData.providerData[0];


    const fileInputRef = useRef(null);

    //modals..


    const [addFriendModal, setAddFriendModal] = useState(false);
    const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);



    const [localFriendRequests, setLocalFriendRequests] = useState([]);



    const [localFriends, setLocalFriends] = useState(
        friends
            ? Object.entries(friends).map(([id, friendData]) => ({
                id,
                name: friendData.name,
                photoURL: friendData.photoURL,
            }))
            : []
    );

    const [searchTerm, setSearchTerm] = useState("");

    const filteredFriends = localFriends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchInputChange = event => {
        setSearchTerm(event.target.value);
    };




    //add friend value
    const [recipientEmail, setRecipientEmail] = useState("");


    const [selector, setSelector] = useState("chats");


    //account fields

    const [accUserName, setAccUserName] = useState(displayName || "");
    const [accUserEmail, setAccUserEmail] = useState(email || "");
    const [accUserPhoneNumber, setAccUserPhoneNumber] = useState(phoneNumber || "");



    //settings field buttons

    const [showSettings, setShowSettings] = useState(false);

    const [editingName, setEditingName] = useState(false);
    const [editingEmail, setEditingEmail] = useState(false);
    const [editingPhoneNumber, setEditingPhoneNumber] = useState(false);



    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        await handleUploadImage(file);
    };

    const [photoURL, setPhotoURL] = useState(userData.providerData[0].photoURL);

    useEffect(() => {
        const pendingRequests = Object.values(friendRequests)?.filter(request => request.status === "pending") || [];
        setLocalFriendRequests(pendingRequests);
    }, [friendRequests]);


    const [sendingRequest, setSendingRequest] = useState(false);



    //toggle settings field buttons

    const handleToggleSettings = () => {
        setShowSettings(!showSettings);
    };

    const handleEditName = () => {
        setEditingName(!editingName);
    };

    const handleEditEmail = () => {
        setEditingEmail(!editingEmail);
    };

    const handleEditPhoneNumber = () => {
        setEditingPhoneNumber(!editingPhoneNumber);
    };


    //setting new values

    const handleUploadImage = async (file) => {
        try {
            const userStorageRef = ref(storage, `userProfiles/${currentUser.uid}/`);

            // Upload the image to the user's folder
            const imageRef = ref(userStorageRef, file.name);
            await uploadBytes(imageRef, file);

            // Get the download URL of the uploaded image
            const url = await getDownloadURL(imageRef);

            console.log("Image uploaded successfully:", url);

            // Update the user's document in Firestore with the new photoURL
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {

                const userData = userDocSnapshot.data();

                //check if the user has a photoURL
                if (userData.providerData[0].photoURL) {

                    console.log("User already has a profile picture");
                    const confirm = window.confirm("You already have a profile picture. Do you want to replace it?");
                    if (!confirm) {
                        return;
                    }
                }

                const newProviderData = userData.providerData.map(provider => ({
                    ...provider,
                    photoURL: url // Update the photoURL
                }));

                await updateDoc(userDocRef, {
                    providerData: newProviderData
                });

                setPhotoURL(url); // Update the local state

                console.log("PhotoURL updated successfully");
            } else {
                console.log("User document does not exist");
            }

        } catch (error) {
            console.error("Error uploading image:", error);
        }
    };


    const handleSetNewName = async (newName) => {

        if (newName == null) {
            alert("Please enter a new name");
            setEditingName(false);
            return;
        }
        if (displayName == newName) {
            alert("Name already exists");
            setEditingName(false);
            return;
        }

        try {
            const currentUserDocRef = doc(db, "users", currentUser.uid);
            const currentUserDocSnapshot = await getDoc(currentUserDocRef);
            if (currentUserDocSnapshot.exists()) {
                const userData = currentUserDocSnapshot.data();
                const newProviderData = userData.providerData.map(provider => ({
                    ...provider,
                    displayName: newName // Update the display name
                }));

                await updateDoc(currentUserDocRef, {
                    providerData: newProviderData
                });

                setEditingName(false); // Exit edit mode

            } else {
                console.log("User document does not exist");
            }
        } catch (error) {
            console.error("Error updating name:", error);
        }
    };

    const handleSetNewEmail = async (newEmail) => {

        if (newEmail == null) {
            alert("Please enter a new email");
            setEditingEmail(false);
            return;
        }

        if (email == newEmail) {
            alert("Email already set");
            setEditingEmail(false);
            return;
        }

        try {

            const currentUserDocRef = doc(db, "users", currentUser.uid);
            const currentUserDocSnapshot = await getDoc(currentUserDocRef);
            if (currentUserDocSnapshot.exists()) {
                const userData = currentUserDocSnapshot.data();
                const newProviderData = userData.providerData.map(provider => ({
                    ...provider,
                    email: newEmail // Update the email
                }));

                await sendEmailVerification(auth.currentUser);

                const waitTime = 30000; // 30 seconds
                const interval = 1000; // Check every 1 second
                let elapsedTime = 0;

                const timer = setInterval(async () => {
                    elapsedTime += interval;

                    try {
                        await auth.currentUser.reload();
                    } catch (error) {
                        console.error("Error reloading user:", error);
                        clearInterval(timer);
                        return;
                    }

                    if (elapsedTime >= waitTime) {
                        clearInterval(timer);
                        console.log("Verification time expired. Please try again.");
                        return;
                    }

                    if (auth.currentUser.emailVerified) {
                        console.log("Email verified");
                        clearInterval(timer);

                        try {
                            await updateDoc(currentUserDocRef, {
                                providerData: newProviderData,
                                email: newEmail
                            });
                            updateEmail(auth.currentUser, newEmail)
                                .then(() => {
                                    console.log("Email updated");
                                })
                                .catch((error) => {
                                    console.error("Error updating email:", error);
                                });
                            setEditingEmail(false); // Exit edit mode
                        } catch (error) {
                            console.error("Error updating documents:", error);
                        }
                    }
                }, interval);


            }
            else {
                console.log("User document does not exist");
            }
        } catch (error) {
            console.error("Error updating email:", error);
        }


    }

    const handleSetNewPhoneNumber = async (newPhoneNumber) => {

        console.log("new phone number = ", newPhoneNumber);

        if (newPhoneNumber == null) {
            alert("Phone number not set");
            setEditingPhoneNumber(false);
            return;
        }

        if (phoneNumber == newPhoneNumber) {
            alert("Phone number already set");
            setEditingPhoneNumber(false);
            return;
        }

        try {
            const currentUserDocRef = doc(db, "users", currentUser.uid);
            const currentUserDocSnapshot = await getDoc(currentUserDocRef);
            if (currentUserDocSnapshot.exists()) {
                const userData = currentUserDocSnapshot.data();
                const newProviderData = userData.providerData.map(provider => ({
                    ...provider,
                    phoneNumber: newPhoneNumber // Update the phone number
                }));

                await updateDoc(currentUserDocRef, {
                    providerData: newProviderData
                });

                setAccUserPhoneNumber(newPhoneNumber); // Update the local state
                setEditingPhoneNumber(false); // Exit edit mode

            } else {
                console.log("User document does not exist");
            }
        }
        catch (error) {
            console.error("Error updating phone number:", error);
        }
    };



    //handling requests acceptance and rejection

    const handleRejectRequest = (friendRequest, requestFriendName) => {
        console.log("Rejected ");


        const updatedArray = localFriendRequests.filter((friend) => friend !== friendRequest);
        setlocalFriendRequests(updatedArray);

        const currentUserFriendsRef = doc(db, "users", currentUser.uid);
        updateDoc(currentUserFriendsRef, {
            [`friendRequests.${friendRequest}`]: "rejected"
        });

        const friendRequestSender = doc(db, "users", friendRequest);
        updateDoc(friendRequestSender, {
            [`friendRequests.${currentUser.uid}`]: "rejected"
        });


        setShowFriendRequestModal(false);
    };

    const handleAcceptRequest = async (friendRequest, requestFriendName) => {

        console.log("Accepted");


        // Update the current user's friendRequests field to mark the request as accepted
        const currentUserFriendsRef = doc(db, "users", currentUser.uid);

        await updateDoc(currentUserFriendsRef, {
            [`friendRequests.${friendRequest}.status`]: "accepted"
        });

        // Get the requested friend's document reference
        const friendRequestSenderRef = doc(db, "users", friendRequest);
        const friendRequestSenderSnapshot = await getDoc(friendRequestSenderRef);
        const friendRequestSenderData = friendRequestSenderSnapshot.data();
        const friendRequestSenderPhotoURL = friendRequestSenderData.providerData[0].photoURL;

        await updateDoc(currentUserFriendsRef, {
            [`friends.${friendRequest}`]: {
                name: requestFriendName,
                photoURL: friendRequestSenderPhotoURL
            }
        });

        await updateDoc(friendRequestSenderRef, {
            [`friends.${currentUser.uid}`]: {
                name: displayName,
                photoURL: photoURL
            }
        });


        const currentUserChatDocRef = doc(db, "chats", currentUser.uid);
        const friendChatDocRef = doc(db, "chats", friendRequest);

        //get the chat document of the current user and check if chatHistory collection exists
        const currentUserChatDocSnapshot = await getDoc(currentUserChatDocRef);
        const friendChatDocSnapshot = await getDoc(friendChatDocRef);

        if (currentUserChatDocSnapshot.exists()) {
            //check for present of collection named chatHistory
            const chatHistoryCollectionRef = collection(currentUserChatDocRef, "chatHistory");
            const chatHistoryCollectionSnapshot = await getDocs(chatHistoryCollectionRef);
            if (chatHistoryCollectionSnapshot.empty) {
                await setDoc(doc(chatHistoryCollectionRef, requestFriendName), {
                    //set one field named receiver id and set its value to the friend's id
                    receiverId: friendRequest,
                    messages: []
                });
            }
            //if chatHistory collection exists, add the friend's name to the collection
            else {
                await setDoc(doc(chatHistoryCollectionRef, requestFriendName), {
                    receiverId: friendRequest,
                    messages: []
                });
            }
        }

        if (friendChatDocSnapshot.exists()) {
            //check for present of collection named chatHistory
            const chatHistoryCollectionRef = collection(friendChatDocRef, "chatHistory");
            const chatHistoryCollectionSnapshot = await getDocs(chatHistoryCollectionRef);
            if (chatHistoryCollectionSnapshot.empty) {
                await setDoc(doc(chatHistoryCollectionRef, displayName), {
                    receiverId: currentUser.uid,
                    messages: []
                });
            }
            //if chatHistory collection exists, add the friend's name to the collection
            else {
                await setDoc(doc(chatHistoryCollectionRef, displayName), {
                    receiverId: currentUser.uid,
                    messages: []
                });
            }
        }



        setShowFriendRequestModal(false);
    };


    //adding friend request

    const sendRequest = async () => {

        if (recipientEmail === "") {
            alert("Please enter a recipient email");
            return;
        }

        if (recipientEmail === email) {
            alert("You cannot send a request to yourself");
            return;
        }

        if (displayName === null) {
            alert("Please set your name first");
            return;
        }


        try {
            setSendingRequest(true);
            const usersRef = collection(db, "users");
            const recipientQuery = query(usersRef, where("email", "==", recipientEmail));
            const recipientSnapshot = await getDocs(recipientQuery);

            if (!recipientSnapshot.empty) {

                const recipientUid = recipientSnapshot.docs[0].id;

                //update the friendrequest array of the recipient with the current user's uid
                const recipientDocRef = doc(db, "users", recipientUid);

                // Assuming currentUser has properties `uid` and `displayName`
                const friendRequestObject = {
                    [currentUser.uid]: {
                        uid: currentUser.uid,
                        displayName: displayName,
                        status: "pending" // or "accepted" based on your logic
                    }
                };

                await updateDoc(recipientDocRef, {
                    friendRequests: {
                        ...friendRequestObject
                    }
                });


                setSendingRequest(false);
                alert("Request sent successfully");

                setRecipientEmail("");
                setAddFriendModal(false);

            }


            else {
                alert(" Friend with provided email not found");
                setSendingRequest(false);
            }
        }

        catch (error) {
            console.log("Error sending request:", error);
        }
    };


    const handleChatToFriend = (friendid, friendname, friendPhotoURL) => {
        handleConversationWithFriend(friendid, friendname, friendPhotoURL);
    }


    return (
        <div className="w-full h-full">

            <div className="w-full h-full flex">

                <div className="w-16 fixed left-0 bg-gray-900 h-full pt-32">

                    <div className="w-full px-2 overflow-hidden h-full relative">

                        <div className="w-12 h-12 border-2 border-green-400  mx-auto bg-black rounded-full mb-12 ">
                            <img src={photoURL} alt="dp" className="w-full h-full rounded-full object-cover" />
                        </div>


                        <div className="space-y-6">

                            <button className="w-full h-10 p-2 mx-auto hover:bg-gray-700 hover:cursor-pointer rounded-md transition-all ease-in-out duration-300 text-white  hover:text-green-600"
                                onClick={() => setSelector("chats")}
                            >
                                <BsChatDots className="w-full h-full text" />
                            </button>


                            <button className="w-full h-10 p-2 mx-auto hover:bg-gray-700 hover:cursor-pointer rounded-md transition-all ease-in-out duration-300 text-white hover:text-green-600"
                                onClick={() => setSelector("calls")}
                            >
                                <IoCallOutline className="w-full h-full text" />
                            </button>

                            <button className="w-full h-10 p-2 mx-auto hover:bg-gray-700 hover:cursor-pointer rounded-md transition-all ease-in-out duration-300 text-white hover:text-green-600"
                                onClick={() => setSelector("status")}
                            >
                                <ImSpinner10 className="w-full h-full text" />
                            </button>


                            <button className="w-full h-10 p-2 mx-auto hover:bg-gray-700 hover:cursor-pointer rounded-md transition-all ease-in-out duration-300 text-white hover:text-green-600"
                                onClick={() => setSelector("archive")}
                            >
                                <IoArchiveOutline className="w-full h-full text" />
                            </button>

                            <button className="w-full h-10 p-2 mx-auto hover:bg-gray-700 hover:cursor-pointer rounded-md transition-all ease-in-out duration-300 text-white hover:text-green-600"
                                onClick={handleToggleSettings}
                            >
                                <IoSettingsOutline className="w-full h-full text" />
                            </button>

                        </div>

                        <div className="absolute bottom-0 left-0 pb-8 w-full">

                            <div className="flex flex-col h-fit justify-center items-center space-y-8  w-full">

                                <button onClick={async () => {
                                    try {

                                        window.confirm("Are you sure you want to logout out?");

                                        if (currentUser) {
                                            // Send online status as false to backend
                                            const data = { uid: currentUser.uid, online: false };
                                            ws.send(JSON.stringify({ data: data, type: "presence" }));
                                        }
                                        // Sign out the user
                                        await auth.signOut();
                                    } catch (error) {
                                        console.error("Error signing out:", error);
                                    }
                                }} className=" transform rotate-180 cursor-pointer hover:bg-red-500  text-white w-fit p-2 rounded-md">
                                    <MdLogout className="w-6 h-6" />
                                </button>


                                <button className="w-6  h-6 hover:bg-cyan-500 border-cyan-400 hover:border rounded-full text-white hover:text-black"
                                    onClick={() => setShowInfoModal(true)}
                                >
                                    <IoInformationCircle className="w-full h-full" />
                                </button>

                            </div>

                        </div>

                    </div>
                </div>


                {/* side nav section */}

                <div className="w-full h-full flex flex-col text-center ps-16  bg-gray-800 ">

                    <div className="w-full h-full overflow-hidden">

                        <div className="h-auto w-full">

                            <p className="h-16 align-baseline  text-white mb-4 text-left pt-6 font-bold px-2 tracking-wider text-lg border-0 border-b border-green-300 shadow-green-400 shadow-sm">CHAT-RT</p>

                            <div className="w-full px-2 py-1 mb-2 ">

                                <div className="text-white flex items-center tracking-wide">
                                    <p className="text-left text-lg uppercase italic">{selector}</p>


                                    {/* Notify and sort */}

                                    <div className="ms-auto mr-2 space-x-2 relative ">

                                        <button
                                            className="w-10 h-10 p-2 group hover:bg-gray-700 hover:text-green-500 rounded-md hover:cursor-pointer "
                                            onClick={() => setAddFriendModal(true)}

                                        >
                                            <HiOutlinePlus className="w-full h-full" />
                                            <span
                                                className="absolute invisible opacity-0 transition-all ease-in-out duration-300 group-hover:visible group-hover:opacity-100 -left-3 -bottom-5 text-center text-[10px] bg-gray-900 p-1 px-2 rounded-md text-gray-300"
                                            >Add Friend</span>
                                        </button>

                                        <button
                                            className="w-10 h-10 p-2 group  hover:bg-gray-700 hover:text-green-500 rounded-md hover:cursor-pointer relative"
                                        // onClick={() => setShowModal(!showModal)}

                                        >
                                            <MdSort className="w-full h-full" />
                                            <span
                                                className="absolute visible opacity-0 transition-all ease-in-out duration-300 group-hover:visible group-hover:opacity-100 left-1 -bottom-5 text-center text-[10px] bg-gray-900 p-1 px-2 rounded-md text-gray-300"
                                            >sort</span>
                                        </button>

                                        <button
                                            className="relative w-10 h-10 p-2 group hover:bg-gray-700 hover:text-green-500 rounded-md hover:cursor-pointer "
                                            onClick={() => setShowFriendRequestModal(true)}
                                        >
                                            <FaRegBell className="w-full h-full" />
                                            {localFriendRequests.length > 0 && (
                                                <div className="absolute top-1 right-1 mt-1 mr-1 w-3 h-3 bg-green-600 rounded-full border-white border-2"></div>
                                            )}
                                            <span
                                                className="absolute invisible opacity-0 transition-all ease-in-out duration-300 group-hover:visible group-hover:opacity-100 -right-2 -bottom-5 text-center text-[10px] bg-gray-900 p-1 px-2 rounded-md text-gray-300"
                                            >Requests</span>
                                        </button>

                                    </div>

                                </div>
                            </div>

                            <div className="w-11/12 mx-auto h-10 bg-gray-700 flex items-center justify-center rounded-md px-2 border-0 border-b border-green-500">

                                <input
                                    type="text"
                                    className="w-11/12 h-full bg-gray-700 text-white px-2 focus:outline-none"
                                    value={searchTerm}
                                    onChange={handleSearchInputChange}
                                    placeholder="Search chats.."
                                />
                                <button className="w-1/12 h-full px-1 bg-gray-700 text-white hover:text-green-500 hover:cursor-pointer">
                                    <HiSearch className="w-full h-full" />
                                </button>

                            </div>

                        </div>




                        {/* Friends List */}

                        <div className="h-full relative  overflow-y-auto px-2 sm:px-4 md:px-6 pt-2 ">

                            <div className=" text-white w-full h-full">

                                <div className="text-white pt-6 text-left">
                                    {localFriends.length > 0 ? (
                                        <ul className="">
                                            {localFriends.map(({ id, name, photoURL }) => (
                                                <li
                                                    key={id}
                                                    className="font-semibold tracking-wide group hover:bg-gray-700 hover:text-green-500 p-2 rounded-md hover:cursor-pointer transition-all ease-in-out duration-100 hover:shadow-lg "
                                                    onClick={() => handleChatToFriend(id, name, photoURL)}
                                                >
                                                    <div className="flex justify-center items-center w-full  ">
                                                        <div className="flex justify-start items-center rounded-md w-full">

                                                            <div className="w-12 h-12 relative me-6  ">
                                                                <img
                                                                    src={photoURL}
                                                                    alt={name} // Use the friend's name as alt text
                                                                    className="w-12 h-12 rounded-full mr-8 border object-cover  "
                                                                />
                                                                <span className={`rounded-full absolute bottom-0 right-0 ${onlineStatus[id] ? 'bg-green-400' : 'bg-red-600'} w-3 h-3 ml-2`} />
                                                            </div>

                                                            <p className="uppercase group-hover:ps-1 tracking-wider group-hover:scale-105 transition-all ease-in-out duration-300 ">
                                                                {name}
                                                            </p>
                                                        </div>

                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No friends to display</p>
                                    )}


                                </div>
                            </div>

                            {/* Display filtered friends */}
                            {searchTerm && (
                                <div className="absolute top-0 left-0 w-full h-full py-2 overflow-hidden">
                                    <div className="w-full bg-gray-600 bg-opacity-20 h-full backdrop-filter backdrop-blur-lg p-4 overflow-y-auto">
                                        {filteredFriends.length > 0 ? (
                                            filteredFriends.map(friend => (
                                                <div key={friend.id} className="flex w-full h-16 opacity-100 px-8 text-white font-bold uppercase items-center">
                                                    <img src={friend.photoURL} className="w-12 h-12 rounded-full bg-cover me-8" alt={friend.name} />
                                                    <span>{friend.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-white">No matching friends found</p>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>




                    </div>
                </div>







                {/* M O D A L S */}


                {/* Settings Modal */}


                {showSettings && (
                    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex justify-center items-center bg-gray-900 bg-opacity-50 "
                    >
                        <div className="bg-gray-900 h-fit absolute bottom-54 md:bottom-1 md:left-1 rounded-md md:h-1/2  w-11/12 sm:w-9/12 md:w-96  ">

                            <div className="space-y-6  text-center p-1">

                                <div className="space-y-2 bg-gray-700 py-2 pb-4">

                                    <div className="w-6 h-6 ms-auto me-2 hover:bg-gray-500  rounded-md hover:cursor-pointer">
                                        <RxCross2 className="w-full h-full text-white" onClick={handleToggleSettings} />
                                    </div>

                                    <div className="flex justify-center ">
                                        <div className="relative">
                                            <img src={photoURL}
                                                alt="DP" className=" bg-black w-24 h-24 rounded-full border border-green-500 object-contain" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                                ref={fileInputRef}
                                            />

                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                className="hover:bg-gray-800 hover:text-white transition-all ease-in-out duration-300 p-1 w-6 h-6 rounded-full absolute bottom-0 right-0 bg-white">
                                                <MdOutlineEdit className="w-full h-full"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>



                                {/* NAME */}

                                <div className="flex items-center justify-between px-4 h-10 border-0 border-b border-opacity-15  border-green-500  ">
                                    {
                                        editingName ? (
                                            <input type="text" className="border-2 px-2 py-1 rounded-sm text-black "
                                                placeholder="Enter new name"
                                                value={accUserName}
                                                onChange={(e) => setAccUserName(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-white text-xl font-semibold">
                                                {displayName ? accUserName : <span className="text-gray-400 font-md">Name not set</span>}
                                            </p>
                                        )
                                    }
                                    <div className="text-white px-2 py-1 mr-2" >
                                        {
                                            editingName ? (
                                                <button
                                                    className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300"
                                                    onClick={() => handleSetNewName(accUserName)}
                                                >
                                                    <IoMdCheckmark className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                                </button>
                                            ) : (
                                                <button onClick={handleEditName} className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300">
                                                    <MdOutlineEdit className="w-5 h-5 rounded-full  " />
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>

                                {/* EMAIL */}

                                <div className="flex justify-between items-center px-4 h-10 border-0 border-b border-opacity-15  border-green-500 ">
                                    {
                                        editingEmail ? (
                                            <input type="text" className="border-2 px-2 py-1 rounded-sm text-black"
                                                placeholder="Enter new email"
                                                value={accUserEmail}
                                                onChange={(e) => setAccUserEmail(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-white text-xl font-semibold">
                                                {email ? accUserEmail :
                                                    <span className="text-gray-400 font-md">Email not set</span>
                                                }
                                            </p>
                                        )
                                    }
                                    <div className="text-white px-2 py-1 mr-2 " >
                                        {
                                            editingEmail ? (
                                                <button
                                                    className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300"
                                                    onClick={() => handleSetNewEmail(accUserEmail)}
                                                >
                                                    <IoMdCheckmark className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                                </button>

                                            ) : (
                                                <button onClick={handleEditEmail}
                                                    className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300"
                                                >
                                                    <MdOutlineEdit className="w-5 h-5 rounded-full" />
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>

                                {/* ABOUT */}
                                <div className="flex justify-between items-center px-4 h-10 border-0 border-b border-opacity-15  border-green-500 ">
                                    <p className="text-slate-400 text-md font-semibold">MEN SHOULD SUFFER</p>
                                    <div className="text-white px-2 py-1 mr-2" >
                                        <button
                                            // onClick={handleEditAbout} 
                                            className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300">
                                            <MdOutlineEdit className="w-5 h-5 rounded-full  " />
                                        </button>
                                    </div>
                                </div>


                                {/* PHONE NUMBER */}

                                <div className="flex justify-between items-center px-4 h-10 border-0 border-b border-opacity-15  border-green-500 ">
                                    {
                                        editingPhoneNumber ? (
                                            <input type="text" className="border-2 px-2 py-1 rounded-sm text-black"
                                                placeholder="Enter new phone number"
                                                value={accUserPhoneNumber}
                                                onChange={(e) => setAccUserPhoneNumber(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-white text-xl font-semibold">
                                                {phoneNumber ? accUserPhoneNumber : <span className="text-gray-400 font-md">Phone number not set</span>
                                                }
                                            </p>
                                        )
                                    }
                                    <div className="text-white px-2 py-1 mr-2">
                                        {
                                            editingPhoneNumber ? (
                                                <button
                                                    className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300"
                                                    onClick={() => handleSetNewPhoneNumber(accUserPhoneNumber)}
                                                >
                                                    <IoMdCheckmark className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                                </button>
                                            ) : (
                                                <button onClick={handleEditPhoneNumber}
                                                    className="hover:bg-gray-700 hover:text-green-400 p-1 rounded-md transition-all ease-in-out duration-300"
                                                >
                                                    <MdOutlineEdit className="w-5 h-5 rounded-full" />
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* Friend Request Modal */}

                {showFriendRequestModal && (
                    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex justify-center items-center bg-gray-900 bg-opacity-50"
                    >
                        <div className="bg-gradient-to-b from-slate-100 from-20% via-slate-300  to-gray-800 p-4 rounded-lg h-96 w-96 lg:w-1/3">
                            <div className="w-6 h-6 ms-auto rounded-sm text-red-500 hover:bg-red-500 hover:text-white transition-all ease-in-out duration-150 cursor-pointer                            ">
                                <RxCross2 className="w-full h-full " onClick={() => setShowFriendRequestModal(false)} />
                            </div>

                            {
                                localFriendRequests.length === 0 ? (
                                    <div className="text-center w-full h-full flex pb-12 justify-center items-center">
                                        <p className="text-gray-500 text-xl font-semibold">No friend requests !</p>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <p className="text-black text-xl font-semibold mb-4">Friend Requests</p>
                                        {localFriendRequests.map((friendRequest, index) => (
                                            <div key={`${friendRequest.uid}-${index}`} className="flex hover:scale-105 transition-all ease-in-out duration-300 items-center justify-around py-2 text-center hover:shadow-lg hover:bg-gray-100 select-none">
                                                <p className="text-black text-xl font-semibold">{friendRequest.displayName.toUpperCase()}</p>

                                                <div className="flex justify-center hover:cursor-pointer">
                                                    <button className="bg-green-500 text-white px-4 py-1 rounded-md mr-4 border-2 hover:text-green-600 hover:bg-white  border-green-500 hover:cursor-pointer transition-all ease-in-out duration-200
                                                    " onClick={() => handleAcceptRequest(friendRequest.uid, friendRequest.displayName)}>Accept</button>
                                                    <button className="bg-red-500 text-white px-4 py-1 rounded-md border-2 hover:text-red-600 hover:bg-white  border-red-500 hover:cursor-pointer transition-all ease-in-out duration-200
                                                    " onClick={() => handleRejectRequest(friendRequest.uid, friendRequest.displayName)}>Reject</button>
                                                </div>
                                            </div>
                                        ))}


                                    </div>
                                )
                            }



                        </div>
                    </div>
                )}


                {/* Add friend modal */}

                {addFriendModal && (
                    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex justify-center items-center bg-gray-900 bg-opacity-50"
                    >
                        <div className="p-4 bg-gradient-to-b from-slate-100 from-20% via-slate-300  to-gray-800 shadow-sm shadow-gray-900 rounded-lg h-96 w-96 lg:w-1/3 ">
                            <div className="w-6 h-6 ms-auto  rounded-sm text-red-500 hover:bg-red-500 hover:text-white transition-all ease-in-out duration-150 cursor-pointer">
                                <RxCross2 className="w-full h-full " onClick={() => setAddFriendModal(false)} />
                            </div>

                            <div>
                                <p className="text-black text-center py-4 text-xl underline font-semibold">ADD FRIEND</p>
                                <div className="flex flex-col justify-center items-center space-x-2">

                                    <div className="w-full mb-6 space-y-2 px-2">
                                        <p className="text-black text-xl py-2 font-semibold">Enter recipient email</p>
                                        <input
                                            type="text"
                                            className="w-full h-10 px-2 border-2 border-gray-500 rounded-md text-black"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="Enter recipient email"
                                        />
                                    </div>
                                    <div className="w-1/2 py-2">
                                        <button
                                            className="w-full h-10 bg-green-500 text-white font-bold tracking-wide active:bg-green-600 active:text-white transition-all ease-in-out duration-200 rounded-sm hover:shadow-lg shadow-black hover:border border-green-500 hover:bg-white hover:text-green-500 hover:cursor-pointer"
                                            onClick={sendRequest}>
                                            {
                                                sendingRequest ? (
                                                    "SENDING REQUEST ..."
                                                ) : (
                                                    "SEND REQUEST"
                                                )
                                            }
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* info button modal */}

                {showInfoModal && (
                    <div className="fixed  inset-0 backdrop-filter backdrop-blur-sm flex justify-center items-center bg-gray-900 bg-opacity-20 p-2"
                    >
                        
                        <div className=" shadow-sm shadow-green-600 overflow-hidden py-2 md:p-4 h-2/3 w-96 md:w-2/3 lg:h-3/4 lg:w-3/4 xl:w-2/3 bg-gradient-to-t lg:bg-gradient-to-r from-15% from-slate-200 via-slate-600 to-gray-900 relative touch-none"
                        >
                            <div className="w-6 h-6 ms-auto rounded-sm text-red-500 hover:bg-red-500 hover:text-white transition-all ease-in-out duration-150 cursor-pointer">
                                <RxCross2 className="w-full h-full " onClick={() => setShowInfoModal(false)} />
                            </div>

                            <p className="absolute top-1 left-2 font-bold text-white lg:text-gray-600 underline ">This website is built with <FiHeart className="inline lg:text-black mx-1"/>  by,</p>

                            <div className="text-center  space-y-2 w-full h-full overflow-hidden py-2 lg:px-4 px-1 ">

                                <div className="px-2 w-full flex md:flex-row flex-col  text-center justify-center items-center  bg-gray-900 text-white py-8 md:py-4 rounded-md shadow-sm shadow-green-300 border md:border-2 border-green-500  relative"
                                >
                                    <img src="https://res.cloudinary.com/dfsvudyfv/image/upload/v1708204036/WhatsApp_Image_2024-02-17_at_23.51.24_2a44ad68-removebg-preview_i4440k.png" 
                                        className="rounded-full select-none w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 object-cover text-center top-6 absolute left-8 md:left-2 md:top-2 lg:left-4 lg:top-4 xl:left-24 xl:top-8 " alt="My_img"
                                        onContextMenu={(e) => e.preventDefault()} />
                                    <div className="space-y-2 mt-4">
                                        <h1 className="font-semibold text-lg tracking-wider mb-6 sm:mb-4 md:mb-0">MUKESH S</h1>
                                        <h3 className="font-bold text-xl pb-2 lg:text-2xl">WEB DESIGN & DEVELOPER</h3>
                                        <p className="font-semibold text-md text-gray-400 ">
                                            SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full h-full text-left overflow-y-auto ">

                                    <div
                                        className="py-4 px-2 lg:grid grid-cols-2 h-fit w-full mb-8">

                                        <div className=" " >
                                            <p className="font-semibold text-xl mb-2">TECH STACK USED:</p>

                                            <div className="">
                                                <p className="border-b-2 border-green-500 w-fit font-bold text-black">BACKEND</p>
                                                <ul className="p-4 space-y-2">
                                                    <li className="font-semibold font-mono">
                                                        FIREBASE <span className=" font-normal ms-2 text-md">User auth, Conversation handlers, Online presence notify in real-time, Database</span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        NODE JS <span className=" font-normal ms-2 text-md">Backend server environment</span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        EXPRESS JS <span className=" font-normal ms-2 text-md">App server & route handler </span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        WEBSOCKETS <span className=" font-normal ms-2 text-md">Socket connections and Conversation listeningserver</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="border-b-2 border-green-500 w-fit font-bold text-black"> FRONTEND</p>
                                                <ul className="p-4 space-y-2">
                                                    <li className="font-semibold font-mono">
                                                        REACT JS LIBRARY <span className="ms-2 text-md font-normal ">Frontend Framework</span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        FIREBASE <span className="ms-2 text-md font-normal">Auth state handler, Build tools for conversations, User options</span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        TAILWIND CSS <span className="ms-2 text-md font-normal">UI responsive design and colorschemes</span>
                                                    </li>
                                                    <li className="font-semibold font-mono">
                                                        VITE <span className="ms-2 text-md font-normal">Development server</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="md:text-white  space-y-6">
                                            <p className="font-semibold text-xl mb-2">TECH STACK OVERVIEW:</p>

                                            <div className="mb-2 text-center">
                                                <div className="flex items-center justify-center space-x-4 mb-2">
                                                    <h1 className="font-bold">REACT JS</h1>
                                                    <img src="" alt="react" className="w-6 h-6 bg-white rounded-full" />
                                                </div>
                                                <p className="w-11/12 md:text-gray-200">
                                                    JavaScript library for building user interfaces.
                                                    Component-based architecture for modular and reusable UI development.
                                                    Efficient updates through Virtual DOM and support for server-side rendering.
                                                </p>
                                            </div>

                                            <div className="mb-2 text-center">
                                                <div className="flex items-center justify-center space-x-4 mb-2">
                                                    <h1 className="font-bold">FIREBASE</h1>
                                                    <img src="" alt="react" className="w-6 h-6 bg-white rounded-full" />
                                                </div>
                                                <p className="w-11/12 md:text-gray-200">
                                                    Google&apos;s platform for mobile and web app development.
                                                    Services include real-time database, authentication, hosting, and cloud functions.
                                                    Enables real-time data synchronization, secure user authentication, and scalable database solutions.
                                                </p>
                                            </div>

                                            <div className="mb-2 text-center">
                                                <div className="flex items-center justify-center space-x-4 mb-2">
                                                    <h1 className="font-bold">WEBSOCKETS</h1>
                                                    <img src="" alt="react" className="w-6 h-6 bg-white rounded-full" />
                                                </div>

                                                <p className="w-11/12 md:text-gray-200">
                                                    Communication protocol providing full-duplex channels over a single TCP connection.
                                                    Enables real-time, bidirectional data transfer between clients and servers.
                                                    Ideal for applications requiring frequent updates or real-time interactions like chat apps and online gaming.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-11/12 h-fit py-8 font-mono space-y-6 mx-auto h-ful text-white px-8 bg-gray-900 rounded-md ">
                                        <p className="font-bold ">PROJECT OVERVIEW:</p>
                                        <p className="indent-8">
                                            In this project, I&apos;ve harnessed a powerful tech stack to develop a versatile and efficient web chat application, complete with real-time communication capabilities. The frontend is powered by React.js, a dynamic JavaScript library renowned for its component-based architecture, fostering code reusability and scalability. To streamline development, I&apos;ve adopted Vite.js, a modern build tool known for its efficiency.

                                        </p>
                                        <p className="indent-8">
                                            On the backend, Node.js serves as the foundation, offering scalability and performance. Leveraging Express.js, a minimalist web framework, I&apos;ve rapidly developed APIs with intuitive routing and middleware support. WebSocket communication, facilitated by the ws library, enables seamless real-time bidirectional data transfer between clients and the server, essential for instant messaging functionality.
                                            <br />
                                        </p>
                                        <p className="indent-8">
                                            For data management, Firebase Firestore, a flexible NoSQL database, ensures seamless synchronization and offline support. Additionally, Firebase Authentication guarantees secure user login, while Firebase Storage efficiently handles file uploads and downloads.
                                            <br />
                                        </p>
                                        <p className="indent-8">
                                        The application is hosted on Vercel and Netlify, renowned for their reliability and seamless deployment processes. With built-in CI/CD pipelines, updates are effortlessly deployed, ensuring scalability and uninterrupted service. By integrating these technologies, the project delivers a responsive, secure, and scalable web chat application, tailored to modern communication needs.

                                        </p>
                                    </div>

                                    <div className="h-44"></div>

                                </div>

                            </div>

                        </div>


                    </div>
                )}

            </div>


        </div >
    )
}

export default SideNav