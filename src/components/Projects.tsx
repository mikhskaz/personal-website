"use client";

import { useEffect, useRef } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { BsClock } from "react-icons/bs";

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
        inProgress: true
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
        link: "",
        inProgress: true
      },
      
    ]
  },
  seng: {
    title: "Software Engineering",
    content: [
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
        img: "/img/dutoronto.png",
        tech: ["TypeScript", "React", "Tailwind CSS"],
        fullDesc: "Featuring mail list and a responsive design.",
        link: "https://github.com/Thehashhobo/DU-Toronto-Webpage",
        inProgress: true
      },
      {
        projectTitle: "Portfolio Website",
        desc: "What you are currently viewing",
        img: "/img/portfolio.png",
        tech: ["TypeScript", "React", "Tailwind CSS"],
        fullDesc: "",
        link: "https://mikhskaz.com",
        inProgress: true
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

/**
 * @component TabButton
 * @decription Renders a single interactive Tab Button for navigating between projects.
 * @param {object} props - Component props
 * @param {string} props.tabKey - Unique identifier for the tab, corresponding to an entry in TAB_DATA
 * @param {string} props.title - The display title for the tab button
 */
const TabButton = ({ tabKey, title }: { tabKey: string; title: string }) => (
  <button
    className="tab-btn pb-2 font-medium text-white text-2xl hover:text-secondary transition cursor-none"
    data-tab={tabKey}
    role="tab"
    aria-selected="false"
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
  <div className="tab-content hidden" id={tabKey}>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mx-auto px-6">
    {content.map((item, i) => (
      <div // Project Card
        key={i}
        className={`bg-black text-white p-6 rounded-2xl shadow-lg flex flex-col ${ // Added flex flex-col here
          item.fullSpan ? "col-span-2" : ""
        }`}
      >
        {item.img && (
          <img
            src={item.img}
            alt={item.desc}
            className="rounded-xl object-cover h-48 w-full"
          />
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
              className="inline-flex items-center gap-2 self-start bg-white hover:bg-primary text-black hover:text-white text-sm px-4 py-2 rounded-md"
            >
              View Project <FaExternalLinkAlt />
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
  /**
   * @type {React.RefObject<HTMLDivElement>}
   * @description Ref for the animated underline beneat tab buttons
   */
  const underlineRef = useRef<HTMLDivElement>(null);

  /**
   * @effect
   * @decription Manages tab switching logic and the animated underline.
   * 
   * Attaches event listernes to tab buttons for lcick events, updates the underline's position and width based on the active tab.
   * Handles resize event to reposition underline. 
   * 
   * 'SetTimeout' ensures initial tab activation after DOM rendered.
   */
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
    const contents = document.querySelectorAll<HTMLElement>(".tab-content");
    const underline = underlineRef.current;
    let selectedButton: HTMLElement | null = null;

    /**
     * Updates position and width of tab underline
     * @param {HTMLElement} button - Currently selected tab button
     */
    const updateUnderline = (button: HTMLElement) => {
      selectedButton = button;
      if (underline) {
        underline.style.width = `${button.offsetWidth}px`;
        underline.style.left = `${button.offsetLeft}px`;
      }
    };

    /**
     * Handles window resize events to adjust underline pos
     */
    const handleResize = () => {
      if (selectedButton && underline) {
        underline.style.width = `${selectedButton.offsetWidth}px`;
        underline.style.left = `${selectedButton.offsetLeft}px`;
      }
    };

    // Attach click listeners
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        // Deactivate buttons, hide content
        buttons.forEach((btn) => {
          btn.classList.remove("text-blue-700", "font-semibold");
          btn.setAttribute("aria-selected", "false");
        });
        contents.forEach((content) => content.classList.add("hidden"));

        // Activate clicked button, show content
        const tabId = button.dataset.tab!;
        document.getElementById(tabId)?.classList.remove("hidden");
        button.classList.add("text-blue-700", "font-semibold");
        button.setAttribute("aria-selected", "true");
        updateUnderline(button);
      });
    });

    // Resize listener
    window.addEventListener("resize", handleResize);

    // Click on default 'ai' tab after render
    setTimeout(() => {
      const defaultTab = document.querySelector<HTMLButtonElement>(".tab-btn[data-tab='ai']");
      if (defaultTab) defaultTab.click();
    }, 0);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col items-center pb-12 bg-primary w-full height-screen">
      <div className="container px-3 md:px-10">
        <h2 className="hero-heading">Projects.</h2>
      <p className="hero-text mb-8">
        What I&apos;ve been working on.
      </p>
      </div>

      <div className="relative w-full border-b border-gray-300 mb-8">
        <div className="flex justify-center space-x-6" role="tablist">
          {Object.entries(TAB_DATA).map(([key, { title }]) => (
            <TabButton key={key} tabKey={key} title={title} />
          ))}
        </div>
        <div
          ref={underlineRef}
          className="tab-underline absolute bottom-0 h-1 bg-black rounded transition-all duration-300 ease-in-out"
        ></div>
      </div>

      <div className="w-full">
        {Object.entries(TAB_DATA).map(([key, { content }]) => (
          <TabContent key={key} tabKey={key} content={content} />
        ))}
      </div>
    </div>
  );
};

export default Projects;