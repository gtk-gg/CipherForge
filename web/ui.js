function generatePassword(len = 96) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);

  return Array.from(arr, x => chars[x % chars.length]).join("");
}

const genBox = document.getElementById("generatedBox");
const genField = document.getElementById("generatedPassword");
const pwdInput = document.getElementById("passwordInput");
const copyBtn = document.getElementById("copyBtn");
const autoCheckbox = document.getElementById("autoPassword");

autoCheckbox.onchange = e => {
  if (e.target.checked) {
    // Generate password and show only generated box
    const pwd = generatePassword();
    genField.value = pwd;

    // Hide the text input to prevent accidental edits
    pwdInput.style.display = "none";

    // Show generated password box
    genBox.style.display = "flex";
  } else {
    // Hide generated password box
    genBox.style.display = "none";

    // Show the text input for user to enter own password
    pwdInput.value = "";
    pwdInput.style.display = "block";
  }
};

// Copy button remains functional
copyBtn.onclick = () => {
  navigator.clipboard.writeText(genField.value);
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
};
