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

document.getElementById("autoPassword").onchange = e => {
  if (e.target.checked) {
    const pwd = generatePassword();
    genField.value = pwd;
    pwdInput.value = pwd;
    genBox.style.display = "flex";
  } else {
    genBox.style.display = "none";
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(genField.value);
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
};
