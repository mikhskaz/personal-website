type MarqueeProps = {
  items: string[];
  /** Seconds for one full loop */
  duration?: number;
  className?: string;
  outlined?: boolean;
};

/**
 * Infinite horizontal ticker. The track is rendered twice so the loop
 * is seamless; pauses on hover.
 */
const Marquee = ({ items, duration = 28, className = '', outlined = false }: MarqueeProps) => {
  const track = (ariaHidden: boolean) => (
    <div className="marquee-track" aria-hidden={ariaHidden} style={{ ['--marquee-duration' as string]: `${duration}s` }}>
      {items.map((item, i) => (
        <span key={i} className={`marquee-item ${outlined ? 'text-outline' : ''}`}>
          <span className="dot" />
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`marquee ${className}`}>
      {track(false)}
      {track(true)}
    </div>
  );
};

export default Marquee;
