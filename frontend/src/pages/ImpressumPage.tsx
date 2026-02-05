import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box mb="6">
    <Heading as="h2" size="md" color="bark.500" mb="2">
      {title}
    </Heading>
    {children}
  </Box>
);

const ImpressumPage: React.FC = () => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="lg"
      p={{ base: '5', md: '8' }}
    >
      <Heading as="h1" size="xl" color="forest.500" mb="6">
        Impressum
      </Heading>

      <Section title="Angaben gem&auml;&szlig; &sect; 5 TMG">
        <Text color="bark.400" lineHeight="1.8">
          Marco Jan<br />
          Körösistraße 196<br />
          8010 Graz
        </Text>
      </Section>

      <Section title="Kontakt">
        <Text color="bark.400" lineHeight="1.8">
          E-Mail: marco.jan@gmx.de<br /> 
        </Text>
      </Section>

      <Section title="Verantwortlich f&uuml;r den Inhalt nach &sect; 55 Abs. 2 RStV">
        <Text color="bark.400" lineHeight="1.8">
          Marco Jan<br />
          Körösistraße 196<br />
          8010 Graz
        </Text>
      </Section>

      <Section title="Haftungsausschluss">
        <Text color="bark.400" lineHeight="1.8" mb="3">
          <strong>Haftung f&uuml;r Inhalte:</strong> Die Inhalte unserer Seiten wurden mit gr&ouml;&szlig;ter
          Sorgfalt erstellt. F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte
          k&ouml;nnen wir jedoch keine Gew&auml;hr &uuml;bernehmen.
        </Text>
        <Text color="bark.400" lineHeight="1.8">
          <strong>Haftung f&uuml;r Links:</strong> Unser Angebot enth&auml;lt Links zu externen Webseiten
          Dritter, auf deren Inhalte wir keinen Einfluss haben. F&uuml;r die Inhalte der verlinkten
          Seiten ist stets der jeweilige Anbieter verantwortlich.
        </Text>
      </Section>
    </Box>
  );
};

export default ImpressumPage;
