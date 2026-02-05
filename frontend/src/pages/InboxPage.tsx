import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import { FaInbox, FaCircle } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaTrash } from 'react-icons/fa';
import { getInbox, deleteConversation } from '../api/api';
import { loadPrivateKey, importPublicKey, decryptMessage } from '../crypto';

type InboxItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  iv?: string;
  otherId: string;
  otherName: string;
  otherDogName: string;
  otherPublicKey?: string;
  hasUnread: number;
};

const InboxPage: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<InboxItem | null>(null);
  const navigate = useNavigate();
  const privateKeyRef = useRef<CryptoKey | null>(null);

  // Private Key aus IndexedDB laden
  useEffect(() => {
    loadPrivateKey().then(pk => {
      privateKeyRef.current = pk;
    });
  }, []);

  useEffect(() => {
    let timer: any;
    let cancelled = false;

    const load = async (first = false) => {
      try {
        if (first) setLoading(true);

        // Private Key sicherstellen
        if (!privateKeyRef.current) {
          privateKeyRef.current = await loadPrivateKey();
        }

        const data = await getInbox();
        if (cancelled) return;

        const pk = privateKeyRef.current;

        // Inbox-Vorschau entschlüsseln
        if (pk) {
          const decryptedItems = await Promise.all(
            data.items.map(async (item: InboxItem) => {
              if (item.iv && item.otherPublicKey) {
                try {
                  const otherPk = await importPublicKey(item.otherPublicKey);
                  const content = await decryptMessage(pk!, otherPk, item.content, item.iv);
                  return { ...item, content };
                } catch {
                  return { ...item, content: '[Verschlüsselt]' };
                }
              }
              return item;
            })
          );
          setItems(decryptedItems);
        } else {
          // Ohne Private Key: verschlüsselte Nachrichten als Platzhalter
          setItems(
            data.items.map((item: InboxItem) =>
              item.iv ? { ...item, content: '[Verschlüsselt]' } : item
            )
          );
        }
      } catch (e: any) {
        if (cancelled) return;

        if (e.response?.status === 401) {
          setItems([]);
          navigate('/login', { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(true);
    timer = setInterval(() => load(false), 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [navigate]);

  if (loading)
    return (
      <Flex justify="center" align="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );

  return (
    <Box>
      <Flex align="center" gap="2" mb={{ base: '4', md: '6' }}>
        <Box color="forest.500"><FaInbox size="24" /></Box>
        <Heading as="h2" size={{ base: 'lg', md: 'xl' }} color="bark.500" fontWeight="800">
          Nachrichten
        </Heading>
      </Flex>

      {items.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          py="12"
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
        >
          <Box color="sand.500" mb="4" opacity={0.5}><FaInbox size="48" /></Box>
          <Text color="bark.400" fontSize="lg">
            Noch keine Nachrichten.
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          {items.map(i => (
            <Box
              key={i.id}
              onClick={() =>
                navigate(`/messages/${i.otherId}`, {
                  state: { otherName: `${i.otherDogName} (${i.otherName})` }
                })
              }
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              cursor="pointer"
              overflow="hidden"
              transition="all 0.2s"
              _hover={{ boxShadow: 'md', transform: 'translateX(4px)' }}
              display="flex"
            >
              {/* Colored left border for unread */}
              <Box
                w="4px"
                flexShrink={0}
                bg={i.hasUnread ? 'forest.500' : 'transparent'}
              />

              <Flex
                flex="1"
                p="4"
                justify="space-between"
                align="center"
                gap="3"
              >
                <Box flex="1" minW="0">
                  <Flex align="center" gap="2">
                    <Text fontWeight="700" color="bark.500" fontSize="md">
                      {i.otherDogName} ({i.otherName})
                    </Text>
                    {i.iv && (
                      <Box color="forest.500">
                        <svg width="10" height="12" viewBox="0 0 14 16" fill="currentColor"><path d="M7 0C4.8 0 3 1.8 3 4v2H2a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-1V4c0-2.2-1.8-4-4-4zm2 6H5V4c0-1.1.9-2 2-2s2 .9 2 2v2z"/></svg>
                      </Box>
                    )}
                  </Flex>
                  <Text
                    color="bark.400"
                    fontSize="sm"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {i.content}
                  </Text>
                  <Text fontSize="xs" color="bark.300" mt="1">
                    {new Date(i.createdAt).toLocaleString()}
                  </Text>
                </Box>

                <Flex align="center" gap="2" flexShrink={0}>
                  {!!i.hasUnread && (
                    <Box color="ember.500"><FaCircle size="10" /></Box>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    color="bark.300"
                    _hover={{ color: 'ember.500' }}
                    minW="auto"
                    p="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(i);
                    }}
                    title="Chat löschen"
                  >
                    <FaTrash size="13" />
                  </Button>
                </Flex>
              </Flex>
            </Box>
          ))}
        </Flex>
      )}

      {/* Chat löschen Bestätigung */}
      {deleteTarget && (
        <Box
          position="fixed" top="0" left="0" right="0" bottom="0"
          bg="blackAlpha.500" zIndex="50"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => setDeleteTarget(null)}
        >
          <Box
            bg="white" borderRadius="xl" p="6" maxW="400px" w="90%" boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="md" color="bark.500" mb="3">Chat löschen?</Heading>
            <Text color="bark.400" fontSize="sm" mb="5">
              Der Chat mit <strong>{deleteTarget.otherDogName} ({deleteTarget.otherName})</strong> wird für dich gelöscht. Neue Nachrichten werden weiterhin angezeigt.
            </Text>
            <Flex gap="3" justify="flex-end">
              <Button
                variant="ghost" size="sm" color="bark.400"
                onClick={() => setDeleteTarget(null)}
              >
                Abbrechen
              </Button>
              <Button
                size="sm" bg="ember.500" color="white"
                _hover={{ bg: 'ember.600' }}
                onClick={async () => {
                  try {
                    await deleteConversation(deleteTarget.otherId);
                    setItems(prev => prev.filter(it => it.otherId !== deleteTarget.otherId));
                  } catch {
                    // Fehler still ignorieren
                  }
                  setDeleteTarget(null);
                }}
              >
                Löschen
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default InboxPage;
