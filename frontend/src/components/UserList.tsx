import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
import { getAvailableUsers } from '../api/api';
import { User } from '../types/user';
import UserCard from './UserCard';

interface Props {
  user?: User;
}

const UserList: React.FC<Props> = ({user}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      setError('');
      try {
        const data = await getAvailableUsers();
        if (!mounted) return;
        setUsers(data);
      } catch (e: any) {
        if (e.response?.status === 401) {
          setUsers([]);
          navigate('/login', { replace: true });
          return;
        }
        setError(e.response?.data?.error || 'Fehler beim Laden');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading)
    return (
      <Flex justify="center" align="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );

  if (error)
    return (
      <Text color="ember.500" fontWeight="600" textAlign="center" py="8">
        {error}
      </Text>
    );

  return (
    <Box>
      <Flex align="center" gap="2" mb={{ base: '4', md: '6' }}>
        <Box color="forest.500"><FaPaw size="24" /></Box>
        <Heading as="h2" size={{ base: 'lg', md: 'xl' }} color="bark.500" fontWeight="800">
          {user ? `${user.name} finde nette Gassi-Kontakte` : 'Finde nette Gassi-Kontakte'}
        </Heading>

      </Flex>

      {users.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          py="12"
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
        >
          <Box color="sand.500" mb="4" opacity={0.5}><FaPaw size="48" /></Box>
          <Text color="bark.400" fontSize="lg">
            Keine Hundebesitzer verfügbar.
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={{ base: '4', md: '5' }}>
          {users.map(u => (
            <UserCard key={u.id} user={u} />
          ))}
        </SimpleGrid>

      )}
    </Box>
  );
};

export default UserList;
