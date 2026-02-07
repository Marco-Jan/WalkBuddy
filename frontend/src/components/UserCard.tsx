import React from 'react';
import { User } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { FaShieldAlt, FaClock, FaCircle, FaMapMarkerAlt, FaEnvelope, FaPaw } from 'react-icons/fa';
import { getProfilePicUrl } from '../api/api';

interface Props {
  user: User;
}


  //db name formatter

    function formatDogGender(gender?: string) {
    switch (gender) {
      case 'male':
        return 'Rüde';
      case 'female':
        return 'Hündin';
      default:
        return '—';
    }
  }

  function formatAge(age?: string | number) {
    const a = age != null ? String(age) : '';
    switch (a) {
      case 'puppy':
        return 'Welpe';
      case 'teenager':
        return 'Teenager';
      case 'adult':
        return 'Adult';
      case 'senior':
        return 'Senior';
      default:
        return a ? a.charAt(0).toUpperCase() + a.slice(1) : '—';
    }
  }



const UserCard: React.FC<Props> = ({ user }) => {
  const accessible = !!user.accessible;
  const needHisTime = !!user.need_his_time;
  const available = !!user.available;

  const navigate = useNavigate();

  const location =
    user.city
      ? `${user.city}${user.area ? ` – ${user.area}` : ''}`
      : null;

  return (
    <Flex
      direction="column"
      borderRadius="xl"
      overflow="hidden"
      bg="white"
      boxShadow="md"
      transition="all 0.25s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      {...(available ? { animation: 'pulse-glow 2.5s ease-in-out infinite' } : {})}
      height="100%"
      cursor="pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      {/* Gradient Header */}
      <Box
        bgGradient="to-r"
        gradientFrom="forest.500"
        gradientTo="forest.700"
        px={{ base: '4', md: '5' }}
        py={{ base: '3', md: '4' }}
        flexShrink={0}
      >
        <Flex align="center" gap="3">
          {user.profilePic ? (
            <img
              src={getProfilePicUrl(user.profilePic)!}
              alt={user.dogName}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }}
            />
          ) : (
            <Flex
              w="40px" h="40px"
              borderRadius="full"
              bg="forest.600"
              border="2px solid white"
              align="center" justify="center"
              flexShrink={0}
            >
              <FaPaw size="16" color="#D4A847" />
            </Flex>
          )}
          <Box>
            <Heading as="h3" size="md" color="white" fontWeight="800" lineClamp={1}>
              {user.dogName} ({user.name})
            </Heading>
            <Text fontSize="sm" color="forest.100" mt="1">
              {formatDogGender(user.gender)} | {formatAge(user.age)} | {user.breed}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Body */}
      <Flex
        px={{ base: '4', md: '5' }}
        py={{ base: '3', md: '4' }}
        direction="column"
        flex="1"
      >
        {/* 1) Badges – eigener Block */}
        <Box mb="3">
          <Flex gap="2" wrap="wrap">
            {accessible && (
              <Flex
                align="center"
                gap="1.5"
                bg="forest.50"
                color="forest.700"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="sm"
                fontWeight="600"
              >
                <FaShieldAlt size="12" />
                <span>Zugänglich</span>
              </Flex>
            )}

            {needHisTime && (
              <Flex
                align="center"
                gap="1.5"
                bg="amber.50"
                color="amber.700"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="sm"
                fontWeight="600"
              >
                <FaClock size="12" />
                <span>Braucht Schnupperzeit</span>
              </Flex>
            )}

            {available && (
              <Flex
                align="center"
                gap="1.5"
                bg="forest.50"
                color="forest.600"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="sm"
                fontWeight="600"
              >
                <FaCircle size="8" color="#2D6A4F" />
                <span>Verfügbar</span>
              </Flex>
            )}
          </Flex>
        </Box>

        {/* 2) Spacer: sorgt dafür, dass Ort + Button immer unten sitzen */}
        <Box flex="1" />

        {/* 3) Ort – eigener Block, direkt über Button */}
        <Box mb="3" minH="22px">
          {location && (
            <Flex align="center" gap="1.5" color="bark.400" fontSize="sm">
              <FaMapMarkerAlt size="14" />
              <Text lineClamp={1}>{location}</Text>
            </Flex>
          )}
        </Box>

        {/* 4) Button – immer unten */}
        <Button
          onClick={(e) => { e.stopPropagation(); navigate(`/messages/${user.id}`); }}
          bg="ember.500"
          color="white"
          _hover={{ bg: 'ember.600' }}
          width="full"
          fontWeight="700"
          size="sm"
        >
          <FaEnvelope style={{ marginRight: '8px' }} />
          Nachricht schreiben
        </Button>
      </Flex>
    </Flex>
  );
};

export default UserCard;
