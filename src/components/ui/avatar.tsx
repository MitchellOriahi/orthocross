import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

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
  ({ className, src, alt = "", ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    React.useEffect(() => {
      setErrored(false);
    }, [src]);
    if (!src || errored) return null;
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        onError={() => setErrored(true)}
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
