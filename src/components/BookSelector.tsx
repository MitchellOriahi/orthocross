import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Book {
  title: string;
  bookName: string;
  totalChapters: number;
}

interface BookSelectorProps {
  books: Book[];
  onSelectBook: (book: Book, chapter: number) => void;
  currentBook?: string;
}

export const BookSelector = ({ books, onSelectBook, currentBook }: BookSelectorProps) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [open, setOpen] = useState(false);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  const handleChapterClick = (chapter: number) => {
    if (selectedBook) {
      onSelectBook(selectedBook, chapter);
      setOpen(false);
      setSelectedBook(null);
    }
  };

  const handleBackToBooks = () => {
    setSelectedBook(null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Select Book
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {selectedBook ? (
              <button 
                onClick={handleBackToBooks}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                {selectedBook.bookName}
              </button>
            ) : (
              "Choose a Book"
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {!selectedBook ? (
            <div className="space-y-2">
              {books.map((book) => (
                <button
                  key={book.title}
                  onClick={() => handleBookClick(book)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    currentBook === book.title
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent border-border'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{book.bookName}</div>
                    <div className="text-sm text-muted-foreground">
                      {book.totalChapters} {book.totalChapters === 1 ? 'Chapter' : 'Chapters'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1).map((chapter) => (
                <Button
                  key={chapter}
                  variant="outline"
                  onClick={() => handleChapterClick(chapter)}
                  className="aspect-square p-0 text-lg font-semibold hover:bg-primary hover:text-primary-foreground"
                >
                  {chapter}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
