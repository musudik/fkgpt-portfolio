import React from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-glow"></div>
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>FKGPT.DEV</h4>
                        <p>Professional web development and AI solutions. Transforming ideas into digital reality.</p>
                    </div>

                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#portfolio">Portfolio</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Services</h4>
                        <ul>
                            <li><a href="#services">Web Development</a></li>
                            <li><a href="#services">Hosting Solutions</a></li>
                            <li><a href="#services">AI Integration</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Connect</h4>
                        <div className="social-links">
                            <a href="https://github.com/musudik" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <i className="fab fa-github"></i>
                            </a>
                            <a href="https://wa.me/4917644417602" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                <i className="fab fa-whatsapp"></i>
                            </a>
                            <a href="mailto:contact@fkgpt.dev" aria-label="Email">
                                <i className="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} FKGPT.DEV. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
