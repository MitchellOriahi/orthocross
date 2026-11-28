import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useNotificationPopups } from "@/hooks/useNotificationPopups";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  useNotificationPopups();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={Infinity}
      expand
      closeButton={false}
      offset={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      swipeDirections={["top", "bottom", "left", "right"]}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
