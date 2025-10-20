import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Book, TrendingUp, ThumbsUp, Heart, Flame, PartyPopper, Star, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StreakFlame } from "@/components/StreakFlame";
import { formatDistanceToNow } from "date-fns";

interface FriendData {
  username: string;
  profile_picture_url: string | null;
  display_name: string | null;
  streak_visible: boolean;
}

interface BookProgress {
  book_key: string;
  total_chapters: number;
  completed_chapters: number;
}

interface Activity {
  id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  activity_type: string;
  activity_data: any;
  created_at: string;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}

interface ReadingHistory {
  book_key?: string;
  chapter?: number;
  completed_at: string;
  activity_type?: string;
  activity_data?: any;
}

export default function FriendProfile() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friend, setFriend] = useState<FriendData | null>(null);
  const [bookProgress, setBookProgress] = useState<BookProgress[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalBibleProgress, setTotalBibleProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const REACTION_EMOJIS = [
    { emoji: "👍", icon: ThumbsUp, label: "Like" },
    { emoji: "❤️", icon: Heart, label: "Love" },
    { emoji: "🔥", icon: Flame, label: "Fire" },
    { emoji: "🎉", icon: PartyPopper, label: "Celebrate" },
    { emoji: "⭐", icon: Star, label: "Star" },
    { emoji: "🙏", icon: Hand, label: "Pray" }
  ];

  useEffect(() => {
    if (friendId) {
      loadFriendData();
      loadReadingProgress();
      loadReadingHistory();
      loadActivities();
      loadStreak();

      // Set up real-time subscriptions for live updates
      const progressChannel = supabase
        .channel(`friend-progress-${friendId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'completed_chapters',
            filter: `user_id=eq.${friendId}`
          },
          () => {
            loadReadingProgress();
            loadReadingHistory();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_activities',
            filter: `user_id=eq.${friendId}`
          },
          () => {
            loadReadingHistory();
            loadActivities();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activity_reactions',
          },
          () => {
            loadActivities();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_streaks',
            filter: `user_id=eq.${friendId}`
          },
          () => {
            loadStreak();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(progressChannel);
      };
    }
  }, [friendId]);

  const loadFriendData = async () => {
    if (!friendId) return;

    const { data } = await supabase
      .from('profiles')
      .select('username, profile_picture_url, display_name, streak_visible')
      .eq('id', friendId)
      .single();

    if (data) {
      setFriend(data);
    }
  };

  const loadStreak = async () => {
    if (!friendId) return;

    const { data } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', friendId)
      .maybeSingle();

    if (data) {
      setCurrentStreak(data.current_streak);
    }
  };

  const loadReadingProgress = async () => {
    if (!friendId) return;

    // Get all completed chapters for this friend
    const { data: completedData } = await supabase
      .from('completed_chapters')
      .select('book_key, chapter')
      .eq('user_id', friendId);

    if (completedData) {
      // Group by book and count chapters
      const bookMap = new Map<string, Set<number>>();
      
      completedData.forEach(item => {
        if (!bookMap.has(item.book_key)) {
          bookMap.set(item.book_key, new Set());
        }
        bookMap.get(item.book_key)!.add(item.chapter);
      });

      // Convert to progress array (assuming standard chapter counts)
      const bookChapterCounts: Record<string, number> = {
        'matthew': 28, 'mark': 16, 'luke': 24, 'john': 21,
        'acts': 28, 'romans': 16, '1-corinthians': 16, '2-corinthians': 13,
        'galatians': 6, 'ephesians': 6, 'philippians': 4, 'colossians': 4,
        '1-thessalonians': 5, '2-thessalonians': 3, '1-timothy': 6, '2-timothy': 4,
        'titus': 3, 'philemon': 1, 'hebrews': 13, 'james': 5,
        '1-peter': 5, '2-peter': 3, '1-john': 5, '2-john': 1,
        '3-john': 1, 'jude': 1, 'revelation': 22
      };

      const progress: BookProgress[] = [];
      let totalCompleted = 0;
      let totalChapters = 0;

      Object.entries(bookChapterCounts).forEach(([bookKey, total]) => {
        const completed = bookMap.get(bookKey)?.size || 0;
        progress.push({
          book_key: bookKey,
          total_chapters: total,
          completed_chapters: completed
        });
        totalCompleted += completed;
        totalChapters += total;
      });

      setBookProgress(progress);
      setTotalBibleProgress(Math.round((totalCompleted / totalChapters) * 100));
    }
  };

  const loadActivities = async () => {
    if (!friendId || !user) return;

    const { data: activitiesData } = await supabase
      .from('friend_activities')
      .select('id, user_id, activity_type, activity_data, created_at')
      .eq('user_id', friendId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activitiesData) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .eq('id', friendId)
        .single();

      const { data: reactionsData } = await supabase
        .from('activity_reactions')
        .select('activity_id, emoji, user_id')
        .in('activity_id', activitiesData.map(a => a.id));

      const activitiesWithData = activitiesData.map(activity => {
        const activityReactions = reactionsData?.filter(r => r.activity_id === activity.id) || [];
        const reactionCounts = new Map<string, { count: number; userReacted: boolean }>();
        
        activityReactions.forEach(reaction => {
          const current = reactionCounts.get(reaction.emoji) || { count: 0, userReacted: false };
          reactionCounts.set(reaction.emoji, {
            count: current.count + 1,
            userReacted: current.userReacted || reaction.user_id === user.id
          });
        });

        const reactions = Array.from(reactionCounts.entries()).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          userReacted: data.userReacted
        }));

        return {
          ...activity,
          username: profileData?.username || 'Unknown User',
          profile_picture_url: profileData?.profile_picture_url || null,
          reactions
        };
      });

      setActivities(activitiesWithData as Activity[]);
    }
  };

  const loadReadingHistory = async () => {
    if (!friendId) return;

    // Get completed chapters
    const { data: chaptersData } = await supabase
      .from('completed_chapters')
      .select('book_key, chapter, completed_at')
      .eq('user_id', friendId)
      .order('completed_at', { ascending: false })
      .limit(20);

    // Get friend activities (islands, saints, etc.)
    const { data: activitiesData } = await supabase
      .from('friend_activities')
      .select('*')
      .eq('user_id', friendId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Combine and sort by date
    const combined: ReadingHistory[] = [];
    
    if (chaptersData) {
      chaptersData.forEach(item => {
        combined.push({
          book_key: item.book_key,
          chapter: item.chapter,
          completed_at: item.completed_at,
          activity_type: 'chapter'
        });
      });
    }

    if (activitiesData) {
      activitiesData.forEach(item => {
        combined.push({
          completed_at: item.created_at,
          activity_type: item.activity_type,
          activity_data: item.activity_data
        });
      });
    }

    // Sort by date and take the most recent 15 items
    combined.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    setReadingHistory(combined.slice(0, 15));
  };

  const handleReaction = async (activityId: string, emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const activity = activities.find(a => a.id === activityId);
    const existingReaction = activity?.reactions?.find(r => r.emoji === emoji && r.userReacted);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (!error) {
        loadActivities();
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('activity_reactions')
        .insert({ activity_id: activityId, user_id: user.id, emoji });

      if (!error) {
        loadActivities();
      }
    }
  };

  const formatBookName = (bookKey: string) => {
    return bookKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!friend) {
    return (
      <div className="min-h-screen gradient-peaceful flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/friends')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">
                {friend.display_name 
                  ? friend.display_name.charAt(0).toUpperCase() + friend.display_name.slice(1)
                  : friend.username.charAt(0).toUpperCase() + friend.username.slice(1)
                }'s Profile
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={friend.profile_picture_url || undefined} />
                <AvatarFallback>{friend.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{friend.username}</h2>
                  {friend.streak_visible && currentStreak > 0 && (
                    <StreakFlame days={currentStreak} size="xs" />
                  )}
                </div>
                <p className="text-muted-foreground">Friend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Bible Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Overall Bible Progress
            </CardTitle>
            <CardDescription>
              Complete reading progress through the Bible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-bold">{totalBibleProgress}%</span>
              </div>
              <Progress value={totalBibleProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Book Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              Book Progress
            </CardTitle>
            <CardDescription>
              Chapter completion by book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookProgress.filter(book => book.completed_chapters > 0).map(book => (
                <div key={book.book_key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{formatBookName(book.book_key)}</span>
                    <span className="text-sm text-muted-foreground">
                      {book.completed_chapters}/{book.total_chapters}
                    </span>
                  </div>
                  <Progress 
                    value={(book.completed_chapters / book.total_chapters) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {bookProgress.filter(book => book.completed_chapters > 0).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No books started yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reading History</CardTitle>
            <CardDescription>
              Latest activity and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No activity yet
                </p>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-8 w-8">
                          {activity.profile_picture_url ? (
                            <AvatarImage src={activity.profile_picture_url} alt={activity.username} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {activity.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{activity.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.activity_type === 'chapter_completed' && (
                          <>
                            ✨ Completed {activity.activity_data?.book_key ? 
                              `${activity.activity_data.book_key} Chapter ${activity.activity_data.chapter}` : 
                              'a chapter'}
                          </>
                        )}
                        {activity.activity_type === 'book_completed' && (
                          <>
                            📚 Completed {activity.activity_data?.book_name || 'a book'}!
                          </>
                        )}
                        {activity.activity_type === 'bible_completed' && (
                          <>
                            📖 Completed the entire Bible!
                          </>
                        )}
                        {activity.activity_type === 'saint_completed' && (
                          <>
                            👤 Finished reading about {activity.activity_data?.saint_name || 'a saint'}
                          </>
                        )}
                        {activity.activity_type === 'island_completed' && (
                          <>
                            ⛰️ Completed island: {activity.activity_data?.island_name || 'Unknown Island'}
                          </>
                        )}
                      </p>
                    </div>
                    
                    {/* Reactions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Display existing reactions */}
                      {activity.reactions?.map((reactionData) => (
                        <button
                          key={reactionData.emoji}
                          onClick={() => handleReaction(activity.id, reactionData.emoji)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            reactionData.userReacted 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span>{reactionData.emoji}</span>
                          {reactionData.count > 0 && <span>{reactionData.count}</span>}
                        </button>
                      ))}
                      
                      {/* Dropdown to add new reactions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            Add Reaction
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-background">
                          {REACTION_EMOJIS.map(({ emoji, icon: Icon, label }) => (
                            <DropdownMenuItem
                              key={emoji}
                              onClick={() => handleReaction(activity.id, emoji)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Icon className="w-4 h-4" />
                              <span>{emoji} {label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
