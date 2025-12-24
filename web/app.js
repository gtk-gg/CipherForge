// app.js - Encrypt/Decrypt using crypto.js
encryptBtn.addEventListener('click', async () => {
    if (!selectedFileObj) { alert("Select a file first!"); return; }

    // Generate password and show
    const pwd = cryptoEngine.generatePassword();
    genPassword.value = pwd;
    passwordSection.classList.remove('hidden');
    fileDrop.style.display = 'none';

    try {
        const encBlob = await cryptoEngine.encryptFile(selectedFileObj, pwd);

        // Normalize file name to avoid issues with parentheses, etc
        let safeName = selectedFileObj.name.replace(/\s+/g, "_").replace(/\(|\)/g, "");
        downloadBlob(encBlob, safeName + ".encrypted");

        statusText.textContent = "Encryption completed successfully!";
        statusSection.classList.remove('hidden');
    } catch (e) {
        alert("Encryption failed: " + e.message);
    }
});

decryptBtn.addEventListener('click', async () => {
    if (!selectedFileObj) { alert("Select a file first!"); return; }

    const pwd = prompt("Enter password for decryption:");
    if (!pwd) return;

    try {
        const decBlob = await cryptoEngine.decryptFile(selectedFileObj, pwd);

        // Remove .encrypted suffix safely
        let originalName = selectedFileObj.name.replace(/\.encrypted$/, "");
        downloadBlob(decBlob, originalName);

        statusText.textContent = "Decryption completed successfully!";
        statusSection.classList.remove('hidden');
    } catch (e) {
        alert("Decryption failed. Wrong password or corrupted file.");
    }
});

// Helper for downloading
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
