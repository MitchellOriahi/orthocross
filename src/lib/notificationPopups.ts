import { isValidElement, type ReactNode } from "react";

export function notificationText(value: ReactNode | (() => ReactNode)): string {
  if (typeof value === "function") return notificationText(value());
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(notificationText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) return notificationText(value.props.children);
  return "";
}

export function notificationDuration(text: string, locale = "en"): number {
  const trimmed = text.trim();
  if (!trimmed) return 3000;
  const { Segmenter } = Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: "sentence" }) => {
      segment(text: string): Iterable<{ segment: string }>;
    };
  };
  const segments = Segmenter
    ? Array.from(new Segmenter(locale, { granularity: "sentence" }).segment(trimmed))
    : trimmed.split(/[.!?。！？؟።]+\s*/u).map(segment => ({ segment }));
  const sentences = segments
    .filter(({ segment }) => /[\p{L}\p{N}]/u.test(segment));
  return sentences.length >= 2 ? 6000 : 3000;
}

export function isNotificationSwipe(dx: number, dy: number): boolean {
  return Math.max(Math.abs(dx), Math.abs(dy)) >= 60;
}