type SectionHeadingProps = {
  index: string;
  title: string;
  sub?: string;
  className?: string;
  /** Use black accents when the section background is red */
  invert?: boolean;
};

/**
 * Numbered editorial section header: rule line, mono index, oversized
 * Bebas title, and an optional right-aligned mono subtitle.
 */
const SectionHeading = ({ index, title, sub, className = '', invert = false }: SectionHeadingProps) => (
  <div className={`section-head reveal ${invert ? 'invert' : ''} ${className}`}>
    <span className="section-num">{index}</span>
    <h2 className="section-title">{title}</h2>
    {sub && (
      <p className="section-sub meta-label">
        <span className="tick">/ </span>
        {sub}
      </p>
    )}
  </div>
);

export default SectionHeading;
