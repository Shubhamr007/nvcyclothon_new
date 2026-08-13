const fileInput = document.querySelector('#file-input');
const dropZone = document.querySelector('#drop-zone');
const fileList = document.querySelector('#file-list');
const sendButton = document.querySelector('#send-request');
const status = document.querySelector('#upload-status');
let selectedFiles = [];

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(section => revealObserver.observe(section));
window.addEventListener('scroll', () => {
  const art = document.querySelector('.hero-art');
  if (art && window.scrollY < 700) art.style.transform = `translateY(${window.scrollY * .12}px)`;
}, { passive: true });

function prettySize(bytes) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function renderFiles() {
  fileList.innerHTML = selectedFiles.map((file, index) => `<div class="file-row"><span class="file-type">${(file.name.split('.').pop() || 'FILE').slice(0,4).toUpperCase()}</span><span class="file-name">${file.name}</span><span>${prettySize(file.size)}</span><button class="remove-file" data-index="${index}" aria-label="Remove ${file.name}">×</button></div>`).join('');
  sendButton.disabled = !selectedFiles.length;
  fileList.querySelectorAll('.remove-file').forEach(button => button.addEventListener('click', () => { selectedFiles.splice(button.dataset.index, 1); renderFiles(); }));
}
function addFiles(files) {
  const incoming = [...files];
  if (selectedFiles.length + incoming.length > 10) { status.textContent = 'You can upload up to 10 files per request.'; return; }
  selectedFiles.push(...incoming); status.textContent = ''; renderFiles();
}
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', e => addFiles(e.target.files));
['dragenter','dragover'].forEach(event => dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.add('drag'); }));
['dragleave','drop'].forEach(event => dropZone.addEventListener(event, e => { e.preventDefault(); dropZone.classList.remove('drag'); }));
dropZone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
sendButton.addEventListener('click', async () => {
  const filesToUpload = [...selectedFiles];
  sendButton.disabled = true;
  sendButton.innerHTML = 'Sending request <span>…</span>';
  status.textContent = 'Uploading your files securely…';
  try {
    const form = new FormData();
    filesToUpload.forEach(file => form.append('files', file));
    const response = await fetch('/upload', { method: 'POST', body: form });
    if (!response.ok) throw new Error('Upload failed');
    const result = await response.json();
    status.textContent = `Thank you — ${result.count} file${result.count === 1 ? '' : 's'} received. Our wholesale team will be in touch.`;
    selectedFiles = [];
  } catch (error) {
    status.textContent = 'Could not reach the upload service. Start server.py and try again.';
  } finally {
    renderFiles();
    sendButton.innerHTML = 'Send request <span>→</span>';
  }
});
document.querySelectorAll('.add').forEach(button => button.addEventListener('click', () => { const count = document.querySelector('#cart-count'); count.textContent = Number(count.textContent) + 1; const toast = document.querySelector('#toast'); toast.textContent = `${button.dataset.product} added to your bag`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }));
