<div id="crystal-container">
    <div id="ui-overlay">
        <div id="step-1" class="step">
            <h3>Select Your Crystal Shape</h3>
            <button onclick="setShape('diamond')">Diamond</button>
            <button onclick="setShape('cube')">Cube</button>
            <button onclick="setShape('sphere')">Sphere</button>
        </div>

        <div id="step-2" class="step" style="display:none;">
            <input type="file" id="imageUpload" accept="image/*">
            <div style="margin-top: 15px;">
                <label for="removeBg">Remove Background? <input type="checkbox" id="removeBg"></label>
            </div>
            <div id="bg-loading" style="display:none; color: #ffeb3b; margin-top: 10px; font-weight: bold;">Removing Background... Please wait...</div>
        </div>

        <div id="step-3" class="step" style="display:none;">
            <button onclick="toggle3DPrint()">View Laser Engraved (3D Print)</button>
        </div>
    </div>
    <div id="threejs-canvas"></div>
</div>