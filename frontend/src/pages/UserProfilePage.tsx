import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Flex, Heading, Spinner, Text, Textarea } from '@chakra-ui/react';
import { FaArrowLeft, FaEnvelope, FaShieldAlt, FaClock, FaCircle, FaMapMarkerAlt, FaPaw } from 'react-icons/fa';
import { User } from '../types/user';
import { getUserProfile, getProfilePicUrl, blockUser, reportUser } from '../api/api';

function formatDogGender(gender?: string) {
  switch (gender) {
    case 'male': return 'Rüde';
    case 'female': return 'Hündin';
    default: return '—';
  }
}

function formatAge(age?: string | number) {
  const a = age != null ? String(age) : '';
  switch (a) {
    case 'puppy': return 'Welpe';
    case 'teenager': return 'Teenager';
    case 'adult': return 'Adult';
    case 'senior': return 'Senior';
    default: return a ? a.charAt(0).toUpperCase() + a.slice(1) : '—';
  }
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const u = await getUserProfile(userId);
        setProfile(u);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setError(e?.response?.data?.error || '');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, navigate]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleBlock = async () => {
    if (!userId) return;
    try {
      await blockUser(userId);
      navigate(-1);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Fehler beim Blockieren');
    }
    setShowBlockConfirm(false);
  };

  const handleReport = async () => {
    if (!userId || !reportReason.trim()) return;
    try {
      await reportUser(userId, reportReason.trim());
      setReportSent(true);
      setTimeout(() => {
        setShowReportDialog(false);
        setReportReason('');
        setReportSent(false);
      }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Fehler beim Melden');
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );
  }

  if (error || !profile) {
    return (
      <Box maxW="600px" mx="auto" textAlign="center" py="16">
        <Text color="ember.500" fontWeight="600">{error || 'User nicht gefunden'}</Text>
        <Button mt="4" onClick={() => navigate(-1)} variant="ghost" color="bark.500">
          Zurück
        </Button>
      </Box>
    );
  }

  const accessible = !!profile.accessible;
  const needHisTime = !!profile.need_his_time;
  const available = !!profile.available;
  const location =
    profile.city
      ? `${profile.city}${profile.area ? ` – ${profile.area}` : ''}${profile.postalCode ? ` ${profile.postalCode}` : ''}`
      : null;

  return (
    <Box maxW="600px" mx="auto">
      {/* Header Bar */}
      <Flex align="center" gap="2" mb="3">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="sm"
          color="bark.500"
          _hover={{ bg: 'sand.300' }}
          minW="auto"
          p="2"
        >
          <FaArrowLeft />
        </Button>
        <Text fontWeight="700" color="bark.500">Profil</Text>

        {/* Kebab Menu */}
        <Box position="relative" ref={menuRef} ml="auto">
          <Button
            variant="ghost"
            size="sm"
            minW="auto"
            p="2"
            color="bark.500"
            _hover={{ bg: 'sand.300' }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menü"
          >
            &#8942;
          </Button>
          {menuOpen && (
            <Box
              position="absolute" right="0" top="100%"
              bg="white" boxShadow="lg" borderRadius="md"
              border="1px solid" borderColor="sand.300"
              zIndex="10" minW="160px" py="1"
            >
              <Box
                px="4" py="2" cursor="pointer"
                _hover={{ bg: 'sand.200' }}
                fontSize="sm" fontWeight="600" color="bark.500"
                onClick={() => { setMenuOpen(false); setShowReportDialog(true); }}
              >
                Melden
              </Box>
              <Box
                px="4" py="2" cursor="pointer"
                _hover={{ bg: 'ember.50' }}
                fontSize="sm" fontWeight="600" color="ember.500"
                onClick={() => { setMenuOpen(false); setShowBlockConfirm(true); }}
              >
                Blockieren
              </Box>
            </Box>
          )}
        </Box>
      </Flex>

      {/* Profile Banner */}
      <Box
        bgGradient="to-r"
        gradientFrom="forest.500"
        gradientTo="forest.700"
        borderRadius="xl"
        borderBottomRadius="0"
        px={{ base: '5', md: '8' }}
        py={{ base: '6', md: '8' }}
        textAlign="center"
      >
        {profile.profilePic ? (
          <img
            src={getProfilePicUrl(profile.profilePic)!}
            alt={profile.dogName}
            style={{ width: '128px', height: '128px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', margin: '0 auto 12px' }}
          />
        ) : (
          <Flex
            w="128px" h="128px"
            borderRadius="full"
            bg="forest.600"
            border="4px solid white"
            align="center" justify="center"
            mx="auto"
            mb="3"
          >
            <FaPaw size="48" color="#D4A847" />
          </Flex>
        )}
        <Heading as="h2" size="lg" color="white" fontWeight="800">
          {profile.dogName}
        </Heading>
        <Text color="forest.100" fontSize="sm" mt="1">
          von {profile.name}
        </Text>
      </Box>

      {/* Profile Body */}
      <Box bg="white" borderRadius="xl" borderTopRadius="0" boxShadow="lg" p={{ base: '4', md: '6' }}>
        {/* Dog Info */}
        <Flex gap="4" wrap="wrap" mb="4">
          <Box>
            <Text fontSize="xs" color="bark.400" fontWeight="600">Geschlecht</Text>
            <Text fontWeight="700" color="bark.500">{formatDogGender(profile.gender)}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="bark.400" fontWeight="600">Alter</Text>
            <Text fontWeight="700" color="bark.500">{formatAge(profile.age)}</Text>
          </Box>
          {profile.breed && (
            <Box>
              <Text fontSize="xs" color="bark.400" fontWeight="600">Rasse</Text>
              <Text fontWeight="700" color="bark.500">{profile.breed}</Text>
            </Box>
          )}
          {profile.neutered && (
            <Box>
              <Text fontSize="xs" color="bark.400" fontWeight="600">Neutral</Text>
              <Text fontWeight="700" color="bark.500">
                {profile.neutered === 'yes' ? 'Ja' : profile.neutered === 'no' ? 'Nein' : profile.neutered}
              </Text>
            </Box>
          )}
        </Flex>

        {/* Beschreibung */}
        {profile.description && (
          <Box mb="4" p="3" bg="sand.50" borderRadius="md" border="1px solid" borderColor="sand.200">
            <Text fontSize="xs" color="bark.400" fontWeight="600" mb="1">Über {profile.dogName}</Text>
            <Text fontSize="sm" color="bark.500" whiteSpace="pre-wrap">
              {profile.description}
            </Text>
          </Box>
        )}

        {/* Badges */}
        <Flex gap="2" wrap="wrap" mb="4">
          {accessible && (
            <Flex align="center" gap="1.5" bg="forest.50" color="forest.700"
              px="3" py="1" borderRadius="full" fontSize="sm" fontWeight="600">
              <FaShieldAlt size="12" />
              <span>Zugänglich</span>
            </Flex>
          )}
          {needHisTime && (
            <Flex align="center" gap="1.5" bg="amber.50" color="amber.700"
              px="3" py="1" borderRadius="full" fontSize="sm" fontWeight="600">
              <FaClock size="12" />
              <span>Braucht Schnupperzeit</span>
            </Flex>
          )}
          {available && (
            <Flex align="center" gap="1.5" bg="forest.50" color="forest.600"
              px="3" py="1" borderRadius="full" fontSize="sm" fontWeight="600">
              <FaCircle size="8" color="#2D6A4F" />
              <span>Verfügbar</span>
            </Flex>
          )}
        </Flex>

        {/* Location */}
        {location && (
          <Flex align="center" gap="1.5" color="bark.400" fontSize="sm" mb="5">
            <FaMapMarkerAlt size="14" />
            <Text>{location}</Text>
          </Flex>
        )}

        {/* Action Buttons */}
        <Button
          onClick={() => navigate(`/messages/${profile.id}`)}
          bg="ember.500"
          color="white"
          _hover={{ bg: 'ember.600' }}
          width="full"
          fontWeight="700"
          size="md"
        >
          <FaEnvelope style={{ marginRight: '8px' }} />
          Nachricht schreiben
        </Button>
      </Box>

      {/* Block Confirmation Dialog */}
      {showBlockConfirm && (
        <Box
          position="fixed" top="0" left="0" right="0" bottom="0"
          bg="blackAlpha.500" zIndex="50"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => setShowBlockConfirm(false)}
        >
          <Box
            bg="white" borderRadius="xl" p="6" maxW="400px" w="90%" boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="md" color="bark.500" mb="3">User blockieren?</Heading>
            <Text color="bark.400" fontSize="sm" mb="5">
              {profile.dogName} ({profile.name}) wird dich nicht mehr kontaktieren können und du wirst keine Nachrichten mehr von diesem User sehen.
            </Text>
            <Flex gap="3" justify="flex-end">
              <Button variant="ghost" size="sm" color="bark.400" onClick={() => setShowBlockConfirm(false)}>
                Abbrechen
              </Button>
              <Button size="sm" bg="ember.500" color="white" _hover={{ bg: 'ember.600' }} onClick={handleBlock}>
                Blockieren
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <Box
          position="fixed" top="0" left="0" right="0" bottom="0"
          bg="blackAlpha.500" zIndex="50"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => { setShowReportDialog(false); setReportReason(''); setReportSent(false); }}
        >
          <Box
            bg="white" borderRadius="xl" p="6" maxW="400px" w="90%" boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="md" color="bark.500" mb="3">User melden</Heading>
            {reportSent ? (
              <Text color="forest.500" fontWeight="600" textAlign="center" py="4">
                Meldung gesendet. Danke!
              </Text>
            ) : (
              <>
                <Text color="bark.400" fontSize="sm" mb="3">
                  Bitte beschreibe den Grund für die Meldung:
                </Text>
                <Textarea
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Grund eingeben…"
                  rows={3}
                  resize="none"
                  bg="sand.100"
                  borderColor="sand.400"
                  _hover={{ borderColor: 'forest.300' }}
                  _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
                  mb="4"
                />
                <Flex gap="3" justify="flex-end">
                  <Button variant="ghost" size="sm" color="bark.400" onClick={() => { setShowReportDialog(false); setReportReason(''); }}>
                    Abbrechen
                  </Button>
                  <Button
                    size="sm" bg="ember.500" color="white"
                    _hover={{ bg: 'ember.600' }}
                    onClick={handleReport}
                    disabled={!reportReason.trim()}
                  >
                    Melden
                  </Button>
                </Flex>
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UserProfilePage;
