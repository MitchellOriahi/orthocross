import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const SWIPE_DISMISS_THRESHOLD = 60;

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

  return (
    <Toast
      key={id}
      {...props}
      onTouchStart={(e) => {
        const t = e.touches[0];
        startX.current = t.clientX;
        startY.current = t.clientY;
      }}
      onTouchEnd={(e) => {
        if (startX.current === null || startY.current === null) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX.current;
        const dy = t.clientY - startY.current;
        startX.current = null;
        startY.current = null;
        if (Math.abs(dx) > SWIPE_DISMISS_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          dismiss(id);
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") return;
        startX.current = e.clientX;
        startY.current = e.clientY;
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse" || startX.current === null || startY.current === null) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        startX.current = null;
        startY.current = null;
        if (Math.abs(dx) > SWIPE_DISMISS_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          dismiss(id);
        }
      }}
    >
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
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
