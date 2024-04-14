
import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
import {
    OrbitControls
} from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

import Albedo from "./assets/Albedo.jpg"
import sunmap from "./assets/sunmap.jpg"
//import Eclipses from "./assests/Eclipses.png" 


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
            <strong>
                <p>How large is the Earth?</p>
            </strong>
            <p>

            <p>An estimate for the circumference of the Earth was made over two thousand years ago by an ancient Greek polymath named Eratosthenes of Cyrene with just two poles. By measuring the angle of the shadow cast by two poles standing perfectly straight on the ground in two different locations, he was able to calculate the size of the Earth.
It goes as follows:</p>
<p>
<p>
<br>
            <img src="public/Triangles_copy.jpg" alt="Description of the image" width="300" height="200">
</p>
Assuming the Earth is a sphere, consider the rays of light coming from the sun. Imagine there are two poles placed straight up from the ground at two different cities where one is directly south from the other. Because of the Earth’s curvature which itself is because the Earth is a sphere, each pole will cast a slightly different shadow on the ground depending on how close it is to the equator. At the equator, there will be no shadow, at the poles there will only be shadow. 
Using some straightforward maths, you can get the “angle” of the shadow. The difference between the angle of this shadow in the poles, compared to the equator is 90 degrees, corresponding to having travelled a quarter of the way around a circle or a sphere. So, if the difference in the shadows is 3.6 degrees, then you will have travelled a 100th of the Earth’s total circumference. Multiplying the distance between the two cities by 100 will give you the total circumference of the planet! </p>
This method led Eratosthenes to estimate the circumference of the Earth to be 40,320km which is remarkably close to today’s known value of 40,007km measured with far more advanced tools.
Note that to do this for yourself you would need to do these measurements at noon (when the Sun is at the highest point in the sky) on the summer solstice (the longest day of the year).
            
            </p>
        </p>
    `,
    flat_earth: `
        <h3>Flat Earth</h3>
        <p>
            <strong>can you see the mount everest?</strong>
            <strong>What is wrong with this model?</strong>
            <strong>
                <p>But what is more important is that what made people get stuck with this for centuries? how scietific thinking overcome this fallacy</p>
            </strong>
            <p> Story: In ancient Miletus, Thales, a wise philosopher, believed the Earth was a flat disk floating on water. One evening, his pupil Anaximander, brimming with bold ideas, proposed a challenging hypothesis.

            "Master," Anaximander said, "what if the Earth hangs suspended in the void, not floating on water, and is cylindrical in form?"
            
            Thales, intrigued and open-minded, welcomed Anaximander's daring thought. "Your vision is grand. Let us explore these mysteries together, for it is through questioning that we uncover truth."
            
            Thus, in the heart of Miletus, a new philosophical inquiry was born, pushing the boundaries of ancient understanding of the cosmos.</p>
            
            
            <br>
            <img src="public/Triangles_copy.jpg" alt="Description of the image" width="300" height="200">
            
        </p>
       

    `,
    sun: `
        <h3>Sun</h3>
        <p>
            
            <strong>
                <p>How do we know the sun is in the center of the solar system</p>
            </strong>
            <p>
            <p>The idea of a geocentric universe, one where the earth is at the centre of everything doesn’t sound completely crazy at first. Looking up at the sky, everything appears to move around the Earth, the Sun, the Moon and the stars. It also might feel nice to think that everything revolves around you. </p>
            <p>There are small problems with viewing the universe in this way. One of them was the “retrograde” motion of the planets. If you record the movement of Venus for example, through the sky, you will see it travel in one direction and then appear to reverse for some time before continuing to move in the original direction. </p>
            Problem:
            The Sun and the Moon always move in the same direction at the same speed. This is easily explainable by saying the move around the Earth. However, the planets move backwards and forwards in a way that doesn’t make any sense if they’re on a fixed orbit around the Earth.
            What would you do to fix this?
            Solution:
            A proposed solution back then was to have the planets move in a circle around their own orbit. Imagine it as a wheel on a wheel. This would provide a way for people back then to explain the retrograde motion of the planets. However, there were still problems with this solution. Over time, predictions would be inaccurate, and the model had another layer of complexity making it difficult to understand.

    A man named Copernicus argued for a simpler model: heliocentrism. The planets in the sky all orbit the sun as opposed to the Earth. It would simplify the overall model greatly and provided more elegant answers to certain phenomena such as the retrograde motion of planets. It was however, not received terribly well as it relied on placing the planets in perfectly circular orbits around the Sun which resulted in the model not being able to predict the motion of the planets any more accurately than the preexisting geocentric model.
    It was two advancements that spelled trouble for the egocentricity. Firstly, Galileo’s telescope allowed him to make certain observations such as the phases of Venus which would only be explained by Venus orbiting the Sun instead of the Earth as well as the discovery of Jupiter’s moons which cast doubt on the notion that the Earth was the only thing other bodies could orbit.
    Lastly, Kepler’s laws and Newton’s theory of gravitation gave far more accurate predictions of the planets orbits than any other previous model and relied on the Sun being at the centre of the solar system, driving the last nail in the coffin for egocentricity (at least in the scientific world).
            </p>

            <br>
            <img src="public/SunDistance.png" alt="Description of the image" width="300" height="200">
        </p>
    `,
    moon: `
    <h3>Moon</h3>
    <p>
        <strong>---Circumference---</strong>
        <strong>
            <p>Question 1</p>
        </strong>
        <p>Explanation with examples</p>

        <br>
        <img src="public/Eclipses.png" alt="Description of the image" width="300" height="200">
    </p>
`
,
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
