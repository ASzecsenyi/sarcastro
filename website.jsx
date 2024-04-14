
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

const sidebarContentMap = {
    earth: `
        <h3>Earth</h3>
        <p>
            ---Circumference---
            An estimate for the circumference of the Earth was made over two thousand years ago by an ancient Greek polymath named Eratosthenes of Cyrene with just two poles. By measuring the angle of the shadow cast by two poles standing perfectly straight on the ground in two different locations, he was able to calculate the size of the Earth.
            It goes as follows:
            Assuming the Earth is a sphere, consider the rays of light coming from the sun. Imagine there are two poles placed straight up from the ground at two different cities where one is directly south from the other. Because of the Earth's curvature which itself is because the Earth is a sphere, each pole will cast a slightly different shadow on the ground depending on how close it is to the equator. At the equator, there will be no shadow, at the poles there will only be shadow. Using some straightforward maths, you can get the "angle" of the shadow. The difference between the angle of this shadow in the poles, compared to the equator is 90 degrees, corresponding to having travelled a quarter of the way around a circle or a sphere. So, if the difference in the shadows is 3.6 degrees, then you will have travelled a 100th of the Earth's total circumference. Multiplying the distance between the two cities by 100 will give you the total circumference of the planet!
            This method led Eratosthenes to estimate the circumference of the Earth to be 40,320km which is remarkably close to today's known value of 40,007km measured with far more advanced tools.
            Note that to do this for yourself you would need to do these measurements at noon (when the Sun is at the highest point in the sky) on the summer solstice (the longest day of the year).
        </p>
    `,
    flat_earth: `
        <h3>Flat Earth</h3>
        <p>
            ---Circumference---
            The flat Earth model proposes that the Earth is a flat, disc-shaped plane, with the North Pole at the center and Antarctica as a wall around the edge. In this model, the circumference of the Earth would be the distance around the outer edge of the disc.
            However, the flat Earth model is not supported by scientific evidence. The Earth has been observed and measured to be a nearly spherical planet, with a circumference of approximately 40,000 kilometers (24,901 miles) at the equator.
            The idea of a flat Earth has been disproven by numerous observations and experiments, including:
            1. Observations of ships disappearing bottom-first over the horizon.

            
            2. The ability to circumnavigate the globe.
            3. Satellite imagery and photographs of the Earth from space.
            4. The consistent measurements of the Earth's curvature.
            The flat Earth model fails to explain these and many other observations, and it is not accepted by the scientific community as a valid representation of the Earth's shape.
        </p>
    `,
    sun: `
        <h3>Sun</h3>
        <p>
            ---Circumference---
            The Sun is a nearly perfect sphere, with a circumference of approximately 4,379,000 kilometers (2,720,000 miles) at its equator. This is about 109 times the diameter of the Earth.
            The Sun's shape is maintained by a balance between the outward pressure of the hot gas in its interior and the inward pull of its own gravity. This balance results in a state called hydrostatic equilibrium, which gives the Sun its spherical shape.
            However, the Sun is not a perfect sphere. It rotates faster at its equator than at its poles, causing a slight bulge at the equator and flattening at the poles. This shape is known as an oblate spheroid. The difference in diameter between the Sun's equator and poles is about 10 kilometers (6.2 miles), which is very small compared to its overall size.
            The Sun's size and shape have been measured using various techniques, including:
            1. Solar eclipses: By measuring the size of the Moon's shadow on the Earth during a total solar eclipse, astronomers can calculate the relative sizes of the Sun and Moon.
            2. Helioseismology: By studying the vibrations on the Sun's surface, scientists can infer its internal structure and size.
            3. Spacecraft measurements: Space-based instruments, such as the Solar and Heliospheric Observatory (SOHO), have made precise measurements of the Sun's size and shape.
            Understanding the Sun's size and shape is important for modeling its internal structure, dynamics, and evolution, as well as its interactions with the Earth and other objects in the solar system.
        </p>
    `,
};

function onPointerClick(event) {
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

   

    if (intersects.length > 0) {
        toggleSidebar();

        const sidebarContent = document.querySelector('.sidebar-content');
        const clickedObjectName = intersects[0].object.name;

        // Check if the clicked object name exists in the sidebarContentMap
        if (clickedObjectName in sidebarContentMap) {
            sidebarContent.innerHTML = sidebarContentMap[clickedObjectName];
        } else {
            sidebarContent.innerHTML = '<h3>Object Information</h3><p>This is the information about the clicked object.</p>';
        }
    }

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


function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    sidebar.classList.toggle('open');
    content.classList.toggle('open');
}
  

init();
animate();

document.addEventListener('pointermove', onPointerMove);
document.addEventListener('click', onPointerClick);
