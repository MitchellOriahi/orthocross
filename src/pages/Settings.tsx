import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Music, Volume2, Bell, Plus, Trash2, BellOff, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useMusic } from "@/contexts/MusicContext";
import { useNotifications, ReminderTime } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { isPlaying, toggleMusic, volume, setVolume } = useMusic();
  const { updateStreakReminders, getStreakReminders, scheduleStreakReminders } = useNotifications();
  const { user, signOut } = useAuth();
  const [reminders, setReminders] = useState<ReminderTime[]>([]);
  const [fastingNotificationsEnabled, setFastingNotificationsEnabled] = useState(false);
  const [streakNotificationsEnabled, setStreakNotificationsEnabled] = useState(false);

  useEffect(() => {
    setReminders(getStreakReminders());
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('fasting_notifications_enabled, streak_notifications_enabled')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setFastingNotificationsEnabled(data.fasting_notifications_enabled || false);
      setStreakNotificationsEnabled(data.streak_notifications_enabled || false);
    }
  };

  const handleToggleReminder = async (id: number) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updated);
    await updateStreakReminders(updated);
    toast.success("Reminder updated");
  };

  const handleTimeChange = async (id: number, hour: number, minute: number) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, hour, minute } : r
    );
    setReminders(updated);
    await updateStreakReminders(updated);
    toast.success("Reminder time updated");
  };

  const handleAddReminder = async () => {
    if (reminders.length >= 3) {
      toast.error("Maximum 3 reminders allowed");
      return;
    }
    const newId = Math.max(...reminders.map(r => r.id), 0) + 1;
    const updated = [...reminders, { id: newId, hour: 9, minute: 0, enabled: true }];
    setReminders(updated);
    await updateStreakReminders(updated);
    toast.success("Reminder added");
  };

  const handleDeleteReminder = async (id: number) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    await updateStreakReminders(updated);
    toast.success("Reminder deleted");
  };

  const handleToggleFastingNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    setFastingNotificationsEnabled(enabled);
    await supabase
      .from('profiles')
      .update({ fasting_notifications_enabled: enabled })
      .eq('id', user.id);
    
    toast.success(enabled ? "Fasting notifications enabled" : "Fasting notifications disabled");
  };

  const handleToggleStreakNotifications = async (enabled: boolean) => {
    if (!user) return;
    
    setStreakNotificationsEnabled(enabled);
    await supabase
      .from('profiles')
      .update({ streak_notifications_enabled: enabled })
      .eq('id', user.id);
    
    if (enabled) {
      await scheduleStreakReminders();
      toast.success("Streak notifications enabled");
    } else {
      toast.success("Streak notifications disabled");
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-1.5">
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
            </div>
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

          {/* Streak Reminders */}
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
            <CardContent className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg">
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={() => handleToggleReminder(reminder.id)}
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={reminder.hour}
                      onChange={(e) => handleTimeChange(reminder.id, parseInt(e.target.value), reminder.minute)}
                      className="w-16 px-2 py-1 border border-border rounded text-center bg-background"
                      disabled={!reminder.enabled}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={reminder.minute.toString().padStart(2, '0')}
                      onChange={(e) => handleTimeChange(reminder.id, reminder.hour, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-border rounded text-center bg-background"
                      disabled={!reminder.enabled}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {reminders.length < 3 && (
                <Button
                  variant="outline"
                  onClick={handleAddReminder}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              )}
            </CardContent>
          </Card>

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

          {/* Home Button */}
          <Card className="shadow-elevated">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-14 px-6 rounded-none"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="w-5 h-5 mr-3" />
                <span className="text-base">Return to Dashboard</span>
              </Button>
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
        </div>
      </main>
    </div>
  );
};

export default Settings;
