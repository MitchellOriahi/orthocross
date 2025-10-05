import { useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

interface Lesson {
  id: number;
  title: string;
  passage: string;
  completed: boolean;
  locked: boolean;
  progress?: number;
}

const lessons: Lesson[] = [
  { id: 1, title: "Gospel of John", passage: "John 3:1-21", completed: false, locked: false, progress: 0 },
  { id: 2, title: "Psalms", passage: "Psalm 23", completed: true, locked: false },
  { id: 3, title: "Proverbs", passage: "Proverbs 3:1-12", completed: true, locked: false },
  { id: 4, title: "Matthew", passage: "Matthew 5:1-16", completed: false, locked: true },
  { id: 5, title: "Romans", passage: "Romans 8:1-17", completed: false, locked: true },
];

export const LessonPath = () => {
  const navigate = useNavigate();

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.locked) {
      navigate('/reading', {
        state: {
          title: lesson.title,
          passage: lesson.passage,
          progress: lesson.progress || 0
        }
      });
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto py-8">
      {/* SVG Path connecting lessons */}
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <path
          d="M 50% 60 Q 30% 180, 50% 300 T 50% 540 T 50% 780 T 50% 1020"
          stroke="hsl(var(--border))"
          strokeWidth="4"
          fill="none"
          strokeDasharray="8,8"
          opacity="0.3"
        />
      </svg>

      <div className="relative space-y-12">
        {lessons.map((lesson, index) => {
          const isLeft = index % 2 === 0;
          
          return (
            <div
              key={lesson.id}
              className={`flex justify-center ${isLeft ? 'md:justify-start md:pl-0' : 'md:justify-end md:pr-0'}`}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Card
                className={`
                  w-72 cursor-pointer transition-all duration-300 hover:scale-105
                  ${lesson.locked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sacred'}
                  ${lesson.completed ? 'border-primary/50 bg-gradient-to-br from-card to-primary/5' : ''}
                  relative overflow-hidden
                `}
                onClick={() => handleLessonClick(lesson)}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  {lesson.completed ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </div>
                  ) : lesson.locked ? (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-lg">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ) : null}
                </div>

                {/* Image Section */}
                <div className="relative h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={orthodoxCross}
                    alt={lesson.title}
                    className={`w-full h-full object-cover ${lesson.locked ? 'grayscale' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.passage}</p>
                  
                  {!lesson.completed && !lesson.locked && lesson.progress !== undefined && (
                    <div className="space-y-1 pt-2">
                      <Progress value={lesson.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {lesson.progress}% complete
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
