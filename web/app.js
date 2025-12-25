let selectedFile, action;

const show = id => {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

// ACCEPT BUTTON
document.getElementById("acceptBtn").onclick = () => show("screen-file");

// FILE SELECTION
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

document.body.ondragover = e => e.preventDefault();
document.body.ondrop = e => {
  e.preventDefault();
  selectedFile = e.dataTransfer.files[0];
  show("screen-action");
};

dropZone.onclick = () => fileInput.click();

fileInput.onchange = () => {
  selectedFile = fileInput.files[0];
  show("screen-action");
};

// ENCRYPT BUTTON
document.getElementById("encryptBtn").onclick = () => {
  action = "encrypt";
  show("screen-password");

  const autoLabel = document.getElementById("autoPassword").closest("label");
  const genBox = document.getElementById("generatedBox");

  if (autoLabel) autoLabel.style.display = "flex";
  if (genBox) genBox.style.display = "none";
};

// DECRYPT BUTTON
document.getElementById("decryptBtn").onclick = () => {
  action = "decrypt";
  show("screen-password");

  const autoLabel = document.getElementById("autoPassword").closest("label");
  const genBox = document.getElementById("generatedBox");

  if (autoLabel) autoLabel.style.display = "none";
  if (genBox) genBox.style.display = "none";
};

// PROCEED BUTTON
document.getElementById("proceedBtn").onclick = async () => {
  const pwd = document.getElementById("passwordInput").value;
  if (!pwd) return alert("Password required");

  show("screen-status");
  const status = document.getElementById("statusText");
  status.textContent = action === "encrypt" ? "Encrypting..." : "Decrypting...";

  try {
    let result;

    if (action === "encrypt") {
      result = await encryptData(await selectedFile.arrayBuffer(), pwd);
    } else {
      const data = await decryptData(selectedFile, pwd);
      result = new Blob([data]);
    }

    const a = document.createElement("a");
    const url = URL.createObjectURL(result);

    let downloadName;
    if (action === "encrypt") {
      downloadName = selectedFile.name + ".encrypted";
    } else {
      // remove ".encrypted" and keep original extension
      downloadName = selectedFile.name.endsWith(".encrypted")
        ? selectedFile.name.replace(/\.encrypted$/, "")
        : selectedFile.name;
    }

    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();

    status.textContent = "✅ Completed";
  } catch {
    status.textContent = "❌ Wrong password or corrupted file";
  }
};

// BACK BUTTON
document.getElementById("backBtn").onclick = () => location.reload();
