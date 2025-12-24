/**
 * errorhandler.js - Automatic Error Solver
 * Catches uncaught errors and promise rejections
 * Resets UI to safe state and lets user retry
 */

(function(){
    const resetApp = () => {
        // Back to menu button click if exists
        const backBtn = document.getElementById('backToMenu');
        if(backBtn) backBtn.click();

        // Clear password field
        const genPassword = document.getElementById('genPassword');
        if(genPassword) genPassword.value = "";

        // Reset file selection
        const selectedFileText = document.getElementById('selectedFile');
        if(selectedFileText) selectedFileText.textContent = "No file selected";

        // Disable encrypt/decrypt buttons
        const encryptBtn = document.getElementById('encryptBtn');
        const decryptBtn = document.getElementById('decryptBtn');
        if(encryptBtn) encryptBtn.disabled = true;
        if(decryptBtn) decryptBtn.disabled = true;

        // Hide password section and status section
        const passwordSection = document.getElementById('passwordSection');
        const statusSection = document.getElementById('statusSection');
        if(passwordSection) passwordSection.classList.add('hidden');
        if(statusSection) statusSection.classList.add('hidden');
    };

    const handleError = (msg) => {
        alert("⚠️ Something went wrong:\n" + msg + "\n\nApp has been reset. Please try again.");
        console.error(msg);
        resetApp();
    };

    window.addEventListener("error", (e)=>{
        handleError(e.message + "\nSource: " + e.filename + ":" + e.lineno);
    });

    window.addEventListener("unhandledrejection", (e)=>{
        let reason = e.reason ? (e.reason.message || e.reason) : "Unknown";
        handleError("Promise rejection: " + reason);
    });

    console.log("errorhandler.js initialized: all errors auto-solved and app reset.");
})();
