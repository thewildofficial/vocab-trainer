/**
 * DOM Manipulation Utilities
 */

// Helper to select one or multiple elements
export const $ = (selector, scope = document) => {
    const els = scope.querySelectorAll(selector);
    return els.length > 1 ? els : els[0];
};

// Create element with attributes and children
export const createElement = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, val]) => {
        if (key === 'class') {
            el.className = val;
        } else if (key === 'dataset') {
            Object.entries(val).forEach(([dataKey, dataVal]) => {
                el.dataset[dataKey] = dataVal;
            });
        } else if (key.startsWith('on') && typeof val === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), val);
        } else {
            el.setAttribute(key, val);
        }
    });

    if (!Array.isArray(children)) children = [children];
    
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            el.appendChild(child);
        }
    });

    return el;
};

// Render logic for single-page routing
export const renderScreen = (screenId, setupCallback) => {
    const app = $('#app');
    const template = $(`#template-${screenId}`);
    
    if (!template) {
        console.error(`Screen template ${screenId} not found`);
        return;
    }

    // Fade out
    app.style.opacity = 0;
    
    setTimeout(() => {
        app.innerHTML = '';
        const content = template.content.cloneNode(true);
        app.appendChild(content);
        
        if (setupCallback) setupCallback();
        
        // Fade in
        requestAnimationFrame(() => {
            app.style.opacity = 1;
        });
    }, 200);
};
