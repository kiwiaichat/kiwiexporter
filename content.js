// Hello World Extension - Content Script

(function() {
    'use strict';

    // Display hello world message
    function showHelloWorld() {
        const helloDiv = document.createElement('div');
        helloDiv.id = 'hello-world-extension';
        helloDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007acc;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
            ">
                🚀 Hello World from Extension!
                <button onclick="document.getElementById('hello-world-extension').remove()"
                        style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            margin-left: 10px;
                            border-radius: 3px;
                            padding: 2px 8px;
                            cursor: pointer;
                        ">
                    ✕
                </button>
            </div>
        `;

        // Add to page if not already present
        if (!document.getElementById('hello-world-extension')) {
            document.body.appendChild(helloDiv);
        }
    }

    // Catch and Drop functionality
    function setupCatchAndDrop() {
        let draggedElement = null;
        let dropZone = null;

        // Create drop zone
        function createDropZone() {
            const zone = document.createElement('div');
            zone.id = 'extension-drop-zone';
            zone.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    width: 200px;
                    height: 100px;
                    background: rgba(0, 255, 0, 0.1);
                    border: 2px dashed #00aa00;
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #006600;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    text-align: center;
                    z-index: 9999;
                ">
                    Drop elements here!<br>
                    (Catch & Drop Zone)
                </div>
            `;

            // Handle drag events
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                zone.style.background = 'rgba(0, 255, 0, 0.3)';
            });

            zone.addEventListener('dragleave', function(e) {
                zone.style.background = 'rgba(0, 255, 0, 0.1)';
            });

            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                zone.style.background = 'rgba(0, 255, 0, 0.1)';

                if (draggedElement) {
                    // Clone the dragged element and add to drop zone
                    const clonedElement = draggedElement.cloneNode(true);
                    clonedElement.style.maxWidth = '180px';
                    clonedElement.style.overflow = 'hidden';

                    // Clear previous content
                    const contentDiv = zone.querySelector('div');
                    contentDiv.innerHTML = `
                        <div style="padding: 5px; margin-bottom: 5px; background: white; border-radius: 3px;">
                            <strong>Dropped:</strong><br>
                        </div>
                    `;

                    contentDiv.appendChild(clonedElement);

                    // Store in extension storage
                    chrome.storage.local.get(['droppedItems'], function(result) {
                        const items = result.droppedItems || [];
                        items.push({
                            content: clonedElement.outerHTML,
                            timestamp: new Date().toISOString(),
                            url: window.location.href
                        });

                        // Keep only last 10 items
                        if (items.length > 10) {
                            items.splice(0, items.length - 10);
                        }

                        chrome.storage.local.set({droppedItems: items});
                    });
                }
            });

            return zone;
        }

        // Make elements draggable
        function makeDraggable(element) {
            if (element.draggable) return; // Already draggable

            element.draggable = true;
            element.style.cursor = 'move';

            element.addEventListener('dragstart', function(e) {
                draggedElement = element;
                e.dataTransfer.effectAllowed = 'copy';
            });

            element.addEventListener('dragend', function(e) {
                draggedElement = null;
            });
        }

        // Setup draggable elements
        function setupDraggableElements() {
            // Make all divs draggable (you can customize this selector)
            const elements = document.querySelectorAll('div, p, span, img, a');
            elements.forEach(element => {
                if (element.offsetParent !== null) { // Only visible elements
                    makeDraggable(element);
                }
            });
        }

        // Initialize
        dropZone = createDropZone();
        document.body.appendChild(dropZone);

        // Setup draggable elements after page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupDraggableElements);
        } else {
            setupDraggableElements();
        }

        // Setup observer for dynamically added elements
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches('div, p, span, img, a')) {
                            makeDraggable(node);
                        }
                        // Also check children
                        const childElements = node.querySelectorAll && node.querySelectorAll('div, p, span, img, a');
                        if (childElements) {
                            childElements.forEach(makeDraggable);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize extension
    function init() {
        showHelloWorld();
        setupCatchAndDrop();

        // Add keyboard shortcut (Ctrl+Shift+H) to toggle hello world
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                const existing = document.getElementById('hello-world-extension');
                if (existing) {
                    existing.remove();
                } else {
                    showHelloWorld();
                }
            }
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();