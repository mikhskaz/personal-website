import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import type { CSSProperties } from "react";
import TypingRoles from "./TypingRoles";

gsap.registerPlugin(ScrollTrigger);

const delay = (s: number) => ({ "--intro-delay": `${s}s` } as CSSProperties);

const Hero = () => {
    useGSAP(() => {
        gsap.set(".hero-section", {
          clipPath: "circle(110% at 30% 50%)", // Start oversized to fill the screen
        });

        gsap.to(".hero-section", {
          clipPath: "circle(40% at 30% 20%)", // Shrinks into a circle in the top-left corner
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: ".hero-section",
            start: "top 10%",
            end: "bottom top",
            scrub: 1,
          },
        });
      }, []);

    return (
        <div className="relative h-svh w-full">
            <div className="relative z-20 h-svh rounded-lg">
                <section id="home" className="hero-section inset-0 z-10 h-svh text-white">
                    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
                        <div className="hero-bg absolute w-full h-full bg-gradient-to-t from-primary to-secondary" />
                    </div>
                    <div className="absolute left-0 top-0 z-40">
                        <div className="mt-24 md:mt-32 ml-6 md:ml-10">
                            <p className="meta-label intro-line mb-4">
                                <span style={delay(0.1)}>
                                    Toronto, Canada <span className="tick">/</span> U of T, CS &amp; CogSci <span className="tick">/</span> AI&nbsp;&amp;&nbsp;ML
                                </span>
                            </p>
                            <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(3.25rem,13vw,12rem)]">
                                <span className="intro-line"><span style={delay(0.25)}>Mikhail</span></span>
                                <span className="intro-line"><span className="text-outline" style={delay(0.4)}>Skazhenyuk</span></span>
                            </h1>
                            <p className="hero-text ml-1 mt-4 intro-line">
                                <span style={delay(0.6)}><TypingRoles /></span>
                            </p>
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-6 md:left-10 z-40 hidden md:block">
                        <div className="scroll-cue">
                            <span className="meta-label">Scroll</span>
                            <div className="cue-line" />
                        </div>
                    </div>
                    <div className="hero-quote absolute inset-0 z-40 flex-col justify-end items-end pr-5 pb-5">
                        <p className="quote-text font-display italic text-white leading-relaxed text-right mb-2">
                            "Computer science is no more about computers than astronomy is about telescopes, biology is about microscopes or chemistry is about beakers and test tubes. Science is not about tools. It is about how we use them, and what we find out when we do."
                        </p>
                        <p className="quote-author max-w-md font-display font-bold text-white text-right">
                            - Edsger W. Dijkstra
                        </p>
                    </div>
                </section>
            </div>
            <div className="hero-quote absolute inset-0 flex-col justify-end items-end pr-5 pb-5" aria-hidden="true">
                <p className="quote-text font-display italic text-secondary leading-relaxed text-right mb-2">
                    "Computer science is no more about computers than astronomy is about telescopes, biology is about microscopes or chemistry is about beakers and test tubes. Science is not about tools. It is about how we use them, and what we find out when we do."
                </p>
                <p className="quote-author max-w-md font-display font-bold text-secondary text-right">
                    - Edsger W. Dijkstra
                </p>
            </div>
        </div>
    );
};

export default Hero;
