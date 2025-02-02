class WheelSpinner {
    constructor() {
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.isSpinning = false;
        this.currentRotation = 0;
        this.sections = ['Julian', 'Spin Again', 'Julian', 'Austin', 'Spin Again', 'Austin'];
        this.spinHistory = [];
        this.maxHistory = 10;
        
        // Add base URL detection
        this.baseUrl = window.location.hostname === 'salixlabs.github.io' ? '/wheelspin/' : './';
        
        // Set initial triangle color to match spin button
        const triangleFill = document.querySelector('.triangle-fill');
        triangleFill.style.fill = '#ffff00';
        
        this.spinSound = document.getElementById('spinSound');
        this.stopSoundSpinAgain = document.getElementById('stopSoundSpinAgain');
        this.stopSoundAustin = document.getElementById('stopSoundAustin');
        this.stopSoundJulian = document.getElementById('stopSoundJulian');
        this.spinSound.playbackRate = 1.0;  // Normal speed to start
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.drawWheel();
        this.spinButton.addEventListener('click', () => this.spin());
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.offsetWidth, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        this.drawWheel();
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.currentRotation);

        const sectionAngle = (2 * Math.PI) / this.sections.length;

        for (let i = 0; i < this.sections.length; i++) {
            // Draw the colored section
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, radius, i * sectionAngle, (i + 1) * sectionAngle);
            this.ctx.closePath();
            
            // Get the color from the computed CSS style
            const tempDiv = document.createElement('div');
            tempDiv.className = `wheel-section-${i + 1}`;
            document.body.appendChild(tempDiv);
            const color = window.getComputedStyle(tempDiv).fill;
            document.body.removeChild(tempDiv);
            
            this.ctx.fillStyle = color;
            this.ctx.fill();
            
            // Draw the black line
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(radius * Math.cos(i * sectionAngle), radius * Math.sin(i * sectionAngle));
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw the text
            this.ctx.save();
            this.ctx.rotate(i * sectionAngle + sectionAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px "Clarendon Bold"';
            this.ctx.fillText(this.sections[i], radius - 20, 0);
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }

    updateHistory(result, color) {
        this.spinHistory.unshift({ result, color });  // Add to start of array
        if (this.spinHistory.length > this.maxHistory) {
            this.spinHistory.pop();  // Remove oldest entry
        }
        
        const historyList = document.getElementById('spinHistory');
        historyList.innerHTML = '';  // Clear current history
        
        this.spinHistory.forEach(entry => {
            const li = document.createElement('li');
            li.style.borderLeft = `4px solid ${entry.color}`;
            li.style.borderRight = `4px solid ${entry.color}`;
            
            if (entry.result === 'Austin' || entry.result === 'Julian') {
                const img = document.createElement('img');
                img.src = `${this.baseUrl}Assets/${entry.result.toLowerCase()}-baby.png`;
                li.appendChild(img);
            }
            
            const text = document.createElement('span');
            text.textContent = entry.result;
            li.appendChild(text);
            
            historyList.appendChild(li);
        });
    }

    spin() {
        if (this.isSpinning) return;
        
        // Start the spinning sound once
        this.spinSound.currentTime = 0;
        this.spinSound.play();
        
        // Clear any previous winning selection
        const winningDisplay = document.getElementById('winningSelection');
        winningDisplay.textContent = '';
        winningDisplay.className = 'winning-selection';
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        
        const spinDuration = 5000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        const totalRotation = 2 * Math.PI * (8 + Math.random() * 4);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            const easeOut = (t) => {
                return 1 - Math.pow(1 - t, 4);
            };
            
            this.currentRotation = startRotation + totalRotation * easeOut(progress);
            this.drawWheel();

            // Update triangle color based on current rotation
            const currentSection = Math.floor(
                (((-this.currentRotation - Math.PI/2) % (2 * Math.PI)) / (2 * Math.PI) * this.sections.length) 
                % this.sections.length
            );

            // If the result is negative, wrap it around
            const normalizedSection = currentSection < 0 ? 
                this.sections.length + currentSection : 
                currentSection;

            const triangleFill = document.querySelector('.triangle-fill');
            const tempDiv = document.createElement('div');
            tempDiv.className = `wheel-section-${normalizedSection + 1}`;
            document.body.appendChild(tempDiv);
            const color = window.getComputedStyle(tempDiv).fill;
            document.body.removeChild(tempDiv);
            triangleFill.style.fill = color;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Stop the spin sound
                this.spinSound.pause();
                this.spinSound.currentTime = 0;
                
                const winningText = this.sections[normalizedSection];
                
                // Play the appropriate stop sound
                if (winningText === 'Austin') {
                    this.stopSoundAustin.currentTime = 0;
                    this.stopSoundAustin.play();
                } else if (winningText === 'Julian') {
                    this.stopSoundJulian.currentTime = 0;
                    this.stopSoundJulian.play();
                } else {
                    // For "Spin Again"
                    this.stopSoundSpinAgain.currentTime = 0;
                    this.stopSoundSpinAgain.play();
                }
                
                this.isSpinning = false;
                this.spinButton.disabled = false;
                
                console.log('Winning text:', winningText);
                
                // Get the winning color
                const tempDiv = document.createElement('div');
                tempDiv.className = `wheel-section-${normalizedSection + 1}`;
                document.body.appendChild(tempDiv);
                const color = window.getComputedStyle(tempDiv).fill;
                document.body.removeChild(tempDiv);
                
                // Convert the RGB color to RGBA with opacity
                const rgbaColor = color.replace('rgb', 'rgba').replace(')', ', 0.5)');
                const rgbaColorHover = color.replace('rgb', 'rgba').replace(')', ', 0.7)');
                
                // Update wheel glow
                const wheel = document.getElementById('wheel');
                wheel.style.filter = `drop-shadow(0 0 10px ${rgbaColor})`;
                
                // Update wheel hover state using CSS custom property
                wheel.style.setProperty('--hover-glow-color', rgbaColorHover);
                
                winningDisplay.style.color = color;
                
                // Check if Austin was selected
                if (winningText === 'Austin' || winningText === 'Julian') {
                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = `${this.baseUrl}Assets/${winningText.toLowerCase()}-baby.png`;
                    img.style.width = '200px';
                    img.style.height = '200px';
                    winningDisplay.textContent = '';  // Clear any existing content
                    winningDisplay.appendChild(img);
                } else {
                    // Show text for other selections
                    winningDisplay.textContent = winningText;
                }
                
                winningDisplay.className = 'winning-selection';
                winningDisplay.classList.add(`wheel-section-${normalizedSection + 1}`);
                
                setTimeout(() => {
                    winningDisplay.classList.add('show');
                }, 200);
                
                setTimeout(() => {
                    winningDisplay.classList.remove('show');
                    // Clean up
                    winningDisplay.textContent = '';
                }, 4000);
                
                // Add to history after determining winner
                this.updateHistory(winningText, color);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Initialize the wheel when the page loads
window.addEventListener('load', () => {
    new WheelSpinner();
}); 