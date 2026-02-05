import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';
import LoginForm from './LoginForm';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const renderLogin = (onLogin = jest.fn()) =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <LoginForm onLogin={onLogin} />
      </MemoryRouter>
    </ChakraProvider>
  );

describe('LoginForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sollte Login-Formular rendern', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Passwort')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('sollte Link zur Registrierung zeigen', () => {
    renderLogin();
    expect(screen.getByText('Hier registrieren')).toBeInTheDocument();
  });

  it('sollte bei erfolgreichem Login onLogin aufrufen', async () => {
    const onLogin = jest.fn();
    const mockUser = { id: '1', name: 'Max', email: 'max@test.de' };

    mockedAxios.post.mockResolvedValueOnce({ data: { user: mockUser } });

    renderLogin(onLogin);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'max@test.de' },
    });
    fireEvent.change(screen.getByPlaceholderText('Passwort'), {
      target: { value: 'geheim123' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(mockUser);
    });
  });

  it('sollte Fehlermeldung bei fehlgeschlagenem Login zeigen', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Falsche Email oder Passwort' } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'wrong@test.de' },
    });
    fireEvent.change(screen.getByPlaceholderText('Passwort'), {
      target: { value: 'falsch' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Falsche Email oder Passwort')).toBeInTheDocument();
    });
  });

  it('sollte generische Fehlermeldung bei Netzwerkfehler zeigen', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.de' },
    });
    fireEvent.change(screen.getByPlaceholderText('Passwort'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Login')).toBeInTheDocument();
    });
  });
});
