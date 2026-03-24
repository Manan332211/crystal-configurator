let scene, camera, renderer, crystal, imagePlane, controls;
let currentMode = 'standard'; // 'standard' or 'laser'
let originalImageDataUrl = null;

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 600, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, 600);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('threejs-canvas').appendChild(renderer.domElement);

    // Lighting for that "Real Crystal" look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Realistic HDRI-style environment lighting for glass
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

    camera.position.z = 5;

    // Initialize OrbitControls for manual movement
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // adds smooth rotation
    controls.dampingFactor = 0.05;

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

    // Physical Material for realistic refraction/shining edges
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.02,
        transmission: 1, // Full Transparency
        thickness: 1.5,  // Volume thickness for refraction
        ior: 1.5,        // Glass/Crystal index of refraction
        envMapIntensity: 2.0, // Multiplies reflection brightness
        clearcoat: 1,
        clearcoatRoughness: 0.1
    });

    crystal = new THREE.Mesh(geometry, material);
    scene.add(crystal);

    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
}

// IMAGE LOADING & 3D ENGRAVING LOGIC
document.getElementById('imageUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        originalImageDataUrl = event.target.result;
        
        // Uncheck remove background when a new file is uploaded
        document.getElementById('removeBg').checked = false;

        updateCrystalImage(originalImageDataUrl);
    };
    reader.readAsDataURL(file);
});

// BACKGROUND REMOVAL LOGIC
document.getElementById('removeBg').addEventListener('change', function(e) {
    if (!originalImageDataUrl) return;

    if (this.checked) {
        // Show loading indicator
        document.getElementById('bg-loading').style.display = 'block';
        
        fetch(crystalApp.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'remove_background',
                security: crystalApp.nonce,
                image: originalImageDataUrl
            })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('bg-loading').style.display = 'none';
            if (data.success && data.data.url) {
                updateCrystalImage(data.data.url);
            } else {
                alert('Background removal failed: ' + (data.data || 'Try again'));
                this.checked = false; // reset
            }
        })
        .catch(err => {
            document.getElementById('bg-loading').style.display = 'none';
            alert('Error contacting server');
            this.checked = false;
        });
    } else {
        // Revert to original user image
        updateCrystalImage(originalImageDataUrl);
    }
});

function updateCrystalImage(dataUrl) {
    const img = new Image();
    img.onload = function() {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        createImageInsideCrystal(texture, img.width, img.height);
    }
    img.src = dataUrl;
}

function createImageInsideCrystal(texture, width, height) {
    if (imagePlane) crystal.remove(imagePlane); // Remove old image if any

    // Calculate aspect ratio and fit within max bounds
    const maxDimension = 1.8; // safe size inside all shapes
    let planeWidth = maxDimension;
    let planeHeight = maxDimension;

    if (width > height) {
        planeHeight = maxDimension * (height / width);
    } else {
        planeWidth = maxDimension * (width / height);
    }

    const geo = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Using transparent: false and alphaTest ensures the texture is rendered in the 
    // opaque pass, which is required for it to be visible through physical transmission (glass).
    const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        alphaTest: 0.1,  // Allows transparent backgrounds once BG removal is active
        side: THREE.DoubleSide
    });
    imagePlane = new THREE.Mesh(geo, mat);

    // Nest the image inside the crystal center
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

    // Update controls for damping
    if (controls) controls.update();

    // Disabled automatic rotation for manual control
    // if (crystal) crystal.rotation.y += 0.005;

    renderer.render(scene, camera);
}