import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleConfig, ShapeType } from '../types';

// --- Text Sampling Utility ---
const sampleTextParticles = (text: string, fontSize: number = 100): THREE.Vector3[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const estimatedWidth = text.length * fontSize;
    canvas.width = estimatedWidth;
    canvas.height = fontSize * 1.5;

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points: THREE.Vector3[] = [];

    const step = 2;
    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 128) {
                const px = (x - canvas.width / 2) * 0.100;
                const py = -(y - canvas.height / 2) * 0.100;
                points.push(new THREE.Vector3(px, py, 0));
            }
        }
    }
    return points;
};

// --- Shape Generation Logic ---
const getTargetPosition = (
    i: number,
    count: number,
    shape: ShapeType,
    sampledPoints: THREE.Vector3[] = []
): THREE.Vector3 => {
    const vec = new THREE.Vector3();
    const n = i / count;

    if (['text', 'dollar', 'euro', 'bitcoin', 'yen'].includes(shape)) {
        if (sampledPoints.length > 0) {
            const pIndex = i % sampledPoints.length;
            const p = sampledPoints[pIndex];
            vec.copy(p);
            vec.z += (Math.random() - 0.5) * 0.5;
        } else {
            vec.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0);
        }
        return vec;
    }

    switch (shape) {
        case 'cube': {
            vec.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            );
            break;
        }
        case 'diamond': {
            const size = 3.5;
            let x = (Math.random() - 0.5) * 2;
            let z = (Math.random() - 0.5) * 2;
            let remaining = 1 - (Math.abs(x) + Math.abs(z));

            if (remaining < 0) {
                x *= 0.5; z *= 0.5;
                remaining = 1 - (Math.abs(x) + Math.abs(z));
            }

            const ySign = Math.random() > 0.5 ? 1 : -1;
            const y = remaining * ySign;

            vec.set(x * size, y * size, z * size);
            if (Math.random() > 0.8) vec.multiplyScalar(Math.random());
            break;
        }
        case 'torus': {
            const angle = n * Math.PI * 2 * 50;
            const radius = 3;
            const tube = 1;
            const tubeAngle = n * Math.PI * 2;

            const x = (radius + tube * Math.cos(tubeAngle)) * Math.cos(angle);
            const y = (radius + tube * Math.cos(tubeAngle)) * Math.sin(angle);
            const z = tube * Math.sin(tubeAngle);
            vec.set(x, y, z);
            break;
        }
        case 'spiral': {
            const angle = n * Math.PI * 20;
            const radius = n * 4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (n - 0.5) * 6;
            vec.set(x, y, z);
            break;
        }
        case 'grid': {
            const spacing = 0.5;
            const perRow = Math.ceil(Math.pow(count, 1 / 3));
            const x = (i % perRow) * spacing - (perRow * spacing) / 2;
            const y = (Math.floor(i / perRow) % perRow) * spacing - (perRow * spacing) / 2;
            const z = Math.floor(i / (perRow * perRow)) * spacing - (perRow * spacing) / 2;
            vec.set(x, y, z);
            break;
        }
        case 'galaxy': {
            const arms = 5;
            const armAngle = (i % arms) * ((Math.PI * 2) / arms);
            const distance = Math.pow(Math.random(), 2) * 5;
            const spin = distance * 2;
            const angle = armAngle + spin;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            const y = (Math.random() - 0.5) * (6 / (distance + 0.1));
            vec.set(x, y, z);
            break;
        }
        case 'heart': {
            const t = n * Math.PI * 2 * 10;
            const scale = 0.15;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = (Math.random() - 0.5) * 4 * Math.sin(t);
            vec.set(x * scale, y * scale, z * scale);
            break;
        }
        case 'dna': {
            const helixLen = 8;
            const t = (n * 20) % (Math.PI * 4);
            const y = (n * helixLen) - helixLen / 2;
            const radius = 1.5;
            const strand = i % 2 === 0 ? 0 : Math.PI;
            const x = Math.sin(y + strand) * radius;
            const z = Math.cos(y + strand) * radius;
            if (Math.random() > 0.8) {
                const rungT = Math.random();
                vec.set(
                    (Math.sin(y) * radius) * (1 - rungT) + (Math.sin(y + Math.PI) * radius) * rungT,
                    y,
                    (Math.cos(y) * radius) * (1 - rungT) + (Math.cos(y + Math.PI) * radius) * rungT
                );
            } else {
                vec.set(x, y, z);
            }
            break;
        }
        case 'car': {
            const r = Math.random();
            if (r < 0.15) {
                const w = i % 4;
                const wx = w < 2 ? -1.5 : 1.5;
                const wz = w % 2 === 0 ? -1.5 : 1.5;
                const wy = -0.5;
                const angle = Math.random() * Math.PI * 2;
                vec.set(
                    wx + Math.cos(angle) * 0.4,
                    wy + Math.sin(angle) * 0.4,
                    wz + (Math.random() - 0.5) * 0.3
                );
            } else if (r < 0.5) {
                vec.set(
                    (Math.random() - 0.5) * 2.5,
                    0.5 + Math.random() * 1.0,
                    (Math.random() - 0.5) * 2.0
                );
            } else {
                vec.set(
                    (Math.random() - 0.5) * 4.5,
                    -0.5 + Math.random() * 1.0,
                    (Math.random() - 0.5) * 3.5
                );
            }
            break;
        }
        case 'bear': {
            const r = Math.random();
            if (r < 0.4) {
                vec.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2);
            } else if (r < 0.6) {
                vec.set((Math.random() - 0.5) * 1.2, 1.8 + (Math.random() - 0.5) * 1.0, 0.5 + (Math.random() - 0.5) * 1.2);
            } else {
                const leg = i % 4;
                const lx = leg < 2 ? -0.8 : 0.8;
                const lz = leg % 2 === 0 ? -0.8 : 0.8;
                vec.set(lx + (Math.random() - 0.5) * 0.6, -1.5 + (Math.random() - 0.5) * 1.5, lz + (Math.random() - 0.5) * 0.6);
            }
            break;
        }
        case 'solar_system': {
            const r = Math.random();
            if (r < 0.4) {
                const phi = Math.acos(-1 + (2 * Math.random()));
                const theta = Math.sqrt(count * Math.PI) * phi;
                vec.setFromSphericalCoords(1.5, phi, theta);
            } else {
                const dist = 2 + Math.random() * 6;
                const angle = Math.random() * Math.PI * 2;
                vec.set(
                    Math.cos(angle) * dist,
                    (Math.random() - 0.5) * 0.2,
                    Math.sin(angle) * dist
                );
            }
            break;
        }
        case 'comet': {
            const r = Math.random();
            if (r < 0.2) {
                const phi = Math.acos(-1 + (2 * Math.random()));
                const theta = Math.sqrt(count * Math.PI) * phi;
                vec.setFromSphericalCoords(0.8, phi, theta);
                vec.add(new THREE.Vector3(3, 2, 0));
            } else {
                const t = Math.random();
                const len = 10;
                const spread = t * 1.5;
                vec.set(
                    3 - t * len * 0.8 + (Math.random() - 0.5) * spread,
                    2 - t * len * 0.5 + (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread
                );
            }
            break;
        }
        case 'ocean': {
            const size = 10;
            const side = Math.sqrt(count);
            const x = (i % side) / side * size - size / 2;
            const z = Math.floor(i / side) / side * size - size / 2;
            const y = Math.sin(x) * Math.cos(z * 0.8) * 1.0 + Math.sin(z * 2) * 0.2;
            vec.set(x, y - 2, z);
            break;
        }
        case 'tree': {
            const r = Math.random();
            if (r < 0.2) {
                vec.set(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 3 - 1,
                    (Math.random() - 0.5) * 0.6
                );
            } else {
                const phi = Math.acos(-1 + (2 * Math.random()));
                const theta = Math.random() * Math.PI * 2;
                const rad = Math.pow(Math.random(), 1 / 3) * 2.5;
                vec.setFromSphericalCoords(rad, phi, theta);
                vec.y += 1.5;
                vec.x *= 0.8; vec.z *= 0.8;
            }
            break;
        }
        case 'sphere':
        default: {
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            const r = 3.5;
            vec.setFromSphericalCoords(r, phi, theta);
            break;
        }
    }
    return vec;
};

interface ParticlesProps {
    config: ParticleConfig;
}

const Particles: React.FC<ParticlesProps> = ({ config }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const { particleCount, color, shape, speed, noiseStrength, size, text } = config;

    const { positions, targets, randoms } = useMemo(() => {
        const pos = new Float32Array(20000 * 3);
        const tar = new Float32Array(20000 * 3);
        const rnd = new Float32Array(20000 * 3);

        for (let i = 0; i < 20000; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;

            rnd[i * 3] = Math.random();
            rnd[i * 3 + 1] = Math.random();
            rnd[i * 3 + 2] = Math.random();
        }
        return { positions: pos, targets: tar, randoms: rnd };
    }, []);

    useEffect(() => {
        let sampledPoints: THREE.Vector3[] = [];

        if (shape === 'text' && text) {
            sampledPoints = sampleTextParticles(text);
        } else if (shape === 'dollar') {
            sampledPoints = sampleTextParticles('$');
        } else if (shape === 'euro') {
            sampledPoints = sampleTextParticles('€');
        } else if (shape === 'bitcoin') {
            sampledPoints = sampleTextParticles('₿');
        } else if (shape === 'yen') {
            sampledPoints = sampleTextParticles('¥');
        }

        if (sampledPoints.length > 0) {
            sampledPoints.sort(() => Math.random() - 0.5);
        }

        for (let i = 0; i < particleCount; i++) {
            const vec = getTargetPosition(i, particleCount, shape, sampledPoints);
            targets[i * 3] = vec.x;
            targets[i * 3 + 1] = vec.y;
            targets[i * 3 + 2] = vec.z;
        }
    }, [shape, particleCount, targets, text]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const geometry = pointsRef.current.geometry;
        const positionAttribute = geometry.attributes.position;
        const time = state.clock.getElapsedTime();

        for (let i = 0; i < particleCount; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            let px = positionAttribute.array[ix] as number;
            let py = positionAttribute.array[iy] as number;
            let pz = positionAttribute.array[iz] as number;

            const tx = targets[ix];
            const ty = targets[iy];
            const tz = targets[iz];

            const noiseX = Math.sin(time * speed + randoms[iy] * 10) * noiseStrength * 0.02;
            const noiseY = Math.cos(time * speed * 0.8 + randoms[ix] * 10) * noiseStrength * 0.02;
            const noiseZ = Math.sin(time * speed * 0.5 + randoms[ix] * 5) * noiseStrength * 0.02;

            const lerpFactor = 0.02 + (speed * 0.01);

            px += (tx - px) * lerpFactor + noiseX;
            py += (ty - py) * lerpFactor + noiseY;
            pz += (tz - pz) * lerpFactor + noiseZ;

            positionAttribute.setXYZ(i, px, py, pz);
        }

        positionAttribute.needsUpdate = true;
        pointsRef.current.rotation.y += 0.001 * speed;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={size}
                color={color}
                sizeAttenuation={true}
                transparent={true}
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
};

interface ParticleSceneProps {
    config: ParticleConfig;
}

const ParticleScene: React.FC<ParticleSceneProps> = ({ config }) => {
    return (
        <div className="particle-scene">
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
                <ambientLight intensity={0.5} />
                <Particles config={config} />
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    rotateSpeed={0.5}
                    zoomSpeed={0.5}
                    autoRotate={false}
                />
            </Canvas>
            <div className="particle-info">
                {config.particleCount} PARTICLES // {config.shape.toUpperCase()} {config.shape === 'text' ? `(${config.text})` : ''} // SPEED {config.speed.toFixed(1)}
            </div>
        </div>
    );
};

export default ParticleScene;
