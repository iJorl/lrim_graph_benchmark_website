// Oracle Data Visualization Module
// Interactive tool to display oracle predictor performance data

document.addEventListener('DOMContentLoaded', function() {
    const oracleDataContainer = document.getElementById('oracle-data-viz');
    const oracleOverviewContainer = document.getElementById('oracle-overview-viz');

    let currentSize = '16';
    let showEasy = false;
    let showHard = true;
    let useLogScale = false; // For interactive plot
    let overviewLogScale = false; // For overview plot
    let mousePos = null; // Track mouse position for interactive plot
    
    // Color mapping based on grid sizes
    const colors = {
        "blue":     "#1f77b4",
        "orange":   "#ff7f0e", 
        "green":    "#2ca02c",
        "red":      "#d62728",
        "purple":   "#9467bd",
        "brown":    "#8c564b",
        "pink":     "#e377c2",
        "gray":     "#7f7f7f",
        "yellow":   "#bcbd22",
        "cyan":     "#17becf"
    };
    
    // Get color based on dataset size
    function getDatasetColor(datasetName) {
        if (datasetName.includes('16')) return colors.blue;
        if (datasetName.includes('32')) return colors.red;
        if (datasetName.includes('64')) return colors.green;
        if (datasetName.includes('128')) return colors.purple;
        if (datasetName.includes('256')) return colors.brown;
        return colors.gray; // fallback
    }
    
    // Initialize with data from oracle-data.js
    function loadOracleData() {
        // Debug info
        console.log('loadOracleData called');
        console.log('window.oracleData exists:', typeof window.oracleData !== 'undefined');
        console.log('window.oracleData is array:', Array.isArray(window.oracleData));
        if (window.oracleData) {
            console.log('window.oracleData length:', window.oracleData.length);
        }
        
        // Check if data is available
        if (typeof window.oracleData === 'undefined' || !Array.isArray(window.oracleData)) {
            if (oracleDataContainer) {
                oracleDataContainer.innerHTML = `
                    <div class="error">
                        <h4>Data Not Available</h4>
                        <p>Oracle data file (oracle-data.js) not found or not loaded.</p>
                        <p>Please ensure oracle-data.js is included before this script.</p>
                    </div>
                `;
            }
            if (oracleOverviewContainer) {
                oracleOverviewContainer.innerHTML = `
                    <div class="error">
                        <h4>Data Not Available</h4>
                        <p>Oracle data file (oracle-data.js) not found or not loaded.</p>
                    </div>
                `;
            }
            return;
        }
        
        console.log(`Loaded ${window.oracleData.length} data points from oracle-data.js`);
        
        // Initialize overview visualization
        if (oracleOverviewContainer) {
            initializeOverviewVisualization();
        }
        
        // Initialize individual dataset visualization
        if (oracleDataContainer) {
            initializeVisualization();
        }
    }
    
    // Get unique sizes
    function getUniqueSizes() {
        const sizes = [...new Set(window.oracleData.map(point => {
            const parts = point.d.split('_');
            return parts[1];
        }))];
        return sizes.sort((a, b) => parseInt(a) - parseInt(b));
    }
    
    // Get data for specific size and difficulties
    function getSizeData(size, includeEasy, includeHard) {
        const datasets = [];
        
        if (includeEasy) {
            datasets.push(`lrim_${size}_1.5_10k`);
        }
        if (includeHard) {
            datasets.push(`lrim_${size}_0.6_10k`);
        }
        
        const allData = [];
        datasets.forEach(dataset => {
            const data = window.oracleData.filter(point => point.d === dataset)
                                         .sort((a, b) => a.l - b.l);
            allData.push({ dataset, data });
        });

        return allData;
    }
    
    // Parse dataset name to extract info
    function parseDatasetName(name) {
        const parts = name.split('_');
        const size = parts[1];
        const difficulty = parts[2];
        const samples = parts[3];
        
        return {
            size: `${size}×${size}`,
            difficulty: difficulty === '0.6' ? 'Hard' : 'Easy',
            samples: samples
        };
    }
    
    // Create the visualization interface
    function initializeVisualization() {
        const sizes = getUniqueSizes();
        
        oracleDataContainer.innerHTML = `
            <div class="oracle-viz-container">
                <div class="oracle-controls">
                    <div class="size-buttons">
                        <div class="button-row">
                            ${sizes.map(s => `
                                <button class="size-btn ${s === currentSize ? 'selected' : ''}" data-size="${s}">${s}×${s}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="difficulty-buttons">
                        <div class="button-row">
                            <button class="difficulty-btn ${showEasy ? 'selected' : ''}" data-difficulty="easy">Easy (σ=1.5)</button>
                            <button class="difficulty-btn ${showHard ? 'selected' : ''}" data-difficulty="hard">Hard (σ=0.6)</button>
                        </div>
                    </div>
                </div>
                <div class="oracle-chart-container">
                    <div class="chart-header">
                        <button id="toggle-log-scale" class="log-scale-btn">${useLogScale ? 'Linear Scale' : 'Log Scale'}</button>
                    </div>
                    <canvas id="oracle-chart" width="1000" height="500"></canvas>
                </div>
            </div>
        `;
        
        // Setup event listeners
        const sizeButtons = document.querySelectorAll('.size-btn');
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update selection
                sizeButtons.forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                currentSize = e.target.dataset.size;
                updateVisualization();
            });
        });
        
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                
                // Toggle selection
                e.target.classList.toggle('selected');
                
                if (difficulty === 'easy') {
                    showEasy = e.target.classList.contains('selected');
                } else {
                    showHard = e.target.classList.contains('selected');
                }
                
                updateVisualization();
            });
        });
        
        // Toggle log scale
        const logScaleButton = document.getElementById('toggle-log-scale');
        logScaleButton.addEventListener('click', () => {
            useLogScale = !useLogScale;
            logScaleButton.textContent = useLogScale ? 'Linear Scale' : 'Log Scale';
            updateVisualization();
        });
        
        
        // Add mouse tracking for interactive chart
        const canvas = document.getElementById('oracle-chart');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            // Account for canvas scaling - use actual canvas dimensions vs display dimensions
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mousePos = {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
            updateVisualization(); // Redraw with mouse position
        });
        
        canvas.addEventListener('mouseleave', () => {
            mousePos = null;
            updateVisualization(); // Redraw without mouse position
        });
        
        updateVisualization();
    }
    
    // Update the visualization when dataset changes
    function updateVisualization() {
        drawChart();
    }
    
    // Draw the performance chart
    function drawChart() {
        const canvas = document.getElementById('oracle-chart');
        const ctx = canvas.getContext('2d');
        const datasets = getSizeData(currentSize, showEasy, showHard);
        
        if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const margin = { top: 40, right: 40, bottom: 60, left: 80 };
        const chartWidth = canvas.width - margin.left - margin.right;
        const chartHeight = canvas.height - margin.top - margin.bottom;
        
        // Fixed axis ranges - interactive plot uses selected grid size
        const minLayers = 1;
        const maxLayers = parseInt(currentSize);
        const minLogMSE = -13;
        const maxLogMSE = 1;
        
        // Scale functions
        const scaleX = useLogScale ? 
            (layers) => margin.left + (Math.log10(Math.max(layers, 0.1)) - Math.log10(minLayers)) / (Math.log10(maxLayers) - Math.log10(minLayers)) * chartWidth :
            (layers) => margin.left + ((layers - minLayers) / (maxLayers - minLayers)) * chartWidth;
        const scaleY = (logMSE) => margin.top + ((maxLogMSE - logMSE) / (maxLogMSE - minLogMSE)) * chartHeight;
        
        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // Vertical grid lines (match x-axis ticks)
        if (useLogScale) {
            // Log scale grid lines: 1, 2, 4, 8, 16, 32, 64, 128, 256
            const logTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256];
            logTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + chartHeight);
                    ctx.stroke();
                }
            });
        } else {
            // Linear scale grid lines
            const linearTicks = [1, 32, 64, 96, 128, 160, 192, 224, 256];
            linearTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + chartHeight);
                    ctx.stroke();
                }
            });
        }
        
        // Horizontal grid lines (match y-axis ticks: maxLogMSE down to minLogMSE)
        for (let logMSE = maxLogMSE; logMSE >= minLogMSE; logMSE--) {
            const y = scaleY(logMSE);
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw all datasets
        datasets.forEach(({ dataset, data }) => {
            if (data.length === 0) return;
            
            const datasetColor = getDatasetColor(dataset);
            const isDashed = dataset.includes('1.5'); // Easy datasets are dashed
            
            // Set line style (match overview plot)
            ctx.strokeStyle = datasetColor;
            ctx.lineWidth = 2;
            
            if (isDashed) {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            
            // Draw line
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = scaleX(point.l);
                // Clamp values below minLogMSE to minLogMSE
                const clampedValue = Math.max(point.t, minLogMSE);
                const y = scaleY(clampedValue);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // No data points - lines only (matching overview plot)
        });
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // X-axis label
        ctx.fillText('Hop Radius (k)', margin.left + chartWidth / 2, canvas.height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(20, margin.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Test Log MSE', 0, 0);
        ctx.restore();
        
        // Title
        ctx.font = '16px Inter, sans-serif';
        const difficulties = [];
        if (showEasy) difficulties.push('Easy');
        if (showHard) difficulties.push('Hard');
        const titleText = `Oracle Performance: ${currentSize}×${currentSize} (${difficulties.join(', ')})`;
        ctx.fillText(titleText, margin.left + chartWidth / 2, 25);
        
        // X-axis ticks
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';

        if (useLogScale) {
            // Log scale ticks: 1, 2, 4, 8, 16, 32, 64, 128, 256
            const logTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256];
            logTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    const y = margin.top + chartHeight + 15;
                    ctx.fillText(tick.toString(), x, y);
                }
            });
        } else {
            // Linear scale ticks
            const linearTicks = [1, 32, 64, 96, 128, 160, 192, 224, 256];
            linearTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    const y = margin.top + chartHeight + 15;
                    ctx.fillText(tick.toString(), x, y);
                }
            });
        }
        
        // Y-axis ticks (fixed: 1, 0, -1, -2, ..., -11)
        ctx.textAlign = 'right';
        for (let logMSE = maxLogMSE; logMSE >= minLogMSE; logMSE--) {
            const x = margin.left - 10;
            const y = scaleY(logMSE) + 4;
            ctx.fillText(logMSE.toString(), x, y);
        }
        
        // Mouse tracking and closest point display
        if (mousePos && mousePos.x >= margin.left && mousePos.x <= margin.left + chartWidth && 
            mousePos.y >= margin.top && mousePos.y <= margin.top + chartHeight) {
            
            let closestPoint = null;
            let closestDistance = Infinity;
            let closestDataset = null;
            
            // Find the closest data point across all datasets
            datasets.forEach(({ dataset, data }) => {
                data.forEach(point => {
                    const x = scaleX(point.l);
                    // Clamp values below minLogMSE to minLogMSE
                    const clampedValue = Math.max(point.t, minLogMSE);
                    const y = scaleY(clampedValue);
                    const distance = Math.sqrt(Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2));

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = { x, y, layers: point.l, logMSE: point.t };
                        closestDataset = dataset;
                    }
                });
            });
            
            if (closestPoint && closestDistance < 100) { // Only show if within 100 pixels
                // Draw crosshairs
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                
                // Vertical crosshair
                ctx.beginPath();
                ctx.moveTo(closestPoint.x, margin.top);
                ctx.lineTo(closestPoint.x, margin.top + chartHeight);
                ctx.stroke();
                
                // Horizontal crosshair
                ctx.beginPath();
                ctx.moveTo(margin.left, closestPoint.y);
                ctx.lineTo(margin.left + chartWidth, closestPoint.y);
                ctx.stroke();
                
                ctx.setLineDash([]); // Reset line dash
                
                // Highlight the closest point
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(closestPoint.x, closestPoint.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw white border around point
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Display coordinates in a tooltip
                const tooltipText = `(${closestPoint.layers}, ${closestPoint.logMSE.toFixed(3)})`;
                const difficulty = closestDataset.includes('1.5') ? 'Easy' : 'Hard';
                const tooltipText2 = `${currentSize}×${currentSize} ${difficulty}`;
                
                // Tooltip background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = '12px Inter, sans-serif';
                const textWidth = Math.max(ctx.measureText(tooltipText).width, ctx.measureText(tooltipText2).width);
                const tooltipWidth = textWidth + 16;
                const tooltipHeight = 40;
                
                // Position tooltip to avoid going off canvas
                let tooltipX = mousePos.x + 10;
                let tooltipY = mousePos.y - 10;
                
                if (tooltipX + tooltipWidth > canvas.width) {
                    tooltipX = mousePos.x - tooltipWidth - 10;
                }
                if (tooltipY - tooltipHeight < 0) {
                    tooltipY = mousePos.y + 30;
                }
                
                // Draw tooltip background with rounded corners
                ctx.beginPath();
                ctx.roundRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight, 4);
                ctx.fill();
                
                // Draw tooltip text
                ctx.fillStyle = 'white';
                ctx.textAlign = 'left';
                ctx.fillText(tooltipText, tooltipX + 8, tooltipY - 20);
                ctx.fillText(tooltipText2, tooltipX + 8, tooltipY - 8);
            }
        }
    }
    
    
    // Initialize the visualization only if we have at least one container
    if (oracleDataContainer || oracleOverviewContainer) {
        loadOracleData();
    }
    
    // Initialize overview visualization
    function initializeOverviewVisualization() {
        // Create overview chart container
        oracleOverviewContainer.innerHTML = `
            <div class="oracle-overview-container">
                <div class="overview-chart-container">
                    <div class="chart-header">
                        <button id="toggle-overview-log-scale" class="log-scale-btn">${overviewLogScale ? 'Linear Scale' : 'Log Scale'}</button>
                    </div>
                    <canvas id="oracle-overview-chart" width="1000" height="500"></canvas>
                </div>
                <div class="overview-legend" id="overview-legend"></div>
            </div>
        `;
        
        // Add overview log scale toggle
        const overviewLogScaleButton = document.getElementById('toggle-overview-log-scale');
        overviewLogScaleButton.addEventListener('click', () => {
            overviewLogScale = !overviewLogScale;
            overviewLogScaleButton.textContent = overviewLogScale ? 'Linear Scale' : 'Log Scale';
            drawOverviewChart();
        });
        
        drawOverviewChart();
    }
    
    // Draw overview chart with all datasets
    function drawOverviewChart() {
        const canvas = document.getElementById('oracle-overview-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Group data by dataset
        const datasetGroups = {};
        window.oracleData.forEach(point => {
            if (!datasetGroups[point.d]) {
                datasetGroups[point.d] = [];
            }
            datasetGroups[point.d].push(point);
        });

        // Sort each group by layers
        Object.keys(datasetGroups).forEach(dataset => {
            datasetGroups[dataset].sort((a, b) => a.l - b.l);
        });
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const margin = { top: 40, right: 40, bottom: 60, left: 80 };
        const chartWidth = canvas.width - margin.left - margin.right;
        const chartHeight = canvas.height - margin.top - margin.bottom;
        
        // Fixed axis ranges
        const minLayers = 1;
        const maxLayers = 256;
        const minLogMSE = -13;
        const maxLogMSE = 1;
        
        // Scale functions
        const scaleX = overviewLogScale ? 
            (layers) => margin.left + (Math.log10(Math.max(layers, 0.1)) - Math.log10(minLayers)) / (Math.log10(maxLayers) - Math.log10(minLayers)) * chartWidth :
            (layers) => margin.left + ((layers - minLayers) / (maxLayers - minLayers)) * chartWidth;
        const scaleY = (logMSE) => margin.top + ((maxLogMSE - logMSE) / (maxLogMSE - minLogMSE)) * chartHeight;
        
        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // Vertical grid lines (match x-axis ticks)
        if (overviewLogScale) {
            // Log scale grid lines: 1, 2, 4, 8, 16, 32, 64, 128, 256
            const logTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256];
            logTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + chartHeight);
                    ctx.stroke();
                }
            });
        } else {
            // Linear scale grid lines
            const linearTicks = [1, 32, 64, 96, 128, 160, 192, 224, 256];
            linearTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + chartHeight);
                    ctx.stroke();
                }
            });
        }
        
        // Horizontal grid lines (match y-axis ticks: maxLogMSE down to minLogMSE)
        for (let logMSE = maxLogMSE; logMSE >= minLogMSE; logMSE--) {
            const y = scaleY(logMSE);
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw all dataset lines
        const legendItems = [];
        Object.keys(datasetGroups).sort().forEach(dataset => {
            const data = datasetGroups[dataset];
            if (data.length === 0) return;
            
            const color = getDatasetColor(dataset);
            const isDashed = dataset.includes('1.5'); // Sigma 1.5 datasets are dashed
            
            // Set line style
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            if (isDashed) {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            
            // Draw line
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = scaleX(point.l);
                // Clamp values below minLogMSE to minLogMSE
                const clampedValue = Math.max(point.t, minLogMSE);
                const y = scaleY(clampedValue);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // Add to legend
            legendItems.push({ dataset, color, isDashed });
        });
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // X-axis label
        ctx.fillText('Hop Radius (k)', margin.left + chartWidth / 2, canvas.height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(20, margin.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Test Log MSE', 0, 0);
        ctx.restore();
        
        // Title
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Oracle Performance Across All Datasets', margin.left + chartWidth / 2, 25);
        
        // X-axis ticks
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';

        if (overviewLogScale) {
            // Log scale ticks: 1, 2, 4, 8, 16, 32, 64, 128, 256
            const logTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256];
            logTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    const y = margin.top + chartHeight + 15;
                    ctx.fillText(tick.toString(), x, y);
                }
            });
        } else {
            // Linear scale ticks
            const linearTicks = [1, 32, 64, 96, 128, 160, 192, 224, 256];
            linearTicks.forEach(tick => {
                if (tick >= minLayers && tick <= maxLayers) {
                    const x = scaleX(tick);
                    const y = margin.top + chartHeight + 15;
                    ctx.fillText(tick.toString(), x, y);
                }
            });
        }
        
        // Y-axis ticks (fixed: 1, 0, -1, -2, ..., -11)
        ctx.textAlign = 'right';
        for (let logMSE = maxLogMSE; logMSE >= minLogMSE; logMSE--) {
            const x = margin.left - 10;
            const y = scaleY(logMSE) + 4;
            ctx.fillText(logMSE.toString(), x, y);
        }
        
        // Create legend
        createOverviewLegend(legendItems);
    }
    
    // Create legend for overview chart
    function createOverviewLegend(legendItems) {
        const legendContainer = document.getElementById('overview-legend');
        if (!legendContainer) return;
        
        legendContainer.innerHTML = `
            <h5>Legend</h5>
            <div class="legend-grid">
                ${legendItems.map(item => {
                    const info = parseDatasetName(item.dataset);
                    return `
                        <div class="legend-item">
                            <div class="legend-line" style="background-color: ${item.color}; ${item.isDashed ? 'background-image: repeating-linear-gradient(90deg, transparent, transparent 3px, white 3px, white 6px);' : ''}"></div>
                            <span class="legend-text">${info.size} ${info.difficulty}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
});