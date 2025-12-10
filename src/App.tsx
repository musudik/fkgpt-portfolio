import React, { useState, useEffect } from 'react';
import ParticleScene from './particles/ParticleScene';
import ControlPanel from './particles/ControlPanel';
import Navbar from './components/Navbar';
import AIWorkflows from './components/AIWorkflows';
import SpaceSimulation from './components/SpaceSimulation';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import Footer from './components/Footer';
import GDPRConsent from './components/GDPRConsent';
import { ParticleConfig } from './types';

const App: React.FC = () => {
    const [config, setConfig] = useState<ParticleConfig>({
        particleCount: 11000,
        color: '#60a5fa',
        shape: 'diamond',
        speed: 1.7,
        noiseStrength: 0.1,
        size: 0.05,
        text: 'FKGPT'
    });

    // Track if user is in the hero section (for showing/hiding particle control panel)
    const [isInHeroSection, setIsInHeroSection] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            // Hide control panel when scrolled past 80% of viewport height
            const scrollThreshold = window.innerHeight * 0.8;
            setIsInHeroSection(window.scrollY < scrollThreshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="app">
            <Navbar />

            {/* Hero Section - Particle System Only */}
            <section id="home" className="hero-section">
                <div className="particle-container">
                    <ParticleScene config={config} />
                    {isInHeroSection && <ControlPanel config={config} setConfig={setConfig} />}
                </div>

                {/* Floating Logo Only */}
                <div className="floating-logo">
                    <img src="/images/FKGPT.gif" alt="FKGPT" className="hero-logo" />
                </div>

                {/* Scroll Indicator */}
                <div className="scroll-indicator">
                    <i className="fas fa-chevron-down"></i>
                </div>
            </section>

            {/* Intro Section - Below Hero */}
            <section className="intro-section">
                <div className="container">
                    <h1 className="intro-title">FKGPT.DEV</h1>
                    <p className="intro-subtitle">Full-Stack Developer & AI Solutions Architect</p>
                    <p className="intro-description">
                        Transforming ideas into digital reality with cutting-edge web development,
                        hosting solutions, and AI-powered applications.
                    </p>

                    <div className="intro-highlights">
                        <div className="highlight-item">
                            <i className="fas fa-code"></i>
                            <span>Custom Web Development</span>
                        </div>
                        <div className="highlight-item">
                            <i className="fas fa-server"></i>
                            <span>Cloud Hosting Solutions</span>
                        </div>
                        <div className="highlight-item">
                            <i className="fas fa-robot"></i>
                            <span>AI Integration</span>
                        </div>
                    </div>

                    <div className="cta-buttons">
                        <a href="#services" className="cta primary">View Services</a>
                        <a href="#contact" className="cta secondary">Get Quote</a>
                        <a href="https://wa.me/4917644417602" className="cta whatsapp" target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-whatsapp"></i> WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <AIWorkflows />

            <SpaceSimulation />

            <Services />
            <Portfolio />
            <Contact />
            <Footer />

            {/* GDPR Cookie Consent */}
            <GDPRConsent />
        </div>
    );
};

export default App;

