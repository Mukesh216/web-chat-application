import { WebSocketServer as Server } from "ws";
import {doc,  setDoc,  getDoc,  collection,  updateDoc,  onSnapshot} from "firebase/firestore";
import { db } from "./firebase.js";


export function handleWebSocketConnections(messageServer, presenceServer) {
  const messageWss = new Server({ server: messageServer });
  const presenceWss = new Server({ server: presenceServer });


  messageWss.on("connection", (ws) => {
    console.log("WebSocket connection opened");
    ws.on("message", async (message) => {
      try {
        const { content, senderId, receiver, receiverId, sender } =
          JSON.parse(message);

        const currentDate = new Date();
        const options = { timeZone: "Asia/Kolkata" };
        const datePart = currentDate.toISOString().split("T")[0]; // Extract the date part
        const timePart = currentDate.toLocaleTimeString("en-IN", {
          ...options,
          hour: "2-digit",
          minute: "2-digit",
        });
        const time = `${datePart} ${timePart}`;

        // For messages sent by the sender  
        const senderDocRef = doc(db, "chats", senderId);
        const receiverFriendDocRef = doc(
          collection(senderDocRef, "chatHistory"),
          receiver
        );

        await addMessageToDocument(receiverFriendDocRef, sender, content);

        const receiverDocRef = doc(db, "chats", receiverId);
        const senderFriendDocRef = doc(
          collection(receiverDocRef, "chatHistory"),
          sender
        );

        await addMessageToDocument(senderFriendDocRef, sender, content);

        // Send the message back to the sender (optional)
        ws.send(JSON.stringify({ sender, receiver, content, time }));
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    async function addMessageToDocument(docRef, sender, content) {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const messages = existingData.messages || [];
          messages.push({
            sender,
            content,
            timestamp: new Date().toISOString(),
          });

          // Merge the existing data with the new messages array
          const newData = { ...existingData, messages };

          await setDoc(docRef, newData);
        }
      } catch (error) {
        console.error("Error adding message to document:", error);
      }
    }

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });

  presenceWss.on("connection", (ws) => {
    console.log("Presence WebSocket connection opened");
    ws.on("message", async (message) => {
      try {
        const { uid, online } = JSON.parse(message);
        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, { online });

        if (!online) {
          ws.close();
          return;
        }

        if (online) {
          const friendUnsubscribes = []; // Array to store unsubscribe functions for friend listeners

          const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
            const userData = snapshot.data();
            const friends = userData.friends || {};

            for (const friendId of Object.keys(friends)) {
              const friendName = friends[friendId];

              try {
                const friendDocRef = doc(db, "users", friendId);
                const unsubscribeFriend = onSnapshot(
                  friendDocRef,
                  (friendSnapshot) => {
                    const friendData = friendSnapshot.data();
                    const isOnline = friendData
                      ? friendData.online || false
                      : false;

                    ws.send(
                      JSON.stringify({ friendName, friendId, online: isOnline })
                    );
                  }
                );

                // Add the unsubscribe function to the array
                friendUnsubscribes.push(unsubscribeFriend);
              } catch (error) {
                console.error("Error fetching friend data:", error);
              }
            }
          });

          // Cleanup function for user snapshot listener
          ws.on("close", () => {
            console.log("Presence WebSocket connection closed");
            unsubscribe(); // Unsubscribe from user snapshot listener

            // Unsubscribe from all friend snapshot listeners
            friendUnsubscribes.forEach((unsubscribeFriend) =>
              unsubscribeFriend()
            );
          });
        }
      } catch (error) {
        console.error("Error processing presence update:", error);
      }
    });
  });
}
