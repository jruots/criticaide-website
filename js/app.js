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
    updateShortcutText();
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
    const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'MacAPP', 'MacOSX', 'iPad', 'iPhone', 'iPod'];
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

    return { isWindows, isMac };
}

/**
 * Update shortcut text based on the user's OS
 */
function updateShortcutText() {
    const copyElements = document.querySelectorAll('.copy-shortcut');
    const globalElements = document.querySelectorAll('.global-shortcut');
    
    // Detect Mac OS
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    
    if (isMac) {
        // Update for Mac
        copyElements.forEach(el => {
            el.textContent = 'Cmd+C';
        });
        
        globalElements.forEach(el => {
            el.textContent = 'Cmd+Option+Shift+T';
        });
    } else {
        // Update for Windows/others
        copyElements.forEach(el => {
            el.textContent = 'Ctrl+C';
        });
        
        globalElements.forEach(el => {
            el.textContent = 'Ctrl+Alt+Shift+T';
        });
    }
}

/**
 * Set up download link URLs from GitHub releases
 */
function setupDownloadLinks() {
    // Default to the latest release download URLs
    const windowsBtn = document.getElementById('windows-download-btn');
    const macBtn = document.getElementById('mac-download-btn');
    
    // Set initial URLs (these will be updated when we fetch release info)
    windowsBtn.href = "https://github.com/jruots/criticaide/releases/latest/download/Criticaide-Setup-0.3.0-Windows.zip";
    macBtn.href = "https://github.com/jruots/criticaide/releases/latest/download/Criticaide-Setup-0.3.0-Mac.zip";
}

/**
 * Fetch download counts from GitHub API with caching
 * This prevents excessive API requests and handles rate limiting
 */
function fetchDownloadCounts() {
    const apiUrl = "https://api.github.com/repos/jruots/criticaide/releases";
    const cacheKey = 'criticaide_release_data';
    const cacheTimeKey = 'criticaide_release_time';
    const cacheExpiry = 3600000; // 1 hour in milliseconds
    
    // Check cache first
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    
    // Use cache if it exists and is not expired
    if (cachedData && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime);
        if (cacheAge < cacheExpiry) {
            try {
                const releases = JSON.parse(cachedData);
                console.log('Using cached release data');
                updateDownloadCounts(releases);
                return;
            } catch (e) {
                console.warn('Failed to parse cached data:', e);
                // Continue to fetch from API if cache parsing fails
            }
        } else {
            console.log('Cache expired, fetching fresh data');
        }
    }
    
    // Fetch fresh data from GitHub API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                // Check for rate limiting
                if (response.status === 403) {
                    throw new Error('GitHub API rate limit exceeded. Try again later.');
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return response.json();
        })
        .then(releases => {
            if (releases.length === 0) {
                throw new Error("No releases found");
            }
            
            // Cache the response for future use
            try {
                localStorage.setItem(cacheKey, JSON.stringify(releases));
                localStorage.setItem(cacheTimeKey, Date.now().toString());
                console.log('GitHub release data cached');
            } catch (e) {
                console.warn('Failed to cache release data:', e);
                // Continue even if caching fails
            }
            
            // Process the data
            updateDownloadCounts(releases);
        })
        .catch(error => {
            console.error("Error fetching download counts:", error);
            
            // If we have cached data, use it as fallback even if expired
            if (cachedData) {
                try {
                    console.log('Using expired cache as fallback');
                    updateDownloadCounts(JSON.parse(cachedData));
                    return;
                } catch (e) {
                    console.error('Failed to use cache fallback:', e);
                }
            }
            
            // Display error state
            document.getElementById('windows-count').textContent = "N/A";
            document.getElementById('mac-count').textContent = "N/A";
            
            // Update tooltips to explain the error
            const tooltips = document.querySelectorAll('.tooltip');
            tooltips.forEach(tooltip => {
                tooltip.textContent = "Could not fetch download data";
            });
        });
}

/**
 * Process GitHub releases data and update the UI
 */
function updateDownloadCounts(releases) {
    // Get the latest release for download links
    const latestRelease = releases[0];
    
    // Variables to track the total download counts
    let totalWindowsDownloads = 0;
    let totalMacDownloads = 0;
    
    // Latest assets for download links
    let latestWindowsAsset = null;
    let latestMacAsset = null;
    
    // Process all releases to get total download count
    releases.forEach(release => {
        release.assets.forEach(asset => {
            const name = asset.name.toLowerCase();
            
            // Count downloads for Windows
            if (name.includes('windows') || 
                (!name.includes('mac') && 
                (name.endsWith('.exe') || name.endsWith('.msi') || name.endsWith('.zip')))) {
                totalWindowsDownloads += asset.download_count;
                
                // If this is from the latest release, store asset for download link
                if (release.id === latestRelease.id && !latestWindowsAsset) {
                    latestWindowsAsset = asset;
                }
            }
            
            // Count downloads for Mac
            if (name.includes('mac') && 
                !name.includes('instructions') && 
                (name.endsWith('.dmg') || name.endsWith('.zip'))) {
                totalMacDownloads += asset.download_count;
                
                // If this is from the latest release, store asset for download link
                if (release.id === latestRelease.id && !latestMacAsset) {
                    latestMacAsset = asset;
                }
            }
        });
    });
    
    console.log("Total downloads - Windows:", totalWindowsDownloads, "Mac:", totalMacDownloads);
    
    // Update the download counts on the page
    document.getElementById('windows-count').textContent = totalWindowsDownloads.toLocaleString();
    document.getElementById('mac-count').textContent = totalMacDownloads.toLocaleString();
    
    // Update the tooltips to reflect that these are total counts
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
        tooltip.textContent = "Total downloads across all releases";
    });
    
    // Update the download links to the latest release
    updateDownloadLink('windows', latestWindowsAsset);
    updateDownloadLink('mac', latestMacAsset);
}

/**
 * Update download link for a specific platform
 */
function updateDownloadLink(platform, asset) {
    const downloadBtn = document.getElementById(`${platform}-download-btn`);
    const releaseInfoElement = document.getElementById(`${platform}-release-info`);
    
    if (asset) {
        // Update download URL
        downloadBtn.href = asset.browser_download_url;
        
        // Update release info
        if (releaseInfoElement) {
            // Extract version from release tag or asset name
            let version = "latest";
            if (asset.name && asset.name.match(/\d+\.\d+\.\d+/)) {
                version = asset.name.match(/\d+\.\d+\.\d+/)[0];
            }
            releaseInfoElement.textContent = `v${version}`;
        }
        
        // Add event listener to track downloads
        downloadBtn.addEventListener('click', function() {
            console.log(`${platform} download clicked: ${asset.browser_download_url}`);
        });
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