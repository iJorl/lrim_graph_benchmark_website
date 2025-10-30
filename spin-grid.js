// Spin Grid Visualization Module
// Handles the interactive n×n spin grid with torus topology

document.addEventListener('DOMContentLoaded', function() {
    // Configuration parameters (easily configurable)
    const n = 16; // Grid size
    const nodeRadius = 17; // Node radius in pixels
    const nodeSpacing = 38; // Distance between node centers in pixels
    const canvasSize = 650; // Canvas size to fit 16x16 grid
    const updateInterval = 7; // Time between spin flips in milliseconds
    const distanceExponent = 2.6; // Exponent for distance-based interaction
    const temperature = 8.8787; // Temperature T for Metropolis criterion
    const kB = 1; // Boltzmann constant in J/K
    
    const canvas = document.getElementById('spin-grid-canvas');
    
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let spinGrid = [];
        let deltaEnergy = []; // Store delta energy for each node
        let displayMode = 'spin'; // 'spin' or 'energy'
        let isPaused = false; // Animation pause state
        const energyModeLabel = document.getElementById('energy-mode-label');
        
        // Update the energy mode label text
        function updateEnergyModeLabel() {
            if (energyModeLabel) {
                energyModeLabel.textContent = displayMode === 'spin' ? 'Energy' : 'State';
            }
        }
        
        // Calculate energy change if spin at (i,j) were flipped
        function calculateEnergyChange(i, j) {
            const currentSpin = spinGrid[i][j];
            let energySum = 0;
            
            // Sum interaction with all other spins
            for (let ii = 0; ii < n; ii++) {
                for (let jj = 0; jj < n; jj++) {
                    if (ii === i && jj === j) continue; // Skip self
                    
                    const dist = torusDistance(i, j, ii, jj);
                    if (dist > 0) {
                        const Jij = Math.pow(dist, -distanceExponent); // Interaction strength
                        const sj = spinGrid[ii][jj];
                        energySum += sj * Jij;
                    }
                }
            }
            
            // ΔE = si * Σ(sj * Jij) for flipping si → -si
            // Change in energy = (-si - si) * Σ(sj * Jij) = -2 * si * Σ(sj * Jij)
            return 2 * currentSpin * energySum;
        }
        
        // Calculate torus distance between two grid positions
        function torusDistance(i1, j1, i2, j2) {
            // Calculate minimum distance considering periodic boundaries
            const di = Math.min(Math.abs(i1 - i2), n - Math.abs(i1 - i2));
            const dj = Math.min(Math.abs(j1 - j2), n - Math.abs(j1 - j2));
            return Math.sqrt(di * di + dj * dj);
        }
        
        // Calculate delta energy for a specific node
        function calculateNodeDeltaEnergy(i, j) {
            let energy = 0;
            const si = spinGrid[i][j];
            
            for (let ii = 0; ii < n; ii++) {
                for (let jj = 0; jj < n; jj++) {
                    if (ii === i && jj === j) continue; // Skip self
                    
                    const dist = torusDistance(i, j, ii, jj);
                    if (dist > 0) { // Avoid division by zero
                        const sj = spinGrid[ii][jj];
                        energy += (sj * Math.pow(dist, -distanceExponent));
                    }
                }
            }
            
            return -si * energy;
        }
        
        // Calculate delta energy for all nodes
        function calculateAllDeltaEnergies() {
            deltaEnergy = [];
            for (let i = 0; i < n; i++) {
                deltaEnergy[i] = [];
                for (let j = 0; j < n; j++) {
                    deltaEnergy[i][j] = calculateNodeDeltaEnergy(i, j);
                }
            }
        }
        
        // Initialize spin grid with random +1/-1 values
        function initializeSpinGrid() {
            spinGrid = [];
            for (let i = 0; i < n; i++) {
                spinGrid[i] = [];
                for (let j = 0; j < n; j++) {
                    spinGrid[i][j] = Math.random() < 0.5 ? 1 : -1;
                }
            }
            // Calculate initial delta energies
            calculateAllDeltaEnergies();
        }
        
        // Draw the spin grid with torus boundary indicators
        function drawSpinGrid() {
            // Calculate grid dimensions based on parameters
            const gridWidth = (n - 1) * nodeSpacing;
            const gridHeight = (n - 1) * nodeSpacing;
            
            // Center the grid in the canvas
            const offsetX = (canvasSize - gridWidth) / 2;
            const offsetY = (canvasSize - gridHeight) / 2;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvasSize, canvasSize);
            
            // Helper function to get node position (centered)
            function getNodePos(i, j) {
                return {
                    x: offsetX + j * nodeSpacing,
                    y: offsetY + i * nodeSpacing
                };
            }
            
            // Draw edges first (so they appear behind nodes)
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const pos = getNodePos(i, j);
                    
                    // Draw horizontal edges
                    if (j < n - 1) {
                        // Regular horizontal edge
                        const nextPos = getNodePos(i, j + 1);
                        ctx.beginPath();
                        ctx.moveTo(pos.x + nodeRadius, pos.y);
                        ctx.lineTo(nextPos.x - nodeRadius, nextPos.y);
                        ctx.stroke();
                    }
                    
                    // Draw vertical edges
                    if (i < n - 1) {
                        // Regular vertical edge
                        const nextPos = getNodePos(i + 1, j);
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y + nodeRadius);
                        ctx.lineTo(nextPos.x, nextPos.y - nodeRadius);
                        ctx.stroke();
                    }
                }
            }
            
            // Draw torus boundary edges (wrap-around connections)
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed lines for torus edges
            
            // Horizontal torus connections (right edge to left edge)
            for (let i = 0; i < n; i++) {
                const rightPos = getNodePos(i, n - 1);
                const leftPos = getNodePos(i, 0);
                
                // Draw curved connection suggesting wrap-around
                ctx.beginPath();
                ctx.moveTo(rightPos.x + nodeRadius, rightPos.y);
                ctx.lineTo(canvasSize - 5, rightPos.y);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(5, leftPos.y);
                ctx.lineTo(leftPos.x - nodeRadius, leftPos.y);
                ctx.stroke();
            }
            
            // Vertical torus connections (bottom edge to top edge)
            for (let j = 0; j < n; j++) {
                const bottomPos = getNodePos(n - 1, j);
                const topPos = getNodePos(0, j);
                
                // Draw curved connection suggesting wrap-around
                ctx.beginPath();
                ctx.moveTo(bottomPos.x, bottomPos.y + nodeRadius);
                ctx.lineTo(bottomPos.x, canvasSize - 5);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(topPos.x, 5);
                ctx.lineTo(topPos.x, topPos.y - nodeRadius);
                ctx.stroke();
            }
            
            ctx.setLineDash([]); // Reset to solid lines
            
            // Draw nodes on top of edges
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const pos = getNodePos(i, j);
                    
                    if (displayMode === 'spin') {
                        const spin = spinGrid[i][j];
                        
                        // Draw node circle with spin colors
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.fillStyle = spin === 1 ? '#667eea' : '#ff6b6b';
                        ctx.fill();
                        
                        // Draw node border
                        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        
                        // Draw spin value (+ or -)
                        if (nodeRadius > 4) {
                            ctx.fillStyle = 'white';
                            ctx.font = `bold ${Math.min(nodeRadius * 0.8, 16)}px Inter, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(
                                spin === 1 ? '+' : '−',
                                pos.x,
                                pos.y
                            );
                        }
                    } else { // energy mode
                        const energy = deltaEnergy[i][j];
                        
                        // Color based on energy (purple for low, orange for high)
                        const allEnergies = deltaEnergy.flat();
                        const minEnergy = Math.min(...allEnergies);
                        const maxEnergy = Math.max(...allEnergies);
                        const normalized = maxEnergy === minEnergy ? 0.5 : (energy - minEnergy) / (maxEnergy - minEnergy);
                        
                        let fillColor;
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
                        
                        // Draw node circle with energy colors
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.fillStyle = fillColor;
                        ctx.fill();
                        
                        // Draw node border
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            
            // Draw corner indicators for torus topology
            ctx.fillStyle = '#764ba2';
            ctx.globalAlpha = 0.8;
            const cornerSize = 6;
            
            // Corner indicators showing torus wrap-around

            
            ctx.globalAlpha = 1.0;
        }
        
        // Animation for regeneration
        function animateRegeneration() {
            initializeSpinGrid();
            drawSpinGrid();
        }
        
        // Update delta energies after a spin flip at position (flippedI, flippedJ)
        function updateDeltaEnergiesAfterFlip(flippedI, flippedJ) {
            // Update delta energy for all nodes (since they all interact)
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i !== flippedI || j !== flippedJ) {
                        deltaEnergy[i][j] = calculateNodeDeltaEnergy(i, j);
                    }
                }
            }
            // Update the flipped node's energy too
            deltaEnergy[flippedI][flippedJ] = calculateNodeDeltaEnergy(flippedI, flippedJ);
        }
        
        // Spin flip function with Metropolis acceptance criterion
        function performSpinUpdate() {
            // Select one spin uniformly at random (UAR)
            const i = Math.floor(Math.random() * n);
            const j = Math.floor(Math.random() * n);
            
            // Calculate energy change for this potential flip
            const deltaE = calculateEnergyChange(i, j);
            
            // Calculate acceptance probability: p = min(1, exp(-ΔE/kBT))
            const acceptanceProbability = Math.min(1, Math.exp(-deltaE / (kB * temperature)));
            
            // Print acceptance probability to console
            //console.log(`p = ${acceptanceProbability.toFixed(4)}, ΔE = ${deltaE.toFixed(4)}`);
            
            // Generate random number for acceptance test
            const randomValue = Math.random();
            
            // Only flip if accepted by Metropolis criterion
            if (randomValue < acceptanceProbability) {
                // Flip the selected spin
                spinGrid[i][j] *= -1;
                
                // Update delta energies for all nodes
                updateDeltaEnergiesAfterFlip(i, j);
                
                // Redraw the grid to show the update
                drawSpinGrid();
                
                // Return the flipped position
                return { i, j, newSpin: spinGrid[i][j], accepted: true, deltaE, acceptanceProbability };
            } else {
                // Spin flip was rejected, no changes made
                return { i, j, newSpin: spinGrid[i][j], accepted: false, deltaE, acceptanceProbability };
            }
        }
        
        // Initialize and draw
        initializeSpinGrid();
        drawSpinGrid();
        updateEnergyModeLabel(); // Set initial label
        
        // Add key press functionality
        document.addEventListener('keydown', function(event) {
            const key = event.key.toLowerCase();
            
            if (key === 'r') {
                // Regenerate grid
                animateRegeneration();
            } else if (key === 'e') {
                // Toggle display mode between spin and energy
                displayMode = displayMode === 'spin' ? 'energy' : 'spin';
                updateEnergyModeLabel(); // Update button text
                drawSpinGrid(); // Redraw with new mode
            } else if (key === ' ' || key === 'spacebar') {
                // Toggle pause state
                isPaused = !isPaused;
                event.preventDefault(); // Prevent page scroll
            }
        });
        
        // Periodic spin flip - one random spin at specified interval
        setInterval(() => {
            if (!isPaused) {
                performSpinUpdate();
            }
        }, updateInterval);
    }
});