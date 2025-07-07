import { useEffect, useState } from 'react'
import Footer from './components/Footer'
import NavBar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import CursorEffect from './components/CursorEffect'
import Projects from './components/Projects'
import Skills from './components/Skills'
// import './App.css'

function App() {

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // For older IE devices (optional)
      // @ts-ignore
      navigator.msMaxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  return (
    <div>
      {!isTouchDevice && <CursorEffect />}
      {/* <main className="relative min-h-screen w-screen overflow-x-hidden"> */}
      <NavBar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Footer />
    {/* </main> */}
    </div>
  )
}

export default App
