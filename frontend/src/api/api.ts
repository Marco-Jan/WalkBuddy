import axios from 'axios';
import { User } from '../types/user';

axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getAvailableUsers = async (): Promise<User[]> => {
  const res = await axios.get(`${BASE_URL}/status/available`);
  return res.data;
};

export const setMyStatus = async (available: boolean) => {
  const res = await axios.post(`${BASE_URL}/status/set`, { available });
  return res.data; // { success: true, user: me }
};

//nachrichen panel start

export const sendMessage = async (receiverId: string, content: string, iv?: string) => {
  const res = await axios.post(`${BASE_URL}/messages/send`, { receiverId, content, iv });
  return res.data;
};

export const getMessagesWith = async (userId: string): Promise<{ messages: any[]; otherPublicKey: string | null }> => {
  const res = await axios.get(`${BASE_URL}/messages/with/${userId}`);
  return res.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await axios.get(`${BASE_URL}/messages/unread-count`);
  return Number(res.data.count) || 0;
};


export const deleteMessage = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/messages/${id}`);
  return res.data;
};

export const deleteConversation = async (otherId: string) => {
  const res = await axios.delete(`${BASE_URL}/messages/conversation/${otherId}`);
  return res.data;
};

export const markMessagesRead = async () => {
  const res = await axios.post(`${BASE_URL}/messages/mark-read`);
  return res.data;
};

export const getInbox = async (): Promise<{ items: any[] }> => {
  const res = await axios.get(`${BASE_URL}/messages/inbox`);
  return res.data;
};

export const markConversationRead = async (otherId: string) => {
  const res = await axios.post(`${BASE_URL}/messages/mark-read/${otherId}`);
  return res.data;
};

export const getPartnerName = async (otherId: string): Promise<string> => {
  const res = await axios.get(`${BASE_URL}/messages/partner/${otherId}`);
  return res.data.otherName;
};



// /Nachrichtenpanel ende

// Block & Report
export const blockUser = async (userId: string) => {
  const res = await axios.post(`${BASE_URL}/blocks/block`, { userId });
  return res.data;
};

export const unblockUser = async (userId: string) => {
  const res = await axios.post(`${BASE_URL}/blocks/unblock`, { userId });
  return res.data;
};

export const reportUser = async (userId: string, reason: string) => {
  const res = await axios.post(`${BASE_URL}/blocks/report`, { userId, reason });
  return res.data;
};

export const getBlockedUsers = async (): Promise<{ items: { blockedUserId: string; name: string; dogName: string; createdAt: string }[] }> => {
  const res = await axios.get(`${BASE_URL}/blocks/list`);
  return res.data;
};


// Session-basiert: kein id mehr
export const getMe = async (): Promise<User> => {
  const res = await axios.get(`${BASE_URL}/auth/me`);
  return res.data.user; // je nachdem wie du es im Backend sendest
};

export const updateMe = async (
  user: {
    name: string;
    gender: string;
    humanGender: string;
    age: string;
    breed: string;
    dogName: string;
    accessible: boolean;
    need_his_time: boolean;
    city?: string | null;
    area?: string | null;
    postalCode?: string | null;
    visibleToGender?: 'all' | 'male' | 'female';
    neutered?: string | null;
    description?: string | null;
  }
) => {
  const res = await axios.put(`${BASE_URL}/auth/me`, user);
  return res.data;
};

export const logout = async () => {
  const res = await axios.post(`${BASE_URL}/auth/logout`);
  return res.data;
};

// E2EE: Public Key eines Users abrufen
export const getPublicKey = async (userId: string): Promise<string | null> => {
  const res = await axios.get(`${BASE_URL}/auth/public-key/${userId}`);
  return res.data.publicKey;
};

// E2EE: Schlüssel für bestehende User hochladen
export const uploadKeys = async (publicKey: string, encryptedPrivateKey: string) => {
  const res = await axios.post(`${BASE_URL}/auth/keys`, { publicKey, encryptedPrivateKey });
  return res.data;
};

// Profilbild hochladen
export const uploadProfilePic = async (file: File) => {
  const formData = new FormData();
  formData.append('profilePic', file);
  const res = await axios.post(`${BASE_URL}/auth/upload-pic`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Profilbild-URL Helper
export const getProfilePicUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  return `${BASE_URL}/uploads/${filename}`;
};

// User-Profil laden
export const getUserProfile = async (userId: string): Promise<User> => {
  const res = await axios.get(`${BASE_URL}/status/user/${userId}`);
  return res.data.user;
};

// Admin APIs
export const getAdminStats = async () => {
  const res = await axios.get(`${BASE_URL}/admin/stats`);
  return res.data;
};

export const getAdminUsers = async () => {
  const res = await axios.get(`${BASE_URL}/admin/users`);
  return res.data.items;
};

export const getAdminReports = async () => {
  const res = await axios.get(`${BASE_URL}/admin/reports`);
  return res.data.items;
};

export const resolveReport = async (id: string) => {
  const res = await axios.put(`${BASE_URL}/admin/reports/${id}/resolve`);
  return res.data;
};

export const deleteAdminUser = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/admin/users/${id}`);
  return res.data;
};

// Admin: Kontaktanfragen
export const getAdminContact = async () => {
  const res = await axios.get(`${BASE_URL}/admin/contact`);
  return res.data.items;
};

export const markContactRead = async (id: string) => {
  const res = await axios.put(`${BASE_URL}/admin/contact/${id}/read`);
  return res.data;
};

export const deleteContact = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/admin/contact/${id}`);
  return res.data;
};

// Admin: Log
export const getAdminLog = async () => {
  const res = await axios.get(`${BASE_URL}/admin/log`);
  return res.data.items;
};

// Kontaktformular senden
export const sendContactMessage = async (data: { name: string; email: string; subject?: string; message: string }) => {
  const res = await axios.post(`${BASE_URL}/contact/send`, data);
  return res.data;
};

// Email-Verifizierung erneut senden
export const resendVerification = async (email: string) => {
  const res = await axios.post(`${BASE_URL}/auth/resend-verification`, { email });
  return res.data;
};
