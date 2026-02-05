import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';
import UserCard from './UserCard';
import { User } from '../types/user';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const baseUser: User = {
  id: 'abc-123',
  name: 'Max',
  email: 'max@test.de',
  gender: 'male',
  humanGender:'male',
  age: '1',
  breed: 'Husky',
  dogName: 'Bello',
  accessible: 0,
  need_his_time: 0,
  available: 1,
  aktiv: 1,
};

const renderCard = (user: User = baseUser) =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <UserCard user={user} />
      </MemoryRouter>
    </ChakraProvider>
  );

describe('UserCard', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('sollte Hundename und Besitzer anzeigen', () => {
    renderCard();
    expect(screen.getByText('Bello (Max)')).toBeInTheDocument();
  });

  it('sollte Geschlecht anzeigen', () => {
    renderCard();
    expect(screen.getByText(/male/)).toBeInTheDocument();
  });

  it('sollte "Verfügbar" anzeigen wenn available=1', () => {
    renderCard({ ...baseUser, available: 1 });
    expect(screen.getByText('Verfügbar')).toBeInTheDocument();
  });

  it('sollte "Zugänglich" anzeigen wenn accessible=1', () => {
    renderCard({ ...baseUser, accessible: 1 });
    expect(screen.getByText('Zugänglich')).toBeInTheDocument();
  });

  it('sollte "Braucht schnupper Zeit" anzeigen', () => {
    renderCard({ ...baseUser, need_his_time: 1 });
    expect(screen.getByText('Braucht schnupper Zeit')).toBeInTheDocument();
  });

  it('sollte Standort anzeigen wenn vorhanden', () => {
    renderCard({ ...baseUser, city: 'Graz', area: 'Lend', postalCode: '8020' });
    expect(screen.getByText('Graz – Lend 8020')).toBeInTheDocument();
  });

  it('sollte keinen Standort anzeigen wenn city fehlt', () => {
    renderCard({ ...baseUser, city: null });
    expect(screen.queryByText(/Graz/)).not.toBeInTheDocument();
  });

  it('sollte zur Nachrichtenseite navigieren bei Klick', () => {
    renderCard();
    fireEvent.click(screen.getByText('Nachricht schreiben'));
    expect(mockNavigate).toHaveBeenCalledWith('/messages/abc-123');
  });
});
