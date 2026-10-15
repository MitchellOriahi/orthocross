import { expect, test } from "bun:test";
import { calendarDateKey, reminderTimestamp, notificationId } from "./calendarReminders";
test("calendar dates keep local date components", () => {
  expect(calendarDateKey(new Date(2026, 9, 18, 23, 59))).toBe("2026-10-18");
});
test("personal reminder preserves the selected date and time", () => {
  expect(reminderTimestamp("2026-10-18", "09:30")).toBe(new Date(2026, 9, 18, 9, 30).toISOString());
});
test("invalid reminder dates and times are rejected", () => {
  expect(reminderTimestamp("2026-02-30", "09:30")).toBeNull();
  expect(reminderTimestamp("2026-10-18", "25:30")).toBeNull();
});
test("editing and deleting address the same native notification", () => {
  expect(notificationId("a-reminder-id")).toBe(notificationId("a-reminder-id"));
  expect(notificationId("a-reminder-id")).not.toBe(notificationId("another-reminder-id"));
});
