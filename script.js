// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to navigation items on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-menu a[href^="#"]');

    function setActiveNavItem() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const sectionHeight = section.clientHeight;
            
            if (sectionTop <= 100 && sectionTop + sectionHeight > 100) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').substring(1) === current) {
                item.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', setActiveNavItem);

    // Newsletter form submission
    const newsletterForm = document.querySelector('.contact-form form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Simulate form submission
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = 'Subscribed!';
                submitBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    this.reset();
                }, 2000);
            }, 1500);
        });
    }

    // Animate chart bars on scroll
    const chartBars = document.querySelectorAll('.chart-bar');
    
    function animateChart() {
        const chartSection = document.querySelector('.results');
        const rect = chartSection.getBoundingClientRect();
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            chartBars.forEach((bar, index) => {
                setTimeout(() => {
                    bar.style.transform = 'scaleY(1)';
                    bar.style.opacity = '1';
                }, index * 200);
            });
        }
    }

    // Initialize chart bars
    chartBars.forEach(bar => {
        bar.style.transform = 'scaleY(0)';
        bar.style.opacity = '0';
        bar.style.transformOrigin = 'bottom';
        bar.style.transition = 'all 0.6s ease';
    });

    window.addEventListener('scroll', animateChart);
    
    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card, .dataset-card, .doc-card');
    
    function animateCards() {
        featureCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            
            if (rect.top < window.innerHeight - 100) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }

    // Initialize feature cards
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
    });

    window.addEventListener('scroll', animateCards);
    animateCards(); // Run once on load

    // Mobile menu toggle (for future implementation)
    const createMobileMenu = () => {
        const navbar = document.querySelector('.navbar');
        const navMenu = document.querySelector('.nav-menu');
        
        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.className = 'mobile-menu-btn';
        hamburger.innerHTML = '☰';
        hamburger.style.display = 'none';
        hamburger.style.background = 'none';
        hamburger.style.border = 'none';
        hamburger.style.fontSize = '1.5rem';
        hamburger.style.color = '#333';
        hamburger.style.cursor = 'pointer';
        
        navbar.querySelector('.nav-container').appendChild(hamburger);
        
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('mobile-active');
        });
    };

    createMobileMenu();

    // Code tabs functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Load example code if example tab is clicked
            if (targetTab === 'example') {
                loadExampleCode();
            }
        });
    });

    // Cache for example code
    let exampleCodeCache = null;
    let exampleCodeLoaded = false;

    // Load example code from GitHub or fallback to local JS variable
    async function loadExampleCode() {
        const exampleCodeEl = document.getElementById('example-code');
        if (!exampleCodeEl) return;

        // If already loaded, just reapply highlighting
        if (exampleCodeLoaded && exampleCodeCache) {
            exampleCodeEl.textContent = exampleCodeCache;
            // Remove the data-highlighted attribute to allow re-highlighting
            exampleCodeEl.removeAttribute('data-highlighted');
            if (window.hljs) {
                hljs.highlightElement(exampleCodeEl);
            }
            return;
        }

        const githubUrl = 'https://raw.githubusercontent.com/iJorl/lrim_graph_benchmark/main/example-setup/train.py';

        try {
            // Try loading from GitHub first
            const response = await fetch(githubUrl);

            if (response.ok) {
                const code = await response.text();
                exampleCodeCache = code;
                exampleCodeLoaded = true;
                exampleCodeEl.textContent = code;
                // Apply syntax highlighting
                if (window.hljs) {
                    hljs.highlightElement(exampleCodeEl);
                }
            } else if (window.fallbackExampleCode) {
                // Use fallback code from example-code.js
                console.log('GitHub fetch failed, using fallback from example-code.js');
                exampleCodeCache = window.fallbackExampleCode;
                exampleCodeLoaded = true;
                exampleCodeEl.textContent = window.fallbackExampleCode;
                // Apply syntax highlighting
                if (window.hljs) {
                    hljs.highlightElement(exampleCodeEl);
                }
            } else {
                exampleCodeEl.textContent = '# Error loading example code\n# Please visit: https://github.com/iJorl/lrim_graph_benchmark/blob/main/example-setup/train.py';
            }
        } catch (error) {
            console.error('Error loading example code from GitHub:', error);
            // Use fallback code if available
            if (window.fallbackExampleCode) {
                console.log('Using fallback code from example-code.js');
                exampleCodeCache = window.fallbackExampleCode;
                exampleCodeLoaded = true;
                exampleCodeEl.textContent = window.fallbackExampleCode;
                // Apply syntax highlighting
                if (window.hljs) {
                    hljs.highlightElement(exampleCodeEl);
                }
            } else {
                exampleCodeEl.textContent = '# Error loading example code\n# Please visit: https://github.com/iJorl/lrim_graph_benchmark/blob/main/example-setup/train.py';
            }
        }
    }

    // Copy code to clipboard (copies content from active tab)
    window.copyExampleCode = function() {
        // Find the active tab panel
        const activePanel = document.querySelector('.tab-panel.active');
        if (!activePanel) return;

        // Get the code element from the active panel
        const codeEl = activePanel.querySelector('code');
        if (!codeEl) return;

        // Get the text content (for example tab, use cache if available)
        let code;
        if (activePanel.id === 'example-tab' && exampleCodeCache) {
            code = exampleCodeCache;
        } else {
            code = codeEl.textContent;
        }

        navigator.clipboard.writeText(code).then(() => {
            // Visual feedback
            const copyBtn = document.getElementById('copy-code-btn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓';
                copyBtn.style.color = '#28a745';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.color = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    }

    // Dataset selector functionality
    const datasetOptions = document.querySelectorAll('.dataset-option');
    const datasetCanvas = document.getElementById('dataset-grid-canvas');
    const difficultyTags = document.querySelectorAll('.difficulty-tag');

    if (datasetCanvas) {
        const ctx = datasetCanvas.getContext('2d');
        let currentSize = 16;
        let currentDifficulty = '0.6';

        // Difficulty tag click handlers
        difficultyTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const difficulty = tag.dataset.difficulty;

                // Update active state
                difficultyTags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');

                // Update current difficulty
                currentDifficulty = difficulty;

                // Update dataset name code
                updateDatasetName();

                // Redraw grid with new difficulty
                drawGrid(currentSize);
            });
        });

        function updateDatasetName() {
            const name = `lrim_${currentSize}_${currentDifficulty}_10k`;

            // Update dataset showcase code
            const nameElement = document.getElementById('dataset-name-code');
            if (nameElement) {
                nameElement.textContent = `'${name}'`;
            }

            // Update usage snippet code
            const usageDatasetName = document.getElementById('usage-dataset-name');
            if (usageDatasetName) {
                usageDatasetName.textContent = `'${name}'`;
            }
        }

        function drawGrid(size) {
            const canvas = datasetCanvas;
            const width = canvas.width;
            const height = canvas.height;
            const padding = 20;
            const gridSize = Math.min(width, height) - (padding * 2);
            const cellSize = gridSize / size;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Try to load actual dataset sample
            const datasetKey = `lrim_${size}_${currentDifficulty}_10k`;
            let spinData = null;

            // Check if dataset samples are available (from lrim_dataset.js)
            if (typeof datasetSamples !== 'undefined' && datasetSamples[datasetKey]) {
                const dataset = datasetSamples[datasetKey];
                if (dataset.d && dataset.d.length > 0) {
                    // Use first sample
                    spinData = dataset.d[0].x;
                }
            }

            // Draw grid
            const drawStrokes = size < 128; // Only draw strokes for smaller grids
            if (drawStrokes) {
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 0.5;
            }

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const x = padding + i * cellSize;
                    const y = padding + j * cellSize;

                    // Get spin value from actual data or use random
                    let spin;
                    if (spinData && spinData[i * size + j] !== undefined) {
                        spin = spinData[i * size + j]; // Data is now flattened
                    } else {
                        spin = Math.random() > 0.5 ? 1 : -1; // Fallback to random
                    }

                    ctx.fillStyle = spin === 1 ? '#667eea' : '#764ba2';
                    ctx.fillRect(x, y, cellSize, cellSize);
                    if (drawStrokes) {
                        ctx.strokeRect(x, y, cellSize, cellSize);
                    }
                }
            }
        }

        // Draw "NA" in pixel art style with explanation text
        function drawNAPixelArt(canvasWidth, canvasHeight) {
            const pixelSize = 20; // Size of each pixel block
            const color = '#667eea'; // Blue color

            // "N" pattern (5x7 grid)
            const nPattern = [
                [1,0,0,0,1],
                [1,1,0,0,1],
                [1,0,1,0,1],
                [1,0,0,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1]
            ];

            // "A" pattern (5x7 grid)
            const aPattern = [
                [0,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1]
            ];

            // Calculate center position for NA
            const letterWidth = 5 * pixelSize;
            const letterHeight = 7 * pixelSize;
            const spacing = pixelSize * 2;
            const totalWidth = letterWidth * 2 + spacing;
            const startX = (canvasWidth - totalWidth) / 2;
            const startY = (canvasHeight - letterHeight) / 2 - 40; // Move up to make room for text

            // Draw "N"
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 5; col++) {
                    if (nPattern[row][col] === 1) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            startX + col * pixelSize,
                            startY + row * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }

            // Draw "A"
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 5; col++) {
                    if (aPattern[row][col] === 1) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            startX + letterWidth + spacing + col * pixelSize,
                            startY + row * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }

            // Draw smaller pixel text below NA
            const textColor = '#667eea';
            const smallPixelSize = 3; // Smaller pixels for text
            const textY = startY + letterHeight + 40;

            // Create pixel font patterns (3x5 for each character)
            const pixelFont = {
                'F': [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,0,0]],
                'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
                'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
                'E': [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]],
                'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
                'O': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
                'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
                'G': [[1,1,1],[1,0,0],[1,0,1],[1,0,1],[1,1,1]],
                'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
                'S': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
                'V': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
                'W': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
                'N': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
                'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
                ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
            };

            // Text to display
            const line1 = 'FILE TOO LARGE';
            const line2 = 'TO SERVE ON WEBSITE';

            // Helper function to draw text line in pixel art
            function drawPixelText(text, y) {
                const charWidth = 3 * smallPixelSize;
                const charSpacing = smallPixelSize;
                const totalWidth = text.length * (charWidth + charSpacing) - charSpacing;
                let x = (canvasWidth - totalWidth) / 2;

                for (let char of text) {
                    const pattern = pixelFont[char];
                    if (pattern) {
                        for (let row = 0; row < 5; row++) {
                            for (let col = 0; col < 3; col++) {
                                if (pattern[row][col] === 1) {
                                    ctx.fillStyle = textColor;
                                    ctx.fillRect(
                                        x + col * smallPixelSize,
                                        y + row * smallPixelSize,
                                        smallPixelSize,
                                        smallPixelSize
                                    );
                                }
                            }
                        }
                    }
                    x += charWidth + charSpacing;
                }
            }

            drawPixelText(line1, textY);
            drawPixelText(line2, textY + 25);
        }

        // Initial draw
        drawGrid(currentSize);

        // Make canvas clickable to open explorer with current configuration
        datasetCanvas.style.cursor = 'pointer';

        datasetCanvas.addEventListener('click', () => {
            // Build URL with size and difficulty parameters
            const url = `explore.html?size=${currentSize}&difficulty=${currentDifficulty}#data`;
            window.location.href = url;
        });

        // Dataset option click handlers
        datasetOptions.forEach(option => {
            option.addEventListener('click', () => {
                const size = parseInt(option.dataset.size);
                const nodes = option.dataset.nodes;
                const title = option.dataset.title;

                // Update active state
                datasetOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Update card content
                document.getElementById('dataset-title').textContent = title;
                document.getElementById('dataset-nodes').textContent = `${nodes} nodes`;

                // Update current size and dataset name
                currentSize = size;
                updateDatasetName();

                // Draw new grid
                drawGrid(size);

                // Update cursor based on size
                updateCanvasCursor();
            });
        });

        // Dataset code click handler - scroll to usage section
        const datasetCodeLink = document.getElementById('dataset-code-link');
        if (datasetCodeLink) {
            datasetCodeLink.addEventListener('click', () => {
                const getStartedSection = document.getElementById('get-started');
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;

                if (getStartedSection) {
                    const targetPosition = getStartedSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Switch to usage tab
                    setTimeout(() => {
                        const usageTab = document.querySelector('[data-tab="usage"]');
                        if (usageTab) {
                            usageTab.click();
                        }
                    }, 500);
                }
            });
        }
    }
});

// Add CSS for mobile menu
const style = document.createElement('style');
style.textContent = `
    .nav-menu a.active {
        color: #667eea;
        position: relative;
    }

    .nav-menu a.active::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 1px;
    }

    @media (max-width: 768px) {
        .mobile-menu-btn {
            display: block !important;
        }
        
        .nav-menu {
            position: fixed;
            top: 70px;
            left: -100%;
            width: 100%;
            height: calc(100vh - 70px);
            background: white;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding-top: 2rem;
            gap: 1rem;
            transition: left 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .nav-menu.mobile-active {
            left: 0;
        }
        
        .nav-menu a {
            font-size: 1.2rem;
            padding: 1rem;
        }
    }
`;
document.head.appendChild(style);