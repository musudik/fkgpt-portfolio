import React, { useState } from 'react';

interface CodeAssistantFormProps {
    onResponse: (response: string, isLoading: boolean, error?: string) => void;
}

const ACTIONS = [
    { value: 'generate', label: 'Generate Code' },
    { value: 'review', label: 'Review Code' },
    { value: 'explain', label: 'Explain Code' },
    { value: 'refactor', label: 'Refactor Code' },
    { value: 'fix', label: 'Fix/Debug Code' },
    { value: 'test', label: 'Generate Tests' }
];

const LANGUAGES = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Java', 'C#', 'Go', 'Rust',
    'PHP', 'Ruby', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Terraform', 'Bash/Shell', 'Other'
];

const CodeAssistantForm: React.FC<CodeAssistantFormProps> = ({ onResponse }) => {
    const [action, setAction] = useState('generate');
    const [language, setLanguage] = useState('Python');
    const [description, setDescription] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);
        onResponse('', true);

        try {
            const response = await fetch('/api/n8n/code-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    language,
                    description,
                    code: code || undefined
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const result = data.choices?.[0]?.message?.content ||
                data.result ||
                JSON.stringify(data);
            onResponse(result, false);
        } catch (err) {
            onResponse('', false, err instanceof Error ? err.message : 'Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const needsCode = action !== 'generate';

    return (
        <form className="workflow-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="code-action">Action</label>
                    <select
                        id="code-action"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="code-language">Language</label>
                    <select
                        id="code-language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="code-description">
                    {action === 'generate' ? 'What do you want to generate?' : 'Description / Context'} *
                </label>
                <textarea
                    id="code-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={action === 'generate'
                        ? 'Describe the code you want to generate...'
                        : 'Provide context about what you need...'}
                    rows={4}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-group">
                <label htmlFor="code-input">
                    Code {needsCode ? '*' : '(optional)'}
                </label>
                <textarea
                    id="code-input"
                    className="code-textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={8}
                    required={needsCode}
                    disabled={isSubmitting}
                />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting || !description.trim()}>
                {isSubmitting ? (
                    <>
                        <span className="spinner"></span>
                        Processing...
                    </>
                ) : (
                    <>
                        <i className="fas fa-code"></i>
                        {ACTIONS.find(a => a.value === action)?.label}
                    </>
                )}
            </button>
        </form>
    );
};

export default CodeAssistantForm;
