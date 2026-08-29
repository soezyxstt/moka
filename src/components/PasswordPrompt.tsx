// components/PasswordPrompt.tsx
"use client"; // Essential for client-side interactivity

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

type PasswordPromptProps = object

const PasswordPrompt: React.FC<PasswordPromptProps> = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // On success, tell Next.js to re-evaluate server components
        // This will cause the page to re-render, and the server component will
        // now see the access cookie.
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.message || 'Incorrect password.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
    }}>
      <div style={{
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        textAlign: 'center',
      }}>
        <h2>Enter Password to Access This Page</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              padding: '0.5rem',
              margin: '1rem 0',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100%',
              boxSizing: 'border-box',
            }}
            disabled={loading}
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Checking...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;