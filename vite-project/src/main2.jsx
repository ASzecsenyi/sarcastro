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
    //renderer.domElement.style.marginLeft = '25vw';

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;

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
    earthGeometry = new THREE.SphereGeometry(30, 50, 50);
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
    // one vertex towards the sun, 35 units away from the center
    // for this calculate earh system to sun direction vector
    const sunPosition = sunMesh.position;
    console.log(sunPosition);
    const sunDirection = new THREE.Vector3(
        sunPosition.x - earthSystemCenter.x,
        sunPosition.y - earthSystemCenter.y,
        sunPosition.z - earthSystemCenter.z
    ).normalize().multiplyScalar(35);
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

    moonMesh.visible = false;

    // calculate sun earth vector
    const sunPosition = sunMesh.position;
    const earthPosition = earthSystem.position;
    const sunEarthVector = new THREE.Vector3(
        - sunPosition.x + earthPosition.x,
        - sunPosition.y + earthPosition.y,
        - sunPosition.z + earthPosition.z
    );

    // add a decoy moon perpendicular to the sun earth vector, usual num of units away from the earth

    // create the decoy moon
    const moonGeometry = new THREE.SphereGeometry(6, 50, 50);
    const moonMaterial = new THREE.MeshPhongMaterial({
        //color: 0x808080,
        map: MoonTexture
    });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);

    // calculate the positions of the moons
    let moonOrbitRadius = 60;
    if (geocentricFlag) {
        moonOrbitRadius = 120;
    }
    let moonWidth = 6;
    if (bigMoonFlag) {
        moonWidth = 15;
    }

    let earthWidth = 30;
    if (flatEarthFlag) {
        earthWidth = 50;
    }

    let angDiff = Math.PI / 2;


    const moon1Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), angDiff).multiplyScalar(moonOrbitRadius));

    // set the positions of the moon
    moon.position.set(moon1Position.x, moon1Position.y, moon1Position.z);
     // add two horizontal lines that touch the earth on the sides and go further than monnOrbitRadius, and are parallel to the sun earth vector
    const lineMaterial1 = new THREE.LineBasicMaterial({color: 0x0000ff});

    const lineGeometry1 = new THREE.Geometry();
    let p00 = earthPosition
    lineGeometry1.vertices.push(p00);
    let p01 = sunPosition;
    lineGeometry1.vertices.push(p01);
    const line1 = new THREE.Line(lineGeometry1, lineMaterial1);

    const lineGeometry2 = new THREE.Geometry();
    let p10 = earthPosition
    lineGeometry2.vertices.push(p10);
    let p11 = moon1Position;
    lineGeometry2.vertices.push(p11);
    const line2 = new THREE.Line(lineGeometry2, lineMaterial1);

    // add two more lines identical to the previous two but red

    const lineMaterial2 = new THREE.LineBasicMaterial({color: 0xff0000});

    const lineGeometry3 = new THREE.Geometry();
    let p20 = moon1Position
    lineGeometry3.vertices.push(p20);
    let p21 = sunPosition
    lineGeometry3.vertices.push(p21);
    //let p22 = new THREE.Vector3().addVectors(p20, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius*2));
    //p22.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * angDiff * 0.5 * moonOrbitRadius / 120);
    //lineGeometry3.vertices.push(p22);
    const line3 = new THREE.Line(lineGeometry3, lineMaterial2);

    // add the moons to the scene
    scene.add(moon);

    scene.add(line1);
    scene.add(line2);
    scene.add(line3);

    // set the camera position to be earthPosition + sunEarthVector * 2
    camera.position.set(earthPosition.x - sunEarthVector.x * 0.75, earthPosition.y - sunEarthVector.y * 0.75 + earthWidth*2, earthPosition.z - sunEarthVector.z * 0.75);
    // point the camera to the moons
    camera.lookAt(new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius * 2)));


    return [moon, line1, line2, line3];
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

    // add six decoy moons: one just opposite of the sun, one 45 degrees to the right, one 45 degrees to the left
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
    const moon4 = new THREE.Mesh(moonGeometry, moonMaterialMiddle);
    const moon5 = new THREE.Mesh(moonGeometry, moonMaterialInner);
    const moon6 = new THREE.Mesh(moonGeometry, moonMaterial);

    // calculate the positions of the moons
    let moonOrbitRadius = 60;
    if (geocentricFlag) {
        moonOrbitRadius = 120;
    }

    // calculate the angle difference we need between the moons
    // the 2nd and 5th moons must be 4.5 moon widths apart
    let moonWidth = 6;
    if (bigMoonFlag) {
        moonWidth = 15;
    }

    let earthWidth = 30;
    if (flatEarthFlag) {
        earthWidth = 50;
    }

    // angDiff is sin^-1(earthWidth / moonOrbitRadius) / 2
    let angDiff = Math.asin((earthWidth - 1.5*moonWidth) / moonOrbitRadius) / 4;


    const moon1Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * angDiff * 2.5).multiplyScalar(moonOrbitRadius));
    const moon2Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * angDiff * 1.5).multiplyScalar(moonOrbitRadius));
    const moon3Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * angDiff * 0.5).multiplyScalar(moonOrbitRadius));
    const moon4Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * angDiff * 0.5).multiplyScalar(moonOrbitRadius));
    const moon5Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * angDiff * 1.5).multiplyScalar(moonOrbitRadius));
    const moon6Position = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * angDiff * 2.5).multiplyScalar(moonOrbitRadius));


    // set the positions of the moons
    moon1.position.set(moon1Position.x, moon1Position.y, moon1Position.z);
    moon2.position.set(moon2Position.x, moon2Position.y, moon2Position.z);
    moon3.position.set(moon3Position.x, moon3Position.y, moon3Position.z);
    moon4.position.set(moon4Position.x, moon4Position.y, moon4Position.z);
    moon5.position.set(moon5Position.x, moon5Position.y, moon5Position.z);
    moon6.position.set(moon6Position.x, moon6Position.y, moon6Position.z);

    // add two horizontal lines that touch the earth on the sides and go further than monnOrbitRadius, and are parallel to the sun earth vector
    const lineMaterial1 = new THREE.LineBasicMaterial({color: 0x0000ff});

    const lineGeometry1 = new THREE.Geometry();
    let p00 = earthPosition
    // move the point to the surface of the earth
    p00 = new THREE.Vector3().addVectors(p00, sunEarthVector.clone().normalize().multiplyScalar(earthWidth).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
    lineGeometry1.vertices.push(p00);
    let p01 = new THREE.Vector3().addVectors(p00, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius * 2));
    lineGeometry1.vertices.push(p01);
    const line1 = new THREE.Line(lineGeometry1, lineMaterial1);

    const lineGeometry2 = new THREE.Geometry();
    let p10 = earthPosition
    // move the point to the surface of the earth
    p10 = new THREE.Vector3().addVectors(p10, sunEarthVector.clone().normalize().multiplyScalar(-earthWidth).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
    lineGeometry2.vertices.push(p10);
    let p11 = new THREE.Vector3().addVectors(p10, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius * 2));
    lineGeometry2.vertices.push(p11);
    const line2 = new THREE.Line(lineGeometry2, lineMaterial1);

    // add two more lines identical to the previous two but red

    const lineMaterial2 = new THREE.LineBasicMaterial({color: 0xff0000});

    const lineGeometry3 = new THREE.Geometry();
    let p20 = earthPosition
    // move the point to the surface of the earth
    p20 = new THREE.Vector3().addVectors(p20, sunEarthVector.clone().normalize().multiplyScalar(earthWidth).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
    lineGeometry3.vertices.push(p20);
    let p21 = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius * 2));
    lineGeometry3.vertices.push(p21);
    //let p22 = new THREE.Vector3().addVectors(p20, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius*2));
    //p22.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * angDiff * 0.5 * moonOrbitRadius / 120);
    //lineGeometry3.vertices.push(p22);
    const line3 = new THREE.Line(lineGeometry3, lineMaterial2);

    const lineGeometry4 = new THREE.Geometry();
    let p30 = earthPosition
    // move the point to the surface of the earth
    p30 = new THREE.Vector3().addVectors(p30, sunEarthVector.clone().normalize().multiplyScalar(-earthWidth).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
    lineGeometry4.vertices.push(p30);
    let p31 = new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius*2));
    lineGeometry4.vertices.push(p31);
    //let p32 = new THREE.Vector3().addVectors(p30, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius*2));
    //p32.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * angDiff * 0.5 * moonOrbitRadius / 120);
    //lineGeometry4.vertices.push(p32);

    const line4 = new THREE.Line(lineGeometry4, lineMaterial2);

    // add the moons to the scene
    scene.add(moon1);
    scene.add(moon2);
    scene.add(moon3);
    scene.add(moon4);
    scene.add(moon5);
    scene.add(moon6);

    scene.add(line1);
    scene.add(line2);
    scene.add(line3);
    scene.add(line4);

    // set the camera position to be earthPosition + sunEarthVector * 2
    camera.position.set(earthPosition.x - sunEarthVector.x * 0.75, earthPosition.y - sunEarthVector.y * 0.75 + earthWidth*2, earthPosition.z - sunEarthVector.z * 0.75);
    // point the camera to the moons
    camera.lookAt(new THREE.Vector3().addVectors(earthPosition, sunEarthVector.clone().normalize().multiplyScalar(moonOrbitRadius * 2)));


    return [moon1, moon2, moon3, moon4, moon5, moon6, line1, line2, line3, line4];
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

            // call toggleSidebar
            // const sidebar = document.querySelector('.sidebar');
            // const content = document.querySelector('.content');
            // sidebar.classList.toggle('open');
            // content.classList.toggle('open');
            // document.querySelector('.close-btn').style.top = '0px';
            // document.querySelector('.close-btn').style.right = '0px';
        }
    });
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

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    sidebar.classList.toggle('open');
    content.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
        document.querySelector('.close-btn').style.top = '10px';
        document.querySelector('.close-btn').style.right = '10px';
    } else {
        document.querySelector('.close-btn').style.top = '0px';
        document.querySelector('.close-btn').style.right = '0px';
    }
}

function onPointerClick(event) {
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {


        const sidebarContent = document.querySelector('.sidebar-content');
        const clickedObjectName = intersects[0].object.name;

        // Check if the clicked object name exists in the sidebarContentMap
        if (clickedObjectName in sidebarContentMap) {
            sidebarContent.innerHTML = sidebarContentMap[clickedObjectName];
            toggleSidebar();
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
