// Dataset Visualization Module
// Handles the interactive dataset sample visualizer

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the explore page
    const spinCanvas = document.getElementById('spin-canvas');
    const energyCanvas = document.getElementById('energy-canvas');
    const histogramCanvas = document.getElementById('histogram-canvas');
    if (!spinCanvas || !energyCanvas || !histogramCanvas) return;
    
    // Configuration parameters
    const canvasSize = 500;
    const nodeRadius = {
        16: 12,
        32: 6,
        64: 3.5,
        128: 2,
        256: 1
    };
    const nodeSpacing = {
        16: 28,
        32: 14,
        64: 7,
        128: 3.5,
        256: 1.75
    };
    
    // Read URL parameters for initial configuration
    const urlParams = new URLSearchParams(window.location.search);
    const urlSize = urlParams.get('size');
    const urlDifficulty = urlParams.get('difficulty');

    // State variables
    let currentSize = urlSize ? parseInt(urlSize) : 32;
    let currentDifficulty = urlDifficulty ? parseFloat(urlDifficulty) : 0.6; // Hard
    let currentSample = 0;
    let datasets = null;
    
    // Canvas contexts
    const spinCtx = spinCanvas.getContext('2d');
    const energyCtx = energyCanvas.getContext('2d');
    const histogramCtx = histogramCanvas.getContext('2d');
    
    // DOM elements
    const sizeButtons = document.querySelectorAll('.size-btn');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const prevSampleBtn = document.getElementById('prev-sample');
    const nextSampleBtn = document.getElementById('next-sample');
    const currentSampleSpan = document.getElementById('current-sample');
    const datasetTitle = document.getElementById('dataset-title');
    
    // Initialize datasets from lrim_dataset.js
    function initializeDatasets() {
        if (typeof datasetSamples !== 'undefined') {
            datasets = datasetSamples;
            console.log('Loaded datasets:', Object.keys(datasets));
            updateVisualization();
        } else {
            console.error('Dataset samples not found. Make sure lrim_dataset.js is loaded.');
        }
    }
    
    // Get current dataset key
    function getCurrentDatasetKey() {
        return `lrim_${currentSize}_${currentDifficulty}_10k`;
    }
    
    // Update the dataset title
    function updateTitle() {
        const difficulty = currentDifficulty === 0.6 ? 'Hard' : 'Easy';
        datasetTitle.textContent = `${currentSize}×${currentSize} ${difficulty} (σ=${currentDifficulty})`;
    }
    
    // Update sample indicator
    function updateSampleIndicator() {
        currentSampleSpan.textContent = currentSample + 1;
    }
    
    // Draw histogram of delta energy values
    function drawHistogram(energyData) {
        const canvas = histogramCanvas;
        const ctx = histogramCtx;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        if (!energyData || !Array.isArray(energyData)) {
            console.error('Invalid energy data for histogram');
            return;
        }
        
        // Extract energy values (data is now flattened)
        const values = energyData;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        // Create bins
        const numBins = 30;
        const binSize = (maxValue - minValue) / numBins;
        const bins = new Array(numBins).fill(0);
        
        // Fill bins
        values.forEach(value => {
            let binIndex = Math.floor((value - minValue) / binSize);
            if (binIndex >= numBins) binIndex = numBins - 1; // Handle edge case
            bins[binIndex]++;
        });
        
        // Drawing parameters
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const plotWidth = canvasWidth - margin.left - margin.right;
        const plotHeight = canvasHeight - margin.top - margin.bottom;
        const barWidth = plotWidth / numBins;
        const maxCount = Math.max(...bins);
        
        // Draw bars
        ctx.fillStyle = '#7c3aed';
        bins.forEach((count, i) => {
            const barHeight = (count / maxCount) * plotHeight;
            const x = margin.left + i * barWidth;
            const y = margin.top + plotHeight - barHeight;
            
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        });
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + plotHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + plotHeight);
        ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        // X-axis labels
        for (let i = 0; i <= 4; i++) {
            const value = minValue + (i / 4) * (maxValue - minValue);
            const x = margin.left + (i / 4) * plotWidth;
            const y = margin.top + plotHeight + 20;
            ctx.fillText(value.toFixed(2), x, y);
        }
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (i / 4) * maxCount;
            const x = margin.left - 10;
            const y = margin.top + plotHeight - (i / 4) * plotHeight + 4;
            ctx.fillText(Math.round(value).toString(), x, y);
        }
        
        // Axis titles
        ctx.textAlign = 'center';
        ctx.font = '14px Inter, sans-serif';
        
        // X-axis title
        ctx.fillText('Delta Energy', canvasWidth / 2, canvasHeight - 10);
        
        // Y-axis title
        ctx.save();
        ctx.translate(20, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Frequency', 0, 0);
        ctx.restore();
    }
    
    // Draw grid on canvas with given data and context
    function drawGrid(data, size, ctx, isEnergyMode = false) {
        // Clear canvas
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        if (!data || !Array.isArray(data) || data.length !== size * size) {
            console.error('Invalid data:', data);
            return;
        }
        
        const radius = nodeRadius[size];
        const spacing = nodeSpacing[size];
        
        // Calculate grid dimensions and centering offset
        const gridWidth = (size - 1) * spacing;
        const gridHeight = (size - 1) * spacing;
        const offsetX = (canvasSize - gridWidth) / 2;
        const offsetY = (canvasSize - gridHeight) / 2;
        
        // Helper function to get node position
        function getNodePos(i, j) {
            return {
                x: offsetX + j * spacing,
                y: offsetY + i * spacing
            };
        }
        
        // Draw grid lines first (if size is small enough)
        if (size <= 64) {
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
            ctx.lineWidth = 1;
            
            // Horizontal lines
            for (let i = 0; i <= size - 1; i++) {
                const pos1 = getNodePos(i, 0);
                const pos2 = getNodePos(i, size - 1);
                ctx.beginPath();
                ctx.moveTo(pos1.x - radius, pos1.y);
                ctx.lineTo(pos2.x + radius, pos2.y);
                ctx.stroke();
            }
            
            // Vertical lines
            for (let j = 0; j <= size - 1; j++) {
                const pos1 = getNodePos(0, j);
                const pos2 = getNodePos(size - 1, j);
                ctx.beginPath();
                ctx.moveTo(pos1.x, pos1.y - radius);
                ctx.lineTo(pos2.x, pos2.y + radius);
                ctx.stroke();
            }
        }
        
        // For energy mode, calculate min/max for normalization
        let minValue, maxValue;
        if (isEnergyMode) {
            minValue = Math.min(...data);
            maxValue = Math.max(...data);
        }
        
        // Draw nodes
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = i * size + j;
                const value = data[index]; // Data is now flattened: [value, value, ...]
                const pos = getNodePos(i, j);
                
                let fillColor;
                if (isEnergyMode) {
                    // Normalize energy value to [0, 1]
                    const normalized = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
                    // Purple for low energy, orange for high energy
                    if (normalized < 0.5) {
                        // Low energy: dark purple to light purple
                        const intensity = normalized * 2; // 0 to 1
                        const r = Math.floor(75 + intensity * 50);   // 75 to 125
                        const g = Math.floor(0 + intensity * 50);    // 0 to 50  
                        const b = Math.floor(130 + intensity * 125); // 130 to 255
                        fillColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                        // High energy: light orange to dark orange
                        const intensity = (normalized - 0.5) * 2; // 0 to 1
                        const r = Math.floor(255 - intensity * 50);  // 255 to 205
                        const g = Math.floor(140 + intensity * 25);  // 140 to 165
                        const b = Math.floor(50 - intensity * 50);   // 50 to 0
                        fillColor = `rgb(${r}, ${g}, ${b})`;
                    }
                } else {
                    // Spin colors
                    fillColor = value === 1 ? '#667eea' : '#ff6b6b';
                }
                
                // Draw node circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = fillColor;
                ctx.fill();
                
                // Draw node border for larger nodes
                if (radius > 2) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = Math.max(1, radius * 0.1);
                    ctx.stroke();
                }
                
                // Draw spin value (+ or -) for larger spin nodes
                if (!isEnergyMode && radius > 4) {
                    ctx.fillStyle = 'white';
                    ctx.font = `bold ${Math.min(radius * 0.8, 10)}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        value === 1 ? '+' : '−',
                        pos.x,
                        pos.y
                    );
                }
            }
        }
    }
    
    // Update the visualization with current settings
    function updateVisualization() {
        if (!datasets) return;
        
        const datasetKey = getCurrentDatasetKey();
        const dataset = datasets[datasetKey];
        
        if (!dataset) {
            console.error('Dataset not found:', datasetKey);
            console.log('Available datasets:', Object.keys(datasets));
            return;
        }
        
        if (!dataset.d || dataset.d.length === 0) {
            console.error('No samples in dataset:', datasetKey);
            return;
        }

        // Clamp current sample to available range
        currentSample = Math.max(0, Math.min(currentSample, dataset.d.length - 1));

        const sample = dataset.d[currentSample];
        if (!sample || !sample.x || !sample.y) {
            console.error('Invalid sample data:', sample);
            return;
        }
        
        // Draw both grids
        drawGrid(sample.x, currentSize, spinCtx, false);     // Spin configuration
        drawGrid(sample.y, currentSize, energyCtx, true);    // Delta energy
        
        // Draw histogram
        drawHistogram(sample.y);
        
        // Update UI elements
        updateTitle();
        updateSampleIndicator();
        
        console.log(`Displaying ${datasetKey} sample ${currentSample}`);
    }
    
    // Size button click handlers
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all size buttons
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current size
            currentSize = parseInt(this.dataset.size);
            currentSample = 0; // Reset to first sample
            updateVisualization();
        });
    });
    
    // Difficulty button click handlers
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all difficulty buttons
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current difficulty
            currentDifficulty = parseFloat(this.dataset.difficulty);
            currentSample = 0; // Reset to first sample
            updateVisualization();
        });
    });
    
    
    // Sample navigation buttons
    prevSampleBtn.addEventListener('click', function() {
        if (!datasets) return;

        const datasetKey = getCurrentDatasetKey();
        const dataset = datasets[datasetKey];

        if (dataset && dataset.d) {
            currentSample = (currentSample - 1 + dataset.d.length) % dataset.d.length;
            updateVisualization();
        }
    });

    nextSampleBtn.addEventListener('click', function() {
        if (!datasets) return;

        const datasetKey = getCurrentDatasetKey();
        const dataset = datasets[datasetKey];

        if (dataset && dataset.d) {
            currentSample = (currentSample + 1) % dataset.d.length;
            updateVisualization();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        // Skip if user is typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        const key = event.key;
        const code = event.code;
        
        // Handle spacebar with multiple checks
        if (key === ' ' || code === 'Space') {
            // Toggle between easy and hard
            const newDifficulty = currentDifficulty === 0.6 ? 1.5 : 0.6;
            
            // Update button states
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            const targetBtn = document.querySelector(`[data-difficulty="${newDifficulty}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
            
            currentDifficulty = newDifficulty;
            currentSample = 0; // Reset to first sample
            updateVisualization();
            event.preventDefault();
            return;
        }
        
        switch (key) {
            case 'ArrowLeft':
                if (prevSampleBtn) {
                    prevSampleBtn.click();
                    event.preventDefault();
                }
                break;
            case 'ArrowRight':
                if (nextSampleBtn) {
                    nextSampleBtn.click();
                    event.preventDefault();
                }
                break;
            case 'ArrowUp':
                // Go to larger size
                const sizes = [16, 32, 64, 128, 256];
                const currentIndex = sizes.indexOf(currentSize);
                if (currentIndex < sizes.length - 1) {
                    const newSize = sizes[currentIndex + 1];

                    // Update button states
                    sizeButtons.forEach(btn => btn.classList.remove('active'));
                    const targetSizeBtn = document.querySelector(`[data-size="${newSize}"]`);
                    if (targetSizeBtn) {
                        targetSizeBtn.classList.add('active');
                    }

                    currentSize = newSize;
                    currentSample = 0; // Reset to first sample
                    updateVisualization();
                }
                event.preventDefault();
                break;
            case 'ArrowDown':
                // Go to smaller size
                const sizesDown = [16, 32, 64, 128, 256];
                const currentIndexDown = sizesDown.indexOf(currentSize);
                if (currentIndexDown > 0) {
                    const newSize = sizesDown[currentIndexDown - 1];

                    // Update button states
                    sizeButtons.forEach(btn => btn.classList.remove('active'));
                    const targetSizeBtn = document.querySelector(`[data-size="${newSize}"]`);
                    if (targetSizeBtn) {
                        targetSizeBtn.classList.add('active');
                    }

                    currentSize = newSize;
                    currentSample = 0; // Reset to first sample
                    updateVisualization();
                }
                event.preventDefault();
                break;
        }
    });
    
    // Set initial button states based on URL parameters
    function setInitialButtonStates() {
        // Set size button active state
        sizeButtons.forEach(btn => {
            if (parseInt(btn.dataset.size) === currentSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Set difficulty button active state
        difficultyButtons.forEach(btn => {
            if (parseFloat(btn.dataset.difficulty) === currentDifficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Initialize when DOM is ready
    setInitialButtonStates();
    setTimeout(initializeDatasets, 100); // Small delay to ensure lrim_dataset.js is loaded
});