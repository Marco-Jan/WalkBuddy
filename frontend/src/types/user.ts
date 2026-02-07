export interface User {
  id: string;
  name: string;
  email: string;
  humanGender: string;
  gender: string;
  age: string;
  breed: string;
  neutered?: string | null;
  description?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
  dogName: string;
  accessible: boolean | number;
  need_his_time: boolean | number;
  available: boolean | number;
  visibleToGender?: 'all' | 'male' | 'female';
  publicKey?: string | null;
  profilePic?: string | null;
  role?: 'user' | 'admin';
  aktiv: number;
  hasSeenOnboarding?: number;
  
}
