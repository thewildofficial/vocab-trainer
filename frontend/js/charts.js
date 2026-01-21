export const Chart = {
    renderBarChart(container, dataPoints, options = {}) {
        container.innerHTML = '';
        
        if (!dataPoints || dataPoints.length === 0) {
            container.innerHTML = '<p class="text-subtle text-center">No data yet</p>';
            return;
        }

        const maxVal = Math.max(...dataPoints) + 50;
        const minVal = Math.min(...dataPoints) - 50;
        const range = maxVal - minVal || 1;

        dataPoints.forEach((val, idx) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const heightPercent = Math.max(((val - minVal) / range) * 100, 10);
            bar.style.height = `${heightPercent}%`;
            bar.style.backgroundColor = idx === dataPoints.length - 1 ? 'var(--color-primary)' : 'var(--color-secondary-light)';
            bar.dataset.val = Math.round(val);
            bar.style.transitionDelay = `${idx * 0.05}s`;
            container.appendChild(bar);
        });

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
    },

    renderLineChart(container, dataPoints, options = {}) {
        container.innerHTML = '';
        
        if (!dataPoints || dataPoints.length < 2) {
            container.innerHTML = '<p class="text-subtle text-center">Need more data</p>';
            return;
        }

        const width = container.clientWidth || 300;
        const height = options.height || 150;
        const padding = { top: 20, right: 20, bottom: 25, left: 45 };
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;

        const maxVal = Math.max(...dataPoints) + 20;
        const minVal = Math.min(...dataPoints) - 20;
        const range = maxVal - minVal || 1;

        const points = dataPoints.map((val, idx) => ({
            x: padding.left + (idx / (dataPoints.length - 1)) * innerWidth,
            y: padding.top + innerHeight - ((val - minVal) / range) * innerHeight,
            val
        }));

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.overflow = 'visible';
        svg.style.display = 'block';
        svg.style.margin = '0 auto';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'areaGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--color-primary)');
        stop1.setAttribute('stop-opacity', '0.3');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--color-primary)');
        stop2.setAttribute('stop-opacity', '0.05');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * innerHeight;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'var(--color-border)');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            const val = Math.round(maxVal - (i / gridLines) * range);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 8);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            // Get computed CSS variable value for theme-aware color
            const computedStyle = getComputedStyle(document.documentElement);
            const textColor = computedStyle.getPropertyValue('--color-text-light').trim() || '#777777';
            text.setAttribute('fill', textColor);
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', '700');
            text.textContent = val;
            svg.appendChild(text);
        }

        let areaPath = `M ${points[0].x} ${padding.top + innerHeight}`;
        points.forEach(p => { areaPath += ` L ${p.x} ${p.y}`; });
        areaPath += ` L ${points[points.length - 1].x} ${padding.top + innerHeight} Z`;

        const areaEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaEl.setAttribute('d', areaPath);
        areaEl.setAttribute('fill', 'url(#areaGradient)');
        svg.appendChild(areaEl);

        let linePath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            linePath += ` L ${points[i].x} ${points[i].y}`;
        }

        const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lineEl.setAttribute('d', linePath);
        lineEl.setAttribute('fill', 'none');
        lineEl.setAttribute('stroke', 'var(--color-primary)');
        lineEl.setAttribute('stroke-width', '3');
        lineEl.setAttribute('stroke-linecap', 'round');
        lineEl.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(lineEl);

        points.forEach((p, idx) => {
            const isLast = idx === points.length - 1;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', isLast ? 6 : 4);
            circle.setAttribute('fill', isLast ? 'var(--color-primary)' : 'var(--color-secondary)');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });

        const lastPoint = points[points.length - 1];
        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tooltip.setAttribute('x', lastPoint.x);
        tooltip.setAttribute('y', lastPoint.y - 12);
        tooltip.setAttribute('text-anchor', 'middle');
        tooltip.setAttribute('fill', 'var(--color-primary)');
        tooltip.setAttribute('font-size', '12');
        tooltip.setAttribute('font-weight', '800');
        tooltip.textContent = Math.round(lastPoint.val);
        svg.appendChild(tooltip);

        container.appendChild(svg);
    },

    renderProgressBar(container, value, max, options = {}) {
        const percent = Math.min(100, Math.max(0, (value / max) * 100));
        const color = options.color || 'var(--color-primary)';
        
        container.innerHTML = `
            <div class="progress-track" style="height: ${options.height || 8}px;">
                <div class="progress-fill" style="width: ${percent}%; background: ${color};"></div>
            </div>
        `;
    },

    renderFluencyBreakdown(container, wordMastery, allWords) {
        const bands = {
            easy: { min: 1000, max: 1150, label: 'Common Words', color: '#58CC02', total: 0, known: 0 },
            medium: { min: 1150, max: 1400, label: 'Mid Words', color: '#1CB0F6', total: 0, known: 0 },
            hard: { min: 1400, max: 1700, label: 'Hard Words', color: '#CE82FF', total: 0, known: 0 },
            expert: { min: 1700, max: 3000, label: 'Expert Words', color: '#FFD700', total: 0, known: 0 }
        };

        allWords.forEach(word => {
            const d = word.difficulty;
            for (const key of Object.keys(bands)) {
                if (d >= bands[key].min && d < bands[key].max) {
                    bands[key].total++;
                    if (wordMastery[word.word]?.correct >= 1) {
                        bands[key].known++;
                    }
                    break;
                }
            }
        });

        container.innerHTML = Object.values(bands).map(band => {
            const percent = band.total > 0 ? Math.round((band.known / band.total) * 100) : 0;
            return `
                <div class="fluency-band">
                    <div class="fluency-label">
                        <span>${band.label}</span>
                        <span class="fluency-percent">${percent}%</span>
                    </div>
                    <div class="progress-track" style="height: 8px;">
                        <div class="progress-fill" style="width: ${percent}%; background: ${band.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
};
