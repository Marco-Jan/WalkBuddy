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
        px="3"
        py="2.5"
        flexShrink={0}
      >
        <Flex align="center" gap="2">
          {user.profilePic ? (
            <img
              src={getProfilePicUrl(user.profilePic)!}
              alt={user.dogName}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }}
            />
          ) : (
            <Flex
              w="32px" h="32px"
              borderRadius="full"
              bg="forest.600"
              border="2px solid white"
              align="center" justify="center"
              flexShrink={0}
            >
              <FaPaw size="13" color="#D4A847" />
            </Flex>
          )}
          <Box>
            <Heading as="h3" size="sm" color="white" fontWeight="800" lineClamp={1}>
              {user.dogName} ({user.name})
            </Heading>
            <Text fontSize="xs" color="forest.100">
              {formatDogGender(user.gender)} | {formatAge(user.age)} | {user.breed}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Body */}
      <Flex
        px="3"
        py="2.5"
        direction="column"
        flex="1"
      >
        {/* 1) Badges */}
        <Box mb="2">
          <Flex gap="1.5" wrap="wrap">
            {accessible && (
              <Flex
                align="center"
                gap="1"
                bg="forest.50"
                color="forest.700"
                px="2"
                py="0.5"
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
              >
                <FaShieldAlt size="10" />
                <span>Zugänglich</span>
              </Flex>
            )}

            {needHisTime && (
              <Flex
                align="center"
                gap="1"
                bg="amber.50"
                color="amber.700"
                px="2"
                py="0.5"
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
              >
                <FaClock size="10" />
                <span>Schnupperzeit</span>
              </Flex>
            )}

            {available && (
              <Flex
                align="center"
                gap="1"
                bg="forest.50"
                color="forest.600"
                px="2"
                py="0.5"
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
              >
                <FaCircle size="6" color="#2D6A4F" />
                <span>Verfügbar</span>
              </Flex>
            )}
          </Flex>
        </Box>

        {/* 2) Spacer */}
        <Box flex="1" />

        {/* 3) Ort */}
        <Box mb="2" minH="18px">
          {location && (
            <Flex align="center" gap="1" color="bark.400" fontSize="xs">
              <FaMapMarkerAlt size="11" />
              <Text lineClamp={1}>{location}</Text>
            </Flex>
          )}
        </Box>

        {/* 4) Button */}
        <Button
          onClick={(e) => { e.stopPropagation(); navigate(`/messages/${user.id}`); }}
          bg="ember.500"
          color="white"
          _hover={{ bg: 'ember.600' }}
          width="full"
          fontWeight="700"
          size="xs"
          fontSize="xs"
        >
          <FaEnvelope style={{ marginRight: '6px' }} />
          Nachricht
        </Button>
      </Flex>
    </Flex>
  );
};

export default UserCard;
