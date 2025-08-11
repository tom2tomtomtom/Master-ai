'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestOAuthPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`OAuth Test: ${message}`);
  };

  useEffect(() => {
    addLog('Page loaded, checking initial session');
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        addLog(`Found existing session for user: ${session.user?.email}`);
        setSession(session);
        setUser(session.user);
      } else {
        addLog('No existing session found');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        addLog(`Auth event: ${event}`);
        if (session) {
          addLog(`User authenticated: ${session.user?.email}`);
          setUser(session.user);
          setSession(session);
        } else {
          addLog('User signed out or session ended');
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleOAuth = async () => {
    setLoading(true);
    addLog('Starting Google OAuth...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/test-oauth`,
        },
      });

      if (error) {
        addLog(`OAuth error: ${error.message}`);
      } else {
        addLog('OAuth request sent, waiting for redirect...');
      }
    } catch (error: any) {
      addLog(`OAuth exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    addLog('Signing out...');
    await supabase.auth.signOut();
  };

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      addLog(`Session check error: ${error.message}`);
    } else if (session) {
      addLog(`Current session: ${session.user?.email}`);
    } else {
      addLog('No current session');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">OAuth Debug Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Test Google OAuth'}
              </button>
              
              <button
                onClick={checkSession}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Check Current Session
              </button>
              
              {user && (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Status</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 rounded">
                <strong className="text-gray-700">User:</strong>
                <div className="text-sm mt-1 text-gray-600">
                  {user ? JSON.stringify(user, null, 2) : 'Not authenticated'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-100 rounded">
                <strong className="text-gray-700">Session:</strong>
                <div className="text-sm mt-1 text-gray-600">
                  {session ? 'Active' : 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Debug Logs</h2>
            
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">No logs yet...</div>
              )}
            </div>
            
            <button
              onClick={() => setLogs([])}
              className="mt-2 text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}