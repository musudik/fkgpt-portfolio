import React, { useState, useRef } from 'react';

interface DocumentProcessorFormProps {
    onResponse: (response: string, isLoading: boolean, error?: string) => void;
}

const OCR_ENGINES = [
    { value: 'tesseract', label: 'Tesseract (Fast)' },
    { value: 'easyocr', label: 'EasyOCR (Accurate)' },
    { value: 'both', label: 'Both Engines' }
];

const ANALYSIS_TASKS = [
    'Full Analysis (Summary + Key Info + Type)',
    'Text Extraction Only',
    'Data Extraction (Tables, Numbers)',
    'Invoice/Receipt Processing',
    'Business Card Parsing',
    'Form Field Extraction'
];

const MODELS = ['llama3.2:3b', 'llama3.2:1b', 'llama3.1:8b', 'qwen2.5:7b', 'qwen2.5-coder:7b', 'mistral:7b', 'gemma2:9b'];

const DocumentProcessorForm: React.FC<DocumentProcessorFormProps> = ({ onResponse }) => {
    const [file, setFile] = useState<File | null>(null);
    const [ocrEngine, setOcrEngine] = useState('tesseract');
    const [analysisTask, setAnalysisTask] = useState(ANALYSIS_TASKS[0]);
    const [model, setModel] = useState('llama3.2:3b');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsSubmitting(true);
        onResponse('', true);

        try {
            const formData = new FormData();
            formData.append('data', file);
            formData.append('ocrEngine', ocrEngine);
            formData.append('analysisTask', analysisTask);
            formData.append('model', model);

            const response = await fetch('/api/n8n/process-document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const result = data.ocr_text
                ? `## Extracted Text (OCR)\n\n\`\`\`\n${data.ocr_text}\n\`\`\`\n\n## AI Analysis\n\n${data.analysis || 'No analysis available'}`
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
        if (selectedFile) {
            setFile(selectedFile);
            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview(e.target?.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    return (
        <form className="workflow-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Document File *</label>
                <div
                    className={`file-upload-area ${file ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.pdf,.webp"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        hidden
                    />
                    {file ? (
                        <div className="file-info">
                            {preview ? (
                                <img src={preview} alt="Preview" className="file-preview" />
                            ) : (
                                <i className="fas fa-file-pdf"></i>
                            )}
                            <span>{file.name}</span>
                            <small>({(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <i className="fas fa-file-image"></i>
                            <span>Click to upload document</span>
                            <small>JPG, PNG, PDF, TIFF, WebP</small>
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="doc-ocr">OCR Engine</label>
                    <select
                        id="doc-ocr"
                        value={ocrEngine}
                        onChange={(e) => setOcrEngine(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {OCR_ENGINES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="doc-model">AI Model</label>
                    <select
                        id="doc-model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="doc-task">Analysis Task</label>
                <select
                    id="doc-task"
                    value={analysisTask}
                    onChange={(e) => setAnalysisTask(e.target.value)}
                    disabled={isSubmitting}
                >
                    {ANALYSIS_TASKS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting || !file}>
                {isSubmitting ? (
                    <>
                        <span className="spinner"></span>
                        Processing...
                    </>
                ) : (
                    <>
                        <i className="fas fa-file-alt"></i>
                        Process Document
                    </>
                )}
            </button>
        </form>
    );
};

export default DocumentProcessorForm;
