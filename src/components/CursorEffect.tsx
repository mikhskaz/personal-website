import React, { useEffect, useRef } from "react";
// import { IoIosRocket } from "react-icons/io"; // only if you want to use the rocket icon for dot 0; otherwise you can remove this import.

interface Coord {
  x: number;
  y: number;
}

interface Dot {
  x: number;
  y: number;
  el: React.RefObject<HTMLDivElement | null>;
}

export default function CursorEffect() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // === BEGIN: existing “arrow”‐cursor logic ===
  const historyRef = useRef<Coord[]>([]);
  const MAX_HISTORY = 30;

  // Hide the native cursor on mount, restore on unmount
  useEffect(() => {
    const html = document.documentElement;
    const originalCursor = html.style.cursor;
    html.style.cursor = "none";
    return () => {
      html.style.cursor = originalCursor;
    };
  }, []);

  // Helper: get a {x,y} from MouseEvent or TouchEvent
  const extractPoint = (e: MouseEvent | TouchEvent): Coord => {
    if (e instanceof MouseEvent) {
      return { x: e.clientX, y: e.clientY };
    } else {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Helper: compute centroid (average) of an array of points
  const centroid = (pts: Coord[]): Coord => {
    const sum = pts.reduce(
      (acc, p) => {
        acc.x += p.x;
        acc.y += p.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return { x: sum.x / pts.length, y: sum.y / pts.length };
  };

  // Helper: angle in degrees from point a → point b
  const angleDeg = (a: Coord, b: Coord): number =>
    (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

  // Move & rotate the SVG so its “tip” sits exactly under (cx, cy)
  // Default SVG arrow points “up,” so we add +90° to make it face right when dx>0.
  const moveAndRotate = (pos: Coord, rawAngle: number) => {
    const el = svgRef.current;
    if (!el) return;

    // Adjust these if your SVG’s drawn “tip” is in a different spot.
    const TIP_OFFSET_X = 12;
    const TIP_OFFSET_Y = 11;
    const rotation = rawAngle + 90;

    el.style.top = `${pos.y}px`;
    el.style.left = `${pos.x}px`;
    el.style.transform = `translate(-${TIP_OFFSET_X}px, -${TIP_OFFSET_Y}px) rotate(${rotation}deg)`;
  };

  // We’ll also feed the “mouseRef” that the dot‐chain uses.
  const mouseRef = useRef<Coord>({ x: 0, y: 0 });

  // Unified handler for both mousemove and touchmove (arrow + dot logic)
  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const pt = extractPoint(e);
    const history = historyRef.current;

    // 1) Arrow logic: track history for smoothing
    history.push(pt);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    let refPoint: Coord;
    if (history.length >= 2) {
      // Average all but the last point
      refPoint = centroid(history.slice(0, -1));
    } else {
      refPoint = pt;
    }

    const raw = angleDeg(refPoint, pt);
    moveAndRotate(pt, raw);

    // 2) Dot logic: update the “current” mouse position
    mouseRef.current.x = pt.x;
    mouseRef.current.y = pt.y;
  };

  // Attach arrow & pointer listeners once
  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, []);
  // === END: existing “arrow”‐cursor logic ===

  // === BEGIN: dot‐chain logic copied/adapted from the first code snippet ===
  const NUM_DOTS = 20;
  const dots = useRef<Dot[]>(
    Array.from({ length: NUM_DOTS }, () => ({
      x: 0,
      y: 0,
      el: React.createRef<HTMLDivElement>(),
    }))
  );

  // We'll track the previous position of dot 0 if we wanted to rotate it,
  // but here we're not rotating the dots—only the SVG arrow rotates.
  const prevDot0 = useRef<Coord>({ x: 0, y: 0 });

  useEffect(() => {
    // When page becomes visible (or on mouse enter), snap dots to the cursor
    const snapDotsToCursor = () => {
      dots.current.forEach((dot) => {
        dot.x = mouseRef.current.x;
        dot.y = mouseRef.current.y;
        if (dot.el.current) {
          dot.el.current.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
        }
      });
      // Remember this for the next frame
      prevDot0.current = { ...mouseRef.current };
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        snapDotsToCursor();
      }
    };
    const handleMouseEnter = () => {
      snapDotsToCursor();
    };

    // The animation loop for moving each dot toward its predecessor
    const animateDots = () => {
      let x = mouseRef.current.x;
      let y = mouseRef.current.y;

      dots.current.forEach((dot, i) => {
        // Move each dot 25% closer to (x, y)
        dot.x += (x - dot.x) * 0.25;
        dot.y += (y - dot.y) * 0.25;

        if (dot.el.current) {
          dot.el.current.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
        }

        // For the next dot in the chain, use this dot’s updated position
        x = dot.x;
        y = dot.y;
      });

      requestAnimationFrame(animateDots);
    };

    window.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Kick off the animation loop
    animateDots();

    // On unmount, clean up listeners
    return () => {
      window.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  // === END: dot‐chain logic ===

  return (
    <>
      {/* === Dot elements === */}
      {dots.current.map((dot, i) => (
        <div
          key={i}
          ref={dot.el}
          className="fixed top-0 left-0 pointer-events-none"
          style={{
            width: i === 0 ? "0px" : "6px",
            height: i === 0 ? "0px" : "6px",
            backgroundColor: i === 0 ? "transparent" : "white",
            borderRadius: "50%",
            transform: "translate3d(0, 0, 0)",
            transition: "none",
            opacity: (1 - i / NUM_DOTS).toFixed(2),
            zIndex: 9998,
            // We set fontSize/color only if i===0 and wanted a visible rocket icon.
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* If you want a rocket icon on the “first” dot (i===0), you can uncomment this: */}
          {/* {i === 0 ? <IoIosRocket style={{ fontSize: "20px", color: "white" }} /> : null} */}
        </div>
      ))}

      {/* === Arrow SVG (unchanged) === */}
      <svg
        ref={svgRef}
        width={28}
        height={28}
        viewBox="0 0 28 28"
        style={{
          position: "fixed",
          pointerEvents: "none",
          userSelect: "none",
          transition: "transform 12ms linear",
          transformOrigin: "12px 11px",
          zIndex: 9999,
        }}
      >
        {/* Arrow shape (white) */}
        <polygon fill="#FFF" points="8,21 8,5 20,17 13,17 12.5,16.8" />
        <polygon fill="#FFF" points="17,22 14,23 9,12 13,10.5" />
        <rect
          x="12.5"
          y="14"
          transform="rotate(-22 13.5 18)"
          width="2"
          height="8"
          fill="#FFF"
        />
        <polygon fill="#FFF" points="9.5,7.5 9.5,18.5 12.5,15.5 12.5,15 17,15" />
      </svg>
    </>
  );
}
