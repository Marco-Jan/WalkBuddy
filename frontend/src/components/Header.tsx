import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { FaPaw, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaCog } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaDog } from 'react-icons/fa';
import { getUnreadCount } from '../api/api';
import { User } from '../types/user';

interface Props {
  user: User | null;
  onLogout: () => void;
}

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <Box
    as={RouterLink as any}
    {...{to} as any}
    px={{ base: '2', md: '3' }}
    py="1"
    borderRadius="md"
    fontWeight="600"
    fontSize="sm"
    color="white"
    _hover={{ bg: 'forest.600', textDecoration: 'none' }}
    transition="background 0.2s"
    display="flex"
    alignItems="center"
    gap="1.5"
  >
    {icon}
    <Box as="span" display={{ base: 'none', md: 'inline' }}>{label}</Box>
  </Box>
);

const Header: React.FC<Props> = ({ user, onLogout }) => {
  const [hasUnread, setHasUnread] = useState(false);
  const location = useLocation();

  const onMessagesPage =
    location.pathname.startsWith('/inbox') ||
    location.pathname.startsWith('/messages');

  useEffect(() => {
    if (!user || onMessagesPage) {
      setHasUnread(false);
      return;
    }

    const load = async () => {
      try {
        const c = await getUnreadCount();
        setHasUnread(c > 0);
      } catch {
        setHasUnread(false);
      }
    };

    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [user, onMessagesPage]);

  return (
    <Box
      as="nav"
      bg="forest.500"
      position="sticky"
      top="0"
      zIndex="1000"
      boxShadow="0 2px 8px rgba(0,0,0,0.15)"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: '4', md: '6' }}
        py="3"
        align="center"
        justify="space-between"
      >
        {/* Brand */}
        <Box
          as={RouterLink as any}
          {...{to: "/"} as any}
          display="flex"
          alignItems="center"
          gap="2"
          _hover={{ textDecoration: 'none', opacity: 0.9 }}
        >
          <FaPaw color="#D4A847" size="24" />
          <Text color="white" fontWeight="800" fontSize="xl">
            WalkBuddy
          </Text>
        </Box>

        {/* Navigation */}
        <HStack gap={{ base: '0', md: '1' }}>
          {user ? (
            <>
              <NavLink
                to="/inbox"
                icon={
                  <span style={{
                    display: 'inline-block',
                    transform: hasUnread ? 'rotate(-45deg) translateX(6px)' : 'none',
                    transition: 'transform 0.3s ease',
                    transformOrigin: 'center center',
                  }}>
                    <FaDog color={hasUnread ? '#D4A847' : 'white'} size="18" />
                  </span>
                }
                label="Nachrichten"
              />

              <NavLink to="/account" icon={<FaUser />} label="Account" />

              {user.role === 'admin' && (
                <NavLink to="/admin" icon={<FaCog />} label="Admin" />
              )}

              <Box
                as="button"
                onClick={() => {
                  onLogout();
                }}
                px={{ base: '2', md: '3' }}
                py="1"
                borderRadius="md"
                fontWeight="600"
                fontSize="sm"
                color="white"
                bg="transparent"
                border="none"
                cursor="pointer"
                _hover={{ bg: 'forest.600' }}
                transition="background 0.2s"
                display="flex"
                alignItems="center"
                gap="1.5"
              >
                <FaSignOutAlt />
                <Box as="span" display={{ base: 'none', md: 'inline' }}>Logout</Box>
              </Box>
            </>
          ) : (
            <>
              <NavLink to="/login" icon={<FaSignInAlt />} label="Login" />
              <NavLink to="/register" icon={<FaUserPlus />} label="Registrieren" />
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
