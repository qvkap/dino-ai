/**
 * Content script for Dino AI Master
 * Injects AI logic into the Chrome Dino Game page
 */

const API_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';

let currentMode = null;
let socket = null;
let gameState = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'modeChanged') {
        currentMode = request.mode;
        console.log('Mode changed to:', currentMode);
        sendResponse({ status: 'ok' });
    } else if (request.action === 'aiDecision') {
        handleAIDecision(request.decision);
        sendResponse({ status: 'ok' });
    }
});

// Initialize content script
function init() {
    console.log('Dino AI Master content script loaded');
    
    // Wait for game to load
    const gameLoadCheck = setInterval(() => {
        if (window.__GAME_VERSION__ !== undefined) {
            clearInterval(gameLoadCheck);
            setupGameHooks();
        }
    }, 100);
}

function setupGameHooks() {
    console.log('Setting up game hooks...');
    
    // Inject game observer
    const script = document.createElement('script');
    script.textContent = `
        window.dinoAIState = {
            capturing: false,
            lastState: null
        };
        
        // Hook into game loop
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            if (window.Runner && window.Runner.instance) {
                const runner = window.Runner.instance;
                
                // Capture game state
                window.dinoAIState.lastState = {
                    score: runner.distanceRan || 0,
                    player_y: runner.tRex ? runner.tRex.y : 0,
                    speed: runner.currentSpeed || 6,
                    obstacles: runner.obstacles ? runner.obstacles.map(o => [o.xPos, o.yPos]) : []
                };
            }
            return originalRAF.call(this, callback);
        };
    `;
    document.documentElement.appendChild(script);
}

function handleAIDecision(decision) {
    if (!decision || !decision.action) return;
    
    const action = decision.action.toLowerCase();
    
    // Get the game runner
    if (window.Runner && window.Runner.instance) {
        const runner = window.Runner.instance;
        
        // Simulate keyboard input
        if (action === 'jump') {
            simulateKeyPress(32); // Space bar
        } else if (action === 'duck') {
            simulateKeyPress(40); // Down arrow
        }
    }
}

function simulateKeyPress(keyCode) {
    const event = new KeyboardEvent('keydown', {
        keyCode: keyCode,
        code: getKeyName(keyCode),
        key: getKeyName(keyCode),
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
    
    // Release key after short delay
    setTimeout(() => {
        const upEvent = new KeyboardEvent('keyup', {
            keyCode: keyCode,
            code: getKeyName(keyCode),
            key: getKeyName(keyCode),
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(upEvent);
    }, 50);
}

function getKeyName(keyCode) {
    const keyMap = {
        32: 'Space',
        40: 'ArrowDown'
    };
    return keyMap[keyCode] || 'Unknown';
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}