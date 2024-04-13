import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";
import {
    OrbitControls
} from "https://web.cs.manchester.ac.uk/three/three.js-master/examples/jsm/controls/OrbitControls.js";

import Albedo from "./assets/Albedo.jpg"
import sunmap from "./assets/sunmap.jpg"
import venusmap from "./assets/venusmap.jpg"

const albedoMap = await loadTexture(Albedo)
albedoMap.colorSpace = THREE.SRGBColorSpace

const Sunmap = await loadTexture(sunmap)
Sunmap.colorSpace = THREE.SRGBColorSpace

const Venusmap = await loadTexture(venusmap)
Venusmap.colorSpace = THREE.SRGBColorSpace

const MoonTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg');

import { loadTexture } from "./common_utils.js"

// Create and interactive solar system representation

// Global variables
let scene, camera, renderer, controls;

let sunGeometry, sunMaterial, sunMesh, sunOrbitCurve, sunLight;
let earthGeometry, earthMaterial, earthMesh, earthOrbitCurve;
let moonGeometry, moonMaterial, moonMesh, moonOrbitCurve;
let flatEarthGeometry, flatEarthMaterial;
let venusGeometry, venusMaterial, venusMesh, venusOrbitCurve, venusOrbit;
let venusTail = [];

let orbitCounter = [];

let geocentricFlag = true;
let flatEarthFlag = true;
let sunNearbyFlag = true;
let bigMoonFlag = true;

let inTutorial = false;

let sunEarthDistance = 400;

let earthSystem;

let animationSpeed = 1;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();




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

    // Z-index

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
    sunGeometry = new THREE.SphereGeometry(75, 400, 200);
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

    // Venus
    venusGeometry = new THREE.SphereGeometry(50, 50, 50);
    venusMaterial = new THREE.MeshPhongMaterial({
        //color: 0xff0000,
        map: Venusmap
    });
    venusMesh = new THREE.Mesh(venusGeometry, venusMaterial);

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
    scene.add(venusMesh);

    // Create the orbit curves
    earthOrbitCurve = new THREE.EllipseCurve(0, 0, sunEarthDistance, sunEarthDistance, 0, 2 * Math.PI, false, 0);
    moonOrbitCurve = new THREE.EllipseCurve(0, 0, 60, 60, 0, 2 * Math.PI, false, 0);
    sunOrbitCurve = new THREE.EllipseCurve(0, 0, 0, 0, 0, 2 * Math.PI, false, 0);
    venusOrbitCurve = new THREE.EllipseCurve(0, 0, 700, 700, 0, 2 * Math.PI, false, 0);


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
    venusOrbit = draw_orbit(venusOrbitCurve, 0x888888);
    scene.add(earthOrbit);
    earthSystem.add(moonOrbit);
    scene.add(sunOrbit);
    scene.add(venusOrbit);

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

    if (animationSpeed !== 0) {
        const time = 0.00001 * performance.now();
        const t = time % 1;
        const point = earthOrbitCurve.getPoint(animationSpeed * t);
        const point_mn = moonOrbitCurve.getPoint(animationSpeed * t * 10 + 0.5);
        const point_sn = sunOrbitCurve.getPoint(animationSpeed * t);
        const point_vn = venusOrbitCurve.getPoint(animationSpeed * t * 0.2 + 0.75);
        earthSystem.position.set(point.x, 0, point.y);
        moonMesh.position.set(point_mn.x, 0, point_mn.y);
        sunMesh.position.set(point_sn.x, 0, point_sn.y);
        sunLight.position.copy(sunMesh.position);
        venusMesh.position.set(point_vn.x, 0, point_vn.y);

        if (animationSpeed === 30) {

            // zoom the camera on the earth
            const earthPosition = earthSystem.position;
            const venusPosition = venusMesh.position;
            camera.position.set(earthPosition.x, earthPosition.y + 26, earthPosition.z);
            // point the camera to the venus
            camera.lookAt(venusPosition);

            // make the controls center on the earth
            controls.target = earthPosition;
        }
    }

    //erathostenes();


    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// add function to display earth radius measurement of eratosthenes experiment

function erathostenes() {
    // add two poles to the surface of the earth, each perpendicular to the surface
    // they should be at the same longitude, but different latitude
    // add lines from the far tips of the poles towards the sun to represent the sun rays

    // create the poles using THREE.Line

    const pole1Geometry = new THREE.Geometry();
    const pole2Geometry = new THREE.Geometry();
    // one vertex at the center of the earth system
    const earthSystemCenter = earthSystem.position;
    pole1Geometry.vertices.push(earthSystemCenter);
    pole2Geometry.vertices.push(earthSystemCenter);
    // one vertex towards the sun, 30 units away from the center
    // for this calculate earh system to sun direction vector
    const sunPosition = sunMesh.position;
    console.log(sunPosition);
    const sunDirection = new THREE.Vector3(
        sunPosition.x - earthSystemCenter.x,
        sunPosition.y - earthSystemCenter.y,
        sunPosition.z - earthSystemCenter.z
    ).normalize().multiplyScalar(30);
    pole1Geometry.vertices.push(new THREE.Vector3().addVectors(earthSystemCenter, sunDirection));
    // pole2 is rotated up by 30 degrees
    const pole2Direction = sunDirection.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 5);
    pole2Geometry.vertices.push(new THREE.Vector3().addVectors(earthSystemCenter, pole2Direction));

    const poleMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
    const pole1 = new THREE.Line(pole1Geometry, poleMaterial);
    const pole2 = new THREE.Line(pole2Geometry, poleMaterial);

    // add the sun rays
    const sunRay1Geometry = new THREE.Geometry();
    // starts at the centre of sun
    console.log(sunMesh.position);
    sunRay1Geometry.vertices.push(sunMesh.position);
    // vector to the tip of the pole1
    let p1Vector = new THREE.Vector3().subVectors(pole1Geometry.vertices[1], sunMesh.position);
    // make the vector 10 units longer
    p1Vector.add(p1Vector.clone().normalize().multiplyScalar(10));
    sunRay1Geometry.vertices.push(new THREE.Vector3().addVectors(sunMesh.position, p1Vector));
    const sunRay1Material = new THREE.LineBasicMaterial({color: 0xffff00});
    const sunRay1 = new THREE.Line(sunRay1Geometry, sunRay1Material);

    const sunRay2Geometry = new THREE.Geometry();
    sunRay2Geometry.vertices.push(sunMesh.position);
    let p2Vector = new THREE.Vector3().subVectors(pole2Geometry.vertices[1], sunMesh.position);
    p2Vector.add(p2Vector.clone().normalize().multiplyScalar(10));
    sunRay2Geometry.vertices.push(new THREE.Vector3().addVectors(sunMesh.position, p2Vector));
    const sunRay2Material = new THREE.LineBasicMaterial({color: 0xffff00});
    const sunRay2 = new THREE.Line(sunRay2Geometry, sunRay2Material);

    // add the elements to the scene
    scene.add(pole1);
    scene.add(pole2);
    scene.add(sunRay1);
    scene.add(sunRay2);






    // return all the elements created
    return [pole1, pole2, sunRay1, sunRay2];
}

// add function to display sun earth distance measurement of aristarchus experiment

function aristarchus() {
    return [];
}

// add function to display what things are rotating around what of copernicus experiment

function copernicus() {
    // retrograde visualisation
    moonMesh.visible = false;

    let ticks = [];

    // add a dashed orbit line outside the venus ring
    const postVenusOrbitCurve = new THREE.EllipseCurve(0, 0, 1600, 1600, 0, 2 * Math.PI, false, 0);
    const postVenusOrbit = draw_orbit(postVenusOrbitCurve, 0x888888);

    scene.add(postVenusOrbit);

    // add 180 thick ticks evenly on postVenusOrbit
    const postVenusOrbitPoints = postVenusOrbitCurve.getPoints(45);
    // the ticks are 100 units long and 50 units radius, use cylinder geometry, and they are vertical
    const tickGeometry = new THREE.CylinderGeometry(50, 50, 500, 32);
    const tickMaterial = new THREE.MeshBasicMaterial({color: 0x444444});
    for (let i = 0; i < 45; i++) {
        const tickMesh = new THREE.Mesh(tickGeometry, tickMaterial);
        tickMesh.position.set(postVenusOrbitPoints[i].x, 0, postVenusOrbitPoints[i].y);
        scene.add(tickMesh);
        ticks.push(tickMesh);
    }


    return [postVenusOrbit, ...ticks];
}

// add function to display moon radius measurement of moonmoon experiment

function moonmoon() {

    moonMesh.visible = false;

    // calculate sun earth vector
    const sunPosition = sunMesh.position;
    const earthPosition = earthSystem.position;
    const sunEarthVector = new THREE.Vector3(
        - sunPosition.x + earthPosition.x,
        - sunPosition.y + earthPosition.y,
        - sunPosition.z + earthPosition.z
    );

    // add five decoy moons: one just opposite of the sun, one 45 degrees to the right, one 45 degrees to the left
    // the moons are on their usual orbit

    // create the decoy moons
    const moonGeometry = new THREE.SphereGeometry(6, 50, 50);
    const moonMaterial = new THREE.MeshPhongMaterial({
        //color: 0x808080,
        map: MoonTexture
    });
    const moonMaterialInner = new THREE.MeshPhongMaterial({
        color: 0x606060,
        map: MoonTexture
    });
    const moonMaterialMiddle = new THREE.MeshPhongMaterial({
        color: 0x202020,
        map: MoonTexture
    });

    const moon1 = new THREE.Mesh(moonGeometry, moonMaterial);
    const moon2 = new THREE.Mesh(moonGeometry, moonMaterialInner);
    const moon3 = new THREE.Mesh(moonGeometry, moonMaterialMiddle);
    const moon4 = new THREE.Mesh(moonGeometry, moonMaterialInner);
    const moon5 = new THREE.Mesh(moonGeometry, moonMaterial);

    // calculate the positions of the moons
    let moonOrbitRadius = 60;
    if (geocentricFlag) {
        moonOrbitRadius = 120;
    }

    const moon1Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 2 * Math.PI / 6).multiplyScalar(moonOrbitRadius));
    const moon2Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6).multiplyScalar(moonOrbitRadius));
    const moon3Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius));
    const moon4Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 6).multiplyScalar(moonOrbitRadius));
    const moon5Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -2 * Math.PI / 6).multiplyScalar(moonOrbitRadius));


    // set the positions of the moons
    moon1.position.set(moon1Position.x, moon1Position.y, moon1Position.z);
    moon2.position.set(moon2Position.x, moon2Position.y, moon2Position.z);
    moon3.position.set(moon3Position.x, moon3Position.y, moon3Position.z);
    moon4.position.set(moon4Position.x, moon4Position.y, moon4Position.z);
    moon5.position.set(moon5Position.x, moon5Position.y, moon5Position.z);

    // add the moons to the scene
    scene.add(moon1);
    scene.add(moon2);
    scene.add(moon3);
    scene.add(moon4);
    scene.add(moon5);

    return [moon1, moon2, moon3, moon4, moon5];
}

// zoom on the earth and display measurements
function displayMeasurement(experiment) {
    // freeze the animation
    animationSpeed = 0;
    if (experiment === 'copernicus') {
        animationSpeed = 30;
    }
    // zoom the camera on the earth
    const earthPosition = earthSystem.position;
    console.log(experiment);
    camera.position.set(earthPosition.x, earthPosition.y + 50, earthPosition.z + 50);
    // point the camera to the earth
    camera.lookAt(earthPosition);

    // make the controls center on the earth
    controls.target = earthPosition;
    //controls.update();

    inTutorial = true;

    let toDelete = [];

    switch (experiment) {
        case 'erathosthenes':
            toDelete = erathostenes();
            break;
        case 'aristarchus':
            // display the distance between the sun and the earth
            toDelete = aristarchus();
            break;
        case 'copernicus':
            // display what things are rotating around what
            toDelete = copernicus();
            break;
        case 'moonmoon':
            // display the radius of the moon
            toDelete = moonmoon();
            break;
    }

    // if escape is pressed, return to the original view then continue the animation
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            animationSpeed = 1;
            camera.position.set(0, 30, 500);
            camera.lookAt(0, 0, 0);
            controls.target = new THREE.Vector3(0, 0, 0);
            controls.update();

            // remove the elements created
            for (let i = 0; i < toDelete.length; i++) {
                earthSystem.remove(toDelete[i]);
                scene.remove(toDelete[i]);
            }

            moonMesh.visible = true;

            inTutorial = false;
        }
    });
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
        if (!inTutorial && (intersects[i].object.name === 'earth' || intersects[i].object.name === 'flat_earth')) {
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
            displayMeasurement('erathosthenes');
        }
        // if the object is the sun, toggle the sun nearby flag
        if (!inTutorial && (intersects[i].object.name === 'sun' && !geocentricFlag)) {
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
            scene.add(venusOrbit);

            displayMeasurement('aristarchus');

        }
        // if the object the sun at the start, toggle the geocentric flag
        if (!inTutorial && (intersects[i].object.name === 'sun' && geocentricFlag)) {
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
            scene.add(venusOrbit);

            displayMeasurement('copernicus');
        }

        if (!inTutorial && (intersects[i].object.name === 'moon')) {
            bigMoonFlag = !bigMoonFlag;
            const moonPosition = moonMesh.position;
            // apply the change
            if (bigMoonFlag) {
                moonGeometry = new THREE.SphereGeometry(15, 50, 50);
            } else {
                moonGeometry = new THREE.SphereGeometry(6, 50, 50);
            }
            moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            moonMesh.name = 'moon';
            // get the position of the moon

            earthSystem.remove(earthSystem.getObjectByName('moon'));
            earthSystem.add(moonMesh);
            moonMesh.position.set(moonPosition.x, moonPosition.y, moonPosition.z);

            displayMeasurement('moonmoon');
        }
    }
}


init();
animate();

document.addEventListener('pointermove', onPointerMove);
document.addEventListener('click', onPointerClick);
