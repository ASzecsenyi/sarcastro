import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
import {
    OrbitControls
} from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

import Albedo from "./assets/Albedo.jpg"
import sunmap from "./assets/sunmap.jpg"

const MoonTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg');

import { loadTexture } from "./common_utils.js"

// Create and interactive solar system representation

// Global variables
let scene, camera, renderer, controls;

let sunGeometry, sunMaterial, sunMesh, sunOrbitCurve, sunLight;
let earthGeometry, earthMaterial, earthMesh, earthOrbitCurve;
let moonGeometry, moonMaterial, moonMesh, moonOrbitCurve;
let flatEarthGeometry, flatEarthMaterial;

let orbitCounter = [];

let geocentricFlag = true;
let flatEarthFlag = true;
let sunNearbyFlag = true;
let bigMoonFlag = true;

let sunEarthDistance = 400;

let earthSystem;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const albedoMap = await loadTexture(Albedo)
albedoMap.colorSpace = THREE.SRGBColorSpace

const Sunmap = await loadTexture(sunmap)
Sunmap.colorSpace = THREE.SRGBColorSpace



function onPointerMove(event) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (event.clientX / (window.innerWidth)) * 2 - 1;
    pointer.y = -(event.clientY / (window.innerHeight)) * 2 + 1;

}


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 30, 500);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // center vertically
    renderer.domElement.style.marginTop = '50px';

    // TODO add other element:
    // if one of the flags has been changed, add a checkbox to the page that lets user directly change the flag
    // if all the flags have been changed, add a button to the page that lets user start quiz

    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);

    // Create four bodies: a Sun, an Earth, a Moon, and a Flat Earth

    // Flat Earth
    flatEarthGeometry = new THREE.CylinderGeometry(50, 50, 10, 32);
    flatEarthMaterial = new THREE.MeshPhongMaterial({
        //color: 0x0000ff,
        map: albedoMap
    });

    // Earth
    earthGeometry = new THREE.SphereGeometry(25, 50, 50);
    earthMaterial = new THREE.MeshPhongMaterial({
        //color: 0x0000ff,
        map: albedoMap
    });
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    // set the name of the object
    earthMesh.name = 'earth';

    // Sun
    sunGeometry = new THREE.SphereGeometry(109, 400, 200);
    sunMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        //color: 0xffd700,
        map: Sunmap,
        //wireframe: false
    });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.name = 'sun';

    // Moon
    moonGeometry = new THREE.SphereGeometry(6, 50, 50);
    moonMaterial = new THREE.MeshPhongMaterial({
        //color: 0x808080,
        map: MoonTexture
    });

    if (bigMoonFlag) {
        moonGeometry = new THREE.SphereGeometry(15, 50, 50);
    }

    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.name = 'moon';

    // if sunNearbyFlag is on, sun earth distance is 250
    if (sunNearbyFlag) {
        sunEarthDistance = 250;
    }

    // if flat earth flag is on, make the earth flat
    if (flatEarthFlag) {
        earthMesh = new THREE.Mesh(flatEarthGeometry, flatEarthMaterial);
        earthMesh.name = 'flat_earth';
    }

    // if geocentric flag is off, show the real solar system
    // earth is orbiting the sun, moon is orbiting the earth
    // sun earth distance is 400
    // earth moon distance is 60
    // flat earth is hidden

    earthSystem = new THREE.Object3D();
    earthSystem.add(moonMesh);
    earthSystem.add(earthMesh);
    earthSystem.name = 'earth_system';
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
        moonOrbitCurve = new THREE.EllipseCurve(0, 0, 120, 120, 0, 2 * Math.PI, false, 0);
        sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
    }

    // Draw the orbits
    const earthOrbit = draw_orbit(earthOrbitCurve, 0x888888);
    const moonOrbit = draw_orbit(moonOrbitCurve, 0x888888);
    const sunOrbit = draw_orbit(sunOrbitCurve, 0x888888);
    scene.add(earthOrbit);
    earthSystem.add(moonOrbit);
    scene.add(sunOrbit);

    // add point light from sun
    sunLight = new THREE.PointLight(0xffffff);
    sunLight.position.copy(sunMesh.position);
    // move the light source to the sun
    scene.add(sunLight);


    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
}

// make draw_orbit function
function draw_orbit(orbitCurve, color) {
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({color: color});
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = -Math.PI / 2;
    let nextAvalableIndex = 0;
    while (orbitCounter.includes(nextAvalableIndex)) {
        nextAvalableIndex++;
    }
    orbitCounter.push(nextAvalableIndex);
    orbitLine.name = 'orbit' + nextAvalableIndex;

    return orbitLine;
}

function animate() {
    const time = 0.00001 * performance.now();
    const t = time % 1;
    const point = earthOrbitCurve.getPoint(t);
    const point_mn = moonOrbitCurve.getPoint(t * 10 + 0.5);
    const point_sn = sunOrbitCurve.getPoint(t);
    earthSystem.position.set(point.x, 0, point.y);
    moonMesh.position.set(point_mn.x, 0, point_mn.y);
    sunMesh.position.set(point_sn.x, 0, point_sn.y);
    sunLight.position.copy(sunMesh.position);


    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function onPointerClick(event) {
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {

        // print the name of the object
        console.log(intersects[i].object.name);
        // log all the flags
        // console.log('geocentricFlag: ', geocentricFlag);
        // console.log('flatEarthFlag: ', flatEarthFlag);
        // console.log('sunNearbyFlag: ', sunNearbyFlag);

        // if the object is the earth (or flat earth), toggle the flat earth flag
        if (intersects[i].object.name === 'earth' || intersects[i].object.name === 'flat_earth') {
            flatEarthFlag = !flatEarthFlag;
            // apply the change
            if (flatEarthFlag) {
                earthMesh = new THREE.Mesh(flatEarthGeometry, flatEarthMaterial);
                earthSystem.remove(earthSystem.getObjectByName('earth'));
                earthMesh.name = 'flat_earth';

            } else {
                earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
                earthSystem.remove(earthSystem.getObjectByName('flat_earth'));
                earthMesh.name = 'earth';
            }

            earthSystem.add(earthMesh);
        }
        // if the object is the sun, toggle the sun nearby flag
        if (intersects[i].object.name === 'sun' && !geocentricFlag) {
            sunNearbyFlag = !sunNearbyFlag;
            // apply the change
            if (sunNearbyFlag) {
                if (geocentricFlag) {
                    sunEarthDistance = 250;
                    // update the sun orbit curve
                    sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                    // update the line
                } else {
                    sunEarthDistance = 250;
                    // update the earth orbit curve
                    earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                }
            } else {
                if (geocentricFlag) {
                    sunEarthDistance = 400;
                    // update the sun orbit curve
                    sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                } else {
                    sunEarthDistance = 400;
                    // update the earth orbit curve
                    earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                }
            }

            // update the orbits
            for (let i = 0; i < orbitCounter.length; i++) {
                scene.remove(scene.getObjectByName('orbit' + i));
                earthSystem.remove(earthSystem.getObjectByName('orbit' + i));
            }
            orbitCounter = [];
            const earthOrbit = draw_orbit(earthOrbitCurve, 0x888888);
            const moonOrbit = draw_orbit(moonOrbitCurve, 0x888888);
            const sunOrbit = draw_orbit(sunOrbitCurve, 0x888888);
            scene.add(earthOrbit);
            earthSystem.add(moonOrbit);
            scene.add(sunOrbit);

        }
        // if the object is an orbit or the sun at the start, toggle the geocentric flag
        if (intersects[i].object.name.includes('orbit') || intersects[i].object.name === 'sun' && geocentricFlag) {
            geocentricFlag = !geocentricFlag;
            // apply the change
            if (geocentricFlag) {
                earthOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
                moonOrbitCurve = new THREE.EllipseCurve(0, 0, 120, 120, 0, 2 * Math.PI, false, 0);
                sunOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
            } else {
                earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
                moonOrbitCurve = new THREE.EllipseCurve(0, 0, 60, 60, 0, 2 * Math.PI, false, 0);
                sunOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
            }

            // update the orbits
            for (let i = 0; i < orbitCounter.length; i++) {
                scene.remove(scene.getObjectByName('orbit' + i));
                earthSystem.remove(earthSystem.getObjectByName('orbit' + i));
            }
            orbitCounter = [];
            const earthOrbit = draw_orbit(earthOrbitCurve, 0x888888);
            const moonOrbit = draw_orbit(moonOrbitCurve, 0x888888);
            const sunOrbit = draw_orbit(sunOrbitCurve, 0x888888);
            scene.add(earthOrbit);
            earthSystem.add(moonOrbit);
            scene.add(sunOrbit);
        }

        if (intersects[i].object.name === 'moon') {
            bigMoonFlag = !bigMoonFlag;
            // apply the change
            if (bigMoonFlag) {
                moonGeometry = new THREE.SphereGeometry(15, 50, 50);
            } else {
                moonGeometry = new THREE.SphereGeometry(6, 50, 50);
            }
            moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            moonMesh.name = 'moon';
            earthSystem.remove(earthSystem.getObjectByName('moon'));
            earthSystem.add(moonMesh);
        }
    }
}


init();
animate();

document.addEventListener('pointermove', onPointerMove);
document.addEventListener('click', onPointerClick);
