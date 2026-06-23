import { FaInstagram, FaLinkedin, FaGithub, FaArrowUp } from 'react-icons/fa';
import useReveal from '../hooks/useReveal';

const socialLinks = [
    { href: "https://instagram.com/mikhskaz", icon: <FaInstagram />, label: "Instagram" },
    { href: "https://www.linkedin.com/in/mikhail-skazhenyuk-1b44bb271/", icon: <FaLinkedin />, label: "LinkedIn" },
    { href: "https://github.com/mikhskaz", icon: <FaGithub />, label: "GitHub" },
];

const Footer = () => {
    const revealRef = useReveal<HTMLElement>();

    return (
        <footer ref={revealRef} className="w-full bg-black border-t border-white/10 text-white">
            {/* Big CTA */}
            <div className="px-6 md:px-10 pt-20 pb-14 reveal">
                <p className="meta-label mb-8">
                    <span className="tick">05 / </span>Contact: open to internships, research &amp; collaboration
                </p>
                <a
                    href="mailto:mikhska@gmail.com"
                    className="group block font-display font-black uppercase leading-[0.88] text-[clamp(3.5rem,11vw,10rem)]"
                >
                    Let's build
                    <br />
                    <span className="text-outline transition-colors duration-500 group-hover:text-primary">
                        something.
                    </span>
                </a>
                <p className="meta-label mt-8">
                    <span className="tick">→ </span>mikhska@gmail.com
                </p>
            </div>

            {/* Socials + back to top */}
            <div className="flex items-center justify-between px-6 md:px-10 pb-14 reveal" style={{ ['--reveal-delay' as string]: '0.15s' }}>
                <div className="flex gap-6">
                    {socialLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.label}
                            className="text-4xl md:text-5xl text-white/70 transition-all duration-300 hover:text-primary hover:-translate-y-1"
                        >
                            {link.icon}
                        </a>
                    ))}
                </div>
                <a
                    href="#home"
                    aria-label="Back to top"
                    className="flex size-14 items-center justify-center rounded-full border border-white/25 text-white/70 transition-all duration-300 hover:border-primary hover:text-primary hover:-translate-y-1"
                >
                    <FaArrowUp />
                </a>
            </div>

            {/* Colophon */}
            <div className="border-t border-white/10 px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-3">
                <p className="meta-label">&copy; {new Date().getFullYear()} Mikhail Skazhenyuk</p>
                <p className="meta-label hidden sm:block">Toronto, Canada / 43.66°N, 79.39°W</p>
                <p className="meta-label">Designed &amp; built with React + GSAP</p>
            </div>
        </footer>
    );
}

export default Footer;
