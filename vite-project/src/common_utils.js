import * as THREE from "https://web.cs.manchester.ac.uk/three/three.js-master/build/three.module.js";


export const loadTexture = async (url) => {
    let textureLoader = new THREE.TextureLoader()
    return new Promise(resolve => {
        textureLoader.load(url, texture => {
            resolve(texture)
        })
    })
}