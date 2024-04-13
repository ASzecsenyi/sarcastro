import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
import { OrbitControls } from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

// Create and interactive solar system representation

// Global variables
let scene, camera, renderer, controls;

let sunGeometry, sunMaterial, sunMesh, sunOrbitCurve;
let earthGeometry, earthMaterial, earthMesh, earthOrbitCurve;
let moonGeometry, moonMaterial, moonMesh, moonOrbitCurve;
let flatEarthGeometry, flatEarthMaterial;

let geocentricFlag = true;
let flatEarthFlag = true;
let sunNearbyFlag = true;

let sunEarthDistance = 400;

let earthSystem;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 30, 500);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x888888);
  scene.add(ambientLight);

  // Create four bodies: a Sun, an Earth, a Moon, and a Flat Earth

    // Flat Earth
    flatEarthGeometry = new THREE.CylinderGeometry(50, 50, 10, 32);
    flatEarthMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000ff
    });

    // Earth
    earthGeometry = new THREE.SphereGeometry(25, 50, 50);
    earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000ff
    });
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial, name="earth");

    // Sun
    sunGeometry = new THREE.SphereGeometry(109, 400, 200);
    sunMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xffd700,
        emissiveIntensity: 1,
        wireframe: false
    });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial, name="sun");

    // Moon
    moonGeometry = new THREE.SphereGeometry(6, 50, 50);
    moonMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080
    });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial, name="moon");

    // if sunNearbyFlag is on, sun earth distance is 250
    if (sunNearbyFlag) {
        sunEarthDistance = 250;
    }

    // if flat earth flag is on, make the earth flat
    if (flatEarthFlag) {
        earthMesh = new THREE.Mesh(flatEarthGeometry, flatEarthMaterial, name="flat_earth");
    }

    // if geocentric flag is off, show the real solar system
    // earth is orbiting the sun, moon is orbiting the earth
    // sun earth distance is 400
    // earth moon distance is 60
    // flat earth is hidden

    earthSystem = new THREE.Object3D();
    earthSystem.add(moonMesh);
    earthSystem.add(earthMesh);
    scene.add(sunMesh);
    scene.add(earthSystem);
    // Create the orbit curves
    earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
    moonOrbitCurve = new THREE.EllipseCurve(0, 0, 60, 60, 0, 2 * Math.PI, false, 0);
    sunOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);


    // if geocentric flag is on, show the geocentric solar system
    // earth is stationary, moon is orbiting the earth
    // sun earth distance is 400
    // earth moon distance is 200
    if (geocentricFlag) {
        earthOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
        moonOrbitCurve = new THREE.EllipseCurve(0, 0, 150, 150, 0, 2 * Math.PI, false, 0);
        sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
    }

    // Draw the orbits
    draw_orbit(earthOrbitCurve, 0xcccccc);
    draw_orbit(moonOrbitCurve, 0xcccccc);
    draw_orbit(sunOrbitCurve, 0xcccccc);

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
}

// make draw_orbit function
function draw_orbit(orbitCurve, color) {
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: color });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = -Math.PI / 2;
    scene.add(orbitLine);
}

function animate(){
    const time = 0.00001 * performance.now();
    const t = time % 1;
    const point = earthOrbitCurve.getPoint(t);
    const point_mn = moonOrbitCurve.getPoint(t*10+0.5);
    const point_sn = sunOrbitCurve.getPoint(t);
    earthSystem.position.set(point.x, 0, point.y);
    moonMesh.position.set(point_mn.x, 0, point_mn.y);
    sunMesh.position.set(point_sn.x, 0, point_sn.y);

    // update the picking ray with the camera and pointer position
  raycaster.setFromCamera( pointer, camera );

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( scene.children );

  for ( let i = 0; i < intersects.length; i ++ ) {

      // print the name of the object
        console.log(intersects[i].object.name);
      // if earth is clicked, toggle flat earth flag
        if (intersects[i].object === earthMesh) {
            flatEarthFlag = !flatEarthFlag;
            if (flatEarthFlag) {
                earthMesh = new THREE.Mesh(flatEarthGeometry, flatEarthMaterial, name="flat_earth");
            } else {
                earthMesh = new THREE.Mesh(earthGeometry, earthMaterial, name="earth");
            }
            earthSystem.remove(earthSystem.children[1]);
            earthSystem.add(earthMesh);
        }
        // if sun is clicked, toggle sun nearby flag
        if (intersects[i].object === sunMesh) {
            sunNearbyFlag = !sunNearbyFlag;
            if (sunNearbyFlag) {
                sunEarthDistance = 250;
            } else {
                sunEarthDistance = 400;
            }
        }
        // if moon is clicked, toggle geocentric flag
        if (intersects[i].object === moonMesh) {
            geocentricFlag = !geocentricFlag;
            if (geocentricFlag) {
                earthOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
                moonOrbitCurve = new THREE.EllipseCurve(0, 0, 200, 200, 0, 2 * Math.PI, false, 0);
                sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
            } else {
                earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                moonOrbitCurve = new THREE.EllipseCurve(0, 0, 60, 60, 0, 2 * Math.PI, false, 0);
                sunOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
            }
            draw_orbit(earthOrbitCurve, 0xcccccc);
            draw_orbit(moonOrbitCurve, 0xcccccc);
            draw_orbit(sunOrbitCurve, 0xcccccc);
        }

  }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}



init();
animate();

document.addEventListener('pointermove', onPointerMove);
