"use client";

import { useEffect, useRef, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { BsClock } from "react-icons/bs";
import SectionHeading from "./SectionHeading";
import useReveal from "../hooks/useReveal";

/**
 * @interface TabItem
 * @description Defines the structure for a single project item displayed within a project tab.
 */
interface TabItem {
  /**
   * Main title for the project card
   */
  projectTitle: string;
  /**
   * Short, concise description of project
   */
  desc: string;
  /**
   * Optional image URL
   * @optional
   */
  img?: string;
  /**
   * Option array of strings for technologies used
   * @optional
   */
  tech?: string[];
  /**
   * A more detailed description
   * @optional
   */
  fullDesc?: string;
  /**
   * Link to project (Github)
   * @optional
   */
  link?: string;
  /**
   * If true, the project will span two columns on large screens
   * @optional
   */
  fullSpan?: boolean;
  /**
   * Indicates if the project is in progress
   * @optional
   */
  inProgress?: boolean;
}

/**
 * @interface TabSection
 * @description Defines structure for a single tab section, include a title to group project and then the projects themseles.
 */
interface TabSection {
  /**
   * Title of the tab (e.g. AI / ML)
   */
  title: string;
  /**
   * An array of TabItem objects displayedu nder this tab
   */
  content: TabItem[];
}

/**
 * @constant {Record<string, TabeSection>} TAB_DATA
 * @description Data source for all project abs and their contens. Keys represent identifiers and values conform to TabSection interface.
 */
const TAB_DATA: Record<string, TabSection> = {
  ai: {
    title: "AI / ML",
    content: [
      {
        "projectTitle": "Crisis and Canopy",
        "desc": "Interactive scrollytelling atlas of heat, tree canopy, and mental-health crisis calls across Toronto",
        "img": "/img/crisisandcanopy.png",
        "tech": ["React", "D3.js", "Python", "Pandas", "GeoJSON", "Google Earth Engine", "Vite"],
        "fullDesc": "An interactive scrollytelling atlas mapping all 158 Toronto neighbourhoods (2014–2024) to explore how mental-health crisis calls line up with summer heat, tree canopy, and poverty. A dependency-light D3-projected SVG choropleth (no map tiles or API keys) drives a guided narrative, a free-form map explorer, per-neighbourhood drill-downs, a correlation studio, and a seasonal pulse view. A Python pipeline joins Toronto Police persons-in-crisis and Mental Health Act call data to neighbourhood boundaries, Tree Equity Scores, Open-Meteo air temperature, and optional 30 m Landsat land-surface temperature from Google Earth Engine, pre-baking everything into static JSON the client fetches at runtime.",
        "link": "/crisisandcanopy/"
      },
      {
        "projectTitle": "Deal Memo Agent",
        "desc": "AI-powered pipeline that converts raw CIMs into structured investment memos",
        "img": "/img/deal-memo-agent.png",
        "tech": ["Python", "FastAPI", "Claude API", "pdfplumber", "PyMuPDF", "Tavily", "Vanilla JS"],
        "fullDesc": "An agentic document-intelligence pipeline built for private equity workflows. Upload a 60–200 page Confidential Information Memorandum and receive a structured, citation-backed investment memo in minutes. The system uses a multi-stage pipeline: PDF ingestion, LLM-driven extraction of financial metrics and deal terms, live web enrichment for comparable transactions and public comps, and parallel drafting of eight memo sections in institutional tone. Designed with a deliberate human-in-the-loop boundary: the agent surfaces diligence questions and flags risks but never recommends a bid price. Every output carries an AI-assisted disclaimer and full source traceability.",
        "link": "https://github.com/mikhskaz/deal-memo-agent"
      },
      {
        projectTitle: "Visight",
        desc: "End-to-end computer vision system for F1 brand exposure analysis",
        img: "/img/visight.webp",
        tech: ["Python", "Modal", "OpenCV", "AWS", "RL LLM", "VLM", "Computer Vision", "YOLOv8"],
        fullDesc: "",
        link: "https://www.linkedin.com/posts/rudraksh-monga_f1-sponsors-spend-2-billion-a-year-on-logo-activity-7402760209376673792-x1RY?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEJ1xlgBZIZG2xaGxaGWJgjhEwC403RhjaE"
      },
      {
        projectTitle: "Predicting Focal Colours from Natural Images",
        desc: "Predicting focal colours from natural images using KMeans clustering in the CIELAB colour space",
        img: "/img/wcs_color_prototypes.png",
        tech: ["Python", "scikit-learn", "Pandas", "NumPy", "Matplotlib", "PyTorch"],
        fullDesc: "",
        link: "https://github.com/mikhskaz/focal-colour-predictor"
      },
      {
        projectTitle: "GuessWho AI",
        desc: "Guessing Who opponent powered by machine learning",
        img: "/img/guesswho.png",
        tech: ["Python", "Tkinter"],
        fullDesc: "Interactive GUI game using basic ML concepts.",
        link: "https://github.com/mikhskaz/guesswho-ai"
      },
      {
        projectTitle: "FER with CNNs",
        desc: "Classifying emotions with CNNs",
        img: "/img/fer2013.png",
        tech: ["Python", "OpenCV", "TensorFlow", "Keras"],
        fullDesc: "Real-time detection of facial expressions from the webcam. Uses a custom CNN architecture trained on the FER2013 dataset.",
        link: "https://github.com/mikhskaz/cnn-fer",
        inProgress: false
      },
      {
        projectTitle: "Stock Prediction",
        desc: "Predicting Stocks Trends with Linear Regression, SARIMA, Transformers, and Sentiment Analysis",
        img: "/img/stockpredictor.png",
        tech: ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow"],
        fullDesc: "Predicting stock trends using various techniques.",
        link: "https://github.com/mikhskaz/stock-predictor",
        inProgress: false
      },
      {
        projectTitle: "Hot Cognition Research",
        desc: "Simulating the Impact of Arousal / Valence on Memory",
        img: "/img/arousalvalence.png",
        tech: ["Python", "Pandas", "NumPy", "Scikit-learn"],
        fullDesc: "Research into how arousal and valence affect memory and recall of chunks; simulating in a custom implementation of the Clarion cognitive architecture.",
        link: "https://github.com/mikhskaz/hotcognition",
        inProgress: false
      },
      
    ]
  },
  seng: {
    title: "Software Engineering",
    content: [
      {
        projectTitle: "Videocutter",
        desc: "Label videos with ease",
        img: "/img/videocutter.png",
        tech: ["Python", "ffmpeg", "OpenCV"],
        fullDesc: "A simple Python program to ease the labelling of video data and creating finetuned clips for fail cases.",
        link: "https://github.com/mikhskaz/videocutter"
      },
      {
        projectTitle: "Wall Street Warriors",
        desc: "Clean Architecture Stock Trading Simulator",
        img: "/img/UseCaseUML.png",
        tech: ["Java", "Firebase", "Clean Architecture"],
        fullDesc: "Comprehensive stock trading simulator with a clean architecture design, real-time stock data, and a trading engine.",
        link: "https://github.com/BradGardea/WallStreetWarriors"
      },
      {
        projectTitle: "Fraternity Webpage",
        desc: "Full-stack web application for a fraternity",
        img: "/img/dutoronto.webp",
        tech: ["TypeScript", "React", "Tailwind CSS"],
        fullDesc: "Featuring mail list and a responsive design.",
        link: "https://github.com/Thehashhobo/DU-Toronto-Webpage",
        inProgress: false
      },
      {
        projectTitle: "Portfolio Website",
        desc: "What you are currently viewing",
        img: "/img/portfolio.png",
        tech: ["TypeScript", "React", "Tailwind CSS"],
        fullDesc: "",
        link: "https://mikhskaz.com",
        inProgress: false
      },
    ]
  },
  sys: {
    title: "Systems Programming",
    content: [
      {
        projectTitle: "Preemptive User-Level Threads",
        desc: "User-level threading library in C, enabling concurrent execution of multiple threads and scheduling",
        // img: "/path/to/image4.jpg",
        tech: ["C", "Linux", "bash"],
        fullDesc: "",
        link: ""
      },
      {
        projectTitle: "Media Streaming Server in C",
        desc: "Server-client system for streaming media files with TCP/IP sockets",
        // img: "/path/to/image4.jpg",
        tech: ["C", "Linux", "bash"],
        fullDesc: "Dynamic buffering to receive, process, and play media files efficiently without errors.",
        link: ""
      },
      {
        projectTitle: "Custom C Shell",
        desc: "A custom shell implementation in C, supporting basic shell functionalities",
        // img: "/path/to/image4.jpg",
        tech: ["C"],
        fullDesc: "Core functionalities include command execution, piping, redirection, and job control.",
        link: ""
      },
    ]
  },
};

type TabButtonProps = {
  tabKey: string;
  title: string;
  active: boolean;
  onClick: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
};

/**
 * @component TabButton
 * @description Single tab button; active state and underline are driven by React state.
 */
const TabButton = ({ tabKey, title, active, onClick, buttonRef }: TabButtonProps) => (
  <button
    ref={buttonRef}
    onClick={onClick}
    className={`whitespace-nowrap pb-2 transition cursor-pointer text-xs sm:text-lg lg:text-2xl uppercase tracking-tight sm:tracking-wide ${
      active ? 'text-black font-semibold' : 'text-white hover:text-black/70'
    }`}
    role="tab"
    id={`tab-${tabKey}`}
    aria-controls={tabKey}
    aria-selected={active}
  >
    {title}
  </button>
);

/**
 * @component TabContent
 * @description Renders the content panel for a specific project ab
 * Display the responsive grid of Project Card components based on the provided content array
 * 
 * @param {object} props - Component props
 * @param {TabItem[]} props.content - Array of 'TabItem' objects
 * @param {string} props.tabKey - Unique identifier for a project category
 */
const TabContent = ({ content, tabKey }: { content: TabItem[]; tabKey: string }) => (
  <div role="tabpanel" id={tabKey} aria-labelledby={`tab-${tabKey}`}>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mx-auto px-6">
    {content.map((item, i) => (
      <div // Project Card
        key={`${tabKey}-${i}`}
        style={{ ['--i' as string]: i }}
        className={`card-enter group bg-black text-white p-6 rounded-2xl shadow-lg flex flex-col border border-white/10 transition-colors duration-500 hover:border-primary ${
          item.fullSpan ? "col-span-2" : ""
        }`}
      >
        {item.img && (
          <div className="overflow-hidden rounded-xl">
            <img
              src={item.img}
              alt={item.desc}
              loading="lazy"
              decoding="async"
              className="object-cover h-48 w-full transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        )}

        {/* Project Meat */}
        <div className="flex-grow py-4">
          {" "}
          <div className="flex gap-3">
            {" "}
            {/* Name and In progress */}
            {item.projectTitle && <h3 className="text-2xl font-extrabold mb-1">{item.projectTitle}</h3>}
            {item.inProgress && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <BsClock /> In Progress
              </span>
            )}
          </div>
          {/* Short Description */}
          <p className="text-lg mb-1 text-left">{item.desc}</p>
          {/* Detailed Description */}
          {item.fullDesc && <p className="text-sm text-gray-300 text-left">{item.fullDesc}</p>}
          {/* What was used */}
          {item.tech && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-400">
              {item.tech.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gray-800 px-2 py-1 rounded-md border border-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Project Button / Link */}
        <div className="flex items-end mt-4">
          {" "}
          {/* Added mt-4 for some spacing */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex items-center gap-2 self-start bg-white hover:bg-primary text-black hover:text-white text-sm px-4 py-2 rounded-md transition-colors duration-300"
            >
              View Project{' '}
              <FaExternalLinkAlt className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </a>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
);

/**
 * @component Projects
 * @description Main container components for the projects section. 
 * Manages tab navigation logic, dispaly categories, and renders project content
 * 
 * Uses client-side JS for tab functionality, dynamically updating underline indicator based on active tab
 */
const Projects = () => {
  const [activeTab, setActiveTab] = useState<string>('ai');
  const underlineRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const revealRef = useReveal<HTMLDivElement>();

  // Keep the underline glued to the active tab, including on resize
  useEffect(() => {
    const update = () => {
      const button = buttonRefs.current[activeTab];
      const underline = underlineRef.current;
      if (button && underline) {
        underline.style.width = `${button.offsetWidth}px`;
        underline.style.left = `${button.offsetLeft}px`;
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeTab]);

  return (
    <section id="projects" ref={revealRef} className="flex flex-col items-center pb-12 pt-20 bg-primary w-full">
      <div className="container px-3 md:px-10 w-full">
        <SectionHeading index="04" title="Projects" sub="Selected work" className="mb-8" invert />
      </div>

      <div className="relative w-full border-b border-black/30 mb-8">
        <div className="flex flex-nowrap justify-center gap-x-3 sm:gap-x-6 px-3" role="tablist" aria-label="Project categories">
          {Object.entries(TAB_DATA).map(([key, { title }]) => (
            <TabButton
              key={key}
              tabKey={key}
              title={title}
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
              buttonRef={(el) => { buttonRefs.current[key] = el; }}
            />
          ))}
        </div>
        <div
          ref={underlineRef}
          className="absolute bottom-0 h-1 bg-black rounded transition-all duration-300 ease-in-out"
        ></div>
      </div>

      <div className="w-full">
        <TabContent
          key={activeTab}
          tabKey={activeTab}
          content={TAB_DATA[activeTab].content}
        />
      </div>
    </section>
  );
};

export default Projects;