import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import orthodoxCrossBlack from '@/assets/orthodox-cross-black-new.png';
import orthodoxCrossWhite from '@/assets/orthodox-cross-white-new.png';
import { useTheme } from 'next-themes';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  const crossLogo = theme === 'dark' ? orthodoxCrossWhite : orthodoxCrossBlack;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could Not Send Reset Email',
        description: error.message,
      });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen gradient-peaceful flex items-center justify-center px-4">
      <Card className="w-full max-w-md relative">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[10px] sm:text-xs text-muted-foreground z-10">
          @orthocross on Instagram
        </div>
        <CardHeader className="text-center pt-8 sm:pt-6">
          <img src={crossLogo} alt="OrthoCross" className="mx-auto mb-4 block h-16 w-auto object-contain" />
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your email for the reset link.'
              : 'Enter your email and we will send you a reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                Open it on this device to choose a new password.
              </p>
              <Button asChild variant="sacred" className="w-full">
                <Link to="/">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} variant="sacred">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
