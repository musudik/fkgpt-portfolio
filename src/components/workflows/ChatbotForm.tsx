import React, { useState } from 'react';

interface ChatbotFormProps {
    onResponse: (response: string, isLoading: boolean, error?: string) => void;
}

const MODELS = [
    'llama3.2:3b', 'llama3.2:1b', 'llama3.1:8b', 'llama3.1:70b',
    'qwen2.5-coder:7b', 'qwen2.5-coder:14b', 'qwen2.5:7b', 'qwen2.5:14b',
    'mistral:7b', 'mixtral:8x7b', 'codellama:7b', 'codellama:13b',
    'deepseek-coder:6.7b', 'phi3:mini', 'gemma2:9b', 'gemma2:27b'
];

const ChatbotForm: React.FC<ChatbotFormProps> = ({ onResponse }) => {
    const [model, setModel] = useState('llama3.2:3b');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        onResponse('', true);

        try {
            const response = await fetch('/api/n8n/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    system_prompt: systemPrompt || 'You are a helpful AI assistant.',
                    model
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content ||
                data.reply ||
                JSON.stringify(data);
            onResponse(reply, false);
        } catch (err) {
            onResponse('', false, err instanceof Error ? err.message : 'Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="workflow-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="chatbot-model">AI Model</label>
                <select
                    id="chatbot-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isSubmitting}
                >
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="chatbot-system">System Prompt (optional)</label>
                <textarea
                    id="chatbot-system"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Define the AI's personality or role..."
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-group">
                <label htmlFor="chatbot-message">Your Message *</label>
                <textarea
                    id="chatbot-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={5}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting || !message.trim()}>
                {isSubmitting ? (
                    <>
                        <span className="spinner"></span>
                        Processing...
                    </>
                ) : (
                    <>
                        <i className="fas fa-paper-plane"></i>
                        Send Message
                    </>
                )}
            </button>
        </form>
    );
};

export default ChatbotForm;
