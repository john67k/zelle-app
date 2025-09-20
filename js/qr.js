// QR Code Module
class QRManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.scanning = false;
        this.animationId = null;
    }

    // Generate QR code for payment
    async generatePaymentQR(amount, note = '') {
        try {
            if (!window.paymentManager || !window.paymentManager.currentUser) {
                throw new Error('User not authenticated');
            }

            const qrData = window.paymentManager.generateQRData(amount, note);
            const qrCodeElement = document.getElementById('qr-code');
            
            if (!qrCodeElement) {
                throw new Error('QR code container not found');
            }

            // Clear previous QR code
            qrCodeElement.innerHTML = '';

            // Generate QR code using qrcode.js library
            if (typeof QRCode !== 'undefined') {
                await QRCode.toCanvas(qrCodeElement, qrData, {
                    width: 256,
                    height: 256,
                    colorDark: '#4f46e5',
                    colorLight: '#ffffff',
                    margin: 2,
                    errorCorrectionLevel: 'M'
                });
            } else {
                // Fallback - create a visual representation
                qrCodeElement.innerHTML = `
                    <div style="width: 256px; height: 256px; background: white; border: 2px solid #4f46e5; display: flex; align-items: center; justify-content: center; text-align: center; color: #4f46e5; flex-direction: column; border-radius: 8px;">
                        <i class="fas fa-qrcode" style="font-size: 64px; margin-bottom: 16px;"></i>
                        <div style="font-weight: 600; font-size: 18px;">Payment QR Code</div>
                        <div style="font-size: 14px; margin-top: 8px;">Amount: $${amount}</div>
                        <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">Scan to pay</div>
                        <div style="font-size: 10px; margin-top: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px; font-family: monospace;">${qrData.substring(0, 20)}...</div>
                    </div>
                `;
            }

            return { success: true };

        } catch (error) {
            console.error('QR generation error:', error);
            throw new Error(error.message || 'Failed to generate QR code');
        }
    }

    // Start QR code scanning
    async startScanning() {
        try {
            const video = document.getElementById('qr-video');
            if (!video) {
                throw new Error('Video element not found');
            }

            this.video = video;

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 300 },
                    height: { ideal: 300 }
                }
            });

            this.video.srcObject = stream;
            this.video.play();

            // Create canvas for frame capture
            this.canvas = document.createElement('canvas');
            const context = this.canvas.getContext('2d');

            this.scanning = true;

            // Start scanning loop
            const scan = () => {
                if (!this.scanning) return;

                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;

                    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

                    const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Use jsQR library to decode QR code
                    if (typeof jsQR !== 'undefined') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);

                        if (code) {
                            this.handleQRCodeDetected(code.data);
                            return;
                        }
                    }
                }

                this.animationId = requestAnimationFrame(scan);
            };

            this.video.addEventListener('loadedmetadata', () => {
                scan();
            });

            return { success: true };

        } catch (error) {
            console.error('Camera access error:', error);
            
            let errorMessage = 'Failed to access camera';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Camera not supported on this device.';
            }

            throw new Error(errorMessage);
        }
    }

    // Stop QR code scanning
    stopScanning() {
        this.scanning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }

        // Update UI
        const startBtn = document.getElementById('start-scan');
        const stopBtn = document.getElementById('stop-scan');
        
        if (startBtn) {
            startBtn.classList.remove('hidden');
            startBtn.textContent = 'Start Camera';
        }
        if (stopBtn) {
            stopBtn.classList.add('hidden');
        }
    }

    // Handle detected QR code
    async handleQRCodeDetected(qrData) {
        try {
            this.stopScanning();

            // Show loading state
            this.showScanResult('Processing QR code...', 'info');

            // Process the QR code payment
            const result = await window.paymentManager.processQRPayment(qrData);

            if (result.success) {
                this.showScanResult(result.message, 'success');
                // Close QR modal after successful payment
                setTimeout(() => {
                    this.closeQRModal();
                }, 2000);
            } else {
                this.showScanResult('Payment failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('QR processing error:', error);
            this.showScanResult(error.message || 'Invalid QR code', 'error');
        }
    }

    // Show scan result message
    showScanResult(message, type) {
        const qrModal = document.getElementById('qr-modal');
        if (!qrModal) return;

        // Create or update result message
        let resultElement = qrModal.querySelector('.qr-scan-result');
        if (!resultElement) {
            resultElement = document.createElement('div');
            resultElement.className = 'qr-scan-result';
            resultElement.style.cssText = `
                margin-top: 16px;
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                font-weight: 600;
            `;
            qrModal.querySelector('.modal-body').appendChild(resultElement);
        }

        resultElement.textContent = message;
        resultElement.className = `qr-scan-result ${type}`;

        // Style based on type
        switch (type) {
            case 'success':
                resultElement.style.backgroundColor = '#dcfce7';
                resultElement.style.color = '#166534';
                resultElement.style.border = '1px solid #bbf7d0';
                break;
            case 'error':
                resultElement.style.backgroundColor = '#fee2e2';
                resultElement.style.color = '#991b1b';
                resultElement.style.border = '1px solid #fecaca';
                break;
            case 'info':
                resultElement.style.backgroundColor = '#dbeafe';
                resultElement.style.color = '#1e40af';
                resultElement.style.border = '1px solid #bfdbfe';
                break;
        }

        // Remove message after 5 seconds for non-success types
        if (type !== 'success') {
            setTimeout(() => {
                if (resultElement.parentElement) {
                    resultElement.remove();
                }
            }, 5000);
        }
    }

    // Close QR modal
    closeQRModal() {
        const modal = document.getElementById('qr-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal) modal.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');

        // Clean up any running scans
        this.stopScanning();

        // Remove scan result message
        const resultElement = document.querySelector('.qr-scan-result');
        if (resultElement) {
            resultElement.remove();
        }
    }

    // Initialize QR code functionality
    init() {
        // QR Generate form
        const qrGenerateForm = document.getElementById('qr-generate-form');
        if (qrGenerateForm) {
            qrGenerateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const amount = document.getElementById('qr-amount').value;
                const note = document.getElementById('qr-note').value;

                try {
                    await this.generatePaymentQR(amount, note);
                    document.getElementById('qr-code-display').classList.remove('hidden');
                } catch (error) {
                    if (window.authManager) {
                        window.authManager.showNotification(error.message, 'error');
                    }
                }
            });
        }

        // QR tabs
        const qrTabs = document.querySelectorAll('#qr-modal .tab-btn');
        qrTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchQRTab(targetTab);
            });
        });

        // Start scan button
        const startScanBtn = document.getElementById('start-scan');
        if (startScanBtn) {
            startScanBtn.addEventListener('click', async () => {
                try {
                    await this.startScanning();
                    startScanBtn.classList.add('hidden');
                    startScanBtn.textContent = 'Scanning...';
                    
                    const stopBtn = document.getElementById('stop-scan');
                    if (stopBtn) {
                        stopBtn.classList.remove('hidden');
                    }
                } catch (error) {
                    if (window.authManager) {
                        window.authManager.showNotification(error.message, 'error');
                    }
                }
            });
        }

        // Stop scan button
        const stopScanBtn = document.getElementById('stop-scan');
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', () => {
                this.stopScanning();
            });
        }
    }

    // Switch between QR tabs
    switchQRTab(tabName) {
        // Update tab buttons
        const tabs = document.querySelectorAll('#qr-modal .tab-btn');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content
        const generateContent = document.getElementById('qr-generate');
        const scanContent = document.getElementById('qr-scan');

        if (tabName === 'generate') {
            generateContent.classList.remove('hidden');
            scanContent.classList.add('hidden');
            this.stopScanning(); // Stop scanning when switching away
        } else if (tabName === 'scan') {
            generateContent.classList.add('hidden');
            scanContent.classList.remove('hidden');
            
            // Reset QR code display
            const qrDisplay = document.getElementById('qr-code-display');
            if (qrDisplay) {
                qrDisplay.classList.add('hidden');
            }
        }
    }

    // Check if device supports camera
    static async checkCameraSupport() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            return false;
        }
    }

    // Download QR code as image
    downloadQR() {
        const canvas = document.querySelector('#qr-code canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'payment-qr-code.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Create global QR manager instance
window.qrManager = new QRManager();