
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
// import { TiLocationArrow } from "react-icons/ti";

gsap.registerPlugin(ScrollTrigger);

import React, { useRef, useState } from "react";
import type { ReactNode } from "react";
import SectionHeading from "./SectionHeading";
import Marquee from "./Marquee";
import useReveal from "../hooks/useReveal";

type BentoTiltProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export const BentoTilt = ({ children, className = "", disabled = false }: BentoTiltProps) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (disabled || !itemRef.current) return;

    const { left, top, width, height } = itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * -10;
    const tiltY = (relativeX - 0.5) * 10;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

type BentoCardProps = {
  src: string;
  title: string;
  description?: string;
  isComingSoon?: boolean;
};

export const BentoCard = ({ src }: BentoCardProps) => {

  return (
    <div className="relative size-full">
      <video
        src={src}
        loop
        muted
        autoPlay
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        className="absolute left-0 top-0 size-full object-cover object-center rounded-lg"
      />
    </div>
  );
};

const About = () => {
  const [tiltEnabled, setTiltEnabled] = useState(true);
  const revealRef = useReveal<HTMLElement>();

  useGSAP(() => {
    // Detect iOS for pinType fix
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Shorter scroll distance on mobile devices
    const isMobile = window.innerWidth < 768;
    const scrollDistance = isMobile ? 400 : 800;

    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: `+=${scrollDistance} center`,
        scrub: isMobile ? 1 : 3,
        pin: true,
        pinSpacing: true,
        pinType: isIOS ? "transform" : "fixed",
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100svh",
      borderRadius: 0,
    });

    ScrollTrigger.create({
      trigger: "#clip",
      start: "top top",
      end: "bottom top",
      onEnterBack: () => setTiltEnabled(true),
      onLeave: () => setTiltEnabled(false),
    });
  }, []);
    
  
    return (
        <section id="about" ref={revealRef} className="min-h-screen w-screen overflow-hidden">
            <div className="relative z-30 border-y border-white/15 py-5 mb-14 bg-black/20 backdrop-blur-sm">
                <Marquee
                    items={["Software Engineer", "AI/ML Researcher", "Designer", "Creator", "Problem Solver"]}
                    duration={26}
                    outlined
                />
            </div>
            <div className="relative z-30 mx-6 md:mx-10 mb-16">
                <SectionHeading index="01" title="About Me" sub="Who is behind the work" invert />
                <p className="reveal mt-10 max-w-4xl font-display text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.15] text-white" style={{ ['--reveal-delay' as string]: '0.15s' }}>
                    Fourth-year at the <span className="text-bone">University of Toronto</span>, Specialist in{' '}
                    <span className="italic text-bone">Computer Science</span> with a focus in{' '}
                    <span className="text-outline">AI</span>, and a Major in{' '}
                    <span className="italic text-bone">Cognitive Science</span>. I build systems that learn, and
                    interfaces worth remembering.
                </p>
            </div>
            <div className="relative h-dvh w-screen" id="clip">
                <div className="mask-clip-path about-me-img">
                  <BentoTilt className="bento-tilt_1 relative mb-7 overflow-visible w-full h-full" disabled={!tiltEnabled}>
                    <BentoCard
                        src="vid/solar.mp4"
                        title=""
                        description=""
                    />
                  </BentoTilt>
                </div>
            </div>
        </section>
    );
  };
  
  export default About;