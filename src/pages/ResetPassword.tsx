import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import orthodoxCross from '@/assets/orthodox-cross.jpg';

const passwordSchema = (password: string) => password.length >= 8;

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordSchema(password)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);
    // The recovery link signs the user in with a recovery session; this page
    // never sends a current password — recovery sessions are exempt.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could Not Reset Password',
        description:
          error.message === 'Auth session missing!'
            ? 'This reset link is invalid or has expired. Please request a new one.'
            : error.message,
      });
      return;
    }

    toast({
      title: 'Password Updated',
      description: 'Your password has been changed. Welcome back!',
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen gradient-peaceful flex items-center justify-center px-4">
      <Card className="w-full max-w-md relative">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[10px] sm:text-xs text-muted-foreground z-10">
          @orthocross on Instagram
        </div>
        <CardHeader className="text-center pt-8 sm:pt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-2xl shadow-sacred mb-4 p-2 mx-auto">
            <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">Choose a New Password</CardTitle>
          <CardDescription>Pick a new password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
              <Input
                id="reset-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} variant="sacred">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
