import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    id: number;
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const BASE_URL = 'https://n8n.fkgpt.dev';

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface VoiceAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose }) => {
    const [state, setState] = useState<AssistantState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdRef = useRef(0);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript('');
                handleUserMessage(finalTranscript);
            } else {
                setTranscript(interimTranscript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setMicPermission('denied');
            }
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        };

        recognition.onend = () => {
            if (state === 'listening') {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started');
                }
            }
        };

        recognition.onstart = () => {
            setMicPermission('granted');
        };

        recognitionRef.current = recognition;
        synthRef.current = window.speechSynthesis;

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then(result => {
                    setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                    result.onchange = () => {
                        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                    };
                })
                .catch(() => { });
        }

        return () => {
            recognition.abort();
        };
    }, []);

    // Stop recognition when modal closes
    useEffect(() => {
        if (!isOpen && recognitionRef.current) {
            recognitionRef.current.stop();
            setState('idle');
        }
    }, [isOpen]);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleUserMessage = useCallback(async (text: string) => {
        const userMessage: Message = {
            id: ++messageIdRef.current,
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages((prev: Message[]) => [...prev, userMessage]);
        setState('processing');
        recognitionRef.current?.stop();

        try {
            const response = await fetch(`${BASE_URL}/webhook/voice-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text.trim() }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            let assistantText = '';
            if (data.status) {
                if (data.status.includes('$json.output') || data.status.includes('{{')) {
                    assistantText = 'The AI agent is currently being configured. Please try again later.';
                } else {
                    assistantText = data.status;
                }
            } else if (data.output) {
                assistantText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
            } else if (data.message) {
                assistantText = data.message;
            } else if (data.response) {
                assistantText = data.response;
            } else {
                assistantText = 'I received your message but the response format was unexpected.';
            }

            const assistantMessage: Message = {
                id: ++messageIdRef.current,
                type: 'assistant',
                text: assistantText,
                timestamp: new Date()
            };

            setMessages((prev: Message[]) => [...prev, assistantMessage]);
            speakText(assistantText);

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: ++messageIdRef.current,
                type: 'assistant',
                text: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages((prev: Message[]) => [...prev, errorMessage]);
            setState('idle');
        }
    }, []);

    const speakText = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setState('speaking');
        utterance.onend = () => setState('idle');
        utterance.onerror = () => setState('idle');

        synthRef.current.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (state === 'listening') {
            recognitionRef.current.stop();
            setState('idle');
        } else {
            try {
                recognitionRef.current.start();
                setState('listening');
            } catch (e) {
                console.error('Error starting recognition:', e);
            }
        }
    };

    const getStateLabel = () => {
        switch (state) {
            case 'idle': return 'Tap to speak';
            case 'listening': return 'Listening...';
            case 'processing': return 'Processing...';
            case 'speaking': return 'Speaking...';
            case 'error': return 'Error occurred';
            default: return 'Ready';
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="voice-modal-overlay" onClick={handleOverlayClick}>
            <div className="voice-modal-backdrop"></div>

            <div className="voice-modal">
                {/* Animated Background */}
                <div className="voice-modal-bg">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                    <div className="gradient-orb orb-4"></div>
                </div>

                {/* Close Button */}
                <button className="voice-modal-close" onClick={onClose} aria-label="Close">
                    <i className="fas fa-times"></i>
                </button>

                {/* Modal Content */}
                <div className="voice-modal-content">
                    {/* Header */}
                    <div className="voice-modal-header">
                        <div className="voice-modal-icon">
                            <i className="fas fa-robot"></i>
                        </div>
                        <h2>AI Voice Assistant</h2>
                        <p>Speak naturally, I'm here to help</p>
                    </div>

                    {!isSupported ? (
                        <div className="voice-not-supported">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.</p>
                        </div>
                    ) : (
                        <>
                            {/* Waveform Visualization */}
                            <div className={`voice-waveform-modal ${state === 'listening' ? 'active' : ''} ${state === 'speaking' ? 'speaking' : ''}`}>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                                <div className="wave-bar"></div>
                            </div>

                            {/* Microphone Button */}
                            <button
                                className={`mic-button-modal ${state}`}
                                onClick={toggleListening}
                                disabled={state === 'processing' || state === 'speaking'}
                                aria-label={getStateLabel()}
                            >
                                <div className="mic-button-glow"></div>
                                <div className="mic-button-ring"></div>
                                <div className="mic-button-inner-modal">
                                    {state === 'processing' ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                    ) : state === 'speaking' ? (
                                        <i className="fas fa-volume-up"></i>
                                    ) : (
                                        <i className="fas fa-microphone"></i>
                                    )}
                                </div>
                                <div className="mic-ripple"></div>
                                <div className="mic-ripple delay-1"></div>
                                <div className="mic-ripple delay-2"></div>
                            </button>

                            {/* Status Label */}
                            <div className="voice-status-modal">
                                <span className={`status-dot ${state}`}></span>
                                <span className="status-label">{getStateLabel()}</span>
                            </div>

                            {/* Live Transcript */}
                            {transcript && (
                                <div className="live-transcript-modal">
                                    <i className="fas fa-quote-left"></i>
                                    <span>{transcript}</span>
                                </div>
                            )}

                            {/* Permission Notice */}
                            {micPermission === 'denied' && (
                                <div className="mic-permission-notice-modal">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span>Microphone access denied. Please enable it in your browser settings.</span>
                                </div>
                            )}

                            {/* Conversation History */}
                            {messages.length > 0 && (
                                <div className="voice-messages-modal">
                                    <div className="messages-scroll">
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`voice-message-modal ${msg.type}`}>
                                                <div className="message-avatar">
                                                    {msg.type === 'user' ? (
                                                        <i className="fas fa-user"></i>
                                                    ) : (
                                                        <i className="fas fa-robot"></i>
                                                    )}
                                                </div>
                                                <div className="message-bubble">
                                                    <p>{msg.text}</p>
                                                    <span className="message-timestamp">
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="voice-quick-actions-modal">
                                <button onClick={() => handleUserMessage("What services do you offer?")}>
                                    <i className="fas fa-concierge-bell"></i>
                                    Services
                                </button>
                                <button onClick={() => handleUserMessage("Book an appointment")}>
                                    <i className="fas fa-calendar-plus"></i>
                                    Book
                                </button>
                                <button onClick={() => handleUserMessage("Tell me about web development")}>
                                    <i className="fas fa-code"></i>
                                    Web Dev
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
