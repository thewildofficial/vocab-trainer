/**
 * SVG and CSS Charting Utilities
 */

export const Chart = {
    // Renders a simple CSS bar chart into a container
    renderBarChart(container, dataPoints, options = {}) {
        container.innerHTML = '';
        
        if (!dataPoints || dataPoints.length === 0) {
            container.innerHTML = '<p class="text-subtle">No data yet</p>';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            return;
        }

        const maxVal = Math.max(...dataPoints, 1200) + 50;
        const minVal = Math.min(...dataPoints, 1200) - 50;
        const range = maxVal - minVal;

        dataPoints.forEach((val, idx) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            
            // Calculate height percentage relative to range (normalized)
            // But for Elo, we want relative changes to look distinct
            // Let's just do height based on value relative to max for simplicity
            const heightPercent = Math.max(((val - minVal) / range) * 100, 10); // Min 10% height
            
            bar.style.height = `${heightPercent}%`;
            bar.style.backgroundColor = idx === dataPoints.length - 1 ? 'var(--color-primary)' : 'var(--color-secondary-light)';
            bar.dataset.val = Math.round(val);
            
            // Add animation delay
            bar.style.transitionDelay = `${idx * 0.05}s`;
            
            container.appendChild(bar);
        });
        
        // Trigger reflow for animation
        requestAnimationFrame(() => {
            const bars = container.querySelectorAll('.chart-bar');
            bars.forEach(b => {
                const targetHeight = b.style.height;
                b.style.height = '0%';
                requestAnimationFrame(() => {
                    b.style.height = targetHeight;
                });
            });
        });
    }
};
