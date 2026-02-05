import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, Input, Spinner, Text } from '@chakra-ui/react';
import { FaEnvelope, FaPaw } from 'react-icons/fa';
// @ts-ignore react-icons TS resolution issue
import { FaUsers, FaFlag, FaTrash, FaCheck, FaEye, FaInbox } from 'react-icons/fa';
import { User } from '../types/user';
import {
  getAdminStats, getAdminUsers, getAdminReports, resolveReport, deleteAdminUser,
  getProfilePicUrl, getAdminContact, markContactRead, deleteContact, getAdminLog,
} from '../api/api';

interface Props {
  user: User;
}

type AdminStats = {
  users: number;
  messages: number;
  openReports: number;
  unreadContact: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  dogName: string;
  profilePic: string | null;
  role: string;
  available: number;
  city: string | null;
  messageCount: number;
  activeReports: number;
};

type AdminReport = {
  id: string;
  reason: string;
  createdAt: string;
  resolved: number;
  reporterId: string;
  reporterName: string;
  reporterDogName: string;
  reportedUserId: string;
  reportedName: string;
  reportedDogName: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: number;
  createdAt: string;
};

type LogEntry = {
  id: string;
  type: 'contact' | 'report' | 'message';
  actor: string;
  detail: string | null;
  extra: string | null;
  createdAt: string;
};

const AdminPage: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'contact' | 'log'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  // Guard: redirect non-admins
  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user.role, navigate]);

  useEffect(() => {
    if (user.role !== 'admin') return;
    (async () => {
      setLoading(true);
      try {
        const [s, u, r, c, l] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminReports(),
          getAdminContact(),
          getAdminLog(),
        ]);
        setStats(s);
        setUsers(u);
        setReports(r);
        setContactMessages(c);
        setLogEntries(l);
      } catch (e: any) {
        if (e?.response?.status === 403 || e?.response?.status === 401) {
          navigate('/', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user.role, navigate]);

  const handleDeleteUser = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, users: stats.users - 1 });
    } catch {
      // ignore
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, resolved: 1 } : r));
      if (stats) setStats({ ...stats, openReports: Math.max(0, stats.openReports - 1) });
    } catch {
      // ignore
    } finally {
      setResolving(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markContactRead(id);
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, read: 1 } : m));
      if (stats) setStats({ ...stats, unreadContact: Math.max(0, stats.unreadContact - 1) });
    } catch {
      // ignore
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContact(id);
      setContactMessages(prev => prev.filter(m => m.id !== id));
    } catch {
      // ignore
    }
  };

  if (user.role !== 'admin') return null;

  if (loading) {
    return (
      <Flex justify="center" py="16">
        <Spinner size="xl" color="forest.500" borderWidth="4px" />
      </Flex>
    );
  }

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.dogName.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const tabStyle = (tab: string) => ({
    px: '4' as const,
    py: '2' as const,
    fontWeight: '700' as const,
    fontSize: 'sm' as const,
    cursor: 'pointer' as const,
    borderBottom: '3px solid',
    borderColor: activeTab === tab ? 'forest.500' : 'transparent',
    color: activeTab === tab ? 'forest.600' : 'bark.400',
    _hover: { color: 'forest.500' },
    transition: 'all 0.2s',
    position: 'relative' as const,
  });

  const logTypeLabel = (type: string) => {
    switch (type) {
      case 'contact': return { label: 'Kontakt', bg: 'forest.100', color: 'forest.700' };
      case 'report': return { label: 'Meldung', bg: 'ember.100', color: 'ember.700' };
      case 'message': return { label: 'Nachricht', bg: 'amber.100', color: 'amber.700' };
      default: return { label: type, bg: 'sand.200', color: 'bark.500' };
    }
  };

  const unreadCount = contactMessages.filter(m => !m.read).length;

  return (
    <Box maxW="900px" mx="auto">
      <Heading as="h1" size="lg" color="bark.500" fontWeight="800" mb="4">
        Admin Dashboard
      </Heading>

      {/* Tabs */}
      <Flex gap="0" borderBottom="1px solid" borderColor="sand.300" mb="5" overflowX="auto">
        <Box {...tabStyle('overview')} onClick={() => setActiveTab('overview')}>
          Übersicht
        </Box>
        <Box {...tabStyle('users')} onClick={() => setActiveTab('users')}>
          Benutzer
        </Box>
        <Box {...tabStyle('reports')} onClick={() => setActiveTab('reports')}>
          Meldungen
        </Box>
        <Box {...tabStyle('contact')} onClick={() => setActiveTab('contact')}>
          <Flex align="center" gap="1.5">
            Kontakt
            {unreadCount > 0 && (
              <Flex
                bg="ember.500" color="white" borderRadius="full"
                w="20px" h="20px" align="center" justify="center"
                fontSize="xs" fontWeight="800"
              >
                {unreadCount}
              </Flex>
            )}
          </Flex>
        </Box>
        <Box {...tabStyle('log')} onClick={() => setActiveTab('log')}>
          Log
        </Box>
      </Flex>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <Flex gap="4" wrap="wrap">
          <Box flex="1" minW="140px" bg="white" borderRadius="xl" boxShadow="md" p="5">
            <Flex align="center" gap="3" mb="2">
              <Flex w="40px" h="40px" borderRadius="lg" bg="forest.50" align="center" justify="center">
                <FaUsers size="18" color="#2D6A4F" />
              </Flex>
              <Text fontSize="sm" color="bark.400" fontWeight="600">Benutzer</Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="800" color="bark.500">{stats.users}</Text>
          </Box>

          <Box flex="1" minW="140px" bg="white" borderRadius="xl" boxShadow="md" p="5">
            <Flex align="center" gap="3" mb="2">
              <Flex w="40px" h="40px" borderRadius="lg" bg="amber.50" align="center" justify="center">
                <FaEnvelope size="18" color="#D4A847" />
              </Flex>
              <Text fontSize="sm" color="bark.400" fontWeight="600">Nachrichten</Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="800" color="bark.500">{stats.messages}</Text>
          </Box>

          <Box flex="1" minW="140px" bg="white" borderRadius="xl" boxShadow="md" p="5">
            <Flex align="center" gap="3" mb="2">
              <Flex w="40px" h="40px" borderRadius="lg" bg="ember.50" align="center" justify="center">
                <FaFlag size="18" color="#E85D3A" />
              </Flex>
              <Text fontSize="sm" color="bark.400" fontWeight="600">Offene Meldungen</Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="800" color={stats.openReports > 0 ? 'ember.500' : 'bark.500'}>
              {stats.openReports}
            </Text>
          </Box>

          <Box flex="1" minW="140px" bg="white" borderRadius="xl" boxShadow="md" p="5">
            <Flex align="center" gap="3" mb="2">
              <Flex w="40px" h="40px" borderRadius="lg" bg="forest.50" align="center" justify="center">
                <FaInbox size="18" color="#2D6A4F" />
              </Flex>
              <Text fontSize="sm" color="bark.400" fontWeight="600">Kontaktanfragen</Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="800" color={stats.unreadContact > 0 ? 'ember.500' : 'bark.500'}>
              {stats.unreadContact}
            </Text>
          </Box>
        </Flex>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Box>
          <Input
            placeholder="Suche nach Name, Email oder Hundename…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            mb="4"
            bg="white"
            borderColor="sand.400"
            _hover={{ borderColor: 'forest.300' }}
            _focus={{ borderColor: 'forest.500', boxShadow: '0 0 0 1px #2D6A4F' }}
          />

          {filteredUsers.map(u => (
            <Flex
              key={u.id}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              p="4" mb="2"
              align="center"
              gap="3"
            >
              {u.profilePic ? (
                <img
                  src={getProfilePicUrl(u.profilePic)!}
                  alt={u.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <Flex
                  w="40px" h="40px"
                  borderRadius="full"
                  bg="sand.300"
                  align="center" justify="center"
                  flexShrink={0}
                >
                  <FaPaw size="16" color="#6B4226" />
                </Flex>
              )}
              <Box flex="1" minW="0">
                <Flex align="center" gap="2">
                  <Text fontWeight="700" color="bark.500" fontSize="sm" lineClamp={1}>
                    {u.dogName} ({u.name})
                  </Text>
                  {u.role === 'admin' && (
                    <Text fontSize="xs" bg="forest.100" color="forest.700" px="2" borderRadius="full" fontWeight="600">
                      Admin
                    </Text>
                  )}
                </Flex>
                <Text fontSize="xs" color="bark.400" lineClamp={1}>{u.email}</Text>
                <Flex gap="3" mt="1" fontSize="xs" color="bark.400">
                  <Text>{u.messageCount} Nachrichten</Text>
                  {u.activeReports > 0 && (
                    <Text color="ember.500" fontWeight="600">{u.activeReports} Meldungen</Text>
                  )}
                </Flex>
              </Box>
              {u.role !== 'admin' && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="ember.500"
                  _hover={{ bg: 'ember.50' }}
                  onClick={() => setDeleteConfirm(u.id)}
                  disabled={deleting === u.id}
                >
                  <FaTrash size="14" />
                </Button>
              )}
            </Flex>
          ))}

          {filteredUsers.length === 0 && (
            <Text textAlign="center" color="bark.400" py="8">Keine Benutzer gefunden.</Text>
          )}
        </Box>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Box>
          {reports.length === 0 ? (
            <Text textAlign="center" color="bark.400" py="8">Keine Meldungen vorhanden.</Text>
          ) : (
            reports.map(r => (
              <Box
                key={r.id}
                bg="white"
                borderRadius="lg"
                boxShadow="sm"
                p="4" mb="2"
                opacity={r.resolved ? 0.6 : 1}
              >
                <Flex justify="space-between" align="flex-start" gap="3">
                  <Box flex="1" minW="0">
                    <Flex gap="2" wrap="wrap" mb="1" align="center">
                      <Text fontSize="sm" fontWeight="700" color="bark.500">
                        {r.reporterDogName} ({r.reporterName})
                      </Text>
                      <Text fontSize="xs" color="bark.400">meldet</Text>
                      <Text fontSize="sm" fontWeight="700" color="ember.500">
                        {r.reportedDogName} ({r.reportedName})
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="bark.400" mb="1">
                      {r.reason}
                    </Text>
                    <Text fontSize="xs" color="bark.400">
                      {new Date(r.createdAt).toLocaleString('de-DE')}
                    </Text>
                  </Box>
                  {r.resolved ? (
                    <Text fontSize="xs" color="forest.500" fontWeight="700" flexShrink={0}>
                      Erledigt
                    </Text>
                  ) : (
                    <Button
                      size="sm"
                      bg="forest.500"
                      color="white"
                      _hover={{ bg: 'forest.600' }}
                      onClick={() => handleResolve(r.id)}
                      disabled={resolving === r.id}
                      flexShrink={0}
                    >
                      <FaCheck style={{ marginRight: '4px' }} />
                      {resolving === r.id ? '…' : 'Erledigt'}
                    </Button>
                  )}
                </Flex>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <Box>
          {contactMessages.length === 0 ? (
            <Text textAlign="center" color="bark.400" py="8">Keine Kontaktanfragen vorhanden.</Text>
          ) : (
            contactMessages.map(m => (
              <Box
                key={m.id}
                bg="white"
                borderRadius="lg"
                boxShadow="sm"
                p="4" mb="2"
                borderLeft="4px solid"
                borderLeftColor={m.read ? 'sand.300' : 'forest.500'}
                opacity={m.read ? 0.75 : 1}
              >
                <Flex justify="space-between" align="flex-start" gap="3">
                  <Box
                    flex="1" minW="0"
                    cursor="pointer"
                    onClick={() => {
                      setExpandedContact(expandedContact === m.id ? null : m.id);
                      if (!m.read) handleMarkRead(m.id);
                    }}
                  >
                    <Flex gap="2" align="center" mb="1">
                      {!m.read && (
                        <Flex w="8px" h="8px" borderRadius="full" bg="forest.500" flexShrink={0} />
                      )}
                      <Text fontSize="sm" fontWeight="700" color="bark.500">
                        {m.name}
                      </Text>
                      <Text fontSize="xs" color="bark.400">
                        &lt;{m.email}&gt;
                      </Text>
                    </Flex>
                    {m.subject && (
                      <Text fontSize="sm" color="bark.500" fontWeight="600" mb="1">
                        {m.subject}
                      </Text>
                    )}
                    <Text fontSize="xs" color="bark.400">
                      {new Date(m.createdAt).toLocaleString('de-DE')}
                    </Text>

                    {expandedContact === m.id && (
                      <Box mt="3" p="3" bg="sand.50" borderRadius="md" border="1px solid" borderColor="sand.200">
                        <Text fontSize="sm" color="bark.500" whiteSpace="pre-wrap">
                          {m.message}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  <Flex gap="1" flexShrink={0}>
                    {!m.read && (
                      <Button
                        size="sm" variant="ghost" color="forest.500"
                        _hover={{ bg: 'forest.50' }}
                        onClick={() => handleMarkRead(m.id)}
                        title="Als gelesen markieren"
                      >
                        <FaEye size="14" />
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost" color="ember.500"
                      _hover={{ bg: 'ember.50' }}
                      onClick={() => handleDeleteContact(m.id)}
                      title="Löschen"
                    >
                      <FaTrash size="14" />
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <Box>
          {logEntries.length === 0 ? (
            <Text textAlign="center" color="bark.400" py="8">Keine Log-Einträge vorhanden.</Text>
          ) : (
            logEntries.map((entry, i) => {
              const badge = logTypeLabel(entry.type);
              return (
                <Flex
                  key={`${entry.type}-${entry.id}-${i}`}
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  p="3" mb="1.5"
                  align="center"
                  gap="3"
                >
                  <Text
                    fontSize="xs" fontWeight="700" px="2" py="0.5"
                    borderRadius="full" bg={badge.bg} color={badge.color}
                    flexShrink={0} minW="70px" textAlign="center"
                  >
                    {badge.label}
                  </Text>
                  <Box flex="1" minW="0">
                    <Text fontSize="sm" color="bark.500" fontWeight="600" lineClamp={1}>
                      {entry.actor}
                    </Text>
                    {entry.detail && (
                      <Text fontSize="xs" color="bark.400" lineClamp={1}>
                        {entry.detail}
                      </Text>
                    )}
                  </Box>
                  <Text fontSize="xs" color="bark.400" flexShrink={0}>
                    {new Date(entry.createdAt).toLocaleString('de-DE')}
                  </Text>
                </Flex>
              );
            })
          )}
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <Box
          position="fixed" top="0" left="0" right="0" bottom="0"
          bg="blackAlpha.500" zIndex="50"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => setDeleteConfirm(null)}
        >
          <Box
            bg="white" borderRadius="xl" p="6" maxW="400px" w="90%" boxShadow="xl"
            onClick={e => e.stopPropagation()}
          >
            <Heading size="md" color="bark.500" mb="3">Benutzer löschen?</Heading>
            <Text color="bark.400" fontSize="sm" mb="5">
              Dieser Benutzer und alle zugehörigen Daten (Nachrichten, Meldungen, Blockierungen) werden unwiderruflich gelöscht.
            </Text>
            <Flex gap="3" justify="flex-end">
              <Button variant="ghost" size="sm" color="bark.400" onClick={() => setDeleteConfirm(null)}>
                Abbrechen
              </Button>
              <Button
                size="sm" bg="ember.500" color="white"
                _hover={{ bg: 'ember.600' }}
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={deleting === deleteConfirm}
              >
                {deleting === deleteConfirm ? 'Wird gelöscht…' : 'Löschen'}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminPage;
