class CipherForgeUI {
    constructor() {
        this.crypto = new CipherForgeCrypto();
        this.currentFile = null;
        this.isEncrypting = true;
        this.generatedPassword = '';
        
        this.initializeElements();
        this.bindEvents();
        this.showWarning();
    }

    initializeElements() {
        // Modal
        this.warningModal = document.getElementById('warningModal');
        this.acceptBtn = document.getElementById('acceptBtn');
        this.declineBtn = document.getElementById('declineBtn');
        
        // Main container
        this.mainContainer = document.getElementById('mainContainer');
        
        // Mode selection
        this.encryptBtn = document.getElementById('encryptBtn');
        this.decryptBtn = document.getElementById('decryptBtn');
        
        // File handling
        this.fileInput = document.getElementById('fileInput');
        this.uploadBox = document.getElementById('uploadBox');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.clearFileBtn = document.getElementById('clearFileBtn');
        
        // Password handling
        this.passwordOptions = document.querySelectorAll('input[name="passwordOption"]');
        this.customPasswordSection = document.getElementById('customPasswordSection');
        this.generatedPasswordSection = document.getElementById('generatedPasswordSection');
        this.passwordInput = document.getElementById('passwordInput');
        this.confirmPasswordInput = document.getElementById('confirmPasswordInput');
        this.togglePasswordBtn = document.getElementById('togglePasswordBtn');
        this.generatedPasswordElement = document.getElementById('generatedPassword');
        this.copyPasswordBtn = document.getElementById('copyPasswordBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.passwordStrengthBar = document.querySelector('.strength-bar');
        this.passwordStrengthText = document.querySelector('.strength-text');
        this.passwordLength = document.getElementById('passwordLength');
        
        // Action buttons
        this.processBtn = document.getElementById('processBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Progress
        this.progressSection = document.getElementById('progressSection');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressFill = document.getElementById('progressFill');
        this.progressStatus = document.getElementById('progressStatus');
        this.processedBytes = document.getElementById('processedBytes');
        this.totalBytes = document.getElementById('totalBytes');
        this.processingSpeed = document.getElementById('processingSpeed');
        
        // Results
        this.resultSection = document.getElementById('resultSection');
        this.successResult = document.getElementById('successResult');
        this.errorResult = document.getElementById('errorResult');
        this.resultMessage = document.getElementById('resultMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newFileBtn = document.getElementById('newFileBtn');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
    }

    bindEvents() {
        // Warning modal
        this.acceptBtn.addEventListener('click', () => this.acceptWarning());
        this.declineBtn.addEventListener('click', () => this.declineWarning());
        
        // Mode selection
        this.encryptBtn.addEventListener('click', () => this.setMode(true));
        this.decryptBtn.addEventListener('click', () => this.setMode(false));
        
        // File handling
        this.uploadBox.addEventListener('click', () => this.fileInput.click());
        this.uploadBox.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadBox.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.clearFileBtn.addEventListener('click', () => this.clearFile());
        
        // Password handling
        this.passwordOptions.forEach(option => {
            option.addEventListener('change', () => this.handlePasswordOptionChange());
        });
        
        this.passwordInput.addEventListener('input', () => this.updatePasswordStrength());
        this.confirmPasswordInput.addEventListener('input', () => this.validatePasswords());
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        this.copyPasswordBtn.addEventListener('click', () => this.copyPassword());
        this.regenerateBtn.addEventListener('click', () => this.generateNewPassword());
        
        // Process button
        this.processBtn.addEventListener('click', () => this.processFile());
        this.cancelBtn.addEventListener('click', () => this.cancelProcessing());
        
        // Result actions
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.newFileBtn.addEventListener('click', () => this.resetUI());
        this.tryAgainBtn.addEventListener('click', () => this.resetUI());
    }

    showWarning() {
        this.warningModal.style.display = 'flex';
    }

    acceptWarning() {
        this.warningModal.style.display = 'none';
        this.mainContainer.classList.remove('hidden');
        this.setMode(true); // Default to encrypt mode
    }

    declineWarning() {
        // Redirect away or show exit message
        document.body.innerHTML = `
            <div class="container" style="text-align: center; padding-top: 100px;">
                <h1>👋 Goodbye!</h1>
                <p>You must accept the terms to use CipherForge.</p>
                <p>Return to <a href="https://github.com/gtk-gg">GitHub</a></p>
            </div>
        `;
    }

    setMode(isEncrypting) {
        this.isEncrypting = isEncrypting;
        
        // Update button states
        this.encryptBtn.classList.toggle('active', isEncrypting);
        this.decryptBtn.classList.toggle('active', !isEncrypting);
        
        // Update process button text
        const btnIcon = this.processBtn.querySelector('.btn-icon');
        const btnText = this.processBtn.querySelector('.btn-text');
        
        if (isEncrypting) {
            btnIcon.textContent = '🔒';
            btnText.textContent = 'Encrypt File';
        } else {
            btnIcon.textContent = '🔓';
            btnText.textContent = 'Decrypt File';
        }
        
        // Update file input acceptance
        if (isEncrypting) {
            this.fileInput.removeAttribute('accept');
        } else {
            this.fileInput.setAttribute('accept', '.encrypted');
        }
        
        // Clear current file if it doesn't match mode
        if (this.currentFile) {
            const isValid = isEncrypting || 
                (!isEncrypting && this.currentFile.name.endsWith('.encrypted'));
            
            if (!isValid) {
                this.clearFile();
            }
        }
        
        this.validateForm();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadBox.style.borderColor = 'var(--secondary-color)';
        this.uploadBox.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.uploadBox.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        this.uploadBox.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        
        if (e.dataTransfer.files.length > 0) {
            this.handleFile(e.dataTransfer.files[0]);
        }
    }

    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            this.handleFile(e.target.files[0]);
        }
    }

    handleFile(file) {
        // Validate file size (2GB limit)
        if (file.size > 2 * 1024 * 1024 * 1024) {
            this.showError('File is too large. Maximum size is 2GB.');
            return;
        }
        
        // Validate mode
        if (!this.isEncrypting && !file.name.endsWith('.encrypted')) {
            this.showError('Please select a .encrypted file for decryption.');
            return;
        }
        
        this.currentFile = file;
        
        // Update UI
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileInfo.classList.remove('hidden');
        
        this.validateForm();
    }

    clearFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.fileInfo.classList.add('hidden');
        this.processBtn.disabled = true;
    }

    handlePasswordOptionChange() {
        const selectedOption = document.querySelector('input[name="passwordOption"]:checked').value;
        
        if (selectedOption === 'custom') {
            this.customPasswordSection.classList.remove('hidden');
            this.generatedPasswordSection.classList.add('hidden');
            this.generatedPassword = '';
        } else {
            this.customPasswordSection.classList.add('hidden');
            this.generatedPasswordSection.classList.remove('hidden');
            this.generateNewPassword();
        }
        
        this.validateForm();
    }

    generateNewPassword() {
        this.generatedPassword = this.crypto.generatePassword();
        this.generatedPasswordElement.textContent = this.generatedPassword;
        this.passwordLength.textContent = this.generatedPassword.length;
        
        // Auto-copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.generatedPassword).catch(() => {
                // Ignore clipboard errors
            });
        }
    }

    copyPassword() {
        if (!this.generatedPassword) return;
        
        navigator.clipboard.writeText(this.generatedPassword).then(() => {
            const originalText = this.copyPasswordBtn.textContent;
            this.copyPasswordBtn.textContent = '✅ Copied!';
            
            setTimeout(() => {
                this.copyPasswordBtn.textContent = originalText;
            }, 2000);
        });
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.confirmPasswordInput.type = isPassword ? 'text' : 'password';
        this.togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    }

    updatePasswordStrength() {
        const password = this.passwordInput.value;
        const strength = this.crypto.checkPasswordStrength(password);
        
        // Update strength bar
        this.passwordStrengthBar.style.setProperty('--strength-width', `${strength.percentage}%`);
        
        // Update color based on strength
        let color = 'var(--danger-color)';
        if (strength.score > 2) color = 'var(--warning-color)';
        if (strength.score > 4) color = 'var(--success-color)';
        
        this.passwordStrengthBar.style.backgroundColor = color;
        this.passwordStrengthText.textContent = `Password strength: ${strength.strength}`;
        
        this.validateForm();
    }

    validatePasswords() {
        const password = this.passwordInput.value;
        const confirm = this.confirmPasswordInput.value;
        
        if (password && confirm && password !== confirm) {
            this.confirmPasswordInput.style.borderColor = 'var(--danger-color)';
            return false;
        } else {
            this.confirmPasswordInput.style.borderColor = '';
            return true;
        }
    }

    validateForm() {
        let isValid = false;
        
        if (!this.currentFile) {
            isValid = false;
        } else if (document.querySelector('input[name="passwordOption"]:checked').value === 'custom') {
            const password = this.passwordInput.value;
            const confirm = this.confirmPasswordInput.value;
            
            isValid = password.length >= 8 && 
                     password === confirm;
        } else {
            isValid = this.generatedPassword.length > 0;
        }
        
        this.processBtn.disabled = !isValid;
        return isValid;
    }

    async processFile() {
        if (!this.validateForm()) return;
        
        // Get password
        let password;
        if (document.querySelector('input[name="passwordOption"]:checked').value === 'custom') {
            password = this.passwordInput.value;
        } else {
            password = this.generatedPassword;
        }
        
        // Show progress
        this.showProgress();
        
        try {
            let result;
            let fileName;
            
            if (this.isEncrypting) {
                this.updateProgressStatus('Encrypting file...');
                result = await this.crypto.encryptFile(this.currentFile, password);
                fileName = this.currentFile.name + '.encrypted';
            } else {
                this.updateProgressStatus('Decrypting file...');
                result = await this.crypto.decryptFile(this.currentFile, password);
                fileName = this.currentFile.name.replace('.encrypted', '');
            }
            
            this.showSuccess(result, fileName);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    showProgress() {
        // Hide other sections
        this.processBtn.classList.add('hidden');
        this.cancelBtn.classList.remove('hidden');
        this.resultSection.classList.add('hidden');
        
        // Show progress
        this.progressSection.classList.remove('hidden');
        
        // Reset progress
        this.updateProgress(0, 100);
        this.processedBytes.textContent = '0';
        this.totalBytes.textContent = this.formatFileSize(this.currentFile.size);
        this.processingSpeed.textContent = '0 MB/s';
        
        // Setup progress callback
        this.crypto.onProgress = (processed, total) => {
            const percent = Math.round((processed / total) * 100);
            this.updateProgress(percent, total);
        };
    }

    updateProgress(percent, total) {
        this.progressPercent.textContent = `${percent}%`;
        this.progressFill.style.width = `${percent}%`;
        this.processedBytes.textContent = this.formatFileSize(percent * total / 100);
    }

    updateProgressStatus(status) {
        this.progressStatus.textContent = status;
    }

    showSuccess(resultBlob, fileName) {
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.remove('hidden');
        this.successResult.classList.remove('hidden');
        this.errorResult.classList.add('hidden');
        
        // Store result for download
        this.resultBlob = resultBlob;
        this.resultFileName = fileName;
        
        // Update message
        const action = this.isEncrypting ? 'encrypted' : 'decrypted';
        const fileSize = this.formatFileSize(resultBlob.size);
        this.resultMessage.textContent = `File ${action} successfully! Size: ${fileSize}`;
    }

    showError(message) {
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.remove('hidden');
        this.successResult.classList.add('hidden');
        this.errorResult.classList.remove('hidden');
        
        this.errorMessage.textContent = message;
    }

    downloadResult() {
        if (!this.resultBlob) return;
        
        const url = URL.createObjectURL(this.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.resultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    cancelProcessing() {
        // Currently processing - implement abort if needed
        location.reload(); // Simple reset
    }

    resetUI() {
        // Clear file
        this.clearFile();
        
        // Reset password
        this.passwordInput.value = '';
        this.confirmPasswordInput.value = '';
        this.passwordInput.type = 'password';
        this.confirmPasswordInput.type = 'password';
        this.togglePasswordBtn.textContent = '👁️';
        
        // Reset to custom password
        document.querySelector('input[name="passwordOption"][value="custom"]').checked = true;
        this.customPasswordSection.classList.remove('hidden');
        this.generatedPasswordSection.classList.add('hidden');
        
        // Hide results and progress
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        this.cancelBtn.classList.add('hidden');
        this.processBtn.classList.remove('hidden');
        
        // Reset process button state
        this.processBtn.disabled = true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
