import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Mail, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn();
      toast.success('Authentication successful: Entry granted');
    } catch (error) {
      console.error(error);
      toast.error('Authentication failure: Clearance denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-500 overflow-hidden relative">
      {/* Aesthetic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-muted-foreground hover:text-primary transition-all rounded-2xl hover:bg-primary/5 h-12 w-12"
          >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md z-10"
      >
        <Card className="rounded-[2.5rem] shadow-2xl border-border/50 overflow-hidden bg-card/60 backdrop-blur-2xl transition-all duration-500">
          <CardHeader className="text-center space-y-6 pb-4 pt-10 relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="mx-auto w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 relative"
            >
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-pulse" />
            </motion.div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tighter text-foreground">
                SmartLeads <span className="text-primary italic">Nexus</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
                Authorized Entry Portal
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-10 pt-6">
            <Button 
              className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:primary/90 text-primary-foreground rounded-[1.25rem] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-3" />
              ) : (
                <Mail className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" />
              )}
              Initialize Login Sequence
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em]">
                <span className="bg-card/40 px-3 text-muted-foreground/60 backdrop-blur-md">Secure Protocol</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-secondary/50 rounded-2xl border border-border/50">
                 <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-60" />
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight leading-relaxed">
                   Biometric verification system active for all subsequent sessions.
                 </p>
              </div>
              <p className="text-center text-[9px] text-muted-foreground/40 leading-relaxed font-bold uppercase tracking-widest px-4">
                Encryption: AES-256 Enabled
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-4">
           <div className="w-8 h-[1px] bg-foreground/40" />
           <div className="w-3 h-3 bg-foreground rounded-sm rotate-45" />
           <div className="w-8 h-[1px] bg-foreground/40" />
        </div>
        <span className="text-[9px] font-black tracking-[0.5em] uppercase text-foreground">Docs Ecosystem Core</span>
      </motion.div>
    </div>
  );
};
