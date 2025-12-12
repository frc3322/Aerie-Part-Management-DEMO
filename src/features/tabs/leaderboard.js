// Leaderboard Tab Module
// Handles the leaderboard tab display and functionality

import { appState } from "../state/state.js";
import { getLeaderboard } from "../../core/api/partsApi.js";
import { setState } from "../../core/state/reactiveState.js";

/**
 * Load leaderboard data from server
 */
export async function loadLeaderboard() {
    try {
        setState("loadingTab", "leaderboard");
        const data = await getLeaderboard();
        setState("leaderboard", data.leaderboard || []);
        renderLeaderboard();
    } catch (error) {
        console.error("Failed to load leaderboard:", error);
        setState("leaderboard", []);
        renderLeaderboard();
    } finally {
        setState("loadingTab", null);
    }
}

/**
 * Create leaderboard item element
 * @param {Object} entry - Leaderboard entry {name, score}
 * @param {number} rank - Position in leaderboard
 * @returns {HTMLElement} The created leaderboard item
 */
function createLeaderboardItem(entry, rank) {
    const item = document.createElement("div");
    item.className =
        "flex items-center justify-between p-4 neumorphic-card-inner rounded-lg";

    const rankIcon =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";

    item.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-2xl">${rankIcon}</span>
            <div>
                <div class="font-bold text-gray-200">${entry.name}</div>
                <div class="text-sm text-gray-500">Rank #${rank}</div>
            </div>
        </div>
        <div class="text-right">
            <div class="text-2xl font-bold text-blue-400">${entry.score}</div>
            <div class="text-xs text-gray-500">points</div>
        </div>
    `;
    return item;
}

/**
 * Render the leaderboard tab
 */
export function renderLeaderboard() {
    const container = document.getElementById("leaderboard-list");
    const emptyMsg = document.getElementById("leaderboard-empty");

    if (!container) return;

    container.innerHTML = "";

    // Show loading state
    if (appState.loadingTab === "leaderboard") {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fa-solid fa-spinner fa-spin text-green-400 mr-2"></i>
                Loading leaderboard...
            </div>
        `;
        if (emptyMsg) emptyMsg.classList.add("hidden");
        return;
    }

    const leaderboard = appState.leaderboard || [];

    if (leaderboard.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        container.classList.add("hidden");
        return;
    }

    if (emptyMsg) emptyMsg.classList.add("hidden");
    container.classList.remove("hidden");

    leaderboard.forEach((entry, index) => {
        const item = createLeaderboardItem(entry, index + 1);
        container.appendChild(item);
    });
}
