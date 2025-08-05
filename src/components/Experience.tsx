import React, { useState, useEffect, useRef } from 'react';

type ExperienceType = {
  title: string;
  duration: string;
  description: string;
  image: string;
  skills?: string[];
};

const experiences: ExperienceType[] = [
    {
        title: "AI Engineer",
        duration: "Sep 2025",
        description: "Incoming",
        image: "public/img/kite.png"
    },
    {
        title: "AI Engineering Intern",
        duration: "Jul 2025 - Present",
        description: "Implementing a RAG-supported generative AI pipeline for automated test case generation from user stories, codebase, and existing test cases. Product significantly improves test coverage and decreases manual testing time.",
        image: "public/img/digy4.png",
        skills: ["Generative AI", "Python", "LangChain", "OpenAI API", "Test Automation", "RAG", "Vector Databases", "Model Context Protocol"]
    },
    {
        title: "Independent Researcher",
        duration: "Jul 2025 - Present",
        description: "Researching and developing a novel bio-inspired generative AI for multi-modal text relevance. Creating a novel AI framework mimicking the human brain's memory and attention mechanisms, integrating cognitive science principles of multi-modal processing and adaptive attention, inspired by human learning across diverse sensory modalities (e.g. Braille, Sign Language, Speech) to address computational challenges like the frame problem. ",
        image: "public/img/research.png",
        skills: ["Python", "Natural Language Processing", "Deep Learning", "Information Retrieval", "Argument Mining", "Neural Networks", "spaCy", "PyTextRank", "PyTorch"]
    },
    {
        title: "Cognitive Science Researcher",
        duration: "Aug 2024 - Present",
        description: "Simulated the effects of arousal and valence on memory retention curves in a Python implementation of the Clarion Cognitive Architecture, showing a strong correlation between memory retention and emotion.",
        image: "public/img/deppsych.png",
        skills: ["Python", "Cognitive Science", "Clarion Cognitive Architecture", "Data Analysis", "scikit-learn", "Pandas", "NumPy"]
    },
    {
        title: "Frontend Developer",
        duration: "Contractual; May 2025 - June 2025",
        description: "Built a responsive, accessible, and performant web application for a local organization using React, TypeScript, and Tailwind CSS.",
        image: "public/img/dutoronto.webp"
    }
];

const ExperienceStyles = (): React.ReactElement => (
  <style>{`
    /* Adding a smooth transition to the progress bar and circles */
    .timeline-progress {
        transition: height 0.2s linear;
    }

    .experience-section-container {
        display: flex;
        max-width: 1200px;
        margin: 0px auto;
        gap: 50px;
        padding-top: 30vh;
    }
    .timeline-container {
        flex: 1;
        position: relative;
    }
    .timeline-wrapper {
        position: sticky;
        top: 50vh;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .timeline-wrapper::before {
        content: '';
        position: absolute;
        width: 4px;
        height: 100%;
        background-color: #e0e0e0;
        top: 0;
        z-index: -2;
    }
    .timeline-progress {
        position: absolute;
        width: 4px;
        background-color: var(--color-secondary);
        top: 0;
        z-index: -1;
    }
    .timeline-node {
        display: flex;
        align-items: center;
        margin-bottom: 80px;
        transition: transform 0.3s ease;
    }
    .timeline-node:last-child {
        margin-bottom: 0;
    }
    .timeline-node .timeline-circle {
        width: 40px;
        height: 40px;
        background-color: #e0e0e0;
        border: 4px solid #e0e0e0;
        border-radius: 50%;
        transition: background-color 0.3s ease, border-color 0.3s ease;
        position: relative;
    }

    .timeline-node.active .timeline-circle {
        background-color: #fff;
        border-color: var(--color-secondary);
    }
    .experiences-container {
        flex: 3;
        display: flex;
        flex-direction: column;
        gap: 10vh;
        padding-right: 20px;
    }
    .experience-card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 30px;
        opacity: 0.3;
        transform: scale(0.95);
        transition: opacity 0.4s ease, transform 0.4s ease;
        min-height: 300px;
        
        justify-content: center;
    }
    .experience-card.active {
        opacity: 1;
        transform: scale(1);
    }
    .experience-card img {
        max-width: 200px;
        margin-bottom: 20px;
        border-radius: 0px;
    }
    .experience-card h3 {
        margin: 0 0 5px 0;
        font-size: 1.5rem;
        color: var(--color-secondary);
    }
    .experience-card .duration {
        font-style: italic;
        color: #6c757d;
        margin-bottom: 15px;
    }
    .experience-card p {
        font-size: 1rem;
        line-height: 1.6;
    }
    .experiences-container {
        transform: translateY(-200px);
    }
    .skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: auto; /* Pushes skills to the bottom of the card */
        padding-top: 20px; /* Adds space above the skills */
    }
    .skill-tag {
        background-color: #f0f0f0;
        color: #333;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
    }
  `}</style>
);


const Experience = (): React.ReactElement => {
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [progressHeight, setProgressHeight] = useState<number>(0);
    const [lastActiveNode, setLastActiveNode] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const timelineNodeRefs = useRef<(HTMLDivElement | null)[]>([]);
    const experienceCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setActiveIndex(index);
                    }
                });
            },
            { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
        );

        experienceCardRefs.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => {
            experienceCardRefs.current.forEach((card) => {
                if (card) observer.unobserve(card);
            });
        };
    }, []);
    
    // Handles all scroll-based animations
    useEffect(() => {
    const handleScroll = () => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const rect = scrollContainer.getBoundingClientRect();
        const activationPoint = window.innerHeight * 0.6;
        const scrollableDistance = rect.height - window.innerHeight * 0.4;
        const distanceScrolled = activationPoint - rect.top - 100;
        const progress = Math.max(0, Math.min(1, distanceScrolled / scrollableDistance));

        const timelineNodes = timelineNodeRefs.current;
        if (!timelineNodes.every(n => n)) return;

        const firstNode = timelineNodes[0];
        const lastNode = timelineNodes[timelineNodes.length - 1];
        if (!firstNode || !lastNode) return;
        const startY = firstNode.offsetTop + firstNode.offsetHeight / 2;
        const endY = lastNode.offsetTop + lastNode.offsetHeight / 2;
        const totalTimelineHeight = endY - startY;
        setProgressHeight(startY + totalTimelineHeight * progress);

        const numSegments = experiences.length - 1;
        if (numSegments > 0) {
            const currentLastNode = Math.round(progress * numSegments - 0.4);
            setLastActiveNode(currentLastNode);
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run on load

    return () => window.removeEventListener('scroll', handleScroll);
}, [experiences.length]); // Empty dependency array ensures this runs once, as refs don't trigger re-renders

    return (
    <>
        <ExperienceStyles />
        <div className="bg-gradient-to-b from-black to-secondary">
            <section id="experience" className="container mx-auto md:px-10 p-3">
                <p className="hero-heading">
                    Experiences.
                </p>
                <p className="hero-text">
                    Where I have grown.
                </p>
            </section>
            <section className="experience-section-container">
                <div className="timeline-container">
                    <div className="timeline-wrapper">
                        <div className="timeline-progress" style={{ height: `${progressHeight}px` }}></div>
                        {experiences.map((_, index) => (
                            <div
                                key={index}
                                ref={(el) => { timelineNodeRefs.current[index] = el; }}
                                className={`timeline-node ${index <= lastActiveNode ? 'active' : ''}`}
                            >
                                <div className="timeline-circle"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="experiences-container" ref={scrollContainerRef}>
                    {experiences.map((exp, index) => (
                        <div
                            key={index}
                            ref={(el) => { experienceCardRefs.current[index] = el; }}
                            className={`experience-card ${index <= lastActiveNode ? 'active' : ''}`}
                            data-index={index}
                        >
                            <img src={exp.image} alt={`${exp.title} logo`} />
                            <h3>{exp.title}</h3>
                            <div className="duration">{exp.duration}</div>
                            <p>{exp.description}</p>
                            
                            {/* Skills Section */}
                            {exp.skills && exp.skills.length > 0 && (
                                <div className="skills-container">
                                    {exp.skills.map((skill, skillIndex) => (
                                        <span key={skillIndex} className="skill-tag">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    </>
);
};

export default Experience;