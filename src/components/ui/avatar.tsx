import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { getCachedPortrait, portraitRetrySource } from "@/lib/avatarImageCache";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// Plain <img> instead of AvatarPrimitive.Image: Radix re-probes the URL on
// every mount and shows the fallback for at least one frame even for cached
// images, which reads as an initials->photo flash on every screen. The eager
// img paints immediately from cache; the fallback (rendered underneath)
// shows through only while loading or on error.
const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, alt = "", onError, onLoad, ...props }, ref) => {
    const [failedSource, setFailedSource] = React.useState<string>();
    const [attempt, setAttempt] = React.useState(0);
    const [cachedPortrait, setCachedPortrait] = React.useState<{ source: string; url: string }>();
    React.useEffect(() => {
      if (!src) return;
      let active = true;
      let localUrl: string | undefined;
      void getCachedPortrait(src).then(blob => {
        if (!active || !blob) return;
        localUrl = URL.createObjectURL(blob);
        setCachedPortrait({ source: src, url: localUrl });
        setFailedSource(undefined);
      });
      return () => {
        active = false;
        if (localUrl) URL.revokeObjectURL(localUrl);
      };
    }, [src]);
    React.useEffect(() => {
      setFailedSource(undefined);
      setAttempt(0);
    }, [src]);
    React.useEffect(() => {
      if (!src || failedSource !== src || attempt >= 3) return;
      const timer = window.setTimeout(() => {
        setFailedSource(undefined);
        setAttempt(value => value + 1);
      }, 500 * 2 ** attempt);
      return () => window.clearTimeout(timer);
    }, [src, failedSource, attempt]);
    React.useEffect(() => {
      const retry = () => {
        setFailedSource(undefined);
        setAttempt(0);
      };
      window.addEventListener("online", retry);
      return () => window.removeEventListener("online", retry);
    }, []);
    if (!src || failedSource === src) return null;
    return (
      <img
        key={`${src}:${attempt}`}
        ref={ref}
        src={cachedPortrait?.source === src ? cachedPortrait.url : portraitRetrySource(src, attempt)}
        alt={alt}
        loading="eager"
        decoding="async"
        onError={(event) => {
          setFailedSource(src);
          onError?.(event);
        }}
        onLoad={(event) => {
          setFailedSource(undefined);
          onLoad?.(event);
        }}
        className={cn("absolute inset-0 z-[1] aspect-square h-full w-full object-cover", className)}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
