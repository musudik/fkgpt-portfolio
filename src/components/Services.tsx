import React from 'react';

const services = [
    {
        icon: 'fas fa-laptop-code',
        title: 'Web Development',
        description: 'Custom websites and web applications built with modern technologies like React, Node.js, and Python.',
        features: ['Responsive Design', 'SEO Optimized', 'Performance Focused', 'Modern Frameworks'],
        price: 'Starting at €500'
    },
    {
        icon: 'fas fa-cloud',
        title: 'Hosting & Deployment',
        description: 'Reliable cloud hosting solutions with 99.9% uptime, SSL certificates, and automated backups.',
        features: ['Cloud Infrastructure', 'SSL Certificates', 'Daily Backups', '24/7 Monitoring'],
        price: 'From €15/month'
    },
    {
        icon: 'fas fa-robot',
        title: 'AI Integration',
        description: 'Integrate AI chatbots, automation tools, and machine learning capabilities into your applications.',
        features: ['Custom AI Chatbots', 'Process Automation', 'Data Analytics', 'API Integration'],
        price: 'Custom Quote'
    }
];

const Services: React.FC = () => {
    return (
        <section id="services" className="services-section">
            <div className="container">
                <h2 className="section-title">Professional Services</h2>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card">
                            <div className="service-icon">
                                <i className={service.icon}></i>
                            </div>
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>
                            <ul className="service-features">
                                {service.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                            <div className="service-price">{service.price}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
