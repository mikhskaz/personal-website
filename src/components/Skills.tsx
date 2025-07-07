import { useState, useRef } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { FaJava } from "react-icons/fa";
import {
    SiPython,
    SiPytorch,
    SiTensorflow,
    SiNumpy,
    SiPandas,
    SiScikitlearn,
    SiJavascript,
    SiReact,
    SiC,
    SiCplusplus,
    SiGit,
    SiLinux,
    SiMysql,
    SiTypescript,
    SiHtml5,
    SiCss3,
    // SiDocker,
    // SiFastapi,
    SiJupyter,
    SiVite,
    SiTailwindcss,
    // SiNextdotjs,
    // SiMongodb,
    SiPostgresql,
    SiFirebase,
    // SiDjango,
    // SiRust,
    // SiGraphql,
    SiLua,
    SiUnity,
    SiUnrealengine,
    SiKeras,
  } from "react-icons/si";
// import { motion } from "framer-motion";

import type { ReactNode, MouseEvent } from "react";

type BentoTiltProps = {
  children: ReactNode;
  className?: string;
};

export const BentoTilt = ({ children, className = "" }: BentoTiltProps) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * -15;
    const tiltY = (relativeX - 0.5) * 15;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={`transition-transform duration-1000 ease-out ${className}`}
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
  title: ReactNode;
  description?: string;
  isComingSoon?: boolean;
  icons?: { icon: ReactNode; name: string }[];
  images?: string[];
};

export const BentoCard = ({
  src,
  title,
  description,
  isComingSoon,
  icons,
  // images,
}: BentoCardProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
  
    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  
  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);

  return (
    <div
    ref={cardRef}
    onMouseMove={handleMouseMove}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    className="relative size-full overflow-hidden rounded-lg"
    >
    {/* Radial hover background */}
    <div
        className="pointer-events-none absolute inset-0 z-20 opacity-0 transition duration-300"
        style={{
        opacity: hoverOpacity,
        background: `radial-gradient(100px circle at ${cursorPosition.x + 30}px ${cursorPosition.y}px, #656fe288, #00000026)`,
        }}
    />

    {/* Main card content wrapper */}
    <div className="relative size-full">
        {/* Background Image */}
        <img
        src={src}
        alt="Card background"
        className="absolute left-0 top-0 size-full object-cover object-center rounded-lg"
        />

        {/* Foreground Content */}
        <div className="relative z-10 grid size-full grid-cols-3 flex-col justify-between p-5 text-white">
        {/* Title & Description */}
        <div className="col-span-3">
            <h1 className="bento-title">{title}</h1>
            {description && (
            <p className="mt-3 max-w-[30rem] text-md md:text-base">{description}</p>
            )}
        </div>

        {/* Images Grid */}
        {/* {images && images.length > 0 && (
            <div className="col-span-2 my-4 grid w-full grid-cols-6 place-items-center gap-2">
            {images.map((src, index) => (
                <img
                key={index}
                src={src}
                alt={`Skill ${index}`}
                className="h-16 w-16 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition"
                />
            ))}
            </div>
        )} */}

        {/* Scrolling Icons on Right Side */}
        {icons && icons.length > 0 && (
            <div className="absolute top-0 right-4 h-full w-20 overflow-hidden">
            <div className="animate-vertical-scroll flex flex-col gap-6 text-4xl md:text-5xl text-white/40">
                {Array(3)
                .fill(icons)
                .flat()
                .map(({ icon, name }, index) => (
                    <div key={index} className="group relative flex flex-col items-center">
                    <div className="transition-transform group-hover:scale-110 group-hover:text-white">
                        {icon}
                    </div>
                    <span className="absolute top-full mt-1 w-max text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        {name}
                    </span>
                    </div>
                ))}
            </div>
            </div>
        )}
        </div>

        {/* Optional: Button */}
        {isComingSoon && (
        <div
            ref={hoverButtonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="border-hsla absolute bottom-4 left-4 z-20 flex w-fit cursor-pointer items-center gap-1 overflow-hidden rounded-full bg-black px-5 py-2 text-xs uppercase text-white/20"
        >
            <div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
            style={{
                opacity: hoverOpacity,
                background: `radial-gradient(100px circle at ${cursorPosition.x}px ${cursorPosition.y}px, #656fe288, #00000026)`,
            }}
            />
            <TiLocationArrow className="relative z-20" />
            <p className="relative z-20">Coming soon</p>
        </div>
        )}
    </div>
    </div>
  );
};

const Features = () => (
  <section id="skills" className="bg-gradient-to-t from-primary to-secondary">
    <div className="container mx-auto md:px-10">
      <p className="hero-heading">
        Skills.
      </p>
      <p className="hero-text">
        What can I do?
      </p>

    <BentoTilt className="border-hsla bento_tilt_1 relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh]">
      <BentoCard
        src="img/Black.png"
        title="AI/ML"
        description="My main curiosity."
        //   isComingSoon
        icons={[
        { icon: <SiPython key="py" />, name: "Python" },
        { icon: <SiPytorch key="pt" />, name: "PyTorch" },
        { icon: <SiTensorflow key="tf" />, name: "TensorFlow" },
        { icon: <SiKeras key="keras" />, name: "Keras" },
        { icon: <SiScikitlearn key="sk" />, name: "scikit-learn" },
        { icon: <SiJupyter key="jupyter" />, name: "Jupyter" },
        // { icon: <SiFastapi key="fastapi" />, name: "FastAPI" },
        { icon: <SiNumpy key="numpy" />, name: "NumPy" },
        { icon: <SiPandas key="pandas" />, name: "Pandas" },
        // { icon: <SiDocker key="docker" />, name: "Docker" },
        ]}
        // images={["img/cat.png", "img/cat.png", "img/cat.png","img/cat.png", "img/cat.png", "img/cat.png"]} // Example images
      />
    </BentoTilt>

    <div className="grid h-[135vh] w-full grid-cols-2 grid-rows-4 gap-7">
      <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2">
        <BentoCard
        src="img/Black.png"
        title="Software Dev"
        description="I have a lot of experience with it, and I am always improving."
        // isComingSoon
        icons={[
          { icon: <SiC key="c" />, name: "C" },
          { icon: <SiCplusplus key="cpp" />, name: "C++" },
          { icon: <SiGit key="git" />, name: "Git" },
          { icon: <SiLinux key="linux" />, name: "Linux" },
          { icon: <FaJava key="java" />, name: "Java" },
        //   { icon: <SiRust key="rust" />, name: "Rust" },
        ]}
        />
      </BentoTilt>

      <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2">
        <BentoCard
        src="img/Black.png"
        title="Web Dev"
        description="Well, you are looking at it right now."
        // isComingSoon
        icons={[
          { icon: <SiJavascript key="js" />, name: "JavaScript" },
          { icon: <SiTypescript key="ts" />, name: "TypeScript" },
          { icon: <SiReact key="react" />, name: "React" },
          { icon: <SiMysql key="mysql" />, name: "MySQL" },
          { icon: <SiPostgresql key="postgresql" />, name: "PostgreSQL" },
        //   { icon: <SiMongodb key="mongodb" />, name: "MongoDB" },
          { icon: <SiFirebase key="firebase" />, name: "Firebase" },
          { icon: <SiHtml5 key="html" />, name: "HTML5" },
          { icon: <SiCss3 key="css" />, name: "CSS3" },
          { icon: <SiTailwindcss key="tailwind" />, name: "Tailwind CSS" },
          { icon: <SiVite key="vite" />, name: "Vite" },
        //   { icon: <SiNextdotjs key="next" />, name: "Next.js" },
        //   { icon: <SiDjango key="django" />, name: "Django" },
        //   { icon: <SiGraphql key="graphql" />, name: "GraphQL" },
        ]}
        />
      </BentoTilt>

      {/* <BentoTilt className="bento-tilt_2">
        <div className="flex size-full flex-col justify-between bg-violet-300 p-5">
        <h1 className="bento-title special-font max-w-64 text-black">
          M<b>o</b>re co<b>m</b>ing s<b>o</b>on.
        </h1>

        <TiLocationArrow className="m-5 scale-[5] self-end" />
        </div>
      </BentoTilt> */}

      <BentoTilt className="bento-tilt_2 col-span-2 row-span-2 md:col-span-2 md:row-span-2">
        <BentoCard
        src="img/Black.png"
        title="Game Dev / Simulation"
        description="Some work on the side, more of a hobby."
        // isComingSoon
        icons={[
          { icon: <SiUnity key="unity" />, name: "Unity" },
          { icon: <SiUnrealengine key="unreal" />, name: "Unreal Engine" },
          { icon: <SiLua key="lua" />, name: "Lua" },
          { icon: <SiPython key="py" />, name: "Python" },
          { icon: <SiPytorch key="pt" />, name: "PyTorch" },
          { icon: <SiTensorflow key="tf" />, name: "TensorFlow" },
        ]}
        />
      </BentoTilt>
        {/* <p className="hero-heading col-span-2">Thanks for visiting.</p>
        <p className="hero-text col-span-2">Feel Free to contact me at any of the links below</p> */}
      </div>
    </div>
  </section>
);

export default Features;
