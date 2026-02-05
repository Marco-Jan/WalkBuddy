// src/pages/Home.tsx
import React, { useState } from 'react';
import Header from '../components/Header';
import UserList from '../components/UserList';
import { User } from '../types/user';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <main>
        
        {user ? (
          <UserList />
        ) : (
          <p>Bitte logge dich ein, um andere Hundebesitzer zu sehen.</p>
        )}
      </main>
    </div>
  );
}
