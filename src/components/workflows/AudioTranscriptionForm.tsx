import React, { useState, useRef } from 'react';

interface AudioTranscriptionFormProps {
    onResponse: (response: string, isLoading: boolean, error?: string) => void;
}

const ANALYSIS_TYPES = [
    'Full Analysis (Summary + Topics + Action Items)',
    'Transcription Only',
    'Summary Only',
    'Meeting Notes',
    'Key Points Extraction'
];

const MODELS = ['llama3.2:3b', 'llama3.2:1b', 'llama3.1:8b', 'qwen2.5:7b', 'mistral:7b', 'gemma2:9b'];

const AudioTranscriptionForm: React.FC<AudioTranscriptionFormProps> = ({ onResponse }) => {
    const [file, setFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState(ANALYSIS_TYPES[0]);
    const [model, setModel] = useState('llama3.2:3b');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsSubmitting(true);
        onResponse('', true);

        try {
            const formData = new FormData();
            formData.append('data', file);
            formData.append('analysisType', analysisType);
            formData.append('model', model);

            const response = await fetch('/api/n8n/transcribe-audio', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const result = data.transcript
                ? `## Transcript\n\n${data.transcript}\n\n## Analysis\n\n${data.analysis || 'No analysis available'}`
                : JSON.stringify(data, null, 2);
            onResponse(result, false);
        } catch (err) {
            onResponse('', false, err instanceof Error ? err.message : 'Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    return (
        <form className="workflow-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Audio File *</label>
                <div
                    className={`file-upload-area ${file ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.m4a,.ogg,.flac,.webm"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        hidden
                    />
                    {file ? (
                        <div className="file-info">
                            <i className="fas fa-file-audio"></i>
                            <span>{file.name}</span>
                            <small>({(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <i className="fas fa-cloud-upload-alt"></i>
                            <span>Click to upload audio file</span>
                            <small>MP3, WAV, M4A, OGG, FLAC, WebM</small>
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="audio-analysis">Analysis Type</label>
                    <select
                        id="audio-analysis"
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {ANALYSIS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="audio-model">AI Model</label>
                    <select
                        id="audio-model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-note">
                <i className="fas fa-info-circle"></i>
                Audio processing may take a few minutes depending on file size.
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting || !file}>
                {isSubmitting ? (
                    <>
                        <span className="spinner"></span>
                        Transcribing...
                    </>
                ) : (
                    <>
                        <i className="fas fa-microphone"></i>
                        Transcribe Audio
                    </>
                )}
            </button>
        </form>
    );
};

export default AudioTranscriptionForm;
