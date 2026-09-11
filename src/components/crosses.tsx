// The two communions' mainstream cross forms, drawn as inline SVG so they can
// sit in text and inherit color. Eastern Orthodoxy: the three-bar (Byzantine/
// Russian) cross with slanted footrest. Oriental Orthodoxy: the Coptic budded
// cross — equal arms, each ending in three lobes for the Holy Trinity.

interface CrossProps {
  className?: string;
}

export const EasternCross = ({ className }: CrossProps) => (
  <svg viewBox="0 0 24 32" fill="currentColor" className={className} aria-hidden="true">
    {/* vertical beam */}
    <rect x="10.75" y="1" width="2.5" height="30" rx="0.6" />
    {/* upper (titulus) bar */}
    <rect x="6.5" y="5" width="11" height="2.3" rx="0.6" />
    {/* main bar */}
    <rect x="2.5" y="10.5" width="19" height="2.6" rx="0.6" />
    {/* slanted footrest — raised on the viewer's left, matching the OrthoCross logo */}
    <rect
      x="5"
      y="21.6"
      width="14"
      height="2.2"
      rx="0.6"
      transform="rotate(20 12 22.7)"
    />
  </svg>
);

export const OrientalCross = ({ className }: CrossProps) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    {/* equal arms */}
    <rect x="14.5" y="4" width="3" height="24" rx="0.8" />
    <rect x="4" y="14.5" width="24" height="3" rx="0.8" />
    {/* trinity buds at each arm end */}
    {[
      // top
      [16, 3.2], [13.2, 4.6], [18.8, 4.6],
      // bottom
      [16, 28.8], [13.2, 27.4], [18.8, 27.4],
      // left
      [3.2, 16], [4.6, 13.2], [4.6, 18.8],
      // right
      [28.8, 16], [27.4, 13.2], [27.4, 18.8],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="2" />
    ))}
    {/* open center ring, characteristic of many Coptic crosses */}
    <circle cx="16" cy="16" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
