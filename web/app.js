let selectedFile = null;
let action = null;

/* =========================
   Screen Manager
========================= */
const show = id => {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
};

/* =========================
   Start
========================= */
document.getElementById("acceptBtn").onclick = () => {
  resetAll();
  show("screen-file");
};

/* =========================
   File Selection
========================= */
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

document.body.ondragover = e => e.preventDefault();

document.body.ondrop = e => {
  e.preventDefault();
  if (!e.dataTransfer.files.length) return;
  selectedFile = e.dataTransfer.files[0];
  show("screen-action");
};

dropZone.onclick = () => fileInput.click();

fileInput.onchange = () => {
  if (!fileInput.files.length) return;
  selectedFile = fileInput.files[0];
  show("screen-action");
};

/* =========================
   Encrypt / Decrypt Choice
========================= */
document.getElementById("encryptBtn").onclick = () => {
  action = "encrypt";
  prepareEncryptUI();
  show("screen-password");
};

document.getElementById("decryptBtn").onclick = () => {
  action = "decrypt";
  prepareDecryptUI();
  show("screen-password");
};

/* =========================
   Main Action
========================= */
document.getElementById("proceedBtn").onclick = async () => {
  const pwdInput = document.getElementById("passwordInput");
  const password = pwdInput.value;

  if (!password) {
    alert("Password required");
    return;
  }

  show("screen-status");
  const status = document.getElementById("statusText");
  status.textContent =
    action === "encrypt" ? "Encrypting..." : "Decrypting...";

  try {
    let outputBuffer;

    if (action === "encrypt") {
      const fileBuffer = await selectedFile.arrayBuffer();
      outputBuffer = await encryptData(fileBuffer, password);
    } else {
      const encryptedBuffer = await selectedFile.arrayBuffer();
      outputBuffer = await decryptData(encryptedBuffer, password);
    }

    const blob = new Blob([outputBuffer]);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    let fileName;

    if (action === "encrypt") {
      fileName = selectedFile.name + ".encrypted";
    } else {
      fileName = selectedFile.name.endsWith(".encrypted")
        ? selectedFile.name.slice(0, -10)
        : selectedFile.name;
    }

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    URL.revokeObjectURL(url);
    a.remove();

    status.textContent = "✅ Completed";
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Wrong password or corrupted file";
  }
};

/* =========================
   Back
========================= */
document.getElementById("backBtn").onclick = () => {
  location.reload();
};

/* =========================
   UI State Helpers
========================= */
function prepareEncryptUI() {
  const auto = document.getElementById("autoPassword");
  const autoLabel = auto?.closest("label");
  const genBox = document.getElementById("generatedBox");
  const pwdInput = document.getElementById("passwordInput");

  if (autoLabel) autoLabel.style.display = "flex";
  if (genBox) genBox.style.display = "none";
  if (auto) auto.checked = false;

  pwdInput.value = "";
  pwdInput.style.display = "block";
}

function prepareDecryptUI() {
  const auto = document.getElementById("autoPassword");
  const autoLabel = auto?.closest("label");
  const genBox = document.getElementById("generatedBox");
  const pwdInput = document.getElementById("passwordInput");

  // HARD RESET — decrypt NEVER allows generation
  if (auto) auto.checked = false;
  if (autoLabel) autoLabel.style.display = "none";
  if (genBox) genBox.style.display = "none";

  pwdInput.value = "";
  pwdInput.style.display = "block";
}

function resetAll() {
  selectedFile = null;
  action = null;

  const auto = document.getElementById("autoPassword");
  const autoLabel = auto?.closest("label");
  const genBox = document.getElementById("generatedBox");
  const pwdInput = document.getElementById("passwordInput");

  if (auto) auto.checked = false;
  if (autoLabel) autoLabel.style.display = "flex";
  if (genBox) genBox.style.display = "none";

  pwdInput.value = "";
  pwdInput.style.display = "block";
}
