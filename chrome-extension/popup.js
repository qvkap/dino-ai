const API_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';

let socket = null;
let currentMode = null;

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const autoPlayBtn = document.getElementById('autoPlayBtn');
const advisorBtn = document.getElementById('advisorBtn');
const statsBtn = document.getElementById('statsBtn');
const statsPanel = document.getElementById('statsPanel');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveBtn');
const clearStatsBtn = document.getElementById('clearStatsBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    connectWebSocket();
    setupEventListeners();
});

function setupEventListeners() {
    autoPlayBtn.addEventListener('click', () => setMode('auto_play'));
    advisorBtn.addEventListener('click', () => setMode('advisor'));
    statsBtn.addEventListener('click', toggleStatsPanel);
    saveBtn.addEventListener('click', saveSettings);
    clearStatsBtn.addEventListener('click', clearStats);
}

function connectWebSocket() {
    try {
        socket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            setStatus('connected', 'Connected to AI Server');
        });

        socket.on('disconnect', () => {
            setStatus('disconnected', 'Disconnected');
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            setStatus('error', 'Connection Error');
        });

        socket.on('ai_decision', (decision) => {
            handleAIDecision(decision);
        });

        socket.on('mode_changed', (data) => {
            console.log('Mode changed:', data);
        });
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        setStatus('error', 'Connection Failed');
    }
}

function setStatus(status, message) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = message;
}

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'auto_play') {
        autoPlayBtn.classList.add('active');
        socket?.emit('start_auto_play', {});
    } else if (mode === 'advisor') {
        advisorBtn.classList.add('active');
        socket?.emit('start_advisor', {});
    }
    
    // Notify content script
    notifyContentScript({ action: 'modeChanged', mode: mode });
}

function toggleStatsPanel() {
    if (statsPanel.style.display === 'none') {
        statsPanel.style.display = 'block';
        loadStats();
    } else {
        statsPanel.style.display = 'none';
    }
}

function loadStats() {
    chrome.storage.local.get(['gameStats'], (result) => {
        const stats = result.gameStats || { avg: 0, best: 0, total: 0 };
        document.getElementById('avgScore').textContent = Math.round(stats.avg);
        document.getElementById('bestScore').textContent = stats.best;
        document.getElementById('totalGames').textContent = stats.total;
    });
}

function clearStats() {
    if (confirm('Clear all statistics?')) {
        chrome.storage.local.set({ gameStats: { avg: 0, best: 0, total: 0 } });
        loadStats();
    }
}

function handleAIDecision(decision) {
    console.log('AI Decision:', decision);
    // Send decision to content script
    notifyContentScript({ action: 'aiDecision', decision: decision });
}

function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }
    
    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
        alert('Settings saved!');
    });
}

function loadSettings() {
    chrome.storage.sync.get(['openaiApiKey'], (result) => {
        if (result.openaiApiKey) {
            apiKeyInput.value = result.openaiApiKey.substring(0, 20) + '...';
        }
    });
}

function notifyContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, message);
        }
    });
}