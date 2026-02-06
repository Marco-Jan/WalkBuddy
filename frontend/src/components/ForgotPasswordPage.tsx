import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
import { forgotPassword } from '../api/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // Immer Erfolg zeigen (Security)
    }
    setSent(true);
    setLoading(false);
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
            Passwort vergessen
          </Heading>
        </Flex>

        {sent ? (
          <>
            <Box bg="green.100" border="1px solid" borderColor="green.300" borderRadius="md" p="3" mb="4" textAlign="center">
              <Text color="green.700" fontSize="sm" fontWeight="600">
                Falls die Email-Adresse existiert, wurde ein Link zum Zurücksetzen gesendet.
              </Text>
            </Box>
            <Text fontSize="sm" color="bark.400" textAlign="center">
              <Box as={RouterLink as any} {...{to: "/login"} as any} color="ember.500" fontWeight="600">
                Zurück zum Login
              </Box>
            </Text>
          </>
        ) : (
          <>
            <Text fontSize="sm" color="bark.400" mb="4" textAlign="center">
              Gib deine Email-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
            </Text>

            <form onSubmit={handleSubmit}>
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
                Link senden
              </Button>
            </form>

            <Text fontSize="sm" color="bark.400" mt="4" textAlign="center">
              <Box as={RouterLink as any} {...{to: "/login"} as any} color="ember.500" fontWeight="600">
                Zurück zum Login
              </Box>
            </Text>
          </>
        )}
      </Box>
    </Flex>
  );
};

export default ForgotPasswordPage;
