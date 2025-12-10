import React, { useState } from 'react';

type WorkflowType = 'chatbot' | 'code' | 'audio' | 'document';

interface WorkflowTab {
    id: WorkflowType;
    label: string;
    icon: string;
    description: string;
    formUrl: string;
}

const BASE_URL = 'http://207.180.235.87:5678';

const WORKFLOWS: WorkflowTab[] = [
    {
        id: 'chatbot',
        label: 'AI Chatbot',
        icon: 'fas fa-comments',
        description: 'Chat with AI models',
        formUrl: `${BASE_URL}/form/chatbot-form`
    },
    {
        id: 'code',
        label: 'Code Assistant',
        icon: 'fas fa-code',
        description: 'Generate, review & refactor code',
        formUrl: `${BASE_URL}/form/code-assistant-form`
    },
    {
        id: 'audio',
        label: 'Audio Transcription',
        icon: 'fas fa-microphone',
        description: 'Transcribe & analyze audio',
        formUrl: `${BASE_URL}/form/audio-transcription-form`
    },
    {
        id: 'document',
        label: 'Document Processor',
        icon: 'fas fa-file-alt',
        description: 'OCR & document analysis',
        formUrl: `${BASE_URL}/form/document-processor-form`
    }
];

const AIWorkflows: React.FC = () => {
    const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('chatbot');
    const [isLoading, setIsLoading] = useState(true);

    const activeTab = WORKFLOWS.find(w => w.id === activeWorkflow)!;

    return (
        <section id="ai-workflows" className="ai-workflows-section">
            <div className="container">
                <h2 className="section-title">
                    <i className="fas fa-robot"></i> AI Workflows
                </h2>
                <p className="section-description">
                    Experience the power of AI with these interactive workflows powered by my self-hosted AI stack.
                </p>

                {/* Workflow Tabs */}
                <div className="workflow-tabs">
                    {WORKFLOWS.map(workflow => (
                        <button
                            key={workflow.id}
                            className={`workflow-tab ${activeWorkflow === workflow.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveWorkflow(workflow.id);
                                setIsLoading(true);
                            }}
                        >
                            <i className={workflow.icon}></i>
                            <span className="tab-label">{workflow.label}</span>
                        </button>
                    ))}
                </div>

                {/* Workflow Content - Iframe */}
                <div className="workflow-iframe-container">
                    <div className="workflow-header">
                        <i className={activeTab.icon}></i>
                        <div>
                            <h3>{activeTab.label}</h3>
                            <p>{activeTab.description}</p>
                        </div>
                        <a
                            href={activeTab.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="open-external"
                            title="Open in new tab"
                        >
                            <i className="fas fa-external-link-alt"></i>
                        </a>
                    </div>

                    {isLoading && (
                        <div className="iframe-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading {activeTab.label}...</p>
                        </div>
                    )}

                    <iframe
                        key={activeWorkflow}
                        src={activeTab.formUrl}
                        title={activeTab.label}
                        className="workflow-iframe"
                        onLoad={() => setIsLoading(false)}
                        style={{ display: isLoading ? 'none' : 'block' }}
                    />
                </div>
            </div>
        </section>
    );
};

export default AIWorkflows;
