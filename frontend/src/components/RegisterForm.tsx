import React, { useState } from 'react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
import { getApiUrl } from '../api/api';
import {
  generateKeyPair,
  exportPublicKey,
  encryptPrivateKey,
} from '../crypto';

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [dogName, setDogName] = useState('');
  const [humanGender, setHumanGender] = useState('male');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [neutered, setNeutered] = useState('');
  const [description, setDescription] = useState('');
  const [accessible, setAccessible] = useState(false);
  const [needTime, setNeedTime] = useState(false);
  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // E2EE: Schlüsselpaar generieren
      const keyPair = await generateKeyPair();
      const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
      const encPrivKey = await encryptPrivateKey(keyPair.privateKey, password);

      await axios.post(`${getApiUrl()}/auth/register`, {
        name,
        dogName,
        humanGender,
        age,
        email,
        password,
        accessible,
        need_his_time: needTime,
        neutered: neutered || null,
        description: description.trim() || null,
        publicKey: pubKeyBase64,
        encryptedPrivateKey: encPrivKey
      },
    { withCredentials: true });

      setRegistered(true);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Fehler bei der Registrierung');
    }
  };

  const pillStyle = (active: boolean, color: string) => ({
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '999px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer' as const,
    border: '2px solid',
    borderColor: active ? color : '#E2C9A0',
    backgroundColor: active ? (color === '#2D6A4F' ? '#E8F5E9' : '#FDF8E8') : '#FFFCF7',
    color: active ? color : '#6B4226',
    transition: 'all 0.2s',
  });

  if (registered) {
    return (
      <Flex minH="70vh" align="center" justify="center">
        <Box
          bg="white"
          borderRadius="xl"
          boxShadow="lg"
          p={{ base: '5', md: '8' }}
          w="full"
          maxW="520px"
          mx={{ base: '2', md: '0' }}
          textAlign="center"
        >
          <Flex direction="column" align="center" mb="6">
            <Box mb="2"><FaPaw color="#2D6A4F" size="40" /></Box>
            <Heading as="h2" size="lg" color="bark.500">
              Fast geschafft!
            </Heading>
          </Flex>
          <Text color="bark.500" mb="4">
            Wir haben dir eine Verifizierungs-Email an <strong>{email}</strong> gesendet.
          </Text>
          <Text color="bark.400" fontSize="sm" mb="6">
            Bitte klicke auf den Link in der Email, um dein Konto zu aktivieren.
            Danach kannst du dich einloggen.
          </Text>
          <Box as={RouterLink as any} {...{to: "/login"} as any} color="ember.500" fontWeight="600" fontSize="sm">
            Zum Login
          </Box>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="70vh" align="center" justify="center">
      <Box
        bg="white"
        borderRadius="xl"
        boxShadow="lg"
        p={{ base: '5', md: '8' }}
        w="full"
        maxW="520px"
        mx={{ base: '2', md: '0' }}
      >
        <Flex direction="column" align="center" mb="6">
          <Box mb="2"><FaPaw color="#2D6A4F" size="40" /></Box>
          <Heading as="h2" size="lg" color="bark.500">
            Neues Konto erstellen
          </Heading>
        </Flex>

        <Text fontSize="sm" color="bark.400" mb="4" textAlign="center">
          Schon registriert?{' '}
          <Box as={RouterLink as any} {...{to: "/login"} as any} color="ember.500" fontWeight="600">
            Hier einloggen
          </Box>
        </Text>

        <form onSubmit={handleRegister}>
          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                bg="sand.100"
                borderColor="sand.400"
                _hover={{ borderColor: 'forest.300' }}
                _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              />
            </Box>
            <Box flex="1">
              <Input
                placeholder="Hundename"
                value={dogName}
                onChange={e => setDogName(e.target.value)}
                required
                bg="sand.100"
                borderColor="sand.400"
                _hover={{ borderColor: 'forest.300' }}
                _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              />
            </Box>
          </Flex>

          <Box mb="3">
            <select
              value={humanGender}
              onChange={e => setHumanGender(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #E2C9A0',
                backgroundColor: '#FFFCF7',
                color: '#6B4226',
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
              }}
            >
              <option value="male">männlich</option>
              <option value="female">weiblich</option>
              <option value="divers">divers</option>
            </select>
          </Box>

          <Box mb="3">
            <Input
              placeholder="Alter des Hundes (z.B. 3 Jahre/Monate)"
              value={age}
              onChange={e => setAge(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
            />
          </Box>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <select
                value={neutered}
                onChange={e => setNeutered(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #E2C9A0',
                  backgroundColor: '#FFFCF7',
                  color: '#6B4226',
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                }}
              >
                
                <option value="neutered">Neutral</option>
                <option value="intact">Nicht neutral</option>
              </select>
            </Box>
            <Box flex="1">
              <Input
                placeholder="Kurze Beschreibung des Hundes"
                value={description}
                onChange={e => setDescription(e.target.value)}
                bg="sand.100"
                borderColor="sand.400"
                _hover={{ borderColor: 'forest.300' }}
                _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              />
            </Box>
          </Flex>

          <Box mb="3">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
            />
          </Box>

          <Box mb="4">
            <Input
              placeholder="Passwort"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
            />
            <Text fontSize="xs" color="bark.400" mt="1">
              Min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl & Sonderzeichen
            </Text>
          </Box>

          <Flex gap="3" mb="5" wrap="wrap">
            <label style={pillStyle(accessible, '#2D6A4F')}>
              <input
                type="checkbox"
                checked={accessible}
                onChange={e => setAccessible(e.target.checked)}
                style={{ display: 'none' }}
              />
              {accessible ? '\u2705' : '\u26AA'} Zugänglich
            </label>
            <label style={pillStyle(needTime, '#D4A847')}>
              <input
                type="checkbox"
                checked={needTime}
                onChange={e => setNeedTime(e.target.checked)}
                style={{ display: 'none' }}
              />
              {needTime ? '\u23F3' : '\u26AA'} Braucht Schnupperzeit
            </label>
          </Flex>

          <Button
            type="submit"
            bg="forest.500"
            color="white"
            _hover={{ bg: 'forest.600' }}
            width="full"
            size="lg"
            fontWeight="700"
          >
            Registrieren
          </Button>
          {message && (
            <Text mt="3" color="ember.500" fontSize="sm" textAlign="center">
              {message}
            </Text>
          )}
        </form>
      </Box>
    </Flex>
  );
};

export default RegisterForm;
