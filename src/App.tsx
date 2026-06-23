import Footer from './components/Footer'
import NavBar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Experinece from './components/Experience'
// import './App.css'

function App() {
  return (
    <div>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <NavBar />
      <main id="main-content">
        <Hero />
        <About />
        <Experinece />
        <Skills />
        <Projects />
      </main>
      <Footer />
    </div>
  )
}

export default App
