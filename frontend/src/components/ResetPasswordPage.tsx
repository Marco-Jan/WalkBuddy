import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
import { resetPassword } from '../api/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login?reset=1');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Zurücksetzen des Passworts.');
    }
    setLoading(false);
  };

  if (!token) {
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
              Ungültiger Link
            </Heading>
          </Flex>
          <Box bg="red.100" border="1px solid" borderColor="red.300" borderRadius="md" p="3" mb="4" textAlign="center">
            <Text color="red.700" fontSize="sm" fontWeight="600">
              Kein gültiger Reset-Link. Bitte fordere einen neuen an.
            </Text>
          </Box>
          <Text fontSize="sm" color="bark.400" textAlign="center">
            <Box as={RouterLink as any} {...{to: "/forgot-password"} as any} color="ember.500" fontWeight="600">
              Neuen Link anfordern
            </Box>
          </Text>
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
        maxW="420px"
        mx={{ base: '2', md: '0' }}
      >
        <Flex direction="column" align="center" mb="6">
          <Box mb="2"><FaPaw color="#2D6A4F" size="40" /></Box>
          <Heading as="h2" size="lg" color="bark.500">
            Neues Passwort setzen
          </Heading>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Box mb="4">
            <Input
              type="password"
              placeholder="Neues Passwort"
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
          <Box mb="5">
            <Input
              type="password"
              placeholder="Passwort bestätigen"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              bg="sand.100"
              borderColor="sand.400"
              _hover={{ borderColor: 'forest.300' }}
              _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
              size="lg"
            />
          </Box>
          <Button
            type="submit"
            bg="forest.500"
            color="white"
            _hover={{ bg: 'forest.600' }}
            width="full"
            size="lg"
            fontWeight="700"
            loading={loading}
          >
            Passwort ändern
          </Button>
          {error && (
            <Box mt="3">
              <Text color="ember.500" fontSize="sm" textAlign="center">
                {error}
              </Text>
              {error.includes('abgelaufen') && (
                <Text fontSize="sm" color="bark.400" mt="2" textAlign="center">
                  <Box as={RouterLink as any} {...{to: "/forgot-password"} as any} color="ember.500" fontWeight="600">
                    Neuen Link anfordern
                  </Box>
                </Text>
              )}
            </Box>
          )}
        </form>
      </Box>
    </Flex>
  );
};

export default ResetPasswordPage;
