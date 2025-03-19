// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  
  const handleRegister = async (data: { name?: string; email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      // In a real app, you would set up client-side authentication state here
      const userData = await response.json();
      
      // For now, we'll just simulate successful registration
      return userData;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      throw error;
    }
  };
  
  return (
    <>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <AuthForm mode="register" onSubmit={handleRegister} />
    </>
  );
}