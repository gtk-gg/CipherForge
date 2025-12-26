let allowAutoPassword = true;

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
const auto = document.getElementById("autoPassword");

auto.onchange = () => {
  if (!allowAutoPassword) {
    auto.checked = false;
    return;
  }

  if (auto.checked) {
    const pwd = generatePassword();
    genField.value = pwd;
    pwdInput.value = pwd;
    genBox.classList.remove("hidden");
  } else {
    genBox.classList.add("hidden");
    genField.value = "";
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(genField.value);
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
};
