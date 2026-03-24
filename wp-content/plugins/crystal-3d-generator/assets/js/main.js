let scene, camera, renderer, crystal, imagePlane, controls;
let currentMode = 'standard'; // 'standard' or 'laser'

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 600, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, 600);
    document.getElementById('threejs-canvas').appendChild(renderer.domElement);

    // Lighting for that "Real Crystal" look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;
    animate();
}

function setShape(type) {
    if (crystal) scene.remove(crystal);

    let geometry;
    if (type === 'diamond') {
        geometry = new THREE.OctahedronGeometry(2, 0);
    } else if (type === 'cube') {
        geometry = new THREE.BoxGeometry(2, 2, 2);
    } else {
        // Heart shape would require a custom ExtrudeGeometry or GLTF load
        geometry = new THREE.SphereGeometry(1.5, 32, 32);
    }

    // Physical Material for refraction/shining edges
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.9, // Transparency
        thickness: 0.5,
        envMapIntensity: 1,
        clearcoat: 1
    });

    crystal = new THREE.Mesh(geometry, material);
    scene.add(crystal);

    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
}

// IMAGE LOADING & 3D ENGRAVING LOGIC
document.getElementById('imageUpload').addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const texture = new THREE.TextureLoader().load(event.target.result);
        createImageInsideCrystal(texture);
    };
    reader.readAsDataURL(e.target.files[0]);
});

function createImageInsideCrystal(texture) {
    const geo = new THREE.PlaneGeometry(1.5, 1.5);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    imagePlane = new THREE.Mesh(geo, mat);

    // Nest the image inside the crystal group
    crystal.add(imagePlane);
    document.getElementById('step-3').style.display = 'block';
}

// THE "PRO" LASER ENGRAVING EFFECT (Point Cloud)
function toggle3DPrint() {
    if (currentMode === 'standard') {
        // Convert the imagePlane into a Point Cloud
        const width = 64, height = 64; // Resolution of "dots"
        const pointsGeo = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let i = 0; i < width * height; i++) {
            // Logic to map image brightness to Z-depth (the 3D Engrave look)
            let x = (i % width) / width - 0.5;
            let y = Math.floor(i / width) / height - 0.5;
            let z = (Math.random() * 0.1); // Add slight depth based on brightness in real version
            positions.push(x * 2, y * 2, z);
            colors.push(1, 1, 1);
        }

        pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const pointsMat = new THREE.PointsMaterial({ size: 0.02, color: 0xffffff });
        const pointCloud = new THREE.Points(pointsGeo, pointsMat);

        crystal.remove(imagePlane);
        crystal.add(pointCloud);
        currentMode = 'laser';
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (crystal) crystal.rotation.y += 0.005;
    renderer.render(scene, camera);
}