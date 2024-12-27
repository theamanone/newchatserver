"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const RequestResetPasswordPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response:any = await axios.post('/api/user/reset-password', {
       emailOrUsername,
       type: 'request'
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Reset link sent to your email.');
        setTimeout(() => router.push('/auth/signin'), 2000); // Redirect after a delay
      } else {
        setError(result.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Request Password Reset</h1>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
            Email or Username
          </label>
          <input
            type="text"
            id="emailOrUsername"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 bg-blue-500 text-white rounded-md ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};

export default RequestResetPasswordPage;
