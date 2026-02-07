import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { FaPaw } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaMapMarkerAlt } from 'react-icons/fa';
import { getAvailableUsers, searchCities } from '../api/api';
import { User } from '../types/user';
import UserCard from './UserCard';

interface Props {
  user?: User;
}

const UserList: React.FC<Props> = ({user}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<{ city: string; postcode: string; state: string }[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [citySearchFocused, setCitySearchFocused] = useState(false);
  const citySearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
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

    fetchData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const filteredUsers = useMemo(() => {
    const list = cityFilter ? users.filter(u => u.city === cityFilter) : [...users];
    const myCity = user?.city?.toLowerCase() || '';
    if (myCity) {
      list.sort((a, b) => {
        const aMatch = (a.city?.toLowerCase() || '') === myCity ? 0 : 1;
        const bMatch = (b.city?.toLowerCase() || '') === myCity ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    return list;
  }, [users, cityFilter, user?.city]);

  const handleCitySearch = useCallback((value: string) => {
    setCitySearch(value);
    if (!value.trim()) setCityFilter('');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setCitySuggestions([]);
      setCityLoading(false);
      return;
    }

    setCityLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(value.trim());
        setCitySuggestions(results);
      } catch {
        setCitySuggestions([]);
      } finally {
        setCityLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close city search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(e.target as Node)) {
        setCitySearchFocused(false);
      }
    };
    if (citySearchFocused) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [citySearchFocused]);

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

      <Box mb={{ base: '3', md: '4' }} ref={citySearchRef} position="relative" maxW="280px">
        <Flex align="center" position="relative">
          <Box position="absolute" left="10px" color="#A0896C" zIndex="1" pointerEvents="none">
            <FaMapMarkerAlt size="14" />
          </Box>
          <input
            value={citySearch}
            onChange={e => handleCitySearch(e.target.value)}
            onFocus={() => setCitySearchFocused(true)}
            placeholder="nach Stadt suchen…"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid #E2C9A0',
              backgroundColor: '#FFFCF7',
              color: '#6B4226',
              fontWeight: 600,
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setCitySearchFocused(false);
              }
            }}
          />
          {cityFilter && (
            <button
              type="button"
              onClick={() => { setCityFilter(''); setCitySearch(''); setCitySuggestions([]); }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#A0896C',
                fontSize: '16px',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          )}
        </Flex>
        {citySearchFocused && (cityLoading || citySuggestions.length > 0) && (
          <Box
            position="absolute"
            top="100%"
            left="0"
            right="0"
            bg="white"
            border="1px solid"
            borderColor="sand.300"
            borderRadius="md"
            boxShadow="lg"
            zIndex="10"
            maxH="200px"
            overflowY="auto"
            mt="1"
          >
            {cityFilter && (
              <Box
                px="3" py="2" cursor="pointer"
                fontSize="sm" fontWeight="600" color="forest.600"
                _hover={{ bg: 'sand.200' }}
                onMouseDown={() => {
                  setCityFilter('');
                  setCitySearch('');
                  setCitySuggestions([]);
                  setCitySearchFocused(false);
                }}
              >
                Alle Städte
              </Box>
            )}
            {cityLoading ? (
              <Flex justify="center" py="3">
                <Spinner size="sm" color="forest.500" />
              </Flex>
            ) : (
              citySuggestions.map((c, i) => (
                <Box
                  key={`${c.city}-${c.postcode}-${i}`}
                  px="3" py="2" cursor="pointer"
                  fontSize="sm" fontWeight="600"
                  color={c.city === cityFilter ? 'forest.600' : 'bark.500'}
                  bg={c.city === cityFilter ? 'forest.50' : undefined}
                  _hover={{ bg: 'sand.200' }}
                  onMouseDown={() => {
                    setCityFilter(c.city);
                    setCitySearch(c.city);
                    setCitySuggestions([]);
                    setCitySearchFocused(false);
                  }}
                >
                  {c.city}{c.state ? `, ${c.state}` : ''}{c.postcode ? ` (${c.postcode})` : ''}
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>

      {filteredUsers.length === 0 ? (
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
            {cityFilter ? 'Keine Hundebesitzer in dieser Stadt gefunden.' : 'Keine Hundebesitzer verfügbar.'}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={{ base: '4', md: '5' }}>
          {filteredUsers.map(u => (
            <UserCard key={u.id} user={u} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default UserList;
