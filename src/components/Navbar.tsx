import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '#home', label: 'Home' },
        { href: '#ai-workflows', label: 'AI Workflows' },
        { href: '#services', label: 'Services' },
        { href: '#portfolio', label: 'Portfolio' },
        { href: '#contact', label: 'Contact' },
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <a href="#home" className="nav-logo">
                    <img src="/images/FKGPT.gif" alt="FKGPT" width="40" height="40" />
                    <span>FKGPT.DEV</span>
                </a>

                <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
                    {navLinks.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <button
                    className={`nav-toggle ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle navigation"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
