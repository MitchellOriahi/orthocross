import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useEffect, useState } from "react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        return (
          <ToastWithProgress 
            key={id} 
            id={id}
            title={title}
            description={description}
            action={action}
            duration={duration}
            {...props}
          />
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastWithProgress({ id, title, description, action, duration, ...props }: any) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration) return;

    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, ((endTime - now) / duration) * 100);
      setProgress(remaining);

      if (now < endTime) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [duration]);

  return (
    <Toast duration={duration} {...props}>
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
      {duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border overflow-hidden rounded-b-lg">
          <div 
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Toast>
  );
}
