encryptBtn.addEventListener('click',async()=>{
  if(!selectedFileObj){ alert("Select a file first"); return; }
  const pwd = cryptoEngine.generatePassword();
  genPassword.value = pwd;
  passwordSection.classList.remove('hidden');
  fileDrop.style.display='none';
  try {
    const encBlob = await cryptoEngine.encryptFile(selectedFileObj,pwd);
    downloadBlob(encBlob, selectedFileObj.name+".encrypted");
    statusText.textContent = "Encryption completed!";
    statusSection.classList.remove('hidden');
  } catch(e) {
    alert("Encryption failed: "+e.message);
  }
});

decryptBtn.addEventListener('click',async()=>{
  if(!selectedFileObj){ alert("Select a file first"); return; }
  const pwd = prompt("Enter password for decryption:");
  if(!pwd) return;
  try{
    const decBlob = await cryptoEngine.decryptFile(selectedFileObj,pwd);
    downloadBlob(decBlob, selectedFileObj.name.replace(".encrypted",""));
    statusText.textContent = "Decryption completed!";
    statusSection.classList.remove('hidden');
  }catch(e){
    alert("Decryption failed. Wrong password or corrupted file.");
  }
});

function downloadBlob(blob,name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
