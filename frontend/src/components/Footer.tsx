import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Text } from '@chakra-ui/react';

const FooterLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Box
    as={RouterLink as any}
    {...{ to } as any}
    color="sand.200"
    fontWeight="600"
    fontSize="sm"
    _hover={{ color: 'white', textDecoration: 'underline' }}
    transition="color 0.2s"
  >
    {label}
  </Box>
);

const Footer: React.FC = () => {
  return (
    <Box as="footer" bg="forest.500" mt="auto">
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: '4', md: '6' }}
        py="4"
        align="center"
        justify="space-between"
        direction={{ base: 'column', sm: 'row' }}
        gap="2"
      >
        <Flex gap="4" wrap="wrap" justify="center">
          <FooterLink to="/kontakt" label="Kontakt" />
          <FooterLink to="/datenschutz" label="Datenschutz" />
          <FooterLink to="/impressum" label="Impressum" />
        </Flex>

        <Text color="sand.300" fontSize="xs">
          &copy; {new Date().getFullYear()} WalkBuddy
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
