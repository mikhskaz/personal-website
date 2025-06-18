import React, { useRef, useState, useEffect } from 'react';
import type { JSX } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  key: string;
  label: string;
}

const tabs: Tab[] = [
  { key: 'lead', label: 'Lead With Purpose' },
  { key: 'edge', label: 'Sharpen Your Edge' },
  { key: 'bonds', label: 'Forge Lifelong Bonds' },
  { key: 'good', label: 'Be a Force for Good' },
];

const content: Record<string, React.ReactElement> = {
  lead: (
    <div className="content-card">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-3xl font-bold mb-2">20+</h3>
        <p className="text-lg">Presidents of Major Businesses</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-3xl font-bold mb-2">7</h3>
        <p className="text-lg">Nobel Prizes</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md col-span-2">
        <p className="text-lg">Leadership is a habit, not a hierarchy.</p>
      </div>
    </div>
  ),
  edge: (
    <div className="content-card">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md col-span-2">
        <p className="text-lg">College is your launchpad. Brotherhood means pushing each other to grow.</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-4xl font-bold mb-2">3.62</h3>
        <p className="text-lg">Chapter cGPA (24-25)</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-4xl font-bold mb-2">20+</h3>
        <p className="text-lg">Different majors represented</p>
      </div>
    </div>
  ),
  bonds: (
    <div className="content-card">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md col-span-2">
        <h3 className="text-4xl font-bold mb-2">1100+</h3>
        <p className="text-lg">Total initiated Brothers</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-4xl font-bold mb-2">40+</h3>
        <p className="text-lg">Active Brothers</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md col-span-3">
        <p className="text-lg">Brotherhood starts the moment you walk in.</p>
      </div>
    </div>
  ),
  good: (
    <div className="content-card">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md col-span-2">
        <p className="text-lg">Doing good is who we are.</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-3xl font-bold mb-2">$100,000+</h3>
        <p className="text-lg">Donated yearly to GSI</p>
      </div>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-md">
        <h3 className="text-3xl font-bold mb-2">10+</h3>
        <p className="text-lg">Avg annual service hours per Brother</p>
      </div>
    </div>
  ),
};

export default function TabbedSkills(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('lead');
  const underlineRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const activeButton = tabRefs.current[activeTab];
    const underline = underlineRef.current;
    if (activeButton && underline) {
      const { offsetLeft, offsetWidth } = activeButton;
      underline.style.width = `${offsetWidth}px`;
      underline.style.left = `${offsetLeft}px`;
    }
  }, [activeTab]);

  return (
    <div className="relative bg-gradient-to-b from-primary to-secondary w-screen min-h-screen flex flex-col items-center justify-start py-10">
      <div className="text-center mb-10">
        <p className="hero-heading">Skills.</p>
        <p className="hero-text">What can I do?</p>
      </div>

      <div className="relative w-full border-b-2 border-white mb-10">
        <div className="flex justify-center space-x-6" role="tablist">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              ref={(el) => { tabRefs.current[key] = el; }}
              onClick={() => setActiveTab(key)}
              className={`tab-btn impact-btn transition-all px-3 py-2 ${
                activeTab === key ? 'text-primary' : 'text-white'
              }`}
              role="tab"
              aria-selected={activeTab === key}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          ref={underlineRef}
          className="tab-underline absolute bottom-0 z-20 h-1 bg-secondary transition-all duration-300 ease-in-out"
        ></div>
      </div>

      <div className="w-full px-4 flex justify-center items-center relative">
        {tabs.map(({ key }, index) => {
          const isActive = key === activeTab;
          const offset = (index - tabs.findIndex((t) => t.key === activeTab)) * 80;
          return (
            <motion.div
              key={key}
              className="absolute cursor-pointer"
              style={{ zIndex: isActive ? 20 : 10 }}
              animate={{
                scale: isActive ? 1 : 0.85,
                opacity: isActive ? 1 : 0.5,
                x: offset,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => setActiveTab(key)}
            >
              {content[key]}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
