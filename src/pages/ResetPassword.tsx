import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import orthodoxCross from '@/assets/orthodox-cross.jpg';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkState, setLinkState] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash.includes('error=')) {
      setLinkState('invalid');
      return;
    }

    let settled = false;
    const settle = (valid: boolean) => {
      if (!settled) {
        settled = true;
        setLinkState(valid ? 'valid' : 'invalid');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        settle(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) settle(true);
    });

    // Give detectSessionInUrl time to consume the recovery token from the hash
    const timeout = setTimeout(() => settle(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Do Not Match',
        description: 'Please enter the same password in both fields.',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could Not Update Password',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Password Updated',
      description: 'You are now signed in with your new password.',
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen gradient-peaceful flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pt-8 sm:pt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-2xl shadow-sacred mb-4 p-2 mx-auto">
            <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {linkState === 'invalid'
              ? 'This reset link is invalid or has expired'
              : 'Choose a new password for your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkState === 'invalid' ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Password reset links can only be used once and expire after a while.
                Please request a new one from the sign-in screen.
              </p>
              <Button className="w-full" variant="sacred" onClick={() => navigate('/', { replace: true })}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || linkState === 'checking'} variant="sacred">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
