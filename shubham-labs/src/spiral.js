import * as THREE from 'three';
import gsap from 'gsap';

export function initSpiral(audioEngine, cursorEngine) {
  const canvas = document.getElementById('webgl-canvas');
  const randomizeBtn = document.getElementById('randomize-btn');
  
  // HTML container for 3D projected text
  const htmlContainer = document.getElementById('three-html-container') || document.createElement('div');
  if (!htmlContainer.parentElement) {
    htmlContainer.id = 'three-html-container';
    document.body.appendChild(htmlContainer);
  }
  htmlContainer.innerHTML = ''; // Clear previous elements

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xe9f0ff, 0.035);

  // Camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 17);

  // WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight1.position.set(5, 15, 10);
  scene.add(dirLight1);

  // Create Spiral Group
  const spiralGroup = new THREE.Group();
  scene.add(spiralGroup);

  // Upgrade 1: Intertwining DNA Double Helix Configuration
  // Strand A: "SHUBHAM" (Emerald color styling in CSS class)
  // Strand B: "CREATIVE" (Hot pink/amber styling in CSS class)
  const strandAWord = "SHUBHAM";
  const strandBWord = "CREATIVE";
  const numLettersPerStrand = 75;
  const lettersData = [];

  const radius = 6.4;
  const heightGap = 0.32;
  const angleGap = 0.28;

  // Function to create a strand
  const createStrand = (word, angleOffset, cssClass) => {
    for (let i = 0; i < numLettersPerStrand; i++) {
      const char = word[i % word.length];
      
      const span = document.createElement('span');
      span.className = `spiral-letter ${cssClass}`;
      span.textContent = char;
      htmlContainer.appendChild(span);

      // Helix mathematical path coordinates (offset by angleOffset)
      const theta = (i - numLettersPerStrand / 2) * angleGap + angleOffset;
      const y = (i - numLettersPerStrand / 2) * heightGap;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // 3D Anchor point
      const anchor = new THREE.Object3D();
      anchor.position.set(x, y, z);

      // Tangent rotation alignment
      const tx = -Math.sin(theta);
      const tz = Math.cos(theta);
      const angle = Math.atan2(tx, tz);
      anchor.rotation.y = angle;

      spiralGroup.add(anchor);

      // Add advanced physics properties to each node
      lettersData.push({
        element: span,
        anchor: anchor,
        originalChar: char,
        basePos: new THREE.Vector3(x, y, z),
        baseRotY: angle,
        // Physics attributes (spring solver)
        dispOffset: new THREE.Vector3(0, 0, 0), // current offset from anchor
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        // Scramble decryption state
        scrambleCounter: 0,
        isHovered: false
      });

      // Bind Matrix Decryption Scrambler on hover
      span.addEventListener('mouseenter', () => {
        audioEngine.playTick();
        lettersData[lettersData.length - 1].isHovered = true;
        lettersData[lettersData.length - 1].scrambleCounter = 18; // Scramble for 18 frames

        gsap.to(span, {
          scale: 1.4,
          duration: 0.25,
          overwrite: 'auto'
        });
      });

      span.addEventListener('mouseleave', () => {
        lettersData[lettersData.length - 1].isHovered = false;
        gsap.to(span, {
          scale: 1,
          duration: 0.4,
          overwrite: 'auto'
        });
      });
    }
  };

  // Build the double strands
  createStrand(strandAWord, 0, 'strand-a'); // Strand A (Emerald)
  createStrand(strandBWord, Math.PI, 'strand-b'); // Strand B (Hot Magenta)

  // Bind custom cursor overlays
  cursorEngine.bindHover(document.querySelectorAll('.spiral-letter'));

  // Upgrade 2: Cosmic Particle Field
  const particleCount = 450;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    // Distribute particles in a large cylindrical halo around the helix
    const theta = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 22;
    particlePositions[i] = Math.cos(theta) * r;
    particlePositions[i + 1] = (Math.random() - 0.5) * 40; // Y height range
    particlePositions[i + 2] = Math.sin(theta) * r;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  // Custom particle point texture (soft glow points)
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x10b981,
    size: 0.18,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // Upgrade 3: Spring Physics Shockwave Blast
  const blastOrigin = new THREE.Vector3();
  
  const triggerPhysicsBlast = (clientX, clientY) => {
    // Map client coordinates to 3D raycast vector
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(ndc, camera);
    
    // Set blast origin along the raycaster
    blastOrigin.copy(raycaster.ray.origin).add(raycaster.ray.direction.multiplyScalar(15));

    lettersData.forEach((letter) => {
      // Get absolute position
      letter.anchor.getWorldPosition(tempV3);
      
      const distance = tempV3.distanceTo(blastOrigin);
      const forceMagnitude = Math.max(0, 20 / (distance + 0.3));

      // Calculate blast push vector
      const pushDirection = new THREE.Vector3()
        .subVectors(tempV3, blastOrigin)
        .normalize()
        .multiplyScalar(forceMagnitude);

      // Inject impulse force directly into velocities
      letter.velocity.add(pushDirection);
      
      // Trigger scramble on explosion
      letter.scrambleCounter = Math.floor(Math.random() * 25) + 15;
    });
  };

  // Bind double click for gravity blast explosion
  window.addEventListener('dblclick', (e) => {
    triggerPhysicsBlast(e.clientX, e.clientY);
  });

  // Bind touch double-tap for mobile
  let lastTap = 0;
  window.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      const touch = e.changedTouches[0];
      triggerPhysicsBlast(touch.clientX, touch.clientY);
    }
    lastTap = currentTime;
  });

  // Morphing shape transitions
  let currentShape = 'spiral';
  
  const morphToShape = (shape) => {
    currentShape = shape;
    lettersData.forEach((letter, i) => {
      let tx = letter.basePos.x;
      let ty = letter.basePos.y;
      let tz = letter.basePos.z;
      let targetRotY = letter.baseRotY;

      if (shape === 'sphere') {
        const phi = Math.acos(-1 + (2 * i) / lettersData.length);
        const theta = Math.sqrt(lettersData.length * Math.PI) * phi;
        const sphRadius = 6.2;
        tx = sphRadius * Math.sin(phi) * Math.cos(theta);
        ty = sphRadius * Math.sin(phi) * Math.sin(theta);
        tz = sphRadius * Math.cos(phi);
        targetRotY = Math.atan2(tx, tz);
      } else if (shape === 'wave') {
        const side = i % 2 === 0 ? 1 : -1;
        tx = (i - lettersData.length / 2) * 0.14;
        ty = Math.sin(i * 0.15) * 3;
        tz = side * 2.2;
        targetRotY = 0;
      }

      gsap.to(letter.anchor.position, {
        x: tx,
        y: ty,
        z: tz,
        duration: 1.6,
        ease: 'power4.inOut'
      });

      gsap.to(letter.anchor.rotation, {
        y: targetRotY,
        duration: 1.6,
        ease: 'power4.inOut'
      });

      // Trigger text scrambles on shape transforms
      letter.scrambleCounter = Math.floor(Math.random() * 20) + 10;
    });
  };

  randomizeBtn.addEventListener('click', () => {
    if (currentShape === 'spiral') {
      morphToShape('sphere');
      randomizeBtn.textContent = 'Waves';
    } else if (currentShape === 'sphere') {
      morphToShape('wave');
      randomizeBtn.textContent = 'Spiral';
    } else {
      morphToShape('spiral');
      randomizeBtn.textContent = 'Transform';
    }
  });

  // Drag Interaction (inertial momentum)
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };
  let currentRotation = { x: 0, y: 0 };
  let dragVelocity = 0; // Speed tracker for pitch modulation
  let lastDragTime = 0;

  const onDown = (e) => {
    isDragging = true;
    prevMousePos.x = e.clientX || e.touches[0].clientX;
    prevMousePos.y = e.clientY || e.touches[0].clientY;
    lastDragTime = performance.now();
    audioEngine.ensureContext();
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const deltaX = clientX - prevMousePos.x;
    const deltaY = clientY - prevMousePos.y;

    targetRotation.y += deltaX * 0.005;
    targetRotation.x += deltaY * 0.005;

    // Calculate drag velocity for audio FM updates
    const now = performance.now();
    const timeDelta = Math.max(1, now - lastDragTime);
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    dragVelocity = dist / timeDelta;

    prevMousePos.x = clientX;
    prevMousePos.y = clientY;
    lastDragTime = now;
  };

  const onUp = () => {
    isDragging = false;
  };

  window.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  
  window.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);

  // Scroll Interaction (Y camera position flight)
  let targetCameraY = 0;
  let currentCameraY = 0;
  let scrollSpeed = 0; // for warp particle effects

  window.addEventListener('wheel', (e) => {
    targetCameraY -= e.deltaY * 0.015;
    targetCameraY = Math.max(-15, Math.min(15, targetCameraY));
    scrollSpeed = Math.abs(e.deltaY) * 0.015;
  }, { passive: true });

  // Raycaster & Mouse tracking
  const ndcMouse = new THREE.Vector2(-10, -10);
  const raycaster = new THREE.Raycaster();

  window.addEventListener('mousemove', (e) => {
    ndcMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Cyberpunk Matrix Glyphs List
  const glyphs = ['@', '#', '$', '%', '&', '*', '?', 'X', 'Y', 'Z', '7', '9', '§', 'Δ', 'Ω', 'Ξ'];

  // Physics Spring Properties
  const springStrength = 0.045;
  const friction = 0.86;

  const tempV3 = new THREE.Vector3();
  const clock = new THREE.Clock();

  // Render loop
  const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // 1. Momentum & rotation calculations
    if (!isDragging) {
      dragVelocity *= 0.95; // decay velocity
      targetRotation.y += 0.0035; // auto rotation
    }
    
    // Sync pitch modulation to drag velocity
    audioEngine.setPitchVelocity(dragVelocity);

    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.09;
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.09;
    
    spiralGroup.rotation.y = currentRotation.y;
    spiralGroup.rotation.x = currentRotation.x;

    // 2. Camera scroll physics
    currentCameraY += (targetCameraY - currentCameraY) * 0.08;
    camera.position.y = currentCameraY;
    camera.lookAt(0, currentCameraY * 0.5, 0);

    // 3. Particle system updates (dynamic warp effect)
    scrollSpeed *= 0.92; // Decay warp speed
    particleSystem.rotation.y = elapsedTime * 0.02;
    
    // Stretch star field slightly on fast scroll movements
    const currentWarp = Math.min(1.5, scrollSpeed + dragVelocity * 0.2);
    particleMaterial.size = 0.18 + currentWarp * 0.2;
    particleMaterial.opacity = 0.65 + currentWarp * 0.15;

    // 4. Spring Physics Solver & Character Scrambler
    lettersData.forEach((letter) => {
      // Get position
      letter.anchor.getWorldPosition(tempV3);

      // Spring physics calculations applied to offset vector
      // Force: F = -k * x
      const forceX = -springStrength * letter.dispOffset.x;
      const forceY = -springStrength * letter.dispOffset.y;
      const forceZ = -springStrength * letter.dispOffset.z;

      letter.acceleration.set(forceX, forceY, forceZ);
      
      // Integrate: velocity = velocity + acceleration
      letter.velocity.add(letter.acceleration);
      // Apply friction drag damping
      letter.velocity.multiplyScalar(friction);
      // Integrate: position = position + velocity
      letter.dispOffset.add(letter.velocity);
      
      // Reset acceleration accumulator
      letter.acceleration.set(0, 0, 0);

      // Interactive mouse hover displacement (soft repulsion)
      raycaster.setFromCamera(ndcMouse, camera);
      const distToRay = raycaster.ray.distanceToPoint(tempV3);
      
      if (distToRay < 2.2 && !letter.isHovered) {
        const repelDir = new THREE.Vector3()
          .subVectors(tempV3, raycaster.ray.origin)
          .normalize()
          .multiplyScalar(0.55);
        letter.dispOffset.lerp(repelDir, 0.12);
        
        // Trigger slight scramble when cursor is close
        if (Math.random() < 0.05 && letter.scrambleCounter === 0) {
          letter.scrambleCounter = 8;
        }
      }

      // Add displacement offset to rendering vector
      tempV3.add(letter.dispOffset);

      // Perform character matrix scramble
      if (letter.scrambleCounter > 0) {
        letter.scrambleCounter--;
        letter.element.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        letter.element.style.fontFamily = 'monospace';
      } else {
        letter.element.textContent = letter.originalChar;
        letter.element.style.fontFamily = ''; // Restore custom Syne/Jakarta font
      }

      // Project 3D vector to screen space
      const projected = tempV3.clone().project(camera);
      const isBehind = projected.z > 1;

      const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      if (isBehind || screenX < -120 || screenX > window.innerWidth + 120 || screenY < -120 || screenY > window.innerHeight + 120) {
        letter.element.style.display = 'none';
      } else {
        letter.element.style.display = 'block';

        const distToCamera = camera.position.distanceTo(tempV3);
        const depthScale = Math.max(0.1, 10 / distToCamera);
        const opacity = Math.min(1, Math.max(0, 1.9 - (distToCamera / 22)));
        const zIndex = Math.round((100 - distToCamera) * 10);

        letter.element.style.left = `${screenX}px`;
        letter.element.style.top = `${screenY}px`;
        // Apply 3D coordinate depth scaling
        letter.element.style.transform = `translate(-50%, -50%) scale(${depthScale})`;
        letter.element.style.opacity = opacity;
        letter.element.style.zIndex = zIndex;
      }
    });

    // WebGL Canvas Rendering
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };

  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
