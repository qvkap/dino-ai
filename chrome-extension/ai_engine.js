/**
 * Service Worker for Dino AI Master
 * Handles background operations and API communications
 */

const API_URL = 'http://localhost:5000';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Dino AI Master extension installed!');
    
    // Initialize storage
    chrome.storage.local.set({
        gameStats: {
            avg: 0,
            best: 0,
            total: 0
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateStats') {
        updateGameStats(request.score);
        sendResponse({ status: 'ok' });
    }
});

function updateGameStats(score) {
    chrome.storage.local.get(['gameStats'], (result) => {
        const stats = result.gameStats || { avg: 0, best: 0, total: 0 };
        
        stats.total += 1;
        stats.avg = (stats.avg * (stats.total - 1) + score) / stats.total;
        if (score > stats.best) {
            stats.best = score;
        }
        
        chrome.storage.local.set({ gameStats: stats });
    });
}

// Check API health periodically
setInterval(() => {
    fetch(`${API_URL}/api/health`)
        .catch(error => console.log('API connection failed:', error));
}, 30000);