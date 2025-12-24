window.addEventListener('DOMContentLoaded', () => {

    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const statusSection = document.getElementById('statusSection');
    const statusText = document.getElementById('statusText');
    const backToMenu = document.getElementById('backToMenu');

    encryptBtn.addEventListener('click', async () => {
        const file = window.getSelectedFile();
        const password = window.getUserPassword();
        if(!file || !password) return;

        statusText.textContent = "Encrypting...";
        statusSection.classList.remove('hidden');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const encryptedData = await window.cryptoEngine.encrypt(arrayBuffer, password); // returns Uint8Array
            const blob = new Blob([encryptedData], {type: "application/octet-stream"});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = file.name + ".encrypted";
            a.click();
            statusText.textContent = `Encryption complete: ${file.name}.encrypted`;
        } catch(e){
            statusText.textContent = `Error: ${e.message}`;
        }
    });

    decryptBtn.addEventListener('click', async () => {
        const file = window.getSelectedFile();
        const password = window.getUserPassword();
        if(!file || !password) return;

        statusText.textContent = "Decrypting...";
        statusSection.classList.remove('hidden');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const decryptedData = await window.cryptoEngine.decrypt(arrayBuffer, password); // returns Uint8Array

            const originalName = file.name.replace(/\.encrypted$/,"") || "decrypted_file";
            const blob = new Blob([decryptedData], {type: file.type || "application/octet-stream"});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = originalName;
            a.click();

            statusText.textContent = `Decryption complete: ${originalName}`;
        } catch(e){
            statusText.textContent = `Error: ${e.message}`;
        }
    });

    backToMenu.addEventListener('click', () => {
        statusSection.classList.add('hidden');
    });

});
