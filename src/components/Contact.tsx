import React, { useState } from 'react';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Open email client with pre-filled data
        const mailtoLink = `mailto:contact@fkgpt.dev?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
            `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
        )}`;
        window.location.href = mailtoLink;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <section id="contact" className="contact-section">
            <div className="container">
                <h2 className="section-title">Get In Touch</h2>

                <div className="contact-wrapper">
                    <div className="contact-info">
                        <h3>Let's Build Something Amazing</h3>
                        <p>Ready to transform your ideas into reality? Reach out and let's discuss your project.</p>

                        <div className="contact-methods">
                            <a href="https://wa.me/4917644417602" className="contact-method whatsapp" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-whatsapp"></i>
                                <span>WhatsApp</span>
                            </a>
                            <a href="mailto:contact@fkgpt.dev" className="contact-method email">
                                <i className="fas fa-envelope"></i>
                                <span>contact@fkgpt.dev</span>
                            </a>
                            <a href="https://github.com/musudik" className="contact-method github" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-github"></i>
                                <span>GitHub</span>
                            </a>
                        </div>
                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows={5}
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="submit-btn">
                            <i className="fas fa-paper-plane"></i> Send Message
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
