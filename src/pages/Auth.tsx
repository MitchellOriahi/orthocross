import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import orthodoxCross from '@/assets/orthodox-cross.jpg';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (e.g., +1234567890)')
  .min(10, 'Phone number must be at least 10 digits');
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFastingDialog, setShowFastingDialog] = useState(false);
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [fastingEnabled, setFastingEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { scheduleStreakReminders } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: error.errors[0].message,
        });
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message,
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Validate phone number with stricter rules
    try {
      phoneSchema.parse(phoneNumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Invalid Phone Number',
          description: error.errors[0].message,
        });
        return;
      }
    }

    // Validate username
    try {
      usernameSchema.parse(username);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Invalid Username',
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Store phone number and username
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Update user metadata with phone number (securely stored in auth)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { phone_number: phoneNumber }
      });

      if (updateError) {
        console.error('Error storing phone number:', updateError);
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Account created but phone number not saved. Please contact support.',
        });
      }

      // Store username in profile
      const { error: usernameError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (usernameError) {
        console.error('Error storing username:', usernameError);
        if (usernameError.code === '23505') {
          toast({
            variant: 'destructive',
            title: 'Username Taken',
            description: 'This username is already taken. Please try another.',
          });
          setLoading(false);
          return;
        }
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Account created but username not saved. Please update in settings.',
        });
      }
    }

    toast({
      title: 'Account Created',
      description: 'Welcome to OrthoCross!',
    });
    setLoading(false);
    // Show notification preference dialogs
    setShowFastingDialog(true);
  };

  const handleFastingResponse = async (enabled: boolean) => {
    setFastingEnabled(enabled);
    setShowFastingDialog(false);
    setShowStreakDialog(true);
  };

  const handleStreakResponse = async (enabled: boolean) => {
    setShowStreakDialog(false);
    
    // Update preferences in database
    if (user) {
      await supabase
        .from('profiles')
        .update({
          fasting_notifications_enabled: fastingEnabled,
          streak_notifications_enabled: enabled,
        })
        .eq('id', user.id);

      // Schedule streak reminders if enabled
      if (enabled) {
        await scheduleStreakReminders();
      }
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful flex items-center justify-center px-4">
      <Card className="w-full max-w-md relative">
        <div className="absolute top-4 right-4 text-xs text-muted-foreground">
          @orthocross on Instagram
        </div>
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-2xl shadow-sacred mb-4 p-2 mx-auto">
            <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">Welcome to OrthoCross</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading} variant="sacred">
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, underscores, and hyphens only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                  <p className="text-xs text-muted-foreground">
                    For fast and feast notifications. Securely stored and only accessible to you.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading} variant="sacred">
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Fasting Notifications Dialog */}
      <AlertDialog open={showFastingDialog} onOpenChange={setShowFastingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fasting Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to receive notifications for upcoming fasts and feasts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => handleFastingResponse(false)}>
              No, thanks
            </Button>
            <Button onClick={() => handleFastingResponse(true)}>
              Yes, enable
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Streak Reminders Dialog */}
      <AlertDialog open={showStreakDialog} onOpenChange={setShowStreakDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Streak Reminders</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like daily reminders to maintain your Bible reading streak?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => handleStreakResponse(false)}>
              No, thanks
            </Button>
            <Button onClick={() => handleStreakResponse(true)}>
              Yes, enable
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
