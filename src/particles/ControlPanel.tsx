import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { ParticleConfig, ShapeType } from '../types';
import { Settings2, Sparkles, Play, Pause, Palette } from 'lucide-react';

interface ControlPanelProps {
    config: ParticleConfig;
    setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isAutoMode, setIsAutoMode] = useState(true);
    const [isRandomColor, setIsRandomColor] = useState(false);

    const shapes: ShapeType[] = [
        'sphere', 'cube', 'diamond', 'torus', 'spiral', 'grid',
        'galaxy', 'solar_system', 'comet', 'ocean', 'tree', 'bear',
        'car', 'heart', 'dna',
        'dollar', 'euro', 'bitcoin', 'yen', 'text'
    ];

    // Auto Mode Logic (Shapes)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAutoMode) {
            interval = setInterval(() => {
                setConfig(prev => {
                    const autoShapes = shapes.filter(s => s !== 'text');
                    const currentIndex = autoShapes.indexOf(prev.shape as ShapeType);
                    const nextIndex = (currentIndex + 1) % autoShapes.length;
                    return { ...prev, shape: autoShapes[nextIndex] };
                });
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isAutoMode, setConfig]);

    // Random Color Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRandomColor) {
            interval = setInterval(() => {
                setConfig(prev => {
                    const color = new THREE.Color(prev.color);
                    const hsl = { h: 0, s: 0, l: 0 };
                    color.getHSL(hsl);
                    hsl.h = (hsl.h + 0.05) % 1.0;
                    if (hsl.s === 0) hsl.s = 0.8;
                    if (hsl.l === 0 || hsl.l === 1) hsl.l = 0.5;
                    color.setHSL(hsl.h, hsl.s, hsl.l);
                    return { ...prev, color: '#' + color.getHexString() };
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isRandomColor, setConfig]);

    return (
        <div className={`control-panel ${isOpen ? 'open' : 'closed'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="panel-toggle"
            >
                <Settings2 size={20} />
            </button>

            <div className="panel-content">
                <h2 className="panel-title">
                    <Sparkles size={20} /> Nebula Control
                </h2>

                <div className="control-section">
                    {/* Auto Mode Toggle */}
                    <div className="control-row">
                        <span>Auto Shape (10s)</span>
                        <button
                            onClick={() => setIsAutoMode(!isAutoMode)}
                            className={`toggle-btn ${isAutoMode ? 'active' : ''}`}
                        >
                            {isAutoMode ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                    </div>

                    {/* Random Colors */}
                    <div className="control-row">
                        <div className="control-label">
                            <Palette size={16} />
                            <span>Random Colors (5s)</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isRandomColor}
                                onChange={(e) => setIsRandomColor(e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {/* Shapes */}
                    <div className="control-group">
                        <label>Shape ({shapes.length})</label>
                        <div className="shape-grid">
                            {shapes.map(s => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setConfig(p => ({ ...p, shape: s }));
                                        setIsAutoMode(false);
                                    }}
                                    className={`shape-btn ${config.shape === s ? 'active' : ''}`}
                                    title={s}
                                >
                                    {s === 'text' ? 'TEXT' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Input */}
                    {config.shape === 'text' && (
                        <div className="control-group text-input-group">
                            <label>Enter Text</label>
                            <input
                                type="text"
                                value={config.text || ''}
                                onChange={(e) => setConfig(p => ({ ...p, text: e.target.value.toUpperCase() }))}
                                maxLength={10}
                                placeholder="TYPE HERE..."
                                className="text-input"
                            />
                        </div>
                    )}

                    {/* Color */}
                    <div className="control-group">
                        <label>Color <span className="value">{config.color}</span></label>
                        <input
                            type="color"
                            value={config.color}
                            onChange={(e) => {
                                setConfig(p => ({ ...p, color: e.target.value }));
                                setIsRandomColor(false);
                            }}
                            className="color-picker"
                        />
                    </div>

                    {/* Sliders */}
                    <div className="control-group">
                        <label>Count <span className="value">{config.particleCount}</span></label>
                        <input
                            type="range"
                            min="1000"
                            max="20000"
                            step="1000"
                            value={config.particleCount}
                            onChange={(e) => setConfig(p => ({ ...p, particleCount: Number(e.target.value) }))}
                            className="slider-input"
                        />
                    </div>

                    <div className="control-group">
                        <label>Speed <span className="value">{config.speed.toFixed(1)}</span></label>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={config.speed}
                            onChange={(e) => setConfig(p => ({ ...p, speed: Number(e.target.value) }))}
                            className="slider-input"
                        />
                    </div>

                    <div className="control-group">
                        <label>Noise / Chaos <span className="value">{config.noiseStrength.toFixed(1)}</span></label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={config.noiseStrength}
                            onChange={(e) => setConfig(p => ({ ...p, noiseStrength: Number(e.target.value) }))}
                            className="slider-input"
                        />
                    </div>

                    <div className="control-group">
                        <label>Size <span className="value">{config.size.toFixed(2)}</span></label>
                        <input
                            type="range"
                            min="0.01"
                            max="0.2"
                            step="0.01"
                            value={config.size}
                            onChange={(e) => setConfig(p => ({ ...p, size: Number(e.target.value) }))}
                            className="slider-input"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
