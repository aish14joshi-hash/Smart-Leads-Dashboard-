import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Mail, Sun, Moon, Sparkles, ShieldCheck, ArrowLeft, UserPlus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Sign-in identity must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_.]+$/, 'Only lowercase, numbers, dots, or underscores'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type LoginMode = 'initial' | 'email-login' | 'email-signup' | 'forgot-password';

export const Login: React.FC = () => {
  const { signIn, signInWithEmail, signInWithIdentifier, signUp, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('initial');

  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const { register: signupRegister, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const { register: resetRegister, handleSubmit: handleResetSubmit, formState: { errors: resetErrors } } = useForm({
    resolver: zodResolver(resetSchema)
  });

  const handleGoogleLogin = async () => {
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

  const onEmailLogin = async (data: any) => {
    setLoading(true);
    try {
      await signInWithIdentifier(data.identifier, data.password);
      toast.success('Login successful: Nexus access granted');
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        toast.error('Protocol failure: Access credentials invalid or session expired.');
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error('Security alert: Excessive attempts detected. Signal locked temporarily.');
      } else {
        toast.error(`Login failed: ${error.message || 'Invalid credentials'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onEmailSignup = async (data: any) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.name, data.username, data.phone);
      toast.success('Account initialized: Identity created');
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        toast.error('Identity exists: This signal is already registered. Please authorize session instead.');
        setMode('email-login');
      } else if (errorCode === 'auth/weak-password') {
        toast.error('Protocol deviation: Pass-key complexity insufficient.');
      } else if (errorCode === 'auth/invalid-email') {
        toast.error('Signal format error: Identity format invalid.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        toast.error('System restriction: Email registration is currently disabled in Nexus core config.');
      } else {
        toast.error(`Creation failed: ${error.message || 'Error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: any) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      toast.success('Signal broadcasted: Password reset link sent to your node.');
      setMode('email-login');
    } catch (error: any) {
      console.error(error);
      toast.error(`Broadcast failure: ${error.message || 'Reset sequence failed'}`);
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
            
            <AnimatePresence mode="wait">
              {mode !== 'initial' && (
                <motion.button
                  key="back-button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setMode('initial')}
                  className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

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
                {mode === 'initial' ? 'Authorized Entry Portal' : mode === 'email-login' ? 'Nexus Credential Gateway' : mode === 'email-signup' ? 'Identity Initialization' : 'Password Recovery Protocol'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-10 pt-6">
            <AnimatePresence mode="wait">
              {mode === 'initial' ? (
                <motion.div 
                  key="initial"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <Button 
                    className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:primary/90 text-primary-foreground rounded-[1.25rem] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group" 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-3" />
                    ) : (
                      <Mail className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                    Initialize Google Link
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em]">
                      <span className="bg-card/40 px-3 text-muted-foreground/60 backdrop-blur-md">Alternative Protocol</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="secondary"
                      className="h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-border/50"
                      onClick={() => setMode('email-login')}
                    >
                      <Lock className="w-4 h-4 mr-2 opacity-60" />
                      Login
                    </Button>
                    <Button 
                      variant="secondary"
                      className="h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-border/50"
                      onClick={() => setMode('email-signup')}
                    >
                      <UserPlus className="w-4 h-4 mr-2 opacity-60" />
                      Create
                    </Button>
                  </div>
                </motion.div>
              ) : mode === 'email-login' ? (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLoginSubmit(onEmailLogin)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Nexus Identity (Email, Username, or Mobile)</Label>
                      <Input 
                        {...loginRegister('identifier')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="Type signal identity..."
                      />
                      {loginErrors.identifier && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{loginErrors.identifier.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pl-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pass-key (Password)</Label>
                        <button 
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                          Recover Key?
                        </button>
                      </div>
                      <Input 
                        type="password"
                        {...loginRegister('password')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="Secret sequence..."
                      />
                      {loginErrors.password && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{loginErrors.password.message as string}</p>}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-[1.25rem] shadow-xl shadow-primary/20 active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      'Authorize Session'
                    )}
                  </Button>
                </motion.form>
              ) : mode === 'email-signup' ? (
                <motion.form 
                  key="signup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSignupSubmit(onEmailSignup)}
                  className="space-y-6"
                >
                    <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Identity Persona (Name)</Label>
                      <Input 
                        {...signupRegister('name')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="Target designation..."
                      />
                      {signupErrors.name && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{signupErrors.name.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Core Signal (Email)</Label>
                      <Input 
                        {...signupRegister('email')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="nexus@identity.com"
                      />
                      {signupErrors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{signupErrors.email.message as string}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Alias (Username)</Label>
                        <Input 
                          {...signupRegister('username')}
                          className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                          placeholder="unique_id"
                        />
                        {signupErrors.username && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{signupErrors.username.message as string}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Mobile</Label>
                        <Input 
                          {...signupRegister('phone')}
                          className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                          placeholder="+00..."
                        />
                        {signupErrors.phone && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{signupErrors.phone.message as string}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Pass-key (Password)</Label>
                      <Input 
                        type="password"
                        {...signupRegister('password')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="Secret sequence..."
                      />
                      {signupErrors.password && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{signupErrors.password.message as string}</p>}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-[1.25rem] shadow-xl shadow-primary/20 active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      'Initialize Record'
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="forgot-password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleResetSubmit(onResetPassword)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <p className="text-[10px] text-muted-foreground px-2 text-center uppercase tracking-widest font-bold leading-relaxed">
                      Enter your identity signal to receive a recovery broadcast link.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Signal (Email)</Label>
                      <Input 
                        {...resetRegister('email')}
                        className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all" 
                        placeholder="Nexus identity..."
                      />
                      {resetErrors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest pl-1">{resetErrors.email.message as string}</p>}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-[1.25rem] shadow-xl shadow-primary/20 active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      'Initialize Recovery'
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
            
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-secondary/50 rounded-2xl border border-border/50">
                 <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-60 flex-shrink-0" />
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight leading-relaxed">
                   Encryption: AES-256 Enabled. Secure Protocol active.
                 </p>
              </div>
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
