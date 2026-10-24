import { expect, test } from "bun:test";
import { attachLeaderboardProfiles } from "./leaderboardProfiles";

test("podium identities follow winner IDs even when public profiles arrive out of order", () => {
  expect(attachLeaderboardProfiles([
    { user_id: "first", total_points: 30 }, { user_id: "second", total_points: 20 },
  ], [
    { id: "second", username: "Second", profile_picture_url: "/second.jpg" },
    { id: "first", username: "First", profile_picture_url: "/first.jpg" },
  ])).toEqual([
    { id: "first", username: "First", profile_picture_url: "/first.jpg", total_points: 30, rank: 1 },
    { id: "second", username: "Second", profile_picture_url: "/second.jpg", total_points: 20, rank: 2 },
  ]);
});

test("a winner with only a display name is not shown as an unknown user", () => {
  expect(attachLeaderboardProfiles([{ user_id: "winner", total_points: 10 }], [
    { id: "winner", username: null, display_name: "Winner", profile_picture_url: null },
  ])[0].username).toBe("Winner");
});