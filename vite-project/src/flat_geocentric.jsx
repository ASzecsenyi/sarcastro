import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
    import { OrbitControls } from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

    // Global variables
let scene, camera, renderer;
let sunGeometry, sunMaterial, sunMesh;
let earthGeometry, earthMaterial, earthMesh;
let moonGeometry, moonMaterial, moonMesh;
let earthOrbitCurve;
let moonOrbitCurve;
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
  sunGeometry = new THREE.CylinderGeometry(50, 50, 10, 32);
  sunMaterial = new THREE.MeshPhongMaterial({
    color: 0x0000ff
  });
  sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sunMesh);

  const ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  // Create the earth

  earthGeometry = new THREE.SphereGeometry(109, 400, 200);
  earthMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffd700,
    emissiveIntensity: 1,
    wireframe: false
  });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earthMesh);

  // Add light sources
  const sunLight = new THREE.PointLight(0xffffff);
  sunLight.position.copy(earthMesh.position);
  scene.add(sunLight);

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
  scene.add(moonMesh);

  // Create the earth's orbit
  const earthOrbitRadius = 400;
  earthOrbitCurve = new THREE.EllipseCurve(
    0, 0,
    earthOrbitRadius, earthOrbitRadius,
    0, 2 * Math.PI,
    false,
    0
  );

  const moonOrbitRadius = 220;
  moonOrbitCurve = new THREE.EllipseCurve(
    0, 0,
    moonOrbitRadius, moonOrbitRadius,
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

  const moonOrbitPoints = moonOrbitCurve.getPoints(100);
  const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
  const moonOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
  const moonOrbitLine = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
  moonOrbitLine.rotation.x = -Math.PI / 2;
  scene.add(moonOrbitLine);

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
  const point_mn = moonOrbitCurve.getPoint(t*10+0.5);
  earthMesh.position.set(point.x, 0, point.y);
  moonMesh.position.set(point_mn.x, 0, point_mn.y);


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