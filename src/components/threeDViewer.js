// 3D Viewer Component - Error Display Only
// Shows error messages for 3D model viewing functionality (Three.js removed)

/**
 * Show error message for 3D viewer initialization
 * @param {string} containerId - The ID of the container element
 * @param {Object} part - The part data
 */
export async function loadPartStaticViews(containerId, part) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Save overlay if it exists
    const overlay = container.querySelector(".absolute");
    container.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center text-center text-red-400">
            <div>
                <i class="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>
                <p class="text-xs">3D Preview Unavailable</p>
            </div>
        </div>
    `;
    if (overlay) container.appendChild(overlay);
}

/**
 * Show error message for custom 3D viewer
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Configuration options (ignored)
 */
export function initCustom3DViewer(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    const overlay = container.querySelector(".absolute");
    container.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center text-center text-red-400">
            <div>
                <i class="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>
                <p class="text-xs">3D Preview Unavailable</p>
            </div>
        </div>
    `;
    if (overlay) container.appendChild(overlay);
}

/**
 * Show error message for GLTF model loading
 * @param {string} containerId - The ID of the container element
 * @param {string} modelUrl - URL to the GLTF/GLB model file (ignored)
 */
export function loadGLTFModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center text-center text-red-400">
            <div>
                <i class="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>
                <p class="text-xs">3D Preview Unavailable</p>
            </div>
        </div>
    `;
}

/**
 * No-op resize function since there's no 3D viewer to resize
 * @param {string} containerId - The ID of the container element (ignored)
 */
export function resize3DViewer(containerId) {
    // No-op - no 3D viewer to resize
}
