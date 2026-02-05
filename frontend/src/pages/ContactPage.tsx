import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Text, Textarea } from '@chakra-ui/react';
import { FaEnvelope } from 'react-icons/fa';
import { sendContactMessage } from '../api/api';

const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      await sendContactMessage({ name, email, subject, message });
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Nachricht konnte nicht gesendet werden.');
    }
  };

  return (
    <Flex minH="60vh" align="center" justify="center">
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
          <Box mb="2"><FaEnvelope color="#2D6A4F" size="36" /></Box>
          <Heading as="h2" size="lg" color="bark.500">
            Kontakt
          </Heading>
          <Text fontSize="sm" color="bark.400" mt="2" textAlign="center">
            Hast du Fragen, Feedback oder ein Anliegen? Schreib uns!
          </Text>
        </Flex>

        {status === 'sent' ? (
          <Box bg="green.100" border="1px solid" borderColor="green.300" borderRadius="md" p="5" textAlign="center">
            <Text color="green.700" fontWeight="600" fontSize="md">
              Nachricht gesendet!
            </Text>
            <Text color="green.600" fontSize="sm" mt="2">
              Vielen Dank, wir melden uns so schnell wie möglich.
            </Text>
            <Button
              mt="4"
              variant="outline"
              borderColor="forest.500"
              color="forest.500"
              _hover={{ bg: 'forest.50' }}
              size="sm"
              onClick={() => setStatus('idle')}
            >
              Weitere Nachricht senden
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Box mb="3">
              <Input
                placeholder="Dein Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                bg="sand.100"
                borderColor="sand.400"
                _hover={{ borderColor: 'forest.300' }}
                _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
                size="lg"
              />
            </Box>
            <Box mb="3">
              <Input
                type="email"
                placeholder="Deine Email"
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
            <Box mb="3">
              <Input
                placeholder="Betreff (optional)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                bg="sand.100"
                borderColor="sand.400"
                _hover={{ borderColor: 'forest.300' }}
                _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
                size="lg"
              />
            </Box>
            <Box mb="4">
              <Textarea
                placeholder="Deine Nachricht"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
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
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}
            </Button>
            {status === 'error' && (
              <Text mt="3" color="ember.500" fontSize="sm" textAlign="center">
                {errorMsg}
              </Text>
            )}
          </form>
        )}
      </Box>
    </Flex>
  );
};

export default ContactPage;
