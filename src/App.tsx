/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Initializing SmartLeads...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" closeButton richColors />
    </AuthProvider>
  );
}
