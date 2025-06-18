import { FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';

const socialLinks = [
    { href: "https://instagram.com/mikhskaz", icon: <FaInstagram /> },
    { href: "https://www.linkedin.com/in/mikhail-skazhenyuk-1b44bb271/", icon: <FaLinkedin /> },
    { href: "https://github.com/mikhskaz", icon: <FaGithub /> },
];
  
const Footer = () => {
    return (
        <footer className="w-full bg-primary p-4 text-black h-24">
            <div className="container m-auto flex items-center justify-between px-4 items-center h-full">
                <p className="text-center text-lg font-light md:text-left">
                    &copy; {new Date().getFullYear()} Mikhail Skazhenyuk. All rights reserved.
                </p>

                <div className="flex justify-center gap-4">
                    {socialLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-none text-black text-5xl transition-colors duration-500 ease-in-out hover:text-white hover:scale-150"
                        >
                            {link.icon}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}

export default Footer;