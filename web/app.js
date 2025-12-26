let selectedFile = null;
let action = null;

/* ===============================
   SCREEN HANDLER
================================ */
const show = id => {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
};

/* ===============================
   WARNING SCREEN
================================ */
document.getElementById("acceptBtn").onclick = () => {
  show("screen-file");
};

/* ===============================
   FILE SELECTION
================================ */
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

/* ===============================
   ACTION SELECTION
================================ */
document.getElementById("encryptBtn").onclick = () => {
  action = "encrypt";
  show("screen-password");

  // show password generator
  const auto = document.getElementById("autoPassword");
  if (auto) auto.closest("label").classList.remove("hidden");
};

document.getElementById("decryptBtn").onclick = () => {
  action = "decrypt";
  show("screen-password");

  // hide password generator completely
  const auto = document.getElementById("autoPassword");
  const genBox = document.getElementById("generatedBox");

  if (auto) {
    auto.checked = false;
    auto.closest("label").classList.add("hidden");
  }

  if (genBox) genBox.style.display = "none";
};

/* ===============================
   ENCRYPT / DECRYPT
================================ */
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
    let resultBlob;

    if (action === "encrypt") {
      const encryptedBuffer = await encryptData(
        await selectedFile.arrayBuffer(),
        password,
        selectedFile.type || "application/octet-stream"
      );

      resultBlob = new Blob([encryptedBuffer], {
        type: "application/octet-stream"
      });

    } else {
      const { buffer, mimeType } = await decryptData(
        selectedFile,
        password
      );

      resultBlob = new Blob([buffer], { type: mimeType });
    }

    const a = document.createElement("a");
    const url = URL.createObjectURL(resultBlob);

    let downloadName;
    if (action === "encrypt") {
      downloadName = selectedFile.name + ".encrypted";
    } else {
      downloadName = selectedFile.name.endsWith(".encrypted")
        ? selectedFile.name.slice(0, -10)
        : selectedFile.name;
    }

    a.href = url;
    a.download = downloadName;
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

/* ===============================
   RESET
================================ */
document.getElementById("backBtn").onclick = () => {
  location.reload();
};
