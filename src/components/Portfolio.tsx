import React from 'react';

const projects = [
    {
        icon: 'fas fa-music',
        title: 'DropMyBeats',
        url: 'https://dropmybeat.replit.app/',
        description: 'Interactive DJ Event Management platform where music meets technology.',
        tech: ['React', 'Node.js', 'WebRTC', 'Socket.io']
    },
    {
        icon: 'fas fa-tint',
        title: 'Zrinks',
        url: 'https://musudik.github.io/zrinks/',
        description: 'Premium sparkling beverage brand website featuring all-natural fruit-infused drinks.',
        tech: ['HTML5', 'CSS3', 'JavaScript', 'GSAP']
    },
    {
        icon: 'fas fa-headphones',
        title: 'DJ Garry',
        url: 'https://musudik.github.io/dj-garry/',
        description: 'Professional DJ equipment rental service with premium sound systems.',
        tech: ['Vue.js', 'CSS Grid', 'Responsive Design', 'PWA']
    },
    {
        icon: 'fas fa-calendar-alt',
        title: 'OneMunich365',
        url: 'https://onemunich365.de/',
        description: 'Dynamic events organization platform hosting cultural festivals in Munich.',
        tech: ['WordPress', 'PHP', 'MySQL', 'Bootstrap']
    },
    {
        icon: 'fas fa-trophy',
        title: 'SV Lohhof Cricket',
        url: 'https://musudik.github.io/svl-teams/',
        description: 'Professional cricket club website showcasing elite teams and player statistics.',
        tech: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js']
    },
    {
        icon: 'fas fa-palette',
        title: 'Mirusa by Sandy',
        url: 'https://musudik.github.io/mirusa/',
        description: 'Elegant fashion portfolio showcasing contemporary designs.',
        tech: ['React', 'Styled Components', 'Framer Motion', 'Gatsby']
    }
];

const Portfolio: React.FC = () => {
    return (
        <section id="portfolio" className="portfolio-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">🚀 Live Projects Portfolio</h2>
                    <p>Explore our collection of live, interactive web applications and digital solutions</p>
                </div>

                <div className="projects-grid">
                    {projects.map((project, index) => (
                        <div key={index} className="project-card">
                            <div className="project-header">
                                <h3><i className={project.icon}></i> {project.title}</h3>
                                <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
                                    <i className="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                            <p className="project-description">{project.description}</p>
                            <div className="tech-stack">
                                {project.tech.map((tech, i) => (
                                    <span key={i} className="tech-tag">{tech}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="portfolio-cta">
                    <a href="https://github.com/musudik" target="_blank" rel="noopener noreferrer" className="github-link">
                        <i className="fab fa-github"></i> View More on GitHub
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Portfolio;
