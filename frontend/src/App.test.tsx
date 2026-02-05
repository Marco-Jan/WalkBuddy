import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from './theme';
import App from './App';

jest.mock('./api/api', () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
  getUnreadCount: jest.fn().mockResolvedValue(0),
  markMessagesRead: jest.fn().mockResolvedValue({}),
}));

import { getMe, logout } from './api/api';

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;

const renderApp = () =>
  render(
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  );

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('sollte Lade-Text anzeigen während Session geprüft wird', () => {
    mockedGetMe.mockReturnValue(new Promise(() => {})); // never resolves
    renderApp();
    expect(screen.getByText('Lade…')).toBeInTheDocument();
  });

  it('sollte Login-Link anzeigen wenn nicht eingeloggt', async () => {
    mockedGetMe.mockRejectedValue(new Error('401'));
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Registrieren')).toBeInTheDocument();
    });
  });

  it('sollte Logout-Button anzeigen wenn eingeloggt', async () => {
    mockedGetMe.mockResolvedValue({
      id: '1',
      name: 'Max',
      email: 'max@test.de',
      gender: 'male',
      humanGender: 'male',
      age: '1',
      breed: 'Husky',
      dogName: 'Bello',
      accessible: 0,
      need_his_time: 0,
      available: 0,
      aktiv: 1,
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });
});
