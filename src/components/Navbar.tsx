import clsx from 'clsx';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useWindowScroll } from 'react-use';
import { FaAlignJustify } from 'react-icons/fa';
import { TiLocationArrow } from 'react-icons/ti';

import Button from './Button';

const navItems = ['Home', 
    'About', 
    'Experience',
    'Skills', 
    'Projects'
    // 'Contact'
];

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaying) {
        audioElementRef.current.play();
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  useEffect(() => {
    if (currentScrollY === 0) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.remove('floating-nav');
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
      navContainerRef.current?.classList.add('floating-nav');
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.add('floating-nav');
    }

    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible]);

  // Track active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = document.querySelectorAll("section[id]");
      let current: string | null = null;
  
      sectionElements.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.3 && rect.bottom >= window.innerHeight * 0.3) {
          current = section.id;
        }
      });
  
      if (current) {
        setActiveSection(current);
      }
    };
  
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // trigger on mount
  
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 m-6 z-50 h-25 transition-all duration-700 max-w-screen"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2">
        <nav className="flex w-full items-center justify-between p-4">
          {/* Left: Resume Button */}
          <div className="flex items-center gap-7">
          <Button
            id="resume-button"
            title="LinkedIn"
            rightIcon={<TiLocationArrow />}
            href="https://www.linkedin.com/in/mikhail-skazhenyuk-1b44bb271/"
            containerClass="bg-white hover:bg-primary hover:text-white"
            />
          </div>

          {/* Right: Navigation Links, Mobile Menu, and Audio Indicator */}
          <div className="items-center space-x-4 flex">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-10">
              {navItems.map((item, index) => {
                const id = item.toLowerCase();
                return (
                    <a
                    key={index}
                    href={`#${id}`}
                    className={clsx(
                      'relative uppercase font-bold text-2xl text-white transition-all duration-300',
                      'after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:bg-white after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)]',
                      activeSection === id
                        ? 'text-primary after:scale-x-100 after:origin-bottom-left'
                        : 'after:scale-x-0 hover:after:scale-x-100 hover:after:origin-bottom-left hover:text-primary'
                    )}
                  >
                    {item}
                  </a>
                );
              })}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden relative">
              <button
                className={`text-3xl p-2 cursor-pointer transition-colors duration-300 ${
                  menuOpen ? 'text-primary' : 'text-white'
                }`}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <FaAlignJustify />
              </button>

              {menuOpen && (
                <div className="absolute z-50 flex flex-col -mx-6 mt-7 gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-lg">
                  {navItems.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.toLowerCase()}`}
                      className="uppercase text-white text-xl tracking-wide hover:text-primary transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Audio Indicator */}
            <button
              onClick={toggleAudioIndicator}
              className="ml-4 flex items-center space-x-1 cursor-pointer"
            >
              <audio
                ref={audioElementRef}
                className="hidden"
                src="/audio/loop.mp3"
                loop
              />
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={clsx('indicator-line', {
                    active: isIndicatorActive,
                  })}
                  style={{ animationDelay: `${bar * 0.1}s` }}
                />
              ))}
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default NavBar;
