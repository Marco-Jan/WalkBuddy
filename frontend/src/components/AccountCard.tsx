import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Input, Spinner, Text} from '@chakra-ui/react';
import { FaSave, FaPaw } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaCamera } from 'react-icons/fa';
import { User } from '../types/user';
import { getMe, updateMe, setMyStatus, getBlockedUsers, unblockUser, uploadProfilePic, getProfilePicUrl, deleteMyAccount, searchCities } from '../api/api';



interface Props {
  user: User;
  onUpdate: (user: User) => void;
  onAccountDeleted?: () => void;
}

const AccountCard: React.FC<Props> = ({ user, onUpdate, onAccountDeleted }) => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState(user.name);
  const [dogName, setDogName] = useState(user.dogName);
  const [gender, setGender] = useState(user.gender);
  const [humanGender, setHumanGender] = useState(user.humanGender);
  const [age, setAge] = useState(user.age);
  const [breed, setBreed] = useState(user.breed);
  const [neutered, setNeutered] = useState(user.neutered ?? '');
  const [description, setDescription] = useState(user.description ?? '');
  const [accessible, setAccessible] = useState(!!user.accessible);
  const [needHisTime, setNeedHisTime] = useState(!!user.need_his_time);

  const [city, setCity] = useState(user.city ?? '');
  const [area, setArea] = useState(user.area ?? '');

  const [postalCode, setPostalCode] = useState(user.postalCode ?? '');
  const [citySuggestions, setCitySuggestions] = useState<{ city: string; postcode: string; state: string }[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityInputFocused, setCityInputFocused] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [blockedUsers, setBlockedUsers] = useState<{ blockedUserId: string; name: string; dogName: string; createdAt: string }[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isAvailable = useMemo(() => !!user.available, [user.available]);
  const [visibleToGender, setVisibleToGender] = useState(user.visibleToGender ?? 'all');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const fresh = await getMe();
        if (!mounted) return;

        setName(fresh.name);
        setDogName(fresh.dogName);
        setGender(fresh.gender);
        setHumanGender(fresh.humanGender);
        setAge(fresh.age);
        setBreed(fresh.breed);
        setNeutered(fresh.neutered ?? '');
        setDescription(fresh.description ?? '');
        setAccessible(!!fresh.accessible);
        setNeedHisTime(!!fresh.need_his_time);

        setCity(fresh.city ?? '');
        setArea(fresh.area ?? '');
        setPostalCode(fresh.postalCode ?? '');
        setVisibleToGender(fresh.visibleToGender ?? 'all');

        onUpdate(fresh);

        try {
          const blocked = await getBlockedUsers();
          setBlockedUsers(blocked.items);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSavingProfile(true);

    try {
      const res = await updateMe({
        name,
        gender,
        humanGender,
        age,
        breed,
        dogName,
        accessible,
        need_his_time: needHisTime,
        city: city.trim() || null,
        area: area.trim() || null,
        postalCode: postalCode.trim() || null,
        visibleToGender,
        neutered: neutered || null,
        description: description.trim() || null,
      });

      const updatedUser: User = res.user;
      onUpdate(updatedUser);
      setMessage('Profil gespeichert');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSavingProfile(false);
    }
  };





  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      await uploadProfilePic(file);
      const fresh = await getMe();
      onUpdate(fresh);
      setMessage('Profilbild aktualisiert');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Fehler beim Hochladen');
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVisibility = async () => {
    setMessage('');
    setTogglingStatus(true);

    try {
      const res = await setMyStatus(!isAvailable);

      if (res?.user) {
        onUpdate(res.user);
      } else {
        const fresh = await getMe();
        onUpdate(fresh);
      }

      setMessage(!isAvailable ? 'Du bist jetzt sichbar' : 'Du bist jetzt unsichtbar');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Fehler beim Status ändern');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    setUnblocking(blockedUserId);
    try {
      await unblockUser(blockedUserId);
      setBlockedUsers(prev => prev.filter(b => b.blockedUserId !== blockedUserId));
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Fehler beim Entblockieren');
    } finally {
      setUnblocking(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await deleteMyAccount(deletePassword);
      if (onAccountDeleted) onAccountDeleted();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Fehler beim Löschen');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleCityChange = useCallback((value: string) => {
    setCity(value);
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

  // Close city dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityInputFocused(false);
      }
    };
    if (cityInputFocused) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cityInputFocused]);

  if (loading)
    return (
      <Flex justify="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );

  const inputProps = {
    bg: 'sand.100' as const,
    borderColor: 'sand.400' as const,
    _hover: { borderColor: 'forest.300' },
    _focus: { borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' },
  };

  return (
    <Box maxW="600px" mx="auto">
      {/* Gradient Banner */}
      <Box
        bgGradient="to-r"
        gradientFrom="forest.500"
        gradientTo="forest.700"
        borderRadius="xl"
        borderBottomRadius="0"
        px={{ base: '4', md: '6' }}
        py={{ base: '4', md: '5' }}
      >
        <Flex align="center" gap="3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePicUpload}
          />
          <Box
            position="relative"
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            flexShrink={0}
          >
            {user.profilePic ? (
              <img
                src={getProfilePicUrl(user.profilePic)!}
                alt="Profilbild"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }}
              />
            ) : (
              <Flex
                w="56px" h="56px"
                borderRadius="full"
                bg="forest.600"
                border="2px solid white"
                align="center" justify="center"
              >
                <FaPaw size="24" color="#D4A847" />
              </Flex>
            )}
            <Flex
              position="absolute" bottom="0" right="0"
              w="20px" h="20px" borderRadius="full"
              bg="amber.400" align="center" justify="center"
              border="2px solid white"
            >
              <FaCamera size="9" color="#fff" />
            </Flex>
            {uploadingPic && (
              <Flex position="absolute" top="0" left="0" w="56px" h="56px"
                borderRadius="full" bg="blackAlpha.500" align="center" justify="center">
                <Spinner size="sm" color="white" />
              </Flex>
            )}
          </Box>
          <Box>
            <Heading as="h2" size="lg" color="white" fontWeight="800">
              Hallo {user.name}
            </Heading>
            <Text color="forest.100" fontSize="sm">
              <b>Email:</b> {user.email}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Card Body */}
      <Box bg="white" borderRadius="xl" borderTopRadius="0" boxShadow="lg" p={{ base: '4', md: '6' }}>
        {/* Status Section */}
        <Box mb="6" pb="5" borderBottom="1px solid" borderColor="sand.300">
          <Flex align="center" justify="space-between" wrap="wrap" gap="3">
            <Box>
              <Text fontWeight="700" color="bark.500" mb="1">
                Status
              </Text>
              <Flex align="center" gap="2">
                <Box
                  w="3"
                  h="3"
                  borderRadius="full"
                  bg={isAvailable ? 'forest.500' : 'sand.500'}
                />
                <Text color="bark.400" fontSize="sm">
                  {isAvailable ? 'Sichtbar' : 'Unsichtbar'}
                </Text>
              </Flex>
            </Box>
            <Button
              onClick={toggleVisibility}
              disabled={togglingStatus}
              bg={isAvailable ? 'bark.400' : 'forest.500'}
              color="white"
              _hover={{ bg: isAvailable ? 'bark.500' : 'forest.600' }}
              size="sm"
              fontWeight="700"
            >
              {isAvailable ? 'Unsichtbar schalten' : 'Sichtbar schalten'}
            </Button>
          </Flex>
        </Box>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile}>

          {/* Personal Info */}
          <Text fontWeight="700" color="bark.500" mb="3">
            Menschen Profil
          </Text>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Name</Text>
              <Input value={name} onChange={e => setName(e.target.value)} required {...inputProps} />
            </Box>

            <Box flex="1">
            <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Geschlecht<span style={{ fontSize: "12px", marginLeft: "6px" }}>
              wird nicht angezeigt</span>
            </Text>
            <select
              value={humanGender}
              onChange={e => setHumanGender(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #E2C9A0',
                backgroundColor: '#FFFCF7',
                color: '#6B4226',
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
              }}
            >
              <option value="male">Mann</option>
              <option value="female">Frau</option>
              <option value="divers">Divers</option>
            </select>
            </Box>
          </Flex>
            {/* personal ende */}


          {/* Hund section */}
          <Text fontWeight="700" color="bark.500" mb="3">
            Hunde Profil
          </Text>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Hundename</Text>
              <Input value={dogName} onChange={e => setDogName(e.target.value)} required {...inputProps} />
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Geschlecht</Text>
              <select
                value={gender}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #E2C9A0',
                  backgroundColor: '#FFFCF7',
                  color: '#6B4226',
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                }}
              >
                <option value="male">Rüde</option>
                <option value="female">Hündin</option>
              </select>
            </Box>
          </Flex>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Alter</Text>
              <select
                value={age}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #E2C9A0',
                  backgroundColor: '#FFFCF7',
                  color: '#6B4226',
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                }}
              >
                <option value="puppy">Welpe</option>
                <option value="teenager">Teenager</option>
                <option value="adult">Erwachsen</option>
                <option value="senior">Senior</option>
              </select>
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Rasse</Text>
              <Input
                value={breed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBreed(e.target.value)}
                placeholder="Labrador"
                {...inputProps}
              />
            </Box>
          </Flex>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Kastriert</Text>
              <select
                value={neutered}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNeutered(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #E2C9A0',
                  backgroundColor: '#FFFCF7',
                  color: '#6B4226',
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                }}
              >
                
                <option value="neutered">Neutral</option>
                <option value="intact">Nicht neutral</option>
              </select>
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Beschreibung</Text>
              <Input
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung deines Hundes"
                {...inputProps}
              />
            </Box>
          </Flex>
          {/* Hunde section ende */}


          {/* Location */}
          <Text fontWeight="700" color="bark.500" mb="3" mt="5">
            Standort
          </Text>

          <Flex gap="3" mb="3" direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1" ref={cityRef} position="relative">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Stadt</Text>
              <Input
                value={city}
                onChange={e => handleCityChange(e.target.value)}
                onFocus={() => setCityInputFocused(true)}
                placeholder="z.B. Graz"
                autoComplete="off"
                {...inputProps}
              />
              {cityInputFocused && (cityLoading || citySuggestions.length > 0) && (
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
                  {cityLoading ? (
                    <Flex justify="center" py="3">
                      <Spinner size="sm" color="forest.500" />
                    </Flex>
                  ) : (
                    citySuggestions.map((c, i) => (
                      <Box
                        key={`${c.city}-${c.postcode}-${i}`}
                        px="3"
                        py="2"
                        cursor="pointer"
                        fontSize="sm"
                        fontWeight="600"
                        color="bark.500"
                        _hover={{ bg: 'sand.200' }}
                        onMouseDown={() => {
                          setCity(c.city);
                          if (c.postcode) setPostalCode(c.postcode);
                          setCitySuggestions([]);
                          setCityInputFocused(false);
                        }}
                      >
                        {c.city}{c.state ? `, ${c.state}` : ''}{c.postcode ? ` (${c.postcode})` : ''}
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Stadtteil / Bezirk</Text>
              <Input value={area} onChange={e => setArea(e.target.value)} placeholder="z.B. Lend" {...inputProps} />
            </Box>
          </Flex>

          {/* Visibility */}
          <Text fontWeight="700" color="bark.500" mb="3" mt="5">
            Sichtbarkeit
          </Text>

          <Box mb="4">
            <Text fontSize="sm" fontWeight="600" color="bark.400" mb="1">Wer darf mich sehen?</Text>
            <select
              value={visibleToGender}
              onChange={e => setVisibleToGender(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #E2C9A0',
                backgroundColor: '#FFFCF7',
                color: '#6B4226',
                fontWeight: 600,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
              }}
            >
              <option value="all">Alle</option>
              <option value="female">Nur Frauen</option>
              <option value="male">Nur Männer</option>
            </select>
          </Box>

          {/* Checkboxes */}
          <Flex gap="3" mb="5" wrap="wrap">
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: accessible ? '#2D6A4F' : '#E2C9A0',
              backgroundColor: accessible ? '#E8F5E9' : '#FFFCF7',
              color: accessible ? '#2D6A4F' : '#6B4226',
              transition: 'all 0.2s',
            }}>
              <input
                type="checkbox"
                checked={accessible}
                onChange={e => setAccessible(e.target.checked)}
                style={{ display: 'none' }}
              />
              {accessible ? '\u2705' : '\u26AA'} Zugänglich
            </label>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: needHisTime ? '#D4A847' : '#E2C9A0',
              backgroundColor: needHisTime ? '#FDF8E8' : '#FFFCF7',
              color: needHisTime ? '#D4A847' : '#6B4226',
              transition: 'all 0.2s',
            }}>
              <input
                type="checkbox"
                checked={needHisTime}
                onChange={e => setNeedHisTime(e.target.checked)}
                style={{ display: 'none' }}
              />
              {needHisTime ? '\u23F3' : '\u26AA'} Schnupperzeit
            </label>
          </Flex>

          <Button
            type="submit"
            disabled={savingProfile}
            bg="forest.500"
            color="white"
            _hover={{ bg: 'forest.600' }}
            width="full"
            size="lg"
            fontWeight="700"
          >
            <FaSave style={{ marginRight: '8px' }} />
            {savingProfile ? 'Speichert…' : 'Profil speichern'}
          </Button>
        </form>

        {message && (
          <Text mt="4" textAlign="center" color={message.includes('Fehler') ? 'ember.500' : 'forest.600'} fontWeight="600">
            {message}
          </Text>
        )}

        {/* Blockierte Nutzer */}
        {blockedUsers.length > 0 && (
          <Box mt="6" pt="5" borderTop="1px solid" borderColor="sand.300">
            <Text fontWeight="700" color="bark.500" mb="3">
              Blockierte Nutzer
            </Text>
            {blockedUsers.map(b => (
              <Flex
                key={b.blockedUserId}
                align="center"
                justify="space-between"
                bg="sand.100"
                borderRadius="lg"
                px="4" py="3" mb="2"
              >
                <Box>
                  <Text fontWeight="600" color="bark.500" fontSize="sm">
                    {b.dogName} ({b.name})
                  </Text>
                  <Text fontSize="xs" color="bark.400">
                    Blockiert am {new Date(b.createdAt).toLocaleDateString('de-DE')}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="forest.500"
                  color="forest.500"
                  _hover={{ bg: 'forest.50' }}
                  fontWeight="600"
                  disabled={unblocking === b.blockedUserId}
                  onClick={() => handleUnblock(b.blockedUserId)}
                >
                  {unblocking === b.blockedUserId ? 'Wird…' : 'Entblockieren'}
                </Button>
              </Flex>
            ))}
          </Box>
        )}

        {/* Account löschen */}
        <Box mt="6" textAlign="center">
          {!showDeleteDialog ? (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              style={{
                fontSize: '12px',
                color: '#A0896C',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C0392B')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A0896C')}
            >
              Account löschen
            </button>
          ) : (
            <Box bg="sand.100" borderRadius="lg" p="4">
              <Text fontSize="sm" color="bark.500" mb="3">
                Bist du sicher? Dein Account wird deaktiviert und du kannst dich nicht mehr einloggen.
                Gib dein Passwort zur Bestätigung ein:
              </Text>
              <Input
                type="password"
                placeholder="Passwort"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                mb="3"
                {...inputProps}
              />
              {deleteError && (
                <Text fontSize="sm" color="ember.500" mb="2" fontWeight="600">
                  {deleteError}
                </Text>
              )}
              <Flex gap="2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deletePassword}
                  bg="ember.500"
                  color="white"
                  _hover={{ bg: 'ember.600' }}
                  size="sm"
                  fontWeight="700"
                >
                  {deletingAccount ? 'Wird gelöscht…' : 'Endgültig löschen'}
                </Button>
                <Button
                  onClick={() => { setShowDeleteDialog(false); setDeletePassword(''); setDeleteError(''); }}
                  variant="outline"
                  borderColor="bark.300"
                  color="bark.400"
                  size="sm"
                  fontWeight="600"
                >
                  Abbrechen
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AccountCard;
