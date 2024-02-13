// PresenceComponent.js

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Import the db instance from your Firebase configuration file
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const PresenceComponent = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const onlineUsersQuery = query(collection(db, 'users'), where('online', '==', true));
        const querySnapshot = await onSnapshot(onlineUsersQuery, snapshot => {
          const onlineUsersData = [];
          snapshot.forEach(doc => {
            onlineUsersData.push(doc.data());
          });
          console.log('onlineUsersData:', onlineUsersData);
          setOnlineUsers(onlineUsersData);
        });
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();

    // Subscribe to real-time updates for online users
    const unsubscribe = onSnapshot(query(collection(db, 'users'), where('online', '==', true)), snapshot => {
      const onlineUsersData = [];
      snapshot.forEach(doc => {
        onlineUsersData.push(doc.data());
      });
      setOnlineUsers(onlineUsersData);

    });

    return () => unsubscribe();
  }, []);

  return (
    <div className='bg-white text-black h-1/2'>
      <h2>Online Users</h2>
      <ul>
        {onlineUsers.map(user => (
          <li key={user}>{user.uid}</li>
        ))}
      </ul>
    </div>
  );
};

export default PresenceComponent;
