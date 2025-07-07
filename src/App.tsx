// import { useState } from 'react'
import Footer from './components/Footer'
import NavBar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import CursorEffect from './components/CursorEffect'
import Projects from './components/Projects'
import Skills from './components/Skills'
// import './App.css'

function App() {

  return (
    <div>
      <CursorEffect />
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
