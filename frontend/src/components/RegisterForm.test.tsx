import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';
import RegisterForm from './RegisterForm';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const renderRegister = () =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </ChakraProvider>
  );

describe('RegisterForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sollte Registrierungs-Formular rendern', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hundename')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Passwort')).toBeInTheDocument();
    expect(screen.getByText('Registrieren')).toBeInTheDocument();
  });

  it('sollte Link zum Login zeigen', () => {
    renderRegister();
    expect(screen.getByText('Hier einloggen')).toBeInTheDocument();
  });

  it('sollte Geschlecht-Dropdown haben', () => {
    renderRegister();
    const select = screen.getByDisplayValue('männlich');
    expect(select).toBeInTheDocument();
  });

  it('sollte Checkboxen für Zugänglich und Schnupperzeit haben', () => {
    renderRegister();
    expect(screen.getByLabelText(/Zugänglich/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Braucht Schnupperzeit/)).toBeInTheDocument();
  });

  it('sollte bei erfolgreicher Registrierung Bestätigungs-Nachricht zeigen', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true, message: 'Verifizierungs-Email gesendet' } });

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Lisa' },
    });
    fireEvent.change(screen.getByPlaceholderText('Hundename'), {
      target: { value: 'Luna' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'lisa@test.de' },
    });
    fireEvent.change(screen.getByPlaceholderText('Passwort'), {
      target: { value: 'geheim' },
    });
    fireEvent.click(screen.getByText('Registrieren'));

    await waitFor(() => {
      expect(screen.getByText('Fast geschafft!')).toBeInTheDocument();
    });
  });

  it('sollte Fehlermeldung bei Duplikat-Email zeigen', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Email existiert bereits' } },
    });

    renderRegister();

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Hundename'), {
      target: { value: 'Hund' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'dup@test.de' },
    });
    fireEvent.change(screen.getByPlaceholderText('Passwort'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByText('Registrieren'));

    await waitFor(() => {
      expect(screen.getByText('Email existiert bereits')).toBeInTheDocument();
    });
  });
});
