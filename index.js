import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var container, scene, camera, renderer, controls;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock;

var movingCube;
var collideMeshList = [];
var cubes = [];
var message = document.getElementById("message");
var crash = false;
var score = 0;
var scoreText = document.getElementById("score");
var id = 0;
var crashId = " ";
var lastCrashId = " ";
var stats;

init();
animate();

function init() {
    scene = new THREE.Scene();
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 1, 20000);
    camera.position.set(0, 170, 400);

    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({ antialias: true });
    } else {
        renderer = new THREE.CanvasRenderer();
    }
    renderer.setSize(screenWidth * 0.85, screenHeight * 0.85);
    container = document.getElementById("ThreeJS");
    container.appendChild(renderer.domElement);

    THREEx.WindowResize(renderer, camera);
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-250, -1, -3000));
    geometry.vertices.push(new THREE.Vector3(-300, -1, 200));
    material = new THREE.LineBasicMaterial({
        color: 0x6699FF, linewidth: 5, fog: true
    });
    var line1 = new THREE.Line(geometry, material);
    scene.add(line1);
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(250, -1, -3000));
    geometry.vertices.push(new THREE.Vector3(300, -1, 200));
    var line2 = new THREE.Line(geometry, material);
    scene.add(line2);

    // var cubeGeometry = new THREE.CubeGeometry(50, 25, 60, 5, 5, 5);
    // var wireMaterial = new THREE.MeshBasicMaterial({
    //     color: 0x00ff00,
    // });


    // movingCube = new THREE.Mesh(cubeGeometry, wireMaterial);
    // movingCube.position.set(0, 25, -20);
    // scene.add(movingCube);
    const loader = new GLTFLoader();
    loader.load('./js/models/Motorcycle.glb', function(gltf) {
        movingCube = gltf.scene;
        movingCube.position.set(0, 25, -20); // Adjust position as needed
        movingCube.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
        scene.add(movingCube);
    });
}

function animate() {

    requestAnimationFrame(animate);

    var delta = clock.getDelta(); // Clock is already defined in your code

    if (mixer) mixer.update(delta); // Update the animation mixer if it's defined

    update();
    renderer.render(scene, camera);

}

function update() {
    var delta = clock.getDelta();
    var moveDistance = 200 * delta;
    var rotateAngle = Math.PI / 2 * delta;

    if (keyboard.pressed("left") || keyboard.pressed("A")) {
        if (movingCube.position.x > -270)
            movingCube.position.x -= moveDistance;
        if (camera.position.x > -150) {
            camera.position.x -= moveDistance * 0.6;
            if (camera.rotation.z > -5 * Math.PI / 180) {
                camera.rotation.z -= 0.2 * Math.PI / 180;
            }
        }
    }
    if (keyboard.pressed("right") || keyboard.pressed("D")) {
        if (movingCube.position.x < 270)
            movingCube.position.x += moveDistance;
        if (camera.position.x < 150) {
            camera.position.x += moveDistance * 0.6;
            if (camera.rotation.z < 5 * Math.PI / 180) {
                camera.rotation.z += 0.2 * Math.PI / 180;
            }
        }
    }
    if (keyboard.pressed("up") || keyboard.pressed("W")) {
        if (movingCube.position.z > -400) {
            movingCube.position.z -= moveDistance
        }
    }
    if (keyboard.pressed("down") || keyboard.pressed("S")) {
        if (movingCube.position.z < 20) {
            movingCube.position.z += moveDistance
        }
    }

    if (!(keyboard.pressed("left") || keyboard.pressed("right") ||
        keyboard.pressed("A") || keyboard.pressed("D"))) {
        delta = camera.rotation.z;
        camera.rotation.z -= delta / 10;
    }

    var originPoint = movingCube.position.clone();

    for (var vertexIndex = 0; vertexIndex < movingCube.geometry.vertices.length; vertexIndex++) {
        var localVertex = movingCube.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(movingCube.matrix);
        var directionVector = globalVertex.sub(movingCube.position);

        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(collideMeshList);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            crash = true;
            crashId = collisionResults[0].object.name;
            break;
        }
        crash = false;
    }

    if (crash) {
        movingCube.material.color.setHex(0x346386);
        console.log("Crash");
        if (crashId !== lastCrashId) {
            score -= 100;
            lastCrashId = crashId;
        }

        document.getElementById('explode_sound').play()
    } else {
        movingCube.material.color.setHex(0x00ff00);
    }

    if (Math.random() < 0.03 && cubes.length < 30) {
        makeRandomCube();
    }

    for (i = 0; i < cubes.length; i++) {
        if (cubes[i].position.z > camera.position.z) {
            scene.remove(cubes[i]);
            cubes.splice(i, 1);
            collideMeshList.splice(i, 1);
        } else {
            cubes[i].position.z += 10;
        }
    }

    score += 0.1;
    scoreText.innerText = "Score:" + Math.floor(score);

}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


var difficulty = 1; // Global difficulty factor

function makeRandomCube() {
    // Adjust cube size based on difficulty
    var a = (1 * 50) / difficulty,
        b = (getRandomInt(1, 3) * 50) / difficulty,
        c = (1 * 50) / difficulty;

    var geometry = new THREE.CubeGeometry(a, b, c);
    var material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        size: 3
    });

    var object = new THREE.Mesh(geometry, material);
    var box = new THREE.BoxHelper(object);
    box.material.color.setHex(0xff0000);

    // Adjust position more randomly as difficulty increases
    box.position.x = getRandomArbitrary(-250 * difficulty, 250 * difficulty);
    box.position.y = 1 + b / 2;
    box.position.z = getRandomArbitrary(-1200 * difficulty, -1400 * difficulty);
    cubes.push(box);
    box.name = "box_" + id;
    id++;
    collideMeshList.push(box);

    scene.add(box);
}

// Example function to increase difficulty over time
function increaseDifficulty() {
    difficulty += 0.1; // Increase difficulty factor slightly
}

// Call this function periodically, e.g., every minute or after certain events
setInterval(increaseDifficulty, 60000); // Increase difficulty every 60 seconds