import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { processGoogleCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('No session ID received from Google. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const user = await processGoogleCallback(sessionId);
        
        // Redirect based on user role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, processGoogleCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
