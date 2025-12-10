import React, { useState, useEffect } from 'react';

interface CookieSettings {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
}

const GDPRConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<CookieSettings>({
        essential: true, // Always required
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('gdpr-consent');
        if (!consent) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const allAccepted = { essential: true, analytics: true, marketing: true };
        localStorage.setItem('gdpr-consent', JSON.stringify(allAccepted));
        localStorage.setItem('gdpr-consent-date', new Date().toISOString());
        setIsVisible(false);
        setShowSettings(false);
    };

    const handleDeclineAll = () => {
        const essentialOnly = { essential: true, analytics: false, marketing: false };
        localStorage.setItem('gdpr-consent', JSON.stringify(essentialOnly));
        localStorage.setItem('gdpr-consent-date', new Date().toISOString());
        setIsVisible(false);
        setShowSettings(false);
    };

    const handleSaveSettings = () => {
        localStorage.setItem('gdpr-consent', JSON.stringify(settings));
        localStorage.setItem('gdpr-consent-date', new Date().toISOString());
        setIsVisible(false);
        setShowSettings(false);
    };

    const toggleSetting = (key: keyof CookieSettings) => {
        if (key === 'essential') return; // Essential cookies cannot be disabled
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isVisible) return null;

    return (
        <>
            {/* GDPR Banner */}
            <div className={`gdpr-banner ${isVisible && !showSettings ? 'show' : ''}`}>
                <div className="gdpr-content">
                    <div className="gdpr-text">
                        <h4><i className="fas fa-cookie-bite"></i> Cookie Consent</h4>
                        <p>
                            We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                            By clicking "Accept All", you consent to our use of cookies.
                            Read our <a href="#privacy">Privacy Policy</a> for more information.
                        </p>
                    </div>
                    <div className="gdpr-buttons">
                        <button className="gdpr-btn gdpr-accept" onClick={handleAcceptAll}>
                            Accept All
                        </button>
                        <button className="gdpr-btn gdpr-decline" onClick={handleDeclineAll}>
                            Essential Only
                        </button>
                        <button className="gdpr-btn gdpr-settings" onClick={() => setShowSettings(true)}>
                            <i className="fas fa-cog"></i> Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Privacy Settings Modal */}
            <div className={`privacy-modal ${showSettings ? 'show' : ''}`} onClick={() => setShowSettings(false)}>
                <div className="privacy-content" onClick={e => e.stopPropagation()}>
                    <h3><i className="fas fa-shield-alt"></i> Privacy Settings</h3>
                    <p>Manage your cookie preferences below. Essential cookies are required for the website to function properly.</p>

                    <h4>Cookie Categories</h4>

                    <div className="cookie-toggle">
                        <div>
                            <strong>Essential Cookies</strong>
                            <p className="cookie-description">Required for basic website functionality. Cannot be disabled.</p>
                        </div>
                        <div className={`toggle-switch active`} style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        </div>
                    </div>

                    <div className="cookie-toggle">
                        <div>
                            <strong>Analytics Cookies</strong>
                            <p className="cookie-description">Help us understand how visitors interact with our website.</p>
                        </div>
                        <div
                            className={`toggle-switch ${settings.analytics ? 'active' : ''}`}
                            onClick={() => toggleSetting('analytics')}
                        >
                        </div>
                    </div>

                    <div className="cookie-toggle">
                        <div>
                            <strong>Marketing Cookies</strong>
                            <p className="cookie-description">Used to deliver personalized advertisements.</p>
                        </div>
                        <div
                            className={`toggle-switch ${settings.marketing ? 'active' : ''}`}
                            onClick={() => toggleSetting('marketing')}
                        >
                        </div>
                    </div>

                    <div className="privacy-modal-buttons">
                        <button className="gdpr-btn gdpr-accept" onClick={handleSaveSettings}>
                            Save Preferences
                        </button>
                        <button className="gdpr-btn gdpr-decline" onClick={() => setShowSettings(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GDPRConsent;
