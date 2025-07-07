
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
// import { TiLocationArrow } from "react-icons/ti";

gsap.registerPlugin(ScrollTrigger);

import React, { useRef, useState } from "react";
import type { ReactNode } from "react";

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
        className="absolute left-0 top-0 size-full object-cover object-center rounded-lg"
      />
    </div>
  );
};

const About = () => {
  const [tiltEnabled, setTiltEnabled] = useState(true);

  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 3,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
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
        <section id="about" className="min-h-screen w-screen">
            <div className="relative flex flex-col items-center">
                <h1 className="hero-heading relative">About Me</h1>
                <div className="flex-row text-center">
                    <p className="hero-text max-w-6xl mb-16 mx-16">I am a fourth-year student at the University of Toronto specializing in Computer Science (Focus in AI) with a Major in Cognitive Science and Minor in Statistics.</p>
                </div>
            </div>
            <div className="h-dvh w-screen" id="clip">
                <div className="mask-clip-path about-me-img">
                  <BentoTilt className="bento-tilt_1 relative mb-7 overflow-visible w-full h-full" disabled={!tiltEnabled}>
                    <BentoCard
                        src="vid/solar.mov" 
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