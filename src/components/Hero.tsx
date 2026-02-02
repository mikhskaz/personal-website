import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import TypingRoles from "./TypingRoles";

gsap.registerPlugin(ScrollTrigger);

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
                        <div className="mt-30 ml-10">
                            <h1 className="hero-heading">Mikhail</h1>
                            {/* <Button
                                id="about-button"
                                title="About Me"
                                rightIcon={<TiLocationArrow className="inline-block ml-2" />}
                                containerClass="bg-white text-black hover:bg-primary transition-colors duration-300 hover:text-white"
                            />

                            <Button
                                id="skills-button"
                                title="Skills"
                                rightIcon={<TiLocationArrow className="inline-block ml-2" />}
                                containerClass="bg-white text-black hover:bg-primary transition-colors duration-300 hover:text-white"
                            />

                            <Button
                                id="projects-button"
                                title="View Projects"
                                rightIcon={<TiLocationArrow className="inline-block ml-2" />}
                                containerClass="bg-white text-black hover:bg-primary transition-colors duration-300 hover:text-white"
                            /> */}
                            <p className="hero-text ml-1"><TypingRoles /></p>
                            {/* <p className="hero-text ml-1"></p> */}
                        </div>
                    </div>
                    <div className="absolute inset-0 z-40 flex flex-col justify-end items-end pr-5 pb-5">
                        <h1 className="quote-text font-display italic text-white leading-relaxed text-right mb-2">
                            "Computer science is no more about computers than astronomy is about telescopes, biology is about microscopes or chemistry is about beakers and test tubes. Science is not about tools. It is about how we use them, and what we find out when we do."
                        </h1>
                        <h1 className="quote-author max-w-md font-display font-bold text-white text-right">
                            - Edsger W. Dijkstra
                        </h1>
                    </div>
                </section>
            </div>
            <div className="absolute inset-0 flex flex-col justify-end items-end pr-5 pb-5">
                <h1 className="quote-text font-display italic text-secondary leading-relaxed text-right mb-2">
                    "Computer science is no more about computers than astronomy is about telescopes, biology is about microscopes or chemistry is about beakers and test tubes. Science is not about tools. It is about how we use them, and what we find out when we do."
                </h1>
                <h1 className="quote-author max-w-md font-display font-bold text-secondary text-right">
                    - Edsger W. Dijkstra
                </h1>
            </div>
        </div>
    );


};

export default Hero;

