document.addEventListener("DOMContentLoaded", () => {
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
            const blob = await window.cryptoEngine.encryptFile(file, password);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name + ".encrypted";
            a.click();
            statusText.textContent = `Encryption complete: ${file.name}.encrypted`;
        } catch(e){ statusText.textContent = `Error: ${e.message}`; }
    });

    decryptBtn.addEventListener('click', async () => {
        const file = window.getSelectedFile();
        const password = window.getUserPassword();
        if(!file || !password) return;

        statusText.textContent = "Decrypting...";
        statusSection.classList.remove('hidden');

        try {
            const blob = await window.cryptoEngine.decryptFile(file, password);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            let originalName = file.name.replace(/\.encrypted$/,"") || "decrypted_file";
            a.download = originalName;
            a.click();
            statusText.textContent = `Decryption complete: ${originalName}`;
        } catch(e){ statusText.textContent = `Error: ${e.message}`; }
    });

    backToMenu.addEventListener('click', () => { statusSection.classList.add('hidden'); });
});
