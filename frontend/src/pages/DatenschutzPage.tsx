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

const DatenschutzPage: React.FC = () => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="lg"
      p={{ base: '5', md: '8' }}
    >
      <Heading as="h1" size="xl" color="forest.500" mb="6">
        Datenschutzerkl&auml;rung
      </Heading>

      <Section title="1. Verantwortlicher">
        <Text color="bark.400" lineHeight="1.8">
          Marco Jan<br />
          Körösistraße 196<br />
          8010 Graz
        </Text>
      </Section>

      <Section title="2. Erhebung und Speicherung personenbezogener Daten">
        <Text color="bark.400" lineHeight="1.8">
          Bei der Nutzung von WalkBuddy werden folgende personenbezogene Daten erhoben:
          Name, E-Mail-Adresse, Profilbild sowie Angaben zu Ihrem Hund (Name, Rasse, Alter, Geschlecht).
          Diese Daten sind erforderlich, um die Funktionen der Plattform bereitzustellen,
          insbesondere die Vermittlung von Gassi-Partnern und die Nachrichtenfunktion.
        </Text>
      </Section>

      <Section title="3. Nachrichten und Verschl&uuml;sselung">
        <Text color="bark.400" lineHeight="1.8">
          Nachrichten zwischen Nutzern werden Ende-zu-Ende verschl&uuml;sselt (E2EE) &uuml;bertragen.
          Der Betreiber hat keinen Zugriff auf den Klartext der Nachrichten.
          Die kryptografischen Schl&uuml;ssel werden lokal auf Ihrem Ger&auml;t gespeichert.
        </Text>
      </Section>

      <Section title="4. Cookies und Sessions">
        <Text color="bark.400" lineHeight="1.8">
          WalkBuddy verwendet Session-Cookies, um Ihre Anmeldung aufrechtzuerhalten.
          Diese Cookies sind technisch notwendig und werden nicht f&uuml;r Tracking-Zwecke verwendet.
          Es werden keine Drittanbieter-Cookies eingesetzt.
        </Text>
      </Section>

      <Section title="5. Ihre Rechte">
        <Text color="bark.400" lineHeight="1.8">
          Sie haben das Recht auf Auskunft, Berichtigung, L&ouml;schung und Einschr&auml;nkung der
          Verarbeitung Ihrer personenbezogenen Daten gem&auml;&szlig; DSGVO. Zur Aus&uuml;bung Ihrer Rechte
          wenden Sie sich bitte an die oben genannte E-Mail-Adresse.
        </Text>
      </Section>

      <Section title="6. Kontakt">
        <Text color="bark.400" lineHeight="1.8">
          Bei Fragen zum Datenschutz erreichen Sie uns unter: [Deine Email]
        </Text>
      </Section>
    </Box>
  );
};

export default DatenschutzPage;
