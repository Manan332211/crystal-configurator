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
            // Processing resolution (ULTRA high density for photorealism)
            const detail = 250;
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
            const maxDimension = 1.6;
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

                    // Ignore transparent pixels to isolate subject
                    if (a < 10) continue;

                    // True Grayscale Luminance (0 to 1)
                    const gray = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
                    
                    // Skip near-black pixels (crystal remains hollow where it is dark)
                    if (gray < 0.05) continue;

                    // Probability Dithering: Darker pixels have a higher chance of being skipped 
                    // This is the core secret of laser engraving: shading is achieved by fewer points!
                    if (Math.random() > Math.pow(gray, 0.7)) continue;

                    // Normalized positions -0.5 to 0.5
                    const nx = x / canvas.width - 0.5;
                    const ny = y / canvas.height - 0.5;

                    const posX = nx * planeWidth;
                    const posY = -(ny * planeHeight); 
                    
                    // 1. Pure Lithophane Shape-From-Shading (No artificial curves/eggs!)
                    // The depth strictly follows the lighting of the photograph.
                    // This creates a flat back with a perfectly sculpted 3D front face exactly like the reference.
                    const finalZ = gray * 0.3; // Total extrusion depth

                    // 2. Volumetric Layers (Density creates shading)
                    // Bright areas generate points very deep into the crystal (Solid white blocks)
                    // Dark areas generate fewer layers (thin dust)
                    const maxLayers = 6;
                    const activeLayers = Math.max(1, Math.ceil(gray * maxLayers)); 

                    for (let p = 0; p < activeLayers; p++) {
                        // Spread points backward into the block
                        const depthOffset = -(p * 0.015);
                        
                        // Jitter scatters the points for an organic laser fracture look
                        const jX = (Math.random() - 0.5) * 0.003;
                        const jY = (Math.random() - 0.5) * 0.003;
                        const jZ = (Math.random() - 0.5) * 0.003;

                        positions.push(posX + jX, posY + jY, finalZ + depthOffset + jZ);

                        // True laser burns are ALWAYS white/warm-white, NOT gray/black
                        // We lightly tint deeper points to sell the illusion of depth shadowing
                        const shadowFade = 1.0 - (p * 0.1);
                        colors.push(
                            1.0 * shadowFade,             // R: Full white
                            0.98 * shadowFade,            // G: Slightly warm
                            0.96 * shadowFade             // B: Warm laser dust
                        );
                    }
                }
            }

            pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const pointsMat = new THREE.PointsMaterial({
                size: 0.003, // Smallest size for max fidelity
                vertexColors: true,
                transparent: false // Solid opaque rendering so it refracts properly
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