import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import './App.css';

const WORLDS = [
  {
    id: 'toad-core',
    name: 'Toad Core',
    subtitle: 'Swamp Rush',
    objective: 'Dodge mutant vines and collect 8-bit fuel chips.',
    color: '#58d97d',
    accent: '#abffd5',
    enemyColor: '#6f3f24',
  },
  {
    id: 'cyber-corsair',
    name: 'Cyber Corsair',
    subtitle: 'Pirate Strike',
    objective: 'Slip through drone fire and hack the flagship core.',
    color: '#64a7ff',
    accent: '#c7e2ff',
    enemyColor: '#2f386f',
  },
  {
    id: 'storm-forge',
    name: 'Storm Forge',
    subtitle: 'Sky Factory',
    objective: 'Platform around lightning relays and reach the vault.',
    color: '#f29f55',
    accent: '#ffe0bc',
    enemyColor: '#7f2f1e',
  },

];

const WORLD_BY_ID = Object.fromEntries(WORLDS.map((world) => [world.id, world]));
const GAME_DURATION = 35;

function LoaderScreen({ loading }) {
  return (
    <section className="loading-screen" aria-label="loading screen">
      <h1>BUCKY PORTAL BOOT</h1>
      <p>Loading cartridge sectors...</p>
      <div className="loader-box" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loading}>
        <div className="loader-fill" style={{ width: `${loading}%` }} />
      </div>
      <strong>{loading}%</strong>
    </section>
  );
}

function WorldSelection({ mountRef, hoveredWorld }) {
  return (
    <section className="world-select">
      <div className="world-copy">
        <h1>Bucky World Selection</h1>
        <p>Pick a rotating planet to launch its mission.</p>
      </div>
      <div ref={mountRef} className="three-stage" aria-label="3d world selector" />
      <p className="hint">Click a planet to continue.</p>
      {hoveredWorld && (
        <div className="hover-card" style={{ '--planet-color': hoveredWorld.color }}>
          <h2>{hoveredWorld.name}</h2>
          <p>{hoveredWorld.subtitle}</p>
          <p>{hoveredWorld.objective}</p>
        </div>
      )}
    </section>
  );
}

function MiniGame({ selectedWorld, isPlaying, setIsPlaying, onExit }) {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [status, setStatus] = useState('ready');

  useEffect(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStatus('ready');
  }, [selectedWorld]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const canvas = gameRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    const state = {
      player: { x: 180, y: 250, size: 24, speed: 4 },
      enemies: [],
      keys: {},
      elapsed: 0,
      spawnTick: 0,
      lastSecondMark: 0,
      lastFrameTime: performance.now(),
    };

    const onKeyDown = (event) => {
      state.keys[event.key.toLowerCase()] = true;
    };

    const onKeyUp = (event) => {
      state.keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const width = canvas.width;
    const height = canvas.height;

    let animationFrame;

    const loop = (now) => {
      const delta = Math.min((now - state.lastFrameTime) / 16.67, 2);
      state.lastFrameTime = now;
      state.elapsed += delta / 60;
      state.spawnTick += delta;

      if (state.spawnTick > 20) {
        state.spawnTick = 0;
        state.enemies.push({
          x: Math.random() * (width - 22),
          y: -24,
          size: 16 + Math.random() * 14,
          speed: 1.5 + Math.random() * 2.3,
        });
      }

      const move = state.player.speed * delta;
      if (state.keys.a || state.keys.arrowleft) state.player.x -= move;
      if (state.keys.d || state.keys.arrowright) state.player.x += move;
      if (state.keys.w || state.keys.arrowup) state.player.y -= move;
      if (state.keys.s || state.keys.arrowdown) state.player.y += move;

      state.player.x = Math.max(0, Math.min(width - state.player.size, state.player.x));
      state.player.y = Math.max(0, Math.min(height - state.player.size, state.player.y));

      state.enemies.forEach((enemy) => {
        enemy.y += enemy.speed * delta;
      });
      state.enemies = state.enemies.filter((enemy) => enemy.y < height + enemy.size);

      const collision = state.enemies.some((enemy) => {
        const overlapX = state.player.x < enemy.x + enemy.size && state.player.x + state.player.size > enemy.x;
        const overlapY = state.player.y < enemy.y + enemy.size && state.player.y + state.player.size > enemy.y;
        return overlapX && overlapY;
      });

      if (collision) {
        setStatus('hit');
        setIsPlaying(false);
      }

      const seconds = Math.floor(state.elapsed);
      if (seconds !== state.lastSecondMark) {
        state.lastSecondMark = seconds;
        setScore((prev) => prev + 8);
        setTimeLeft((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next === 0) {
            setStatus('clear');
            setIsPlaying(false);
          }
          return next;
        });
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#121935';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = selectedWorld.color;
      context.lineWidth = 3;
      context.strokeRect(1.5, 1.5, width - 3, height - 3);

      context.fillStyle = selectedWorld.color;
      context.fillRect(state.player.x, state.player.y, state.player.size, state.player.size);

      context.fillStyle = selectedWorld.enemyColor;
      state.enemies.forEach((enemy) => {
        context.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
      });

      if (isPlaying) animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isPlaying, selectedWorld, setIsPlaying]);

  const statusMessage = useMemo(() => {
    if (status === 'hit') return 'Mission failed: you were hit by an obstacle.';
    if (status === 'clear') return 'Mission clear: all sectors stabilized!';
    return 'Use WASD or Arrow Keys to dodge hazards.';
  }, [status]);

  return (
    <section className="mini-game" style={{ '--planet-color': selectedWorld.color }}>
      <h1>{selectedWorld.name}</h1>
      <p>{selectedWorld.subtitle}</p>
      <p>{selectedWorld.objective}</p>
      <div className="hud">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>

      <canvas ref={gameRef} className="mini-canvas" width={420} height={300} />
      <p>{statusMessage}</p>

      <div className="action-row">
        {!isPlaying ? (
          <button
            onClick={() => {
              setScore(0);
              setTimeLeft(GAME_DURATION);
              setStatus('ready');
              setIsPlaying(true);
            }}
          >
            Play
          </button>
        ) : (
          <button onClick={() => setIsPlaying(false)}>Pause</button>
        )}
        <button onClick={onExit}>Exit to Worlds</button>
      </div>
    </section>
  );
}

function App() {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredWorld, setHoveredWorld] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoading((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setPhase('worldSelect'), 200);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'worldSelect') return undefined;

    const container = mountRef.current;
    if (!container) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.PointLight(0xffffff, 1.3);
    light.position.set(3, 3, 6);
    scene.add(light);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 450;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.05, color: '#ffffff' }));
    scene.add(stars);

    const planets = [];
    WORLDS.forEach((world, idx) => {
      const group = new THREE.Group();
      group.userData.worldId = world.id;

      const planet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.15, 1),
        new THREE.MeshStandardMaterial({
          color: world.color,
          flatShading: true,
          emissive: world.accent,
          emissiveIntensity: 0.2,
        }),
      );

      const moon = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({ color: world.accent, flatShading: true }),
      );
      moon.position.set(1.9, 0.6, 0);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.45, 0.06, 10, 56),
        new THREE.MeshBasicMaterial({ color: world.accent }),
      );
      ring.rotation.x = Math.PI / 2.8;

      group.add(planet);
      group.add(moon);
      group.add(ring);
      group.position.x = (idx - 1) * 3.1;
      scene.add(group);
      planets.push(group);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const resolveWorld = (object) => {
      let target = object;
      while (target) {
        if (target.userData?.worldId) return WORLD_BY_ID[target.userData.worldId] || null;
        target = target.parent;
      }
      return null;
    };

    const onPointerMove = (event) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(planets, true);
      const found = hits.length ? resolveWorld(hits[0].object) : null;
      setHoveredWorld(found);
    };

    const onPointerDown = (event) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(planets, true);
      if (!hits.length) return;
      const world = resolveWorld(hits[0].object);
      if (!world) return;
      setSelectedWorld(world);
      setIsPlaying(false);
      setPhase('miniGame');
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    let frame;
    const animate = () => {
      planets.forEach((planet, idx) => {
        planet.rotation.y += 0.008 + idx * 0.0015;
        planet.children[1].rotation.y += 0.03;
      });
      stars.rotation.y += 0.0006;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      container.removeChild(renderer.domElement);
      starGeo.dispose();
      planets.forEach((group) => {
        group.children.forEach((child) => {
          child.geometry.dispose();
          child.material.dispose();
        });
      });
      renderer.dispose();
    };
  }, [phase]);

  return (
    <main className="app-shell">
      {phase === 'loading' && <LoaderScreen loading={loading} />}

      {phase === 'worldSelect' && <WorldSelection mountRef={mountRef} hoveredWorld={hoveredWorld} />}

      {phase === 'miniGame' && selectedWorld && (
        <MiniGame
          selectedWorld={selectedWorld}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onExit={() => {
            setIsPlaying(false);
            setHoveredWorld(selectedWorld);
            setPhase('worldSelect');
          }}
        />
      )}
    </main>
  );
}

export default App;
