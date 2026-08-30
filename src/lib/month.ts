// One definition of "month" for the leaderboard, matching Postgres's
// to_char(now(), 'YYYY-MM') (Supabase runs in UTC). Never build these keys
// through new Date(y, m).toISOString() — that converts LOCAL midnight to
// UTC and yields the wrong month for every UTC+ timezone near month edges.
export const currentMonthKey = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const previousMonthKey = (): { key: string; label: string } => {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return {
    key: `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`,
    label: prev.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
};
