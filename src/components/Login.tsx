import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Mail, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn();
      toast.success('Logged in successfully');
    } catch (error) {
      console.error(error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SmartLeads Pro</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              Sign in to manage your sales pipeline
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Button 
            className="w-full h-12 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl shadow-sm transition-all active:scale-95" 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Mail className="w-5 h-5 mr-3" />
            )}
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500">Secure Environment</span>
            </div>
          </div>
          
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed px-6 font-medium">
            Authorized access only. By continuing, you agree to our data protection protocols.
          </p>
        </CardContent>
      </Card>
      
      {/* Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
        <div className="w-4 h-4 bg-slate-800 dark:bg-slate-200 rounded-sm" />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-800 dark:text-slate-200">DocuMind Ecosystem</span>
      </div>
    </div>
  );
};
