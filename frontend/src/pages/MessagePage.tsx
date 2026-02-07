import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Flex, Heading, Spinner, Text, Textarea } from '@chakra-ui/react';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import { getMe, getMessagesWith, sendMessage, markConversationRead, getPartnerName, getPublicKey, blockUser, reportUser, deleteConversation } from '../api/api';
import {
  loadPrivateKey,
  importPublicKey,
  encryptMessage,
  decryptMessage,
} from '../crypto';

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  iv?: string;
};

type LocationState = {
  otherName?: string;
};

const MessagePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [meId, setMeId] = useState<string>('');
  const [otherName, setOtherName] = useState<string>('Chat');
  const [e2eeActive, setE2eeActive] = useState(false);
  const [partnerLastSeenAt, setPartnerLastSeenAt] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const firstLoadDone = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const otherPubKeyRef = useRef<CryptoKey | null>(null);

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const otherLabel = useMemo(() => otherName || 'Partner', [otherName]);

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

  // Private Key aus IndexedDB laden
  useEffect(() => {
    loadPrivateKey().then(pk => {
      privateKeyRef.current = pk;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setMeId(me.id);
      } catch (e: any) {
        if (e?.response?.status === 401) navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      if (!userId) return;

      const stateName = (location.state as LocationState | null)?.otherName;
      if (stateName) {
        setOtherName(stateName);
        return;
      }

      try {
        const n = await getPartnerName(userId);
        setOtherName(n || 'Chat');
      } catch {
        setOtherName('Chat');
      }
    })();
  }, [userId, location.state]);

  const load = async (showSpinner = false) => {
    if (!userId) return;

    // Private Key laden falls noch nicht vorhanden
    if (!privateKeyRef.current) {
      privateKeyRef.current = await loadPrivateKey();
    }

    if (showSpinner) setLoading(true);
    try {
      const data = await getMessagesWith(userId);
      const rawMessages: Message[] = data.messages;
      setPartnerLastSeenAt(data.partnerLastSeenAt || null);

      // Public Key des Partners importieren (einmalig)
      if (!otherPubKeyRef.current && data.otherPublicKey) {
        otherPubKeyRef.current = await importPublicKey(data.otherPublicKey);
      }

      const pk = privateKeyRef.current;
      const otherPk = otherPubKeyRef.current;
      const canDecrypt = !!(pk && otherPk);

      setE2eeActive(canDecrypt);

      // Nachrichten entschlüsseln
      if (canDecrypt) {
        const decrypted = await Promise.all(
          rawMessages.map(async (m) => {
            if (m.iv) {
              try {
                const content = await decryptMessage(pk!, otherPk!, m.content, m.iv);
                return { ...m, content };
              } catch {
                return { ...m, content: '[Entschlüsselung fehlgeschlagen]' };
              }
            }
            return m; // Unverschlüsselte Nachricht (alt)
          })
        );
        setMessages(decrypted);
      } else {
        // Ohne Schlüssel: verschlüsselte Nachrichten als Platzhalter anzeigen
        setMessages(
          rawMessages.map(m =>
            m.iv ? { ...m, content: '[Verschlüsselte Nachricht]' } : m
          )
        );
      }

      setError('');
      setTimeout(() => scrollToBottom(false), 0);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setMessages([]);
        navigate('/login', { replace: true });
        return;
      }
      setError(e?.response?.data?.error || 'Fehler beim Laden');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!userId) return;

      setError('');
      await load(true);

      try {
        await markConversationRead(userId);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          setMessages([]);
          navigate('/login', { replace: true });
          return;
        }
      }

      firstLoadDone.current = true;
      setLoading(false);

      setTimeout(() => scrollToBottom(false), 0);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const timer = setInterval(async () => {
      if (!firstLoadDone.current) return;
      await load(false);
    }, 3000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSend = async () => {
    if (!userId) return;

    const msg = text.trim();
    if (!msg) return;

    setError('');

    try {
      // Private Key laden falls noch nicht vorhanden
      if (!privateKeyRef.current) {
        privateKeyRef.current = await loadPrivateKey();
      }
      const pk = privateKeyRef.current;

      // Public Key des Empfängers holen (falls noch nicht da)
      if (!otherPubKeyRef.current) {
        const pubKeyStr = await getPublicKey(userId);
        if (pubKeyStr) {
          otherPubKeyRef.current = await importPublicKey(pubKeyStr);
        }
      }

      const otherPk = otherPubKeyRef.current;

      if (pk && otherPk) {
        // E2EE: Nachricht verschlüsseln
        const { ciphertext, iv } = await encryptMessage(pk, otherPk, msg);
        await sendMessage(userId, ciphertext, iv);
      } else {
        // Fallback: unverschlüsselt (wenn ein User noch keine Schlüssel hat)
        await sendMessage(userId, msg);
      }

      setText('');

      await load(false);
      await markConversationRead(userId);

      setTimeout(() => scrollToBottom(true), 0);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setMessages([]);
        navigate('/login', { replace: true });
        return;
      }
      setError(e?.response?.data?.error || 'Fehler beim Senden');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSend();
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  };

  if (loading)
    return (
      <Flex justify="center" align="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );

  return (
    <Box maxW="900px" mx="auto">
      {/* Chat Header */}
      <Flex align="center" gap={{ base: '2', md: '3' }} mb={{ base: '3', md: '4' }}>
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
        <Heading as="h2" size={{ base: 'md', md: 'lg' }} color="bark.500" fontWeight="800" lineClamp={1}>
          {otherName}
        </Heading>
        {e2eeActive && (
          <Flex align="center" gap="1" ml="auto" color="forest.500" fontSize="xs" fontWeight="600">
            <svg width="10" height="12" viewBox="0 0 14 16" fill="currentColor"><path d="M7 0C4.8 0 3 1.8 3 4v2H2a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-1V4c0-2.2-1.8-4-4-4zm2 6H5V4c0-1.1.9-2 2-2s2 .9 2 2v2z"/></svg>
            <Text>Verschlüsselt</Text>
          </Flex>
        )}

        {/* Kebab Menu */}
        <Box position="relative" ref={menuRef} ml={e2eeActive ? '0' : 'auto'}>
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
              position="absolute"
              right="0"
              top="100%"
              bg="white"
              boxShadow="lg"
              borderRadius="md"
              border="1px solid"
              borderColor="sand.300"
              zIndex="10"
              minW="160px"
              py="1"
            >
              <Box
                px="4" py="2"
                cursor="pointer"
                _hover={{ bg: 'sand.200' }}
                fontSize="sm"
                fontWeight="600"
                color="bark.500"
                onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}
              >
                Chat löschen
              </Box>
              <Box
                px="4" py="2"
                cursor="pointer"
                _hover={{ bg: 'sand.200' }}
                fontSize="sm"
                fontWeight="600"
                color="bark.500"
                onClick={() => { setMenuOpen(false); setShowReportDialog(true); }}
              >
                Melden
              </Box>
              <Box
                px="4" py="2"
                cursor="pointer"
                _hover={{ bg: 'ember.50' }}
                fontSize="sm"
                fontWeight="600"
                color="ember.500"
                onClick={() => { setMenuOpen(false); setShowBlockConfirm(true); }}
              >
                Blockieren
              </Box>
            </Box>
          )}
        </Box>
      </Flex>

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
              {otherLabel} wird dich nicht mehr kontaktieren können und du wirst keine Nachrichten mehr von diesem User sehen.
            </Text>
            <Flex gap="3" justify="flex-end">
              <Button
                variant="ghost" size="sm" color="bark.400"
                onClick={() => setShowBlockConfirm(false)}
              >
                Abbrechen
              </Button>
              <Button
                size="sm" bg="ember.500" color="white"
                _hover={{ bg: 'ember.600' }}
                onClick={handleBlock}
              >
                Blockieren
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Chat löschen Bestätigung */}
      {showDeleteConfirm && (
        <Box
          position="fixed" top="0" left="0" right="0" bottom="0"
          bg="blackAlpha.500" zIndex="50"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <Box
            bg="white" borderRadius="xl" p="6" maxW="400px" w="90%" boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="md" color="bark.500" mb="3">Chat löschen?</Heading>
            <Text color="bark.400" fontSize="sm" mb="5">
              Der Chat mit {otherLabel} wird für dich gelöscht. Neue Nachrichten werden weiterhin angezeigt.
            </Text>
            <Flex gap="3" justify="flex-end">
              <Button
                variant="ghost" size="sm" color="bark.400"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Abbrechen
              </Button>
              <Button
                size="sm" bg="ember.500" color="white"
                _hover={{ bg: 'ember.600' }}
                onClick={async () => {
                  if (!userId) return;
                  try {
                    await deleteConversation(userId);
                    navigate(-1);
                  } catch (e: any) {
                    setError(e?.response?.data?.error || 'Fehler beim Löschen');
                  }
                  setShowDeleteConfirm(false);
                }}
              >
                Löschen
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
                  <Button
                    variant="ghost" size="sm" color="bark.400"
                    onClick={() => { setShowReportDialog(false); setReportReason(''); }}
                  >
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

      {error && (
        <Text color="ember.500" fontWeight="600" mb="3">
          {error}
        </Text>
      )}

      {/* Message List */}
      <Box
        ref={listRef}
        bg="sand.200"
        borderRadius="xl"
        p={{ base: '3', md: '4' }}
        h={{ base: 'calc(100vh - 280px)', md: '420px' }}
        minH="200px"
        overflowY="auto"
        boxShadow="inset 0 2px 4px rgba(0,0,0,0.06)"
      >
        {messages.length === 0 ? (
          <Flex justify="center" align="center" h="full">
            <Text color="bark.400">Noch keine Nachrichten.</Text>
          </Flex>
        ) : (
          messages.map(m => {
            const isMine = !!meId && m.senderId === meId;
            const isRead = isMine && partnerLastSeenAt
              && new Date(m.createdAt).getTime() <= new Date(partnerLastSeenAt).getTime();

            return (
              <Flex
                key={m.id}
                justify={isMine ? 'flex-end' : 'flex-start'}
                mb="3"
                align="center"
                gap="1"
              >
                <Box
                  maxW={{ base: '85%', md: '75%' }}
                  bg={isMine ? 'forest.500' : 'white'}
                  color={isMine ? 'white' : 'bark.500'}
                  px={{ base: '3', md: '4' }}
                  py="2.5"
                  borderRadius="xl"
                  borderBottomRightRadius={isMine ? '4px' : 'xl'}
                  borderBottomLeftRadius={isMine ? 'xl' : '4px'}
                  boxShadow="sm"
                >
                  <Text fontSize="xs" opacity={0.7} mb="1">
                    {isMine ? 'Du' : otherLabel} {'\u2022'} {new Date(m.createdAt).toLocaleString()}
                  </Text>
                  <Text whiteSpace="pre-wrap" fontSize="sm">
                    {m.content}
                  </Text>
                  {isMine && (
                    <Flex justify="flex-end" mt="0.5">
                      {isRead ? (
                        <FaCheckDouble size="12" style={{ opacity: 0.8 }} />
                      ) : (
                        <FaCheck size="10" style={{ opacity: 0.5 }} />
                      )}
                    </Flex>
                  )}
                </Box>
              </Flex>
            );
          })
        )}
      </Box>

      {/* Input Area */}
      <form onSubmit={onSubmit}>
        <Flex mt="3" gap="2">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Schreib eine Nachricht…"
            rows={2}
            resize="none"
            bg="white"
            borderColor="sand.400"
            _hover={{ borderColor: 'forest.300' }}
            _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
            flex="1"
          />
          <Button
            type="submit"
            bg="ember.500"
            color="white"
            _hover={{ bg: 'ember.600' }}
            alignSelf="flex-end"
            px="5"
            h="auto"
            py="3"
          >
            <FaPaperPlane />
          </Button>
        </Flex>
      </form>
    </Box>
  );
};

export default MessagePage;
