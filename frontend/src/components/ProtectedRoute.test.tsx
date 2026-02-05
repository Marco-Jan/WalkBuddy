import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { User } from '../types/user';

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

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear());

  it('sollte children rendern wenn User eingeloggt', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute user={testUser}>
                <p>Geschützter Inhalt</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Geschützter Inhalt')).toBeInTheDocument();
  });

  it('sollte zu /login weiterleiten wenn kein User', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute user={null}>
                <p>Geschützter Inhalt</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login-Seite</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Geschützter Inhalt')).not.toBeInTheDocument();
    expect(screen.getByText('Login-Seite')).toBeInTheDocument();
  });

  it('sollte localStorage NICHT als Fallback nutzen', () => {
    // localStorage darf Auth nicht bypassen
    localStorage.setItem('currentUser', JSON.stringify(testUser));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute user={null}>
                <p>Geschützter Inhalt</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login-Seite</p>} />
        </Routes>
      </MemoryRouter>
    );

    // Muss zu Login weiterleiten, auch wenn localStorage gesetzt ist
    expect(screen.queryByText('Geschützter Inhalt')).not.toBeInTheDocument();
    expect(screen.getByText('Login-Seite')).toBeInTheDocument();
  });
});
