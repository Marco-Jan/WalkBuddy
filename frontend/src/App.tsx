import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Flex, Spinner } from '@chakra-ui/react';

import { createToaster } from "@chakra-ui/react";

import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UserList from './components/UserList';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import AccountCard from './components/AccountCard';

import MessagePage from './pages/MessagePage';
import InboxPage from './pages/InboxPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminPage from './pages/AdminPage';
import DatenschutzPage from './pages/DatenschutzPage';
import ImpressumPage from './pages/ImpressumPage';
import ContactPage from './pages/ContactPage';
import Footer from './components/Footer';

import OnboardingModal from './components/OnboardingModal';

import { User } from './types/user';
import { getMe, logout, updateMe } from './api/api';
import { clearKeyStore, loadPrivateKey } from './crypto';




export const toaster = createToaster({
  placement: "top",
  duration: 2500,
});


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();

        // E2EE: Prüfen ob Private Key lokal vorhanden ist
        const pk = await loadPrivateKey();
        if (!pk) {
          // Kein Private Key → Session ungültig für E2EE, Re-Login erzwingen
          try { await logout(); } catch { /* ignore */ }
          await clearKeyStore();
          setUser(null);
          return;
        }

        setUser(me);
        if (!me.hasSeenOnboarding) setShowOnboarding(true);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    await clearKeyStore();
    setUser(null);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    if (!u.hasSeenOnboarding) setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    if (user) {
      try {
        await updateMe({
          name: user.name,
          gender: user.gender,
          humanGender: user.humanGender,
          age: user.age,
          breed: user.breed,
          dogName: user.dogName,
          accessible: !!user.accessible,
          need_his_time: !!user.need_his_time,
          visibleToGender: user.visibleToGender,
          neutered: user.neutered,
          description: user.description,
          hasSeenOnboarding: 1,
        } as any);
        setUser({ ...user, hasSeenOnboarding: 1 });
      } catch {
        // Ignore — onboarding will show again next time
      }
    }
  };

  const handleAccountDeleted = async () => {
    await clearKeyStore();
    localStorage.clear();
    setUser(null);
  };


  if (authLoading)
    return (
      <Flex minH="100vh" align="center" justify="center" bg="sand.300" direction="column" gap="4">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
        <Box color="bark.400" fontWeight="600">Lade…</Box>
      </Flex>
    );

  return (
    <Router>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <Flex minH="100vh" bg="sand.100" direction="column">
        <Header user={user} onLogout={handleLogout} />

        <Box flex="1" maxW="1200px" mx="auto" w="100%" px={{ base: '3', sm: '4', md: '6' }} py={{ base: '4', md: '6' }}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginForm onLogin={handleLogin} />} />

                <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterForm />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
            <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} />

            <Route
              path="/"
              element={
                user ? (
                  <ProtectedRoute user={user}>
                    <UserList user={user} />
                  </ProtectedRoute>
                ) : (
                  <LoginForm onLogin={handleLogin} />
                )
              }
            />

            <Route
              path="/inbox"
              element={
                <ProtectedRoute user={user}>
                  <InboxPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages/:userId"
              element={
                <ProtectedRoute user={user}>
                  <MessagePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/account"
              element={
                <ProtectedRoute user={user}>
                  <AccountCard user={user!} onUpdate={setUser} onAccountDeleted={handleAccountDeleted} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute user={user}>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user}>
                  <AdminPage user={user!} />
                </ProtectedRoute>
              }
            />

            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
          </Routes>
        </Box>

        <Footer />
      </Flex>
    </Router>
  );
};

export default App;
