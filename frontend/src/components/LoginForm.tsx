import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
import { User } from '../types/user';
import { uploadKeys, resendVerification, getApiUrl } from '../api/api';
import {
  generateKeyPair,
  exportPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  storePrivateKey,
} from '../crypto';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [verifiedBanner, setVerifiedBanner] = useState<'success' | 'error' | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const [resetBanner, setResetBanner] = useState(false);

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === '1') setVerifiedBanner('success');
    else if (verified === '0') setVerifiedBanner('error');

    if (searchParams.get('reset') === '1') setResetBanner(true);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${getApiUrl()}/auth/login`, {
        email,
        password
      });

      const loggedInUser: User = res.data.user;
      onLogin(loggedInUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));

      // E2EE: Private Key entschlüsseln und lokal speichern
      const encPrivKey = res.data.encryptedPrivateKey;
      if (encPrivKey) {
        try {
          const privateKey = await decryptPrivateKey(encPrivKey, password);
          await storePrivateKey(privateKey);
        } catch {
          console.error('E2EE: Konnte privaten Schlüssel nicht entschlüsseln');
        }
      } else {
        // Bestehender User ohne Schlüssel → erstmalig generieren
        try {
          const keyPair = await generateKeyPair();
          const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
          const encKey = await encryptPrivateKey(keyPair.privateKey, password);
          await uploadKeys(pubKeyBase64, encKey);
          await storePrivateKey(keyPair.privateKey);
        } catch {
          console.error('E2EE: Konnte Schlüssel nicht generieren');
        }
      }

      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Fehler beim Login';
      setMessage(errorMsg);
      if (errorMsg.includes('Email-Adresse')) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Bitte gib deine Email-Adresse ein.');
      return;
    }
    try {
      await resendVerification(email);
      setResendSent(true);
      setMessage('');
    } catch {
      setMessage('Fehler beim erneuten Senden.');
    }
  };

  return (
    <Flex minH="70vh" align="center" justify="center">
      <Box
        bg="white"
        borderRadius="xl"
        boxShadow="lg"
        p={{ base: '5', md: '8' }}
        w="full"
        maxW="420px"
        mx={{ base: '2', md: '0' }}
      >
        <Flex direction="column" align="center" mb="6">
          <Box mb="2"><FaPaw color="#2D6A4F" size="40" /></Box>
          <Heading as="h2" size="lg" color="bark.500">
            Willkommen zurück
          </Heading>
        </Flex>

        {verifiedBanner === 'success' && (
          <Box bg="green.100" border="1px solid" borderColor="green.300" borderRadius="md" p="3" mb="4" textAlign="center">
            <Text color="green.700" fontSize="sm" fontWeight="600">
              Email bestätigt! Du kannst dich jetzt einloggen.
            </Text>
          </Box>
        )}
        {verifiedBanner === 'error' && (
          <Box bg="red.100" border="1px solid" borderColor="red.300" borderRadius="md" p="3" mb="4" textAlign="center">
            <Text color="red.700" fontSize="sm" fontWeight="600">
              Ungültiger oder abgelaufener Verifizierungs-Link.
            </Text>
          </Box>
        )}
        {resetBanner && (
          <Box bg="green.100" border="1px solid" borderColor="green.300" borderRadius="md" p="3" mb="4" textAlign="center">
            <Text color="green.700" fontSize="sm" fontWeight="600">
              Passwort wurde geändert! Du kannst dich jetzt einloggen.
            </Text>
          </Box>
        )}

        <Text fontSize="sm" color="bark.400" mb="4" textAlign="center">
          Noch keinen Account?{' '}
          <Box as={RouterLink as any} {...{to: "/register"} as any} color="ember.500" fontWeight="600">
            Hier registrieren
          </Box>
        </Text>

        <form onSubmit={handleLogin}>
          <Box mb="4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              size="lg"
            />
          </Box>
          <Box mb="2">
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              size="lg"
            />
          </Box>
          <Text fontSize="xs" color="bark.400" mb="4" textAlign="right">
            <Box as={RouterLink as any} {...{to: "/forgot-password"} as any} color="ember.500" fontWeight="600">
              Passwort vergessen?
            </Box>
          </Text>
          <Button
            type="submit"
            bg="forest.500"
            color="white"
            _hover={{ bg: 'forest.600' }}
            width="full"
            size="lg"
            fontWeight="700"
          >
            Login
          </Button>
          {message && (
            <Text mt="3" color="ember.500" fontSize="sm" textAlign="center">
              {message}
            </Text>
          )}
          {showResend && !resendSent && (
            <Button
              mt="3"
              variant="outline"
              borderColor="forest.500"
              color="forest.500"
              _hover={{ bg: 'forest.50' }}
              width="full"
              size="sm"
              onClick={handleResend}
            >
              Verifizierungs-Email erneut senden
            </Button>
          )}
          {resendSent && (
            <Text mt="3" color="forest.500" fontSize="sm" textAlign="center" fontWeight="600">
              Verifizierungs-Email wurde erneut gesendet!
            </Text>
          )}
        </form>
      </Box>
    </Flex>
  );
};

export default LoginForm;
