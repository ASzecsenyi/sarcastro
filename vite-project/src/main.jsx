import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
    import { OrbitControls } from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

    // Global variables
let scene, camera, renderer;
let sunGeometry, sunMaterial, sunMesh;
let earthGeometry, earthMaterial, earthMesh;
let moonGeometry, moonMaterial, moonMesh;
let earthSystem;
let earthOrbitCurve;
let controls;
let cloudMesh;

// Initialize the scene
function init() {
  // Set up the scene, camera, and renderer
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 30, 500);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create the sun
  sunGeometry = new THREE.SphereGeometry(109, 400, 200);
  sunMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffd700,
    emissiveIntensity: 1,
    wireframe: false
  });
  sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sunMesh);

  // Add light sources
  const sunLight = new THREE.PointLight(0xffffff);
  sunLight.position.copy(sunMesh.position);
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  // Create the earth
  earthGeometry = new THREE.SphereGeometry(25, 50, 50);
  earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x0000ff
  });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

  // Load the cloud texture
  // clouds do not appear on the web browser & Debugging is needed
  const cloudTexture = new THREE.TextureLoader().load('https://i.stack.imgur.com/B3c7G.jpg');

  // Create the cloud layer
  const cloudGeometry = new THREE.SphereGeometry(26, 50, 50);
  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 4.8
  });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  earthMesh.add(cloudMesh);

  // Create the moon
  moonGeometry = new THREE.SphereGeometry(5, 40, 20);
  moonMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888
  });
  moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

  // Create the earth-moon system
  earthSystem = new THREE.Group();
  earthSystem.add(earthMesh);
  moonMesh.position.set(60, 0, 0);
  earthSystem.add(moonMesh);
  scene.add(earthSystem);

  // Create the earth's orbit
  const earthOrbitRadius = 400;
  earthOrbitCurve = new THREE.EllipseCurve(
    0, 0,
    earthOrbitRadius, earthOrbitRadius,
    0, 2 * Math.PI,
    false,
    0
  );

  // Optional: Draw the earth's orbit
  const orbitPoints = earthOrbitCurve.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = -Math.PI / 2;
  scene.add(orbitLine);

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
}

// Animation loop
function animate() {
  // Update the earth's position along the orbit curve
  const time = 0.00001 * performance.now();
  const t = time % 1;
  const point = earthOrbitCurve.getPoint(t);
  earthSystem.position.set(point.x, 0, point.y);

  // Update the moon's position around the earth
  const moonOrbitRadius = 60;
  const moonSpeed = 0.1;
  moonMesh.position.x = moonOrbitRadius * Math.cos(time * moonSpeed);
  moonMesh.position.z = moonOrbitRadius * Math.sin(time * moonSpeed);

  // Optional: Rotate the sun, earth, and moon
  sunMesh.rotation.y += 0.001;

  const earthRotationSpeed = 111.5;
  const cloudRotationSpeed = 0.08;

  earthMesh.rotation.y += earthRotationSpeed;
  cloudMesh.rotation.y += cloudRotationSpeed;

  moonMesh.rotation.y += 0.02;

  // Render the scene
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start the visualization
init();
animate();