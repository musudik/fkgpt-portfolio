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

const VoiceAssistant: React.FC = () => {
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
                // Restart if still supposed to be listening
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

        // Check microphone permission
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then(result => {
                    setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                    result.onchange = () => {
                        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
                    };
                })
                .catch(() => {
                    // Permission API not supported
                });
        }

        return () => {
            recognition.abort();
        };
    }, []);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUserMessage = useCallback(async (text: string) => {
        const userMessage: Message = {
            id: ++messageIdRef.current,
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages((prev: Message[]) => [...prev, userMessage]);
        setState('processing');

        // Stop listening while processing
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

            // Parse the response - handle cases where n8n returns raw template or actual output
            let assistantText = '';
            if (data.status) {
                // Check if it's a raw n8n template (workflow not properly processing)
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

            // Speak the response
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

        // Cancel any ongoing speech
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
            case 'idle': return 'Click to speak';
            case 'listening': return 'Listening...';
            case 'processing': return 'Processing...';
            case 'speaking': return 'Speaking...';
            case 'error': return 'Error occurred';
            default: return 'Ready';
        }
    };

    if (!isSupported) {
        return (
            <section id="voice-assistant" className="voice-assistant-section">
                <div className="container">
                    <h2 className="section-title">
                        <i className="fas fa-microphone-alt"></i> AI Voice Assistant
                    </h2>
                    <div className="voice-not-supported">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="voice-assistant" className="voice-assistant-section">
            <div className="container">
                <h2 className="section-title">
                    <i className="fas fa-microphone-alt"></i> AI Voice Assistant
                </h2>
                <p className="section-description">
                    Talk with our AI assistant using voice commands. Book appointments, ask questions, or get information about our services.
                </p>

                <div className="voice-assistant-container">
                    {/* Waveform Visualization */}
                    <div className={`voice-waveform ${state === 'listening' ? 'active' : ''} ${state === 'speaking' ? 'speaking' : ''}`}>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                    </div>

                    {/* Microphone Button */}
                    <button
                        className={`mic-button ${state}`}
                        onClick={toggleListening}
                        disabled={state === 'processing' || state === 'speaking'}
                        aria-label={getStateLabel()}
                    >
                        <div className="mic-button-inner">
                            {state === 'processing' ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : state === 'speaking' ? (
                                <i className="fas fa-volume-up"></i>
                            ) : (
                                <i className="fas fa-microphone"></i>
                            )}
                        </div>
                        <div className="mic-pulse"></div>
                        <div className="mic-pulse delay"></div>
                    </button>

                    {/* Status Label */}
                    <div className="voice-status">
                        <span className={`status-indicator ${state}`}></span>
                        <span className="status-text">{getStateLabel()}</span>
                    </div>

                    {/* Live Transcript (while listening) */}
                    {transcript && (
                        <div className="live-transcript">
                            <i className="fas fa-quote-left"></i>
                            {transcript}
                        </div>
                    )}

                    {/* Permission Notice */}
                    {micPermission === 'denied' && (
                        <div className="mic-permission-notice">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>Microphone access denied. Please enable it in your browser settings.</span>
                        </div>
                    )}

                    {/* Conversation History */}
                    {messages.length > 0 && (
                        <div className="voice-messages">
                            <h4>Conversation</h4>
                            <div className="messages-container">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`voice-message ${msg.type}`}>
                                        <div className="message-icon">
                                            {msg.type === 'user' ? (
                                                <i className="fas fa-user"></i>
                                            ) : (
                                                <i className="fas fa-robot"></i>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            <p>{msg.text}</p>
                                            <span className="message-time">
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
                    <div className="voice-quick-actions">
                        <span className="quick-action-label">Try saying:</span>
                        <div className="quick-actions-list">
                            <button onClick={() => handleUserMessage("What services do you offer?")}>
                                "What services do you offer?"
                            </button>
                            <button onClick={() => handleUserMessage("Book an appointment")}>
                                "Book an appointment"
                            </button>
                            <button onClick={() => handleUserMessage("Tell me about web development")}>
                                "Tell me about web development"
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VoiceAssistant;
