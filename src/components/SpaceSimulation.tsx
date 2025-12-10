import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import './SpaceSimulation.css';

// ============================================
// REAL SCIENTIFIC DATA - 3I/ATLAS COMET
// Source: NASA/JPL, ESA observations
// ============================================

const ATLAS_ORBITAL_ELEMENTS = {
    // Epoch: MJD 60977.5 (October 29, 2025 TDB)
    semiMajorAxis: -0.26391591751781, // AU (negative = hyperbolic)
    eccentricity: 6.139,              // Hyperbolic orbit
    perihelionDistance: 1.35,          // AU (~203 million km)
    argumentOfPerihelion: 128.01,      // degrees (ω)
    longitudeOfAscendingNode: 322.16,  // degrees (Ω)
    inclination: 175.0,                // degrees (retrograde, near ecliptic)
    perihelionDate: new Date('2025-10-29T12:00:00Z'),
    hyperbolicExcessVelocity: 60,      // km/s (v∞)
    maxVelocityAtPerihelion: 68,       // km/s
    nucleusDiameterMin: 0.44,          // km
    nucleusDiameterMax: 5.6,           // km
    discoveryDate: new Date('2025-07-01'),
    discoveredBy: 'ATLAS (Rio Hurtado, Chile)'
};

// Planet orbital data (real values from NASA/JPL) - Enhanced colors and sizes for visibility
const PLANETS = [
    { name: 'Mercury', semiMajorAxis: 0.387, eccentricity: 0.206, period: 88, color: '#A0826D', size: 0.08, orbitalInclination: 7.0 },
    { name: 'Venus', semiMajorAxis: 0.723, eccentricity: 0.007, period: 225, color: '#E7CDAB', size: 0.12, orbitalInclination: 3.4 },
    { name: 'Earth', semiMajorAxis: 1.000, eccentricity: 0.017, period: 365.25, color: '#4F94CD', size: 0.12, orbitalInclination: 0 },
    { name: 'Mars', semiMajorAxis: 1.524, eccentricity: 0.093, period: 687, color: '#CD5C5C', size: 0.10, orbitalInclination: 1.9 },
    { name: 'Jupiter', semiMajorAxis: 5.203, eccentricity: 0.049, period: 4333, color: '#D4A574', size: 0.40, orbitalInclination: 1.3 }
];

// Key events timeline for 3I/ATLAS (real NASA/JPL data)
const KEY_EVENTS = [
    {
        name: 'Discovery',
        date: new Date('2025-07-01'),
        daysFromStart: 0,
        description: 'First observation by ATLAS survey',
        icon: '🔭'
    },
    {
        name: 'Mars Closest',
        date: new Date('2025-10-03'),
        daysFromStart: 94,
        description: 'Closest approach to Mars',
        distance: '0.194 AU (29M km)',
        planet: 'Mars',
        icon: '🔴'
    },
    {
        name: 'Solar Conjunction',
        date: new Date('2025-10-21'),
        daysFromStart: 112,
        description: 'Hidden behind the Sun from Earth',
        icon: '☀️'
    },
    {
        name: 'Perihelion',
        date: new Date('2025-10-29'),
        daysFromStart: 120,
        description: 'Closest approach to Sun',
        distance: '1.35 AU (203M km)',
        icon: '🌟'
    },
    {
        name: 'Earth Closest',
        date: new Date('2025-12-19'),
        daysFromStart: 171,
        description: 'Closest approach to Earth',
        distance: '1.8 AU (270M km)',
        planet: 'Earth',
        icon: '🌍'
    },
    {
        name: 'Jupiter Closest',
        date: new Date('2026-03-15'),
        daysFromStart: 257,
        description: 'Closest approach to Jupiter',
        distance: '~4.5 AU',
        planet: 'Jupiter',
        icon: '🟤'
    }
];

// Astronomical constants
const AU_SCALE = 2; // 1 AU = 2 units in 3D space
const DEG_TO_RAD = Math.PI / 180;

// ============================================
// ORBITAL MECHANICS FUNCTIONS
// ============================================

// Solve Kepler's equation for elliptical orbits (Newton-Raphson)
function solveKeplerEllipse(M: number, e: number, tol: number = 1e-8): number {
    let E = M;
    for (let i = 0; i < 100; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < tol) break;
    }
    return E;
}

// Solve Kepler's equation for hyperbolic orbits
function solveKeplerHyperbola(M: number, e: number, tol: number = 1e-8): number {
    let H = M;
    for (let i = 0; i < 100; i++) {
        const dH = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
        H -= dH;
        if (Math.abs(dH) < tol) break;
    }
    return H;
}

// Calculate true anomaly from eccentric/hyperbolic anomaly
function trueAnomalyFromE(E: number, e: number): number {
    if (e < 1) {
        // Elliptical orbit
        return 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );
    } else {
        // Hyperbolic orbit
        return 2 * Math.atan2(
            Math.sqrt(e + 1) * Math.sinh(E / 2),
            Math.sqrt(e - 1) * Math.cosh(E / 2)
        );
    }
}

// Calculate position from orbital elements
function calculateOrbitalPosition(
    semiMajorAxis: number,
    eccentricity: number,
    trueAnomaly: number,
    argOfPerihelion: number,
    longOfAscNode: number,
    inclination: number
): THREE.Vector3 {
    // Distance from focus
    const a = Math.abs(semiMajorAxis);
    let r: number;
    if (eccentricity < 1) {
        r = a * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
    } else {
        r = a * (eccentricity * eccentricity - 1) / (1 + eccentricity * Math.cos(trueAnomaly));
    }

    // Position in orbital plane
    const xOrbital = r * Math.cos(trueAnomaly);
    const yOrbital = r * Math.sin(trueAnomaly);

    // Convert angles to radians
    const omega = argOfPerihelion * DEG_TO_RAD;
    const Omega = longOfAscNode * DEG_TO_RAD;
    const i = inclination * DEG_TO_RAD;

    // Transform to heliocentric coordinates
    const cosOmega = Math.cos(Omega);
    const sinOmega = Math.sin(Omega);
    const cosomega = Math.cos(omega);
    const sinomega = Math.sin(omega);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);

    const x = (cosOmega * cosomega - sinOmega * sinomega * cosi) * xOrbital +
        (-cosOmega * sinomega - sinOmega * cosomega * cosi) * yOrbital;
    const y = (sinOmega * cosomega + cosOmega * sinomega * cosi) * xOrbital +
        (-sinOmega * sinomega + cosOmega * cosomega * cosi) * yOrbital;
    const z = (sinomega * sini) * xOrbital + (cosomega * sini) * yOrbital;

    return new THREE.Vector3(x * AU_SCALE, z * AU_SCALE, y * AU_SCALE);
}

// ============================================
// 3D COMPONENTS
// ============================================

// Sun component with glow effect
const Sun: React.FC = () => {
    const sunRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (glowRef.current) {
            glowRef.current.rotation.y += 0.001;
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            glowRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group>
            {/* Sun core */}
            <mesh ref={sunRef}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshBasicMaterial color="#FDB813" />
            </mesh>
            {/* Sun glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.45, 32, 32]} />
                <meshBasicMaterial color="#FF6B00" transparent opacity={0.3} />
            </mesh>
            {/* Corona effect */}
            <mesh>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0.1} />
            </mesh>
            {/* Light source */}
            <pointLight color="#FFF5E0" intensity={2} distance={50} />
        </group>
    );
};

// Planet component
interface PlanetProps {
    planet: typeof PLANETS[0];
    simulationTime: number;
    showLabels: boolean;
}

const Planet: React.FC<PlanetProps> = ({ planet, simulationTime, showLabels }) => {
    const position = useMemo(() => {
        // Mean anomaly based on time
        const n = (2 * Math.PI) / planet.period; // Mean motion (rad/day)
        const M = (n * simulationTime) % (2 * Math.PI);

        // Solve for eccentric anomaly
        const E = solveKeplerEllipse(M, planet.eccentricity);

        // True anomaly
        const nu = trueAnomalyFromE(E, planet.eccentricity);

        // Calculate 3D position
        return calculateOrbitalPosition(
            planet.semiMajorAxis,
            planet.eccentricity,
            nu,
            0, // Simple argument of perihelion for visualization
            0, // Simple longitude of ascending node
            planet.orbitalInclination
        );
    }, [planet, simulationTime]);

    return (
        <group position={position.toArray()}>
            <mesh>
                <sphereGeometry args={[planet.size, 16, 16]} />
                <meshStandardMaterial color={planet.color} />
            </mesh>
            {showLabels && (
                <Html position={[0, planet.size + 0.15, 0]} center>
                    <div className="planet-label">{planet.name}</div>
                </Html>
            )}
        </group>
    );
};

// Orbit path visualization
interface OrbitPathProps {
    semiMajorAxis: number;
    eccentricity: number;
    color: string;
    segments?: number;
}

const OrbitPath: React.FC<OrbitPathProps> = ({ semiMajorAxis, eccentricity, color, segments = 128 }) => {
    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const nu = (i / segments) * 2 * Math.PI;
            const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(nu));
            const x = r * Math.cos(nu);
            const z = r * Math.sin(nu);
            pts.push(new THREE.Vector3(x * AU_SCALE, 0, z * AU_SCALE));
        }
        return pts;
    }, [semiMajorAxis, eccentricity, segments]);

    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    return (
        <Line
            points={points}
            color={color}
            transparent
            opacity={0.3}
            lineWidth={1}
        />
    );
};

// 3I/Atlas Comet with tail
interface CometProps {
    simulationTime: number;
    showLabels: boolean;
}

const Comet: React.FC<CometProps> = ({ simulationTime, showLabels }) => {
    const tailRef = useRef<THREE.Points>(null);

    // Calculate comet position based on time from perihelion
    const { position, distanceFromSun, velocity } = useMemo(() => {
        const perihelionTime = ATLAS_ORBITAL_ELEMENTS.perihelionDate.getTime();
        const currentTime = new Date('2025-07-01').getTime() + simulationTime * 24 * 60 * 60 * 1000;
        const daysSincePerihelion = (currentTime - perihelionTime) / (24 * 60 * 60 * 1000);

        // Mean motion for hyperbolic orbit
        const a = Math.abs(ATLAS_ORBITAL_ELEMENTS.semiMajorAxis);
        const mu = 132712440041.93938; // Sun's gravitational parameter (km³/s²)
        const n = Math.sqrt(mu / (Math.pow(a * 149597870.7, 3))); // rad/s

        // Mean anomaly
        const M = n * daysSincePerihelion * 24 * 60 * 60;

        // Solve hyperbolic Kepler equation
        const H = solveKeplerHyperbola(M, ATLAS_ORBITAL_ELEMENTS.eccentricity);

        // True anomaly
        const nu = trueAnomalyFromE(H, ATLAS_ORBITAL_ELEMENTS.eccentricity);

        // Calculate position
        const pos = calculateOrbitalPosition(
            ATLAS_ORBITAL_ELEMENTS.semiMajorAxis,
            ATLAS_ORBITAL_ELEMENTS.eccentricity,
            nu,
            ATLAS_ORBITAL_ELEMENTS.argumentOfPerihelion,
            ATLAS_ORBITAL_ELEMENTS.longitudeOfAscendingNode,
            ATLAS_ORBITAL_ELEMENTS.inclination
        );

        // Distance from sun
        const r = pos.length() / AU_SCALE;

        // Velocity calculation (vis-viva equation for hyperbola)
        const v = Math.sqrt(mu * (2 / (r * 149597870.7) + 1 / (a * 149597870.7))) / 1000; // km/s

        return { position: pos, distanceFromSun: r, velocity: v };
    }, [simulationTime]);

    // Single unified tail pointing AWAY from the Sun (anti-sunward direction)
    const tailGeometry = useMemo(() => {
        const positions = new Float32Array(3000 * 3);
        // Direction pointing AWAY from Sun (anti-sunward)
        const antiSunDir = position.clone().normalize();

        for (let i = 0; i < 3000; i++) {
            // Tail extends away from the Sun
            const t = Math.pow(Math.random(), 0.4) * 4; // Tail length
            const spread = t * 0.12; // Spread increases with distance

            // Add slight curve for dust tail effect
            const curve = Math.sin(t * 0.5) * 0.15;

            positions[i * 3] = position.x + antiSunDir.x * t + (Math.random() - 0.5) * spread + curve;
            positions[i * 3 + 1] = position.y + antiSunDir.y * t + (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = position.z + antiSunDir.z * t + (Math.random() - 0.5) * spread;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geom;
    }, [position]);

    // Slight shimmer animation for the tail
    useFrame((state) => {
        if (tailRef.current && tailRef.current.material) {
            const mat = tailRef.current.material as THREE.PointsMaterial;
            mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group>
            {/* Comet nucleus - bright core */}
            <mesh position={position.toArray()}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial color="#FFFFFF" />
            </mesh>

            {/* Coma (atmosphere around nucleus) - cyan glow */}
            <mesh position={position.toArray()}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color="#00FFFF" transparent opacity={0.35} />
            </mesh>

            {/* Outer coma glow */}
            <mesh position={position.toArray()}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color="#87CEEB" transparent opacity={0.15} />
            </mesh>

            {/* Single unified tail pointing away from Sun */}
            <points ref={tailRef} geometry={tailGeometry}>
                <pointsMaterial
                    size={0.025}
                    color="#87CEEB"
                    transparent
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {showLabels && (
                <Html position={[position.x, position.y + 0.5, position.z]} center>
                    <div className="comet-label">
                        <strong>3I/ATLAS</strong>
                        <span>{distanceFromSun.toFixed(2)} AU</span>
                        <span>{velocity.toFixed(1)} km/s</span>
                    </div>
                </Html>
            )}
        </group>
    );
};

// Hyperbolic orbit path for 3I/Atlas
const CometOrbitPath: React.FC = () => {
    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const e = ATLAS_ORBITAL_ELEMENTS.eccentricity;
        const a = Math.abs(ATLAS_ORBITAL_ELEMENTS.semiMajorAxis);

        // For hyperbola, true anomaly is limited
        const nuMax = Math.acos(-1 / e) * 0.95; // Slightly less than asymptote

        for (let i = -100; i <= 100; i++) {
            const nu = (i / 100) * nuMax;
            const r = a * (e * e - 1) / (1 + e * Math.cos(nu));

            if (r > 0 && r < 20) { // Limit visualization range
                const pos = calculateOrbitalPosition(
                    ATLAS_ORBITAL_ELEMENTS.semiMajorAxis,
                    e,
                    nu,
                    ATLAS_ORBITAL_ELEMENTS.argumentOfPerihelion,
                    ATLAS_ORBITAL_ELEMENTS.longitudeOfAscendingNode,
                    ATLAS_ORBITAL_ELEMENTS.inclination
                );
                pts.push(pos);
            }
        }
        return pts;
    }, []);

    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    return (
        <Line
            points={points}
            color="#00FFFF"
            transparent
            opacity={0.5}
            lineWidth={2}
        />
    );
};

// ============================================
// MAIN SCENE COMPONENT
// ============================================

interface SpaceSceneProps {
    simulationTime: number;
    showLabels: boolean;
    showOrbits: boolean;
    showInfo: boolean;
    currentDate: string;
    perihelionInfo: string;
}

const SpaceScene: React.FC<SpaceSceneProps> = ({ simulationTime, showLabels, showOrbits, showInfo, currentDate, perihelionInfo }) => {
    return (
        <>
            <ambientLight intensity={0.1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <Sun />

            {/* Planet orbits */}
            {showOrbits && PLANETS.map(planet => (
                <OrbitPath
                    key={`orbit-${planet.name}`}
                    semiMajorAxis={planet.semiMajorAxis}
                    eccentricity={planet.eccentricity}
                    color={planet.color}
                />
            ))}

            {/* Planets */}
            {PLANETS.map(planet => (
                <Planet
                    key={planet.name}
                    planet={planet}
                    simulationTime={simulationTime}
                    showLabels={showLabels}
                />
            ))}

            {/* 3I/Atlas orbit path */}
            {showOrbits && <CometOrbitPath />}

            {/* 3I/Atlas Comet */}
            <Comet simulationTime={simulationTime} showLabels={showLabels} />
        </>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

const SpaceSimulation: React.FC = () => {
    const [simulationTime, setSimulationTime] = useState(0); // Days from start date
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [showLabels, setShowLabels] = useState(true);
    const [showOrbits, setShowOrbits] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [cameraView, setCameraView] = useState<'top' | 'side' | 'angle'>('side');
    const [zoomLevel, setZoomLevel] = useState(1);
    const controlsRef = useRef<any>(null);

    // Calculate Present Day (days from July 1, 2025)
    const presentDayOffset = useMemo(() => {
        const startDate = new Date('2025-07-01');
        const today = new Date();
        return Math.round((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    }, []);

    // Camera position presets (side view from behind the comet trajectory)
    const cameraPositions = {
        top: [0, 25 / zoomLevel, 0.1] as [number, number, number],
        side: [-8 / zoomLevel, 5 / zoomLevel, -15 / zoomLevel] as [number, number, number],
        angle: [15 / zoomLevel, 12 / zoomLevel, 15 / zoomLevel] as [number, number, number]
    };

    // Zoom handlers
    const zoomIn = () => setZoomLevel(prev => Math.min(prev * 1.3, 5));
    const zoomOut = () => setZoomLevel(prev => Math.max(prev / 1.3, 0.3));

    // Animation loop for time progression
    const lastTimeRef = useRef(Date.now());

    const animate = useCallback(() => {
        if (isPlaying) {
            const now = Date.now();
            const delta = (now - lastTimeRef.current) / 1000; // seconds
            lastTimeRef.current = now;
            setSimulationTime(prev => prev + delta * speed);
        }
        requestAnimationFrame(animate);
    }, [isPlaying, speed]);

    React.useEffect(() => {
        lastTimeRef.current = Date.now();
        const animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [animate]);

    // Calculate current date
    const currentDate = useMemo(() => {
        const startDate = new Date('2025-07-01');
        const date = new Date(startDate.getTime() + simulationTime * 24 * 60 * 60 * 1000);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }, [simulationTime]);

    // Days until/since perihelion
    const perihelionInfo = useMemo(() => {
        const startDate = new Date('2025-07-01');
        const currentSimDate = new Date(startDate.getTime() + simulationTime * 24 * 60 * 60 * 1000);
        const daysDiff = Math.round((ATLAS_ORBITAL_ELEMENTS.perihelionDate.getTime() - currentSimDate.getTime()) / (24 * 60 * 60 * 1000));

        if (daysDiff > 0) return `${daysDiff} days to perihelion`;
        if (daysDiff < 0) return `${Math.abs(daysDiff)} days after perihelion`;
        return 'AT PERIHELION';
    }, [simulationTime]);

    // Jump to present day
    const goToPresentDay = () => {
        setSimulationTime(presentDayOffset);
    };

    return (
        <section id="space" className="space-section">
            <div className="container">
                <h2 className="section-title">
                    <i className="fas fa-meteor"></i> 3I/ATLAS Interstellar Comet
                </h2>
            </div>

            <div className="space-simulation-container">
                {/* 3D Canvas with Static HUD Overlay */}
                <div className="canvas-wrapper">
                    <Canvas dpr={[1, 2]}>
                        <PerspectiveCamera makeDefault position={cameraPositions[cameraView]} fov={60} />
                        <SpaceScene
                            simulationTime={simulationTime}
                            showLabels={showLabels}
                            showOrbits={showOrbits}
                            showInfo={showInfo}
                            currentDate={currentDate}
                            perihelionInfo={perihelionInfo}
                        />
                        <OrbitControls
                            ref={controlsRef}
                            enableDamping
                            dampingFactor={0.05}
                            rotateSpeed={0.5}
                            zoomSpeed={0.8}
                            minDistance={2}
                            maxDistance={50}
                        />
                    </Canvas>

                    {/* Static HUD Overlay - CSS positioned */}
                    {showInfo && (
                        <div className="static-hud">
                            {/* Left Side - Date & Status */}
                            <div className="hud-left">
                                <div className="hud-date-static">{currentDate}</div>
                                <div className="hud-day-static">DAY {Math.round(simulationTime)}</div>
                                <div className="hud-perihelion-static">{perihelionInfo}</div>
                            </div>

                            {/* Top Center - Title */}
                            <div className="hud-center">
                                <span className="hud-title-static">3I/ATLAS</span>
                            </div>

                            {/* Right Side - Orbital Data */}
                            <div className="hud-right">
                                <div className="hud-stat">eccentricity : {ATLAS_ORBITAL_ELEMENTS.eccentricity.toFixed(2)}</div>
                                <div className="hud-stat">perihelion distance : {ATLAS_ORBITAL_ELEMENTS.perihelionDistance} AU</div>
                                <div className="hud-stat">hyperbolic excess velocity : {ATLAS_ORBITAL_ELEMENTS.hyperbolicExcessVelocity} km/s</div>
                                <div className="hud-stat">inclination : {ATLAS_ORBITAL_ELEMENTS.inclination}°</div>
                            </div>

                            {/* Bottom Left - Discovery Info */}
                            <div className="hud-bottom-left">
                                <span>3I/ATLAS • Interstellar</span>
                            </div>

                            {/* Bottom Right - Nucleus */}
                            <div className="hud-bottom-right">
                                <span>⌀ {ATLAS_ORBITAL_ELEMENTS.nucleusDiameterMin}-{ATLAS_ORBITAL_ELEMENTS.nucleusDiameterMax} km</span>
                            </div>
                        </div>
                    )}

                    {/* Camera View Controls - Top Right */}
                    <div className="camera-controls">
                        <button
                            className={`cam-btn ${cameraView === 'top' ? 'active' : ''}`}
                            onClick={() => setCameraView('top')}
                            title="Top View"
                        >
                            <i className="fas fa-arrow-down"></i>
                        </button>
                        <button
                            className={`cam-btn ${cameraView === 'side' ? 'active' : ''}`}
                            onClick={() => setCameraView('side')}
                            title="Side View"
                        >
                            <i className="fas fa-arrow-right"></i>
                        </button>
                        <button
                            className={`cam-btn ${cameraView === 'angle' ? 'active' : ''}`}
                            onClick={() => setCameraView('angle')}
                            title="3D Angle View"
                        >
                            <i className="fas fa-cube"></i>
                        </button>
                        <div className="zoom-divider"></div>
                        <button
                            className="cam-btn zoom-btn"
                            onClick={zoomIn}
                            title="Zoom In"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                        <button
                            className="cam-btn zoom-btn"
                            onClick={zoomOut}
                            title="Zoom Out"
                        >
                            <i className="fas fa-minus"></i>
                        </button>
                    </div>
                </div>

                {/* Control Panel with Key Events */}
                <div className="space-controls compact">
                    {/* Playback Controls */}
                    <div className="playback-controls">
                        <button
                            className={`play-btn ${isPlaying ? 'active' : ''}`}
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>
                        <div className="speed-control">
                            <label>Speed: {speed}x</label>
                            <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Time Slider */}
                    <div className="time-slider">
                        <label>Timeline</label>
                        <input
                            type="range"
                            min="-30"
                            max="300"
                            value={simulationTime}
                            onChange={(e) => setSimulationTime(parseFloat(e.target.value))}
                        />
                        <div className="timeline-labels">
                            <span>Jun 2025</span>
                            <span>Mar 2026</span>
                        </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="toggle-options">
                        <label className="toggle-option">
                            <input
                                type="checkbox"
                                checked={showLabels}
                                onChange={(e) => setShowLabels(e.target.checked)}
                            />
                            <span>Labels</span>
                        </label>
                        <label className="toggle-option">
                            <input
                                type="checkbox"
                                checked={showOrbits}
                                onChange={(e) => setShowOrbits(e.target.checked)}
                            />
                            <span>Orbits</span>
                        </label>
                        <label className="toggle-option">
                            <input
                                type="checkbox"
                                checked={showInfo}
                                onChange={(e) => setShowInfo(e.target.checked)}
                            />
                            <span>HUD</span>
                        </label>
                    </div>

                    {/* Key Events - Clickable */}
                    <div className="events-compact">
                        <div className="events-title">Key Events</div>

                        {/* Present Day Button */}
                        <button
                            className="event-btn present-day"
                            onClick={goToPresentDay}
                            title="Jump to today's date"
                        >
                            <span className="event-icon-small">📍</span>
                            <span className="event-label">Present Day</span>
                        </button>

                        {KEY_EVENTS.map((event, idx) => {
                            const isPast = simulationTime >= event.daysFromStart;
                            const isCurrent = Math.abs(simulationTime - event.daysFromStart) < 3;

                            return (
                                <button
                                    key={idx}
                                    className={`event-btn ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
                                    onClick={() => setSimulationTime(event.daysFromStart)}
                                    title={event.distance || event.description}
                                >
                                    <span className="event-icon-small">{event.icon}</span>
                                    <span className="event-label">{event.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SpaceSimulation;
