import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Music, Volume2, Bell, Plus, Trash2, BellOff, Home, LogOut, Share2, Mail, MessageSquare, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMusic } from "@/contexts/MusicContext";
import { useNotifications, ReminderTime } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { toast } from "sonner";
import FastingPreferencesDialog from "@/components/FastingPreferencesDialog";
import StreakReminderDialog from "@/components/StreakReminderDialog";

const Settings = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isPlaying, toggleMusic, volume, setVolume } = useMusic();
  const { updateStreakReminders, getStreakReminders, scheduleStreakReminders } = useNotifications();
  const { user, signOut } = useAuth();
  const [reminders, setReminders] = useState<ReminderTime[]>([]);
  const [fastingNotificationsEnabled, setFastingNotificationsEnabled] = useState(false);
  const [streakNotificationsEnabled, setStreakNotificationsEnabled] = useState(false);
  const [friendsNotificationsEnabled, setFriendsNotificationsEnabled] = useState(true);
  const [showFastingPreferencesDialog, setShowFastingPreferencesDialog] = useState(false);
  const [showStreakReminderDialog, setShowStreakReminderDialog] = useState(false);
  const [fastingReminderDays, setFastingReminderDays] = useState<number[]>([3, 0]);
  const [wednesdayNotificationsEnabled, setWednesdayNotificationsEnabled] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('profile_picture_url, username')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfilePicture(data.profile_picture_url);
        setUsername(data.username || "");
      }
    };

    loadProfile();
    loadNotificationPreferences();
    loadStreakReminders();
  }, [user]);

  const loadStreakReminders = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_streak_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('hour', { ascending: true });
    
    if (data) {
      const formattedReminders: ReminderTime[] = data.map(r => ({
        id: parseInt(r.id.split('-')[0], 16), // Convert uuid to number for local id
        hour: r.hour,
        minute: r.minute,
        enabled: r.enabled
      }));
      setReminders(formattedReminders);
    }
  };

  const loadNotificationPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('fasting_notifications_enabled, streak_notifications_enabled, friends_notifications_enabled, fasting_reminder_days, wednesday_notifications_enabled')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setFastingNotificationsEnabled(data.fasting_notifications_enabled || false);
      setStreakNotificationsEnabled(data.streak_notifications_enabled || false);
      setFriendsNotificationsEnabled(data.friends_notifications_enabled ?? true);
      setFastingReminderDays(data.fasting_reminder_days || [3, 0]);
      setWednesdayNotificationsEnabled(data.wednesday_notifications_enabled || false);
    }
  };

  const handleToggleReminder = async (id: number) => {
    if (!user) return;
    
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    // Find the database record by matching hour and minute
    const { data: dbReminders } = await supabase
      .from('user_streak_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('hour', reminder.hour)
      .eq('minute', reminder.minute)
      .single();
    
    if (dbReminders) {
      await supabase
        .from('user_streak_reminders')
        .update({ enabled: !reminder.enabled })
        .eq('id', dbReminders.id);
      
      const updated = reminders.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      setReminders(updated);
      toast.success("Reminder updated");
    }
  };

  const handleTimeChange = async (id: number, hour: number, minute: number) => {
    if (!user) return;
    
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    // Find the database record
    const { data: dbReminders } = await supabase
      .from('user_streak_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('hour', reminder.hour)
      .eq('minute', reminder.minute)
      .single();
    
    if (dbReminders) {
      await supabase
        .from('user_streak_reminders')
        .update({ hour, minute })
        .eq('id', dbReminders.id);
      
      const updated = reminders.map(r => 
        r.id === id ? { ...r, hour, minute } : r
      );
      setReminders(updated);
      toast.success("Reminder time updated");
    }
  };

  const handleAddReminder = async () => {
    if (!user) return;
    
    if (reminders.length >= 3) {
      toast.error("Maximum 3 reminders allowed");
      return;
    }
    
    const { data, error } = await supabase
      .from('user_streak_reminders')
      .insert({ 
        user_id: user.id, 
        hour: 9, 
        minute: 0, 
        enabled: true 
      })
      .select()
      .single();
    
    if (data && !error) {
      await loadStreakReminders();
      toast.success("Reminder added");
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (!user) return;
    
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    // Find and delete the database record
    const { data: dbReminders } = await supabase
      .from('user_streak_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('hour', reminder.hour)
      .eq('minute', reminder.minute)
      .single();
    
    if (dbReminders) {
      await supabase
        .from('user_streak_reminders')
        .delete()
        .eq('id', dbReminders.id);
      
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      toast.success("Reminder deleted");
    }
  };

  const handleToggleFastingNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    if (enabled) {
      // Show preferences dialog when enabling
      setShowFastingPreferencesDialog(true);
      setFastingNotificationsEnabled(true);
    } else {
      // Disable without showing dialog
      setFastingNotificationsEnabled(false);
      await supabase
        .from('profiles')
        .update({ fasting_notifications_enabled: false })
        .eq('id', user.id);
      toast.success("Fasting notifications disabled");
    }
  };

  const handleSaveFastingPreferences = async (selectedDays: number[], wednesdayEnabled: boolean) => {
    if (!user) return;
    
    setFastingReminderDays(selectedDays);
    setWednesdayNotificationsEnabled(wednesdayEnabled);
    await supabase
      .from('profiles')
      .update({ 
        fasting_notifications_enabled: true,
        fasting_reminder_days: selectedDays,
        wednesday_notifications_enabled: wednesdayEnabled
      })
      .eq('id', user.id);
    
    toast.success("Fasting notification preferences saved");
  };

  const handleToggleStreakNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    if (enabled) {
      // Show streak reminder dialog when enabling
      setShowStreakReminderDialog(true);
      setStreakNotificationsEnabled(true);
    } else {
      // Disable without showing dialog
      setStreakNotificationsEnabled(false);
      await supabase
        .from('profiles')
        .update({ streak_notifications_enabled: false })
        .eq('id', user.id);
      toast.success("Streak notifications disabled");
    }
  };

  const handleToggleFriendsNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    setFriendsNotificationsEnabled(enabled);
    await supabase
      .from('profiles')
      .update({ friends_notifications_enabled: enabled })
      .eq('id', user.id);
    
    toast.success(enabled ? "Friends notifications enabled" : "Friends notifications disabled");
  };

  const handleReferFriend = async (method: 'native' | 'email' | 'sms') => {
    const appUrl = window.location.origin;
    const message = `Check out OrthoCross - a daily spiritual practice app with Bible reading streaks, fasting reminders, and Orthodox learning! ${appUrl}`;
    
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: 'OrthoCross - Orthodox Daily Practice',
          text: message,
          url: appUrl
        });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (method === 'email') {
      const subject = encodeURIComponent('Try OrthoCross App!');
      const body = encodeURIComponent(message);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } else if (method === 'sms') {
      const body = encodeURIComponent(message);
      window.open(`sms:?body=${body}`);
    }
  };

  const getUserInitials = () => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Music Settings */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Background Music
              </CardTitle>
              <CardDescription>
                Enhance your spiritual practice with peaceful ambient music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Music Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable Music</p>
                  <p className="text-sm text-muted-foreground">
                    Play relaxing background music while using the app
                  </p>
                </div>
                <Switch
                  checked={isPlaying}
                  onCheckedChange={toggleMusic}
                />
              </div>

              {/* Volume Control */}
              {isPlaying && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Volume
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(values) => setVolume(values[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Reminders - Only shown when enabled */}
          {streakNotificationsEnabled && (
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Streak Reminders
                </CardTitle>
                <CardDescription>
                  Get notified to maintain your daily reading streak
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setShowStreakReminderDialog(true)}
                  className="w-full"
                >
                  Configure Reminders
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications Toggle */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellOff className="w-5 h-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage all notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Fasting Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming fasts and feasts
                  </p>
                </div>
                <Switch
                  checked={fastingNotificationsEnabled}
                  onCheckedChange={handleToggleFastingNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="font-medium">Streak Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get reminders to maintain your reading streak
                  </p>
                </div>
                <Switch
                  checked={streakNotificationsEnabled}
                  onCheckedChange={handleToggleStreakNotifications}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="font-medium">Friends Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when friends complete books
                  </p>
                </div>
                <Switch
                  checked={friendsNotificationsEnabled}
                  onCheckedChange={handleToggleFriendsNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Refer a Friend */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Refer a Friend
              </CardTitle>
              <CardDescription>
                Share OrthoCross with friends and support us!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Help others build their spiritual practice by sharing OrthoCross
              </p>
              <div className="grid grid-cols-1 gap-2">
                {navigator.share && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleReferFriend('native')}
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    Share via...
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleReferFriend('email')}
                >
                  <Mail className="w-4 h-4 mr-3" />
                  Share via Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleReferFriend('sms')}
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Share via SMS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>OrthoCross App</CardTitle>
              <CardDescription>
                Version 1.0.0
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build your daily spiritual practice with Bible reading streaks, 
                fasting reminders, and Orthodox learning.
              </p>
            </CardContent>
          </Card>

          {/* Sign Out Button */}
          <Card className="shadow-elevated">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-14 px-6 rounded-none text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="text-base">Sign Out</span>
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Button */}
          <Card className="shadow-elevated border-destructive/50">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-14 px-6 rounded-none text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => navigate('/data-safety')}
              >
                <UserX className="w-5 h-5 mr-3" />
                <span className="text-base">Delete Account</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fasting Preferences Dialog */}
      <FastingPreferencesDialog
        open={showFastingPreferencesDialog}
        onOpenChange={setShowFastingPreferencesDialog}
        onSave={handleSaveFastingPreferences}
        currentPreferences={fastingReminderDays}
        wednesdayNotificationsEnabled={wednesdayNotificationsEnabled}
      />

      {/* Streak Reminder Dialog */}
      <StreakReminderDialog
        open={showStreakReminderDialog}
        onOpenChange={setShowStreakReminderDialog}
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onDeleteReminder={handleDeleteReminder}
        onToggleReminder={handleToggleReminder}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
};

export default Settings;
