/**
 * Criticaide Website JavaScript
 * Handles OS detection, download links, and download count fetching
 */

document.addEventListener('DOMContentLoaded', function() {
    // Update copyright year
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize UI
    initMobileNav();
    detectUserOS();
    setupDownloadLinks();
    fetchDownloadCounts();
});

/**
 * Initialize mobile navigation menu toggle
 */
function initMobileNav() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Close menu when clicking on links
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

/**
 * Detect user's operating system and highlight appropriate download
 */
function detectUserOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'Macintosh', 'MacIntel', 'MacAPP', 'MacPPC', 'MacOSX', 'iPad', 'iPhone', 'iPod'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    
    let isWindows = false;
    let isMac = false;
    
    // Check platform first
    if (windowsPlatforms.indexOf(platform) !== -1) {
        isWindows = true;
    } else if (macPlatforms.indexOf(platform) !== -1) {
        isMac = true;
    }
    
    // If platform detection failed, check user agent
    if (!isWindows && !isMac) {
        isWindows = userAgent.indexOf('Windows') !== -1;
        isMac = userAgent.indexOf('Mac') !== -1 || userAgent.indexOf('macOS') !== -1;
    }
    
    // Highlight appropriate download card
    if (isWindows) {
        document.getElementById('windows-download').classList.add('highlighted');
    } else if (isMac) {
        document.getElementById('mac-download').classList.add('highlighted');
    }
}

/**
 * Set up download link URLs from GitHub releases
 */
function setupDownloadLinks() {
    // Default to the latest release download URLs
    // These will be updated with actual URLs when fetching download counts
    const windowsBtn = document.getElementById('windows-download-btn');
    const macBtn = document.getElementById('mac-download-btn');
    
    // Set initial URLs (these will be updated when we fetch release info)
    windowsBtn.href = "https://github.com/jruots/criticaide/releases/latest/download/Criticaide-Setup-0.3.0.exe";
    macBtn.href = "https://github.com/jruots/criticaide/releases/latest/download/Criticaide-0.3.0-arm64.dmg";
}

/**
 * Fetch download counts from GitHub API
 */
function fetchDownloadCounts() {
    const apiUrl = "https://api.github.com/repos/jruots/criticaide/releases";
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                throw new Error("No releases found");
            }
            
            // Get the latest release
            const latestRelease = data[0];
            
            // Find Windows and Mac assets
            let windowsAsset = null;
            let macAsset = null;
            
            // Look for the assets in the latest release
            latestRelease.assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                if (name.includes('.exe') || name.includes('.msi')) {
                    windowsAsset = asset;
                } else if (name.includes('.dmg')) {
                    macAsset = asset;
                }
            });
            
            // Update download counts and URLs
            updateDownloadInfo('windows', windowsAsset);
            updateDownloadInfo('mac', macAsset);
            
        })
        .catch(error => {
            console.error("Error fetching download counts:", error);
            document.getElementById('windows-count').textContent = "N/A";
            document.getElementById('mac-count').textContent = "N/A";
        });
}

/**
 * Update download information (count and URL) for a specific platform
 */
function updateDownloadInfo(platform, asset) {
    const countElement = document.getElementById(`${platform}-count`);
    const downloadBtn = document.getElementById(`${platform}-download-btn`);
    
    if (asset) {
        // Update count
        countElement.textContent = asset.download_count.toLocaleString();
        
        // Update download URL
        downloadBtn.href = asset.browser_download_url;
        
        // Add event listener to track downloads
        downloadBtn.addEventListener('click', function() {
            // For tracking purposes, you could implement analytics here if needed
            console.log(`${platform} download clicked`);
        });
    } else {
        countElement.textContent = "0";
    }
}

/**
 * Show a simple notification
 */
function showNotification(message, isError = false) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}