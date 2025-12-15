// API Router
// Routes all backend API calls from frontend files
// Can be easily modified to use frontend-based storage for demo website

// Demo API - Using in-memory storage instead of backend
// Commented out backend API imports for reference
/*
import {
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    apiPostMultipart,
    apiDownloadFile,
} from "./apiClient.js";
*/

import {
    getParts,
    getPart,
    createPart,
    updatePart,
    deletePart,
    approvePart,
    assignPart,
    unclaimPart,
    completePart,
    revertPart,
    getPartsByCategory,
    getStats,
    getLeaderboard,
    uploadPartFile,
    downloadPartFile,
    getPartFileBlobUrl,
    getPartModelBlobUrl,
    getPartDrawingBlobUrl,
} from "../demo_api/index.js";

import { withErrorHandling } from "./apiErrorHandler.js";

// Demo API - API client functions not used (using in-memory storage)
/*
// Export all API client functions
export {
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    apiPostMultipart,
    apiDownloadFile,
};
*/

// Export all parts API functions
export {
    getParts,
    getPart,
    createPart,
    updatePart,
    deletePart,
    approvePart,
    assignPart,
    unclaimPart,
    completePart,
    revertPart,
    getPartsByCategory,
    getStats,
    getLeaderboard,
    uploadPartFile,
    downloadPartFile,
    getPartFileBlobUrl,
    getPartModelBlobUrl,
    getPartDrawingBlobUrl,
};

// Export error handling utility
export { withErrorHandling };
