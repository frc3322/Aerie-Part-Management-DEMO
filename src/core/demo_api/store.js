// In-memory data store for demo API
// Data resets on page reload (no persistence)

/**
 * In-memory data store for parts management
 * Handles CRUD operations with filtering, sorting, and pagination
 */
class PartStore {
    constructor() {
        this.parts = [];
        this.nextId = 1;
        this.initializeStore();
    }

    /**
     * Initialize the store (called on construction)
     */
    initializeStore() {
        // Store will be populated from seed data
    }

    /**
     * Set initial data (from seed data)
     * @param {Array} seedParts - Array of part objects
     */
    setInitialData(seedParts) {
        this.parts = [...seedParts];
        // Set nextId to highest existing ID + 1
        const maxId = this.parts.length > 0 ? Math.max(...this.parts.map(p => p.id)) : 0;
        this.nextId = maxId + 1;
    }

    /**
     * Get all parts with optional filtering and pagination
     * @param {Object} options - Query options
     * @param {string} options.category - Filter by category
     * @param {string} options.search - Search query
     * @param {string} options.sort_by - Sort field
     * @param {string} options.sort_order - Sort order (asc, desc)
     * @param {number} options.limit - Maximum results
     * @param {number} options.offset - Pagination offset
     * @returns {Object} Parts data with pagination info
     */
    getParts(options = {}) {
        let filteredParts = [...this.parts];

        // Apply category filter
        if (options.category) {
            filteredParts = filteredParts.filter(part => part.category === options.category);
        }

        // Apply search filter
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            filteredParts = filteredParts.filter(part =>
                (part.name && part.name.toLowerCase().includes(searchTerm)) ||
                (part.notes && part.notes.toLowerCase().includes(searchTerm)) ||
                (part.subsystem && part.subsystem.toLowerCase().includes(searchTerm)) ||
                (part.assigned && part.assigned.toLowerCase().includes(searchTerm)) ||
                (part.material && part.material.toLowerCase().includes(searchTerm)) ||
                (part.part_id && part.part_id.toLowerCase().includes(searchTerm))
            );
        }

        // Apply sorting
        const sortBy = options.sort_by || 'created_at';
        const sortOrder = options.sort_order || 'desc';

        filteredParts.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle null values
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return sortOrder === 'asc' ? -1 : 1;
            if (bVal == null) return sortOrder === 'asc' ? 1 : -1;

            // Handle string comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Get total count before pagination
        const total = filteredParts.length;

        // Apply pagination
        const offset = options.offset || 0;
        const limit = options.limit;
        if (limit) {
            filteredParts = filteredParts.slice(offset, offset + limit);
        } else if (offset > 0) {
            filteredParts = filteredParts.slice(offset);
        }

        return {
            parts: filteredParts,
            total,
            limit,
            offset
        };
    }

    /**
     * Get a part by ID
     * @param {number} id - Part ID
     * @returns {Object|null} Part object or null if not found
     */
    getPart(id) {
        return this.parts.find(part => part.id === id) || null;
    }

    /**
     * Create a new part
     * @param {Object} partData - Part data (without ID)
     * @returns {Object} Created part with ID
     */
    createPart(partData) {
        const now = new Date().toISOString();

        const newPart = {
            id: this.nextId++,
            type: partData.type || null,
            material: partData.material,
            part_id: partData.part_id || partData.partId || '',
            name: partData.name || null,
            subsystem: partData.subsystem || null,
            assigned: partData.assigned || null,
            status: partData.status || 'Pending',
            misc_info: partData.misc_info || partData.miscInfo || null,
            notes: partData.notes || null,
            file: partData.file || null,
            onshape_url: partData.onshape_url || partData.onshapeUrl || null,
            claimed_date: partData.claimed_date || partData.claimedDate || null,
            created_at: now,
            updated_at: now,
            category: partData.category || 'review',
            amount: partData.amount || 1
        };

        this.parts.push(newPart);
        return newPart;
    }

    /**
     * Update an existing part
     * @param {number} id - Part ID
     * @param {Object} partData - Updated part data
     * @returns {Object|null} Updated part or null if not found
     */
    updatePart(id, partData) {
        const index = this.parts.findIndex(part => part.id === id);
        if (index === -1) return null;

        const existingPart = this.parts[index];
        const now = new Date().toISOString();

        // Update allowed fields
        const allowedFields = [
            'type', 'material', 'name', 'part_id', 'subsystem',
            'assigned', 'status', 'misc_info', 'notes', 'file',
            'onshape_url', 'claimed_date', 'category', 'amount'
        ];

        // Handle camelCase field mappings
        const fieldMapping = {
            'partId': 'part_id',
            'miscInfo': 'misc_info',
            'onshapeUrl': 'onshape_url',
            'claimedDate': 'claimed_date',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at'
        };

        const updatedPart = { ...existingPart, updated_at: now };

        for (const [key, value] of Object.entries(partData)) {
            const mappedKey = fieldMapping[key] || key;
            if (allowedFields.includes(mappedKey)) {
                if (mappedKey === 'misc_info') {
                    updatedPart[mappedKey] = value && typeof value === 'object' ? value : null;
                } else if (mappedKey === 'amount' && value != null) {
                    try {
                        const parsedAmount = parseInt(value);
                        updatedPart[mappedKey] = parsedAmount > 0 ? parsedAmount : 1;
                    } catch {
                        updatedPart[mappedKey] = 1;
                    }
                } else {
                    updatedPart[mappedKey] = value;
                }
            }
        }

        this.parts[index] = updatedPart;
        return updatedPart;
    }

    /**
     * Delete a part by ID
     * @param {number} id - Part ID
     * @returns {boolean} True if deleted, false if not found
     */
    deletePart(id) {
        const index = this.parts.findIndex(part => part.id === id);
        if (index === -1) return false;

        this.parts.splice(index, 1);
        return true;
    }

    /**
     * Get all parts in a category
     * @param {string} category - Category name
     * @param {Object} options - Additional query options
     * @returns {Object} Parts data with pagination info
     */
    getPartsByCategory(category, options = {}) {
        return this.getParts({ ...options, category });
    }

    /**
     * Get statistics about parts
     * @returns {Object} Statistics object
     */
    getStats() {
        const reviewCount = this.parts.filter(p => p.category === 'review').length;
        const cncCount = this.parts.filter(p => p.category === 'cnc').length;
        const handCount = this.parts.filter(p => p.category === 'hand').length;
        const completedCount = this.parts.filter(p => p.category === 'completed').length;

        const pendingCount = this.parts.filter(p => p.status === 'Pending').length;
        const inProgressCount = this.parts.filter(p => p.status === 'In Progress').length;
        const completedStatusCount = this.parts.filter(p => p.status === 'Completed').length;

        const assignedCount = this.parts.filter(p => p.assigned != null).length;
        const unassignedCount = this.parts.filter(p => p.assigned == null).length;

        return {
            by_category: {
                review: reviewCount,
                cnc: cncCount,
                hand: handCount,
                completed: completedCount
            },
            by_status: {
                pending: pendingCount,
                in_progress: inProgressCount,
                completed: completedStatusCount
            },
            assignment: {
                assigned: assignedCount,
                unassigned: unassignedCount
            },
            total: reviewCount + cncCount + handCount + completedCount
        };
    }

    /**
     * Get leaderboard data
     * @returns {Object} Leaderboard data
     */
    getLeaderboard() {
        const completedParts = this.parts.filter(p => p.category === 'completed');
        const scores = {};

        for (const part of completedParts) {
            // Current assignee gets 1 point
            if (part.assigned) {
                scores[part.assigned] = (scores[part.assigned] || 0) + 1;
            }

            // Previous assignees get 0.5 points each
            const miscInfo = part.misc_info || {};
            const handWorkers = miscInfo.handWorkers || miscInfo.hand_workers || [];

            for (const worker of handWorkers) {
                if (worker && typeof worker === 'object' && worker.name) {
                    const workerName = worker.name;
                    // Don't double-count current assignee
                    if (workerName !== part.assigned) {
                        scores[workerName] = (scores[workerName] || 0) + 0.5;
                    }
                }
            }
        }

        const leaderboard = Object.entries(scores)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);

        return { leaderboard };
    }

    /**
     * Clear all data (for testing/reset)
     */
    clear() {
        this.parts = [];
        this.nextId = 1;
    }
}

// Create singleton instance
const partStore = new PartStore();

export default partStore;
