import { describe, expect, test } from "bun:test";
import { notificationDuration, isNotificationSwipe } from "./notificationPopups";

describe("brief notification rules", () => {
  test("one sentence or less lasts exactly three seconds", () => {
    for (const text of ["", "Nudge sent!", "Request sent", "Your request was sent."])
      expect(notificationDuration(text)).toBe(3000);
  });
  test("two or more sentences last exactly six seconds", () => {
    expect(notificationDuration("Request sent. They can accept it now.")).toBe(6000);
    expect(notificationDuration("Saved! Your changes are ready. Thank you!")).toBe(6000);
  });
  test("localized sentence boundaries keep the same timing", () => {
    expect(notificationDuration("تم الإرسال!", "ar")).toBe(3000);
    expect(notificationDuration("已发送。请等待回复。", "zh")).toBe(6000);
    expect(notificationDuration("تم الإرسال! يمكنك الانتظار الآن.", "ar")).toBe(6000);
  });
  test("both short and long pop-ups can be swiped away in any direction", () => {
    for (const duration of [3000, 6000]) {
      expect(notificationDuration(duration === 3000 ? "Sent!" : "Sent! Thank you!")).toBe(duration);
      for (const [dx, dy] of [[60, 0], [-60, 0], [0, 60], [0, -60]])
        expect(isNotificationSwipe(dx, dy)).toBe(true);
    }
    expect(isNotificationSwipe(4, 5)).toBe(false);
    expect(isNotificationSwipe(59, 59)).toBe(false);
  });
});