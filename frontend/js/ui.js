/**
 * DOM Manipulation Utilities
 */

// Select element(s) by selector
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

// Render screen from template
export const renderScreen = (screenId, setupCallback) => {
    const screenContainer = $('#screen-container');
    const template = $(`#template-${screenId}`);
    
    if (!screenContainer) {
        console.error('Screen container not found!');
        return;
    }
    
    if (!template) {
        console.error(`Template ${screenId} not found`);
        return;
    }

    // Clear and render
    screenContainer.innerHTML = '';
    const content = template.content.cloneNode(true);
    screenContainer.appendChild(content);
    
    // Run setup callback
    if (setupCallback) setupCallback();
};
