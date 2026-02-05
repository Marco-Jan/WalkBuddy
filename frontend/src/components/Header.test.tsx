import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';
import Header from './Header';
import { User } from '../types/user';

jest.mock('../api/api', () => ({
  getUnreadCount: jest.fn().mockResolvedValue(0),
  markMessagesRead: jest.fn().mockResolvedValue({}),
}));

const testUser: User = {
  id: '1',
  name: 'Max',
  email: 'max@test.de',
  gender: 'male',
  humanGender:'male',
  age: '1',
  breed: 'Husky',
  dogName: 'Bello',
  accessible: 0,
  need_his_time: 0,
  available: 0,
  aktiv: 1,
};

describe('Header', () => {
  it('sollte Login/Registrieren Links zeigen wenn nicht eingeloggt', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <Header user={null} onLogout={jest.fn()} />
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Registrieren')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('sollte Logout/Nachrichten/Account zeigen wenn eingeloggt', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <Header user={testUser} onLogout={jest.fn()} />
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Nachrichten')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('sollte immer WalkBuddy-Brand zeigen', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <Header user={null} onLogout={jest.fn()} />
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(screen.getByText('WalkBuddy')).toBeInTheDocument();
  });
});
