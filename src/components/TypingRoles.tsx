import { Typewriter } from 'react-simple-typewriter';

const TypingRoles = () => {
  return (
    <h1 className="hero-text inline text-red-500 font-bold">
      <Typewriter
        words={['Designer.', 'Creator.', 'Software Engineer.', 'AI/ML Researcher.', 'Gymrat.', 'Traveler.']}
        loop={0}
        cursor
        cursorStyle="|"
        typeSpeed={70}
        deleteSpeed={50}
        delaySpeed={1000}
      />
    </h1>
  );
};

export default TypingRoles;