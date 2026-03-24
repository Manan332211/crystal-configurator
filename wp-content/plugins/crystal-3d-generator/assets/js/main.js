let scene, camera, renderer, crystal, imagePlane, controls;
let currentMode = 'standard'; // 'standard' or 'laser'
let originalImageDataUrl = null;
let currentImageDataUrl = null;
let pointCloudObj = null;

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

    // Lighting for that "Real Crystal" look - Using Warm White lights!
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Front Warm Point Light
    const pointLight = new THREE.PointLight(0xffefd5, 2.5); // Papaya Whip / warm white
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Back Warm Light for rim lighting the crystal and highlighting interior
    const backLight = new THREE.PointLight(0xffeebb, 2.0);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

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
        currentImageDataUrl = event.target.result;

        // Uncheck remove background when a new file is uploaded
        document.getElementById('removeBg').checked = false;

        updateCrystalImage(originalImageDataUrl);
    };
    reader.readAsDataURL(file);
});

// BACKGROUND REMOVAL LOGIC
document.getElementById('removeBg').addEventListener('change', function (e) {
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
    currentImageDataUrl = dataUrl;
    const img = new Image();
    img.onload = function () {
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
        if (!currentImageDataUrl) return;

        const img = new Image();
        img.onload = function () {
            // Processing resolution (higher = much more dense points, clearer photo)
            const detail = 180;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const hwRatio = img.height / img.width;
            canvas.width = detail;
            canvas.height = Math.floor(detail * hwRatio);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            const pointsGeo = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];

            // Match sizing logic from createImageInsideCrystal
            const maxDimension = 1.8;
            let planeWidth = maxDimension;
            let planeHeight = maxDimension;
            if (img.width > img.height) {
                planeHeight = maxDimension * hwRatio;
            } else {
                planeWidth = maxDimension / hwRatio;
            }

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const r = imgData[idx];
                    const g = imgData[idx + 1];
                    const b = imgData[idx + 2];
                    const a = imgData[idx + 3];

                    // Ignore highly transparent pixels
                    if (a < 20) continue;

                    const brightness = (r + g + b) / (3 * 255);
                    // Skip nearly black pixels entirely (shadows don't engrave)
                    if (brightness < 0.05) continue;

                    // Normalized positions -0.5 to 0.5
                    const nx = x / canvas.width - 0.5;
                    const ny = y / canvas.height - 0.5;

                    const posX = nx * planeWidth;
                    const posY = -ny * planeHeight; 
                    
                    // 1. Smooth Geometric Bulge (Fakes a 3D bust/head curve)
                    const bulgeScale = 0.25; 
                    let bulge = Math.max(0, Math.cos(Math.abs(nx) * Math.PI)); // horizontal curve
                    bulge *= Math.max(0, Math.cos(Math.abs(ny) * Math.PI * 0.8)); // vertical curve
                    bulge *= bulgeScale;

                    // 2. Volumetric Extrusion
                    // Brighter pixels get engraved deeper and denser into the block
                    const thickness = brightness * 0.25; 
                    const numPoints = Math.floor(brightness * 6) + 1; 

                    for (let p = 0; p < numPoints; p++) {
                        // Scatter points to look like organic laser fractures
                        const jitterX = (Math.random() - 0.5) * 0.005;
                        const jitterY = (Math.random() - 0.5) * 0.005;
                        const jitterZ = (Math.random() - 0.5) * 0.005;
                        
                        // Push points backward to create volume
                        const depthOffset = -(p / numPoints) * thickness;
                        const finalZ = bulge + depthOffset;

                        positions.push(posX + jitterX, posY + jitterY, finalZ + jitterZ);

                        // Warm white variations
                        const tintVal = 0.85 + (Math.random() * 0.15);
                        colors.push(1.0, tintVal, tintVal - 0.05);
                    }
                }
            }

            pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const pointsMat = new THREE.PointsMaterial({
                size: 0.003, // Smaller point size for denser clouds
                vertexColors: true,
                transparent: false // Must be opaque to refract properly
            });

            pointCloudObj = new THREE.Points(pointsGeo, pointsMat);
            
            // Hide standard image, show point cloud
            if (imagePlane) crystal.remove(imagePlane);
            crystal.add(pointCloudObj);

            document.querySelector('#step-3 button').innerText = "View Standard Photo";
            currentMode = 'laser';
        };
        img.src = currentImageDataUrl;
    } else {
        // Switch back to standard mode
        if (pointCloudObj) crystal.remove(pointCloudObj);
        updateCrystalImage(currentImageDataUrl);
        document.querySelector('#step-3 button').innerText = "View Laser Engraved (3D Print)";
        currentMode = 'standard';
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