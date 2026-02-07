import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { FaMapMarkerAlt } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaEye } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaComments } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaMobileAlt } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaBell } from 'react-icons/fa';

interface Props {
  onComplete: () => void;
}

const slides = [
  {
    icon: <FaMapMarkerAlt size="40" color="#2D6A4F" />,
    title: 'Kein GPS nötig',
    text: 'WalkBuddy nutzt keinen Standort. Du wählst Stadt & Bezirk selbst.',
  },
  {
    icon: <FaEye size="40" color="#2D6A4F" />,
    title: 'Nur sichtbar wenn du willst',
    text: 'Du erscheinst nur, wenn du deinen Status auf „sichtbar" setzt.',
  },
  {
    icon: <FaComments size="40" color="#2D6A4F" />,
    title: 'Nachrichten & Chats',
    text: 'Schreib anderen Hundebesitzern direkt.',
  },
  {
    icon: <FaMobileAlt size="40" color="#2D6A4F" />,
    title: 'Wie eine App nutzen',
    text: 'Tippe im Browser auf „Teilen" und dann „Zum Startbildschirm". So hast du WalkBuddy wie eine echte App auf deinem Handy.',
  },
  {
    icon: <FaBell size="40" color="#2D6A4F" />,
    title: 'Keine Nachricht verpassen',
    text: '  Neue Nachrichten erkennst du am orangenen Hund-Symbol im Menü — schau regelmäßig rein, damit du nichts verpasst!',
  },
];

const OnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const isLast = current === slides.length - 1;
  const slide = slides[current];

  return (
    <Flex
      position="fixed"
      top="0" left="0" right="0" bottom="0"
      bg="blackAlpha.600"
      align="center" justify="center"
      zIndex="1000"
      px="4"
    >
      <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="2xl"
        maxW="420px"
        w="100%"
        p={{ base: '6', md: '8' }}
        textAlign="center"
      >
        <Box mb="5">
          {slide.icon}
        </Box>

        <Heading as="h2" size="lg" color="bark.500" mb="3" fontWeight="800">
          {slide.title}
        </Heading>

        <Text color="bark.400" fontSize="md" mb="6" lineHeight="1.6">
          {slide.text}
        </Text>

        {/* Dots */}
        <Flex justify="center" gap="2" mb="5">
          {slides.map((_, i) => (
            <Box
              key={i}
              w="8px" h="8px"
              borderRadius="full"
              bg={i === current ? 'forest.500' : 'sand.400'}
              transition="all 0.2s"
            />
          ))}
        </Flex>

        <Flex gap="3" justify="center">
          {!isLast && (
            <Button
              variant="ghost"
              color="bark.400"
              fontWeight="600"
              onClick={onComplete}
              size="sm"
            >
              Überspringen
            </Button>
          )}
          <Button
            bg="forest.500"
            color="white"
            _hover={{ bg: 'forest.600' }}
            fontWeight="700"
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setCurrent(c => c + 1);
              }
            }}
            size="sm"
            px="6"
          >
            {isLast ? 'Los geht\'s!' : 'Weiter'}
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default OnboardingModal;
