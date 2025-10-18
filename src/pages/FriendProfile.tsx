import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Book, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FriendData {
  username: string;
  profile_picture_url: string | null;
}

interface BookProgress {
  book_key: string;
  total_chapters: number;
  completed_chapters: number;
}

interface ReadingHistory {
  book_key: string;
  chapter: number;
  completed_at: string;
}

export default function FriendProfile() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friend, setFriend] = useState<FriendData | null>(null);
  const [bookProgress, setBookProgress] = useState<BookProgress[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [totalBibleProgress, setTotalBibleProgress] = useState(0);

  useEffect(() => {
    if (friendId) {
      loadFriendData();
      loadReadingProgress();
      loadReadingHistory();
    }
  }, [friendId]);

  const loadFriendData = async () => {
    if (!friendId) return;

    const { data } = await supabase
      .from('profiles')
      .select('username, profile_picture_url')
      .eq('id', friendId)
      .single();

    if (data) {
      setFriend(data);
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

  const loadReadingHistory = async () => {
    if (!friendId) return;

    const { data } = await supabase
      .from('completed_chapters')
      .select('book_key, chapter, completed_at')
      .eq('user_id', friendId)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (data) {
      setReadingHistory(data);
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
              <h1 className="text-2xl font-bold">{friend.username}'s Profile</h1>
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
                <h2 className="text-2xl font-bold">{friend.username}</h2>
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

        {/* Reading History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reading History</CardTitle>
            <CardDescription>
              Latest chapters completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {readingHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{formatBookName(item.book_key)} {item.chapter}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(item.completed_at)}</p>
                  </div>
                </div>
              ))}
              {readingHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No reading history yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
