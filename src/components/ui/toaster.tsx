import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { isNotificationSwipe, notificationDuration } from "@/lib/notificationPopups";

function SwipeableToast({
  id,
  title,
  description,
  action,
  dismiss,
  ...props
}: {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismiss: (id: string) => void;
} & Record<string, unknown>) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    if (props.open === false) return;
    let timer: ReturnType<typeof setTimeout>;
    let previousText: string | undefined;
    const schedule = () => {
      const text = content.current?.textContent || "";
      if (text === previousText) return;
      previousText = text;
      clearTimeout(timer);
      timer = setTimeout(() => dismissRef.current(id), notificationDuration(text, document.documentElement.lang || "en"));
    };
    schedule();
    const observer = new MutationObserver(schedule);
    if (content.current) observer.observe(content.current, { childList: true, characterData: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [id, title, description, props.open]);

  return (
    <Toast
      key={id}
      {...props}
      duration={Infinity}
      className="touch-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        startX.current = e.clientX;
        startY.current = e.clientY;
      }}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (startX.current === null || startY.current === null) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        startX.current = null;
        startY.current = null;
        if (isNotificationSwipe(dx, dy)) {
          dismiss(id);
        }
      }}
      onPointerCancel={() => { startX.current = null; startY.current = null; }}
    >
      <div ref={content} className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
    </Toast>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <SwipeableToast
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            dismiss={dismiss}
            {...props}
          />
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
