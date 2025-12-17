// 3D Viewer Component
// Handles 3D model viewing functionality using Three.js

import {
    Scene,
    Color,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    Box3,
    Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    uploadPartViews,
    getPartViewsManifest,
    getPartViewBlobUrl,
} from "../core/api/router.js";

const VIEW_CONFIGS = [
    { name: "front", position: [0, 0, 5], lookAt: [0, 0, 0] },
    { name: "front-right", position: [3.5, 0, 3.5], lookAt: [0, 0, 0] },
    { name: "right", position: [5, 0, 0], lookAt: [0, 0, 0] },
    { name: "back-right", position: [3.5, 0, -3.5], lookAt: [0, 0, 0] },
    { name: "back", position: [0, 0, -5], lookAt: [0, 0, 0] },
    { name: "back-left", position: [-3.5, 0, -3.5], lookAt: [0, 0, 0] },
    { name: "left", position: [-5, 0, 0], lookAt: [0, 0, 0] },
    { name: "front-left", position: [-3.5, 0, 3.5], lookAt: [0, 0, 0] },
];

// View storage: Stores blob URLs for each part's views
// { partId: { 0: blobUrl, 1: blobUrl, ... } }
const viewBlobCache = new Map();
const viewTimers = new Map();

/**
 * Load and display 8 static views for a part
 * @param {string} containerId - The ID of the container element
 * @param {Object} part - The part data
 * @param {string} modelUrl - URL to the GLTF/GLB model file
 */
export async function loadPartStaticViews(containerId, part, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const partId = part.id;

    // 1. Check if we already have views in cache
    if (viewBlobCache.has(partId)) {
        displayEightViewInterface(containerId, partId);
        return;
    }

    // 2. Check if backend has views
    try {
        const manifest = await getPartViewsManifest(partId);
        if (manifest && manifest.views && manifest.views.files) {
            // Load only front view (index 0) initially if not already pre-fetched
            if (!viewBlobCache.has(partId)) {
                const frontBlobUrl = await getPartViewBlobUrl(partId, 0);
                const views = {};
                views[0] = frontBlobUrl;
                viewBlobCache.set(partId, views);
            }

            displayEightViewInterface(containerId, partId);

            // Load remaining 7 views in background
            loadRemainingViews(partId);
            return;
        }
    } catch (error) {
        console.error("Error checking views manifest:", error);
    }

    // 3. If no views, render them from model
    renderAndUploadViews(containerId, part, modelUrl);
}

/**
 * Render 8 views from a GLTF model and upload to backend
 */
async function renderAndUploadViews(containerId, part, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.className =
        "absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10";
    loadingIndicator.innerHTML = `
        <div class="text-center">
            <i class="fa-solid fa-spinner fa-spin text-blue-400 text-2xl mb-2"></i>
            <p class="text-xs text-gray-400">Generating views...</p>
        </div>
    `;
    container.appendChild(loadingIndicator);

    const loader = new GLTFLoader();
    loader.load(
        modelUrl,
        async (gltf) => {
            const model = gltf.scene;

            // Centering and scaling logic (reused from loadGLTFModel)
            const box = new Box3().setFromObject(model);
            const center = box.getCenter(new Vector3());
            const size = box.getSize(new Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 2 / maxDim : 1;
            model.scale.multiplyScalar(scale);
            model.position.sub(center.multiplyScalar(scale));

            const scene = new Scene();
            // Transparent background to show container's oklab color
            scene.background = null;
            scene.add(model);

            const ambientLight = new AmbientLight(0xffffff, 2);
            scene.add(ambientLight);
            const directionalLight = new DirectionalLight(0xffffff, 6);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);

            const width = 800;
            const height = 400;
            const padding = 20;
            const contentWidth = width - padding * 2; // 760
            const contentHeight = height - padding * 2; // 360

            const renderer = new WebGLRenderer({
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true,
            });
            renderer.setSize(width, height);

            // Set background color for the rendered images
            renderer.setClearColor(0x1f232c, 0.95);

            const views = {};
            const formData = new FormData();

            // Use Orthographic camera for precise padding
            const aspect = width / height;
            for (let i = 0; i < VIEW_CONFIGS.length; i++) {
                const config = VIEW_CONFIGS[i];

                // Calculate camera bounds to include model with padding
                // The model is scaled to fit in a 2x2x2 box centered at origin
                const camera = new PerspectiveCamera(50, aspect, 0.1, 1000);
                camera.position.set(...config.position);
                camera.lookAt(...config.lookAt);

                // Adjust camera distance to fit model with padding
                // The model fits in a 2x2x2 box, so its max radius from origin is roughly sqrt(3)
                // but we scaled it so max dimension is 2 (from -1 to 1).
                // We want to fit this 2-unit bounding box into the content area.

                const fovRad = (camera.fov * Math.PI) / 180;
                const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);

                // Distance to fit 2 units in contentHeight (360px) of height (400px)
                const distHeight =
                    1 / Math.tan(fovRad / 2) / (contentHeight / height);
                // Distance to fit 2 units in contentWidth (760px) of width (800px)
                const distWidth =
                    1 / Math.tan(hFovRad / 2) / (contentWidth / width);

                // Use the larger distance to ensure it fits in both dimensions
                const distance = Math.max(distHeight, distWidth);

                // Update camera position based on normalized direction and calculated distance
                const direction = new Vector3(...config.position).normalize();
                camera.position.copy(direction.multiplyScalar(distance));

                renderer.render(scene, camera);

                const blob = await new Promise((resolve) =>
                    renderer.domElement.toBlob(resolve, "image/png")
                );
                const blobUrl = URL.createObjectURL(blob);
                views[i] = blobUrl;

                formData.append(`view_${i}`, blob, `view_${i}.png`);
            }

            viewBlobCache.set(part.id, views);
            loadingIndicator.remove();
            displayEightViewInterface(containerId, part.id);

            // Upload to backend
            try {
                await uploadPartViews(part.id, formData);
            } catch (error) {
                console.error("Failed to upload views:", error);
            }

            // Cleanup Three.js
            renderer.dispose();
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m) => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        },
        undefined,
        (error) => {
            console.error("Error loading model for views:", error);
            loadingIndicator.innerHTML = `<p class="text-red-400">Failed to generate views</p>`;
        }
    );
}

/**
 * Load the remaining 7 views for a part from the backend
 */
async function loadRemainingViews(partId) {
    const views = viewBlobCache.get(partId) || {};
    for (let i = 1; i < 8; i++) {
        if (!views[i]) {
            try {
                const blobUrl = await getPartViewBlobUrl(partId, i);
                views[i] = blobUrl;
            } catch (error) {
                console.error(`Failed to pre-fetch view ${i}:`, error);
            }
        }
    }
    viewBlobCache.set(partId, views);
}

/**
 * Display the 8-view interface and handle drag interactions
 */
function displayEightViewInterface(containerId, partId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const views = viewBlobCache.get(partId);
    if (!views || !views[0]) {
        container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">Loading views...</div>`;
        return;
    }

    let currentIndex = 0;
    const img = document.createElement("img");
    img.src = views[currentIndex];
    img.className =
        "w-full h-full object-contain cursor-grab active:cursor-grabbing select-none";
    img.draggable = false;
    container.appendChild(img);

    // Apply background color
    container.style.backgroundColor = "#1f232cf2";

    // Add overlay indicator
    const indicator = document.createElement("div");
    indicator.className =
        "absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none";
    indicator.textContent = `View 1/8`;
    container.appendChild(indicator);

    let isDragging = false;
    let startX = 0;
    const dragThreshold = 40;

    const updateView = (index) => {
        currentIndex = (index + 8) % 8;
        if (views[currentIndex]) {
            img.src = views[currentIndex];
            indicator.textContent = `View ${currentIndex + 1}/8`;
        } else {
            // If view not loaded yet, try to load it
            getPartViewBlobUrl(partId, currentIndex).then((url) => {
                views[currentIndex] = url;
                img.src = url;
                indicator.textContent = `View ${currentIndex + 1}/8`;
            });
        }
    };

    const handleStart = (e) => {
        isDragging = true;
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        resetTimer(partId);
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const diff = currentX - startX;

        if (Math.abs(diff) > dragThreshold) {
            const step = diff > 0 ? -1 : 1;
            updateView(currentIndex + step);
            startX = currentX;
        }
    };

    const handleEnd = () => {
        isDragging = false;
    };

    img.addEventListener("mousedown", handleStart);
    img.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    // Visibility change and Tab switch handling
    const visibilityHandler = () => {
        if (document.hidden) {
            unloadExtraViews(partId);
        }
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    // Store cleanup
    container._cleanup = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchend", handleEnd);
        document.removeEventListener("visibilitychange", visibilityHandler);
    };

    resetTimer(partId);
}

/**
 * Reset the 5-minute idle timer for a part
 */
function resetTimer(partId) {
    if (viewTimers.has(partId)) {
        clearTimeout(viewTimers.get(partId));
    }
    const timer = setTimeout(() => {
        unloadExtraViews(partId);
    }, 5 * 60 * 1000);
    viewTimers.set(partId, timer);
}

/**
 * Unload all views except the first one to save memory
 */
function unloadExtraViews(partId) {
    const views = viewBlobCache.get(partId);
    if (!views) return;

    for (let i = 1; i < 8; i++) {
        if (views[i]) {
            URL.revokeObjectURL(views[i]);
            delete views[i];
        }
    }
    viewBlobCache.set(partId, views);
}

/**
 * Publicly accessible pre-fetch for front view
 */
export async function prefetchPartFrontView(partId) {
    if (viewBlobCache.has(partId)) return;
    try {
        const manifest = await getPartViewsManifest(partId);
        if (manifest && manifest.views && manifest.views.files) {
            const blobUrl = await getPartViewBlobUrl(partId, 0);
            viewBlobCache.set(partId, { 0: blobUrl });
        }
    } catch (e) {
        // Silently fail pre-fetch
    }
}
