// Demo API - In-memory implementation of parts management API
// Matches the interface of partsApi.js but uses in-memory storage

import partStore from "./store.js";
import { seedParts } from "./seedData.js";

// Initialize store with seed data
partStore.setInitialData(seedParts);

// Status constants
const STATUS_IN_PROGRESS = "In Progress";

/**
 * Helper function to create error responses matching backend format
 */
function createErrorResponse(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    error.details = { error: message };
    return error;
}

/**
 * Helper function to convert part data to API response format (camelCase)
 */
function toApiFormat(part) {
    return {
        id: part.id,
        type: part.type,
        material: part.material,
        name: part.name,
        partId: part.part_id,
        subsystem: part.subsystem,
        assigned: part.assigned,
        status: part.status,
        miscInfo: part.misc_info,
        notes: part.notes,
        file: part.file,
        onshapeUrl: part.onshape_url,
        claimedDate: part.claimed_date,
        createdAt: part.created_at,
        updatedAt: part.updated_at,
        category: part.category,
        amount: part.amount,
    };
}

/**
 * Get all parts with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Parts data with pagination info
 */
export async function getParts(options = {}) {
    try {
        const result = partStore.getParts(options);
        return {
            parts: result.parts.map(toApiFormat),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
        };
    } catch (error) {
        throw createErrorResponse("Failed to retrieve parts", 500);
    }
}

/**
 * Get a specific part by ID
 * @param {number} partId - Part ID
 * @returns {Promise<Object>} Part data
 */
export async function getPart(partId) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }
        return toApiFormat(part);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to retrieve part", 500);
    }
}

/**
 * Create a new part
 * @param {Object} partData - Part data to create
 * @returns {Promise<Object>} Created part data
 */
export async function createPart(partData) {
    try {
        // Validation
        if (!partData.material || !partData.material.trim()) {
            throw createErrorResponse("Material is required", 400);
        }

        const partId = partData.partId || partData.part_id;
        if (!partId || !partId.trim()) {
            throw createErrorResponse("Part ID is required", 400);
        }

        const subsystem = partData.subsystem;
        if (!subsystem || !subsystem.trim()) {
            throw createErrorResponse("Subsystem is required", 400);
        }

        const amount = partData.amount;
        if (amount != null) {
            const parsedAmount = parseInt(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw createErrorResponse(
                    "Amount must be a number greater than 0",
                    400
                );
            }
        }

        // Normalize data
        const normalizedData = {
            ...partData,
            material: partData.material.trim(),
            part_id: partId.trim(),
            subsystem: subsystem.trim(),
            status: partData.status || "Pending",
            category: partData.category || "review",
            amount: partData.amount || 1,
        };

        const part = partStore.createPart(normalizedData);
        return toApiFormat(part);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to create part", 500);
    }
}

/**
 * Update an existing part
 * @param {number} partId - Part ID
 * @param {Object} partData - Updated part data
 * @returns {Promise<Object>} Updated part data
 */
export async function updatePart(partId, partData) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        // Validation
        if (
            partData.subsystem &&
            (!partData.subsystem || !partData.subsystem.trim())
        ) {
            throw createErrorResponse("Subsystem is required", 400);
        }

        const partIdField = partData.partId || partData.part_id;
        if (partIdField && (!partIdField || !partIdField.trim())) {
            throw createErrorResponse("Part ID is required", 400);
        }

        if (partData.amount != null) {
            const parsedAmount = parseInt(partData.amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw createErrorResponse(
                    "Amount must be a number greater than 0",
                    400
                );
            }
        }

        const updatedPart = partStore.updatePart(partId, partData);
        if (!updatedPart) {
            throw createErrorResponse("Part not found", 404);
        }

        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to update part", 500);
    }
}

/**
 * Delete a part
 * @param {number} partId - Part ID
 * @returns {Promise<Object>} Success message
 */
export async function deletePart(partId) {
    try {
        const deleted = partStore.deletePart(partId);
        if (!deleted) {
            throw createErrorResponse("Part not found", 404);
        }
        return { message: "Part deleted successfully" };
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to delete part", 500);
    }
}

/**
 * Approve a part for production
 * @param {number} partId - Part ID
 * @param {Object} payload - Optional payload with reviewer info
 * @returns {Promise<Object>} Updated part data
 */
export async function approvePart(partId, payload = {}) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        // Update status and move to appropriate category
        const updateData = {
            status: "Reviewed",
            category: part.type === "cnc" ? "cnc" : "hand",
        };

        // Add reviewer info to misc_info if provided
        if (payload.reviewer) {
            const existingMisc = part.misc_info || {};
            updateData.misc_info = {
                ...existingMisc,
                reviewer: payload.reviewer,
            };
        }

        const updatedPart = partStore.updatePart(partId, updateData);
        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to approve part", 500);
    }
}

/**
 * Assign a part to a user
 * @param {number} partId - Part ID
 * @param {string} assignedUser - User to assign to
 * @returns {Promise<Object>} Updated part data
 */
export async function assignPart(partId, assignedUser) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        if (!assignedUser) {
            throw createErrorResponse("Assigned user required", 400);
        }

        const updateData = {
            assigned: assignedUser,
            claimed_date: new Date().toISOString(),
            status: STATUS_IN_PROGRESS,
        };

        // For hand fab parts, add worker to misc_info
        if (part.type === "hand") {
            const existingMisc = part.misc_info || {};
            const handWorkers =
                existingMisc.handWorkers || existingMisc.hand_workers || [];
            handWorkers.push({
                name: assignedUser,
                timestamp: new Date().toISOString(),
            });
            updateData.misc_info = {
                ...existingMisc,
                handWorkers,
            };
        }

        const updatedPart = partStore.updatePart(partId, updateData);
        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to assign part", 500);
    }
}

/**
 * Unclaim a part (remove assignment)
 * @param {number} partId - Part ID
 * @returns {Promise<Object>} Updated part data
 */
export async function unclaimPart(partId) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        const updateData = {
            assigned: null,
            claimed_date: null,
            status:
                part.status === STATUS_IN_PROGRESS
                    ? "Already Started"
                    : "Pending",
        };

        const updatedPart = partStore.updatePart(partId, updateData);
        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to unclaim part", 500);
    }
}

/**
 * Mark a part as completed
 * @param {number} partId - Part ID
 * @param {Object} payload - Optional payload
 * @returns {Promise<Object>} Updated part data
 */
export async function completePart(partId, payload = {}) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        const updateData = {
            status: "Completed",
            category: "completed",
        };

        // Merge any misc_info from payload
        if (payload.misc_info || payload.miscInfo) {
            const existingMisc = part.misc_info || {};
            const incomingMisc = payload.misc_info || payload.miscInfo;
            updateData.misc_info = {
                ...existingMisc,
                ...incomingMisc,
            };
        }

        const updatedPart = partStore.updatePart(partId, updateData);
        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to complete part", 500);
    }
}

/**
 * Revert a completed part back to previous category
 * @param {number} partId - Part ID
 * @returns {Promise<Object>} Updated part data
 */
export async function revertPart(partId) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        if (part.category !== "completed") {
            throw createErrorResponse("Part is not completed", 400);
        }

        // Move back to appropriate category
        const updateData = {
            category: part.type === "cnc" ? "cnc" : "hand",
            status: STATUS_IN_PROGRESS,
        };

        const updatedPart = partStore.updatePart(partId, updateData);
        return toApiFormat(updatedPart);
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to revert part", 500);
    }
}

/**
 * Get parts by category
 * @param {string} category - Category name
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} Parts data
 */
export async function getPartsByCategory(category, options = {}) {
    return await getParts({ ...options, category });
}

/**
 * Get system statistics
 * @returns {Promise<Object>} Statistics data
 */
export async function getStats() {
    try {
        const stats = partStore.getStats();
        // Convert snake_case to camelCase for API response
        return {
            by_category: stats.by_category,
            by_status: stats.by_status,
            assignment: stats.assignment,
            total: stats.total,
        };
    } catch (error) {
        throw createErrorResponse("Failed to retrieve statistics", 500);
    }
}

/**
 * Get leaderboard data
 * @returns {Promise<Object>} Leaderboard data
 */
export async function getLeaderboard() {
    try {
        return partStore.getLeaderboard();
    } catch (error) {
        throw createErrorResponse("Failed to retrieve leaderboard", 500);
    }
}

/**
 * Upload a STEP or PDF file for a part (mock implementation)
 * @param {number} partId - Part ID
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload result
 */
export async function uploadPartFile(partId, file) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        if (!file) {
            throw createErrorResponse("No file provided", 400);
        }

        // Mock file upload - just store filename
        const filename = file.name;
        const updateData = { file: filename };
        partStore.updatePart(partId, updateData);

        return {
            message: "File uploaded successfully",
            filename: filename,
            file_path: `/uploads/${partId}/${filename}`,
        };
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to upload file", 500);
    }
}

/**
 * Download the original STEP file for a part (mock implementation)
 * @param {number} partId - Part ID
 * @param {string} filename - Filename for download
 * @returns {Promise<Blob>} File blob
 */
export async function downloadPartFile(partId, filename) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw createErrorResponse("Part not found", 404);
        }

        if (!part.file) {
            throw createErrorResponse("No file associated with this part", 404);
        }

        // Return empty blob for mock download
        return new Blob([], { type: "application/octet-stream" });
    } catch (error) {
        if (error.status) throw error;
        throw createErrorResponse("Failed to download file", 500);
    }
}

/**
 * Get the stored file as a blob URL for preview (mock implementation)
 * @param {number} partId - Part ID
 * @returns {Promise<string>} Blob URL to the stored file
 */
export async function getPartFileBlobUrl(partId) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw new Error("Part not found");
        }

        if (!part.file) {
            throw new Error("No file associated with this part");
        }

        // Return empty blob URL
        const blob = new Blob([], { type: "application/octet-stream" });
        return URL.createObjectURL(blob);
    } catch (error) {
        throw error;
    }
}

/**
 * Get the GLTF model as a blob URL for a part (mock implementation)
 * @param {number} partId - Part ID
 * @returns {Promise<string>} Blob URL to the GLTF model
 */
export async function getPartModelBlobUrl(partId) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw new Error("Part not found");
        }

        if (!part.file) {
            throw new Error("No file associated with this part");
        }

        // Return empty blob URL for GLTF
        const blob = new Blob([], { type: "model/gltf-binary" });
        return URL.createObjectURL(blob);
    } catch (error) {
        throw error;
    }
}

/**
 * Get the drawing PDF as a blob URL for a part (mock implementation)
 * @param {number} partId - Part ID
 * @param {Object} options - Fetch options
 * @returns {Promise<string>} Blob URL to the drawing PDF
 */
export async function getPartDrawingBlobUrl(partId, options = {}) {
    try {
        const part = partStore.getPart(partId);
        if (!part) {
            throw new Error("Part not found");
        }

        if (part.type !== "hand") {
            throw new Error(
                "Drawing downloads are only available for hand fab parts"
            );
        }

        if (!part.onshape_url) {
            throw new Error("No Onshape URL is set for this part");
        }

        // Return empty blob URL for PDF
        const blob = new Blob([], { type: "application/pdf" });
        return URL.createObjectURL(blob);
    } catch (error) {
        throw error;
    }
}

/**
 * Upload part views (dummy implementation)
 * @param {number} partId - Part ID
 * @param {Object} viewsData - Views data to upload
 * @returns {Promise<Object>} Upload result
 */
export async function uploadPartViews(partId, viewsData) {
    return {};
}

/**
 * Get part views manifest (dummy implementation)
 * @param {number} partId - Part ID
 * @returns {Promise<Object>} Views manifest
 */
export async function getPartViewsManifest(partId) {
    return {};
}

/**
 * Get part view blob URL (dummy implementation)
 * @param {number} partId - Part ID
 * @param {string} viewId - View identifier
 * @returns {Promise<string>} Blob URL to the view
 */
export async function getPartViewBlobUrl(partId, viewId) {
    return "";
}
