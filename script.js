// === COSTANTI ===
const PASSWORD_ADMIN = 'ADMINNOVABUS!91526';
const PASSWORD_DIPENDENTI = 'NovaBusDipend.9138';  // password dipendenti solo lettura

const PASSWORD_SERVIZI = 'SERVIZIREMOVE10';
const PASSWORD_REPORT = 'REPORTREMOVE10';

// === ELEMENTI DOM ===
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('main section');

const loginArea = document.getElementById('loginArea');
const dipendentiContent = document.getElementById('dipendentiContent');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const pdfUploader = document.getElementById('pdfUploader');
const pdfDestination = document.getElementById('pdfDestination');
const uploadBtn = document.getElementById('uploadBtn');

const deletePasswordModal = document.getElementById('deletePasswordModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const deletePasswordInput = document.getElementById('deletePasswordInput');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deletePasswordMessage = document.getElementById('deletePasswordMessage');

const modal = document.getElementById('customModal');
const modalText = document.getElementById('modalText');
const modalClose = document.getElementById('modalClose');

const pdfListMap = {
    servizi: document.getElementById('serviziPDFList'),
    dipendenti: document.getElementById('dipendentiPDFList'),
    report: document.getElementById('reportPDFList')
};

let pdfToDeleteIndex = null;
let pdfToDeleteDestination = null;

// --- Funzione per mostrare una sezione alla volta con effetto ---
function loadSection(sectionId) {
    const current = document.querySelector('section.active');
    const next = document.getElementById(sectionId);

    if (current && current.id === sectionId) return;

    if (current) {
        current.style.opacity = 0;
        setTimeout(() => {
            current.classList.remove('active');
            next.classList.add('active');
            next.style.opacity = 0;
            void next.offsetWidth; // forza reflow
            next.style.opacity = 1;
            if (sectionId === 'dipendenti') resetLogin();
        }, 300);
    } else {
        next.classList.add('active');
        next.style.opacity = 1;
        if (sectionId === 'dipendenti') resetLogin();
    }
}

// --- Reset login area dipendenti ---
function resetLogin() {
    loginArea.style.display = 'block';
    dipendentiContent.style.display = 'none';
    passwordInput.value = '';
    loginMessage.textContent = '';

    // Nascondi upload e pulsanti modifica
    pdfUploader.style.display = 'none';
    pdfDestination.style.display = 'none';
    uploadBtn.style.display = 'none';

    // Reset ruolo
    localStorage.removeItem('userRole');

    loadPDFs();
}

// --- Login dipendenti/admin ---
loginBtn.addEventListener('click', () => {
    const pass = passwordInput.value.trim();
    if (pass === PASSWORD_ADMIN) {
        loginArea.style.display = 'none';
        dipendentiContent.style.display = 'block';
        loginMessage.textContent = '';
        enableAdminMode();
        loadPDFs();
    } else if (pass === PASSWORD_DIPENDENTI) {
        loginArea.style.display = 'none';
        dipendentiContent.style.display = 'block';
        loginMessage.textContent = '';
        enableReadOnlyMode();
        loadPDFs();
    } else {
        loginMessage.textContent = 'Password errata, riprova.';
    }
});

// --- Funzioni di abilitazione modalità ---
function enableAdminMode() {
    pdfUploader.style.display = 'block';
    pdfDestination.style.display = 'inline-block';
    uploadBtn.style.display = 'inline-block';
    localStorage.setItem('userRole', 'admin');
}

function enableReadOnlyMode() {
    pdfUploader.style.display = 'none';
    pdfDestination.style.display = 'none';
    uploadBtn.style.display = 'none';
    localStorage.setItem('userRole', 'dipendente');
}

// --- Upload PDF ---
uploadBtn.addEventListener('click', () => {
    const file = pdfUploader.files[0];
    const destination = pdfDestination.value || 'dipendenti';

    if (!file) return showModal('Seleziona un file PDF!');
    if (file.type !== 'application/pdf') return showModal('Solo file PDF consentiti.');

    const reader = new FileReader();
    reader.onload = function (e) {
        let pdfs = JSON.parse(localStorage.getItem('novabusPDFs') || '[]');
        pdfs.push({
            name: file.name,
            data: e.target.result,
            destination: destination
        });
        localStorage.setItem('novabusPDFs', JSON.stringify(pdfs));
        pdfUploader.value = ''; // reset input file
        loadPDFs();
        showModal('PDF caricato con successo!');
    };
    reader.readAsDataURL(file);
});

// --- Elimina PDF ---
function deletePDF(index) {
    let pdfs = JSON.parse(localStorage.getItem('novabusPDFs') || '[]');
    if (index >= 0 && index < pdfs.length) {
        pdfs.splice(index, 1);
        localStorage.setItem('novabusPDFs', JSON.stringify(pdfs));
        loadPDFs();
    }
}

// --- Carica e mostra PDF per ogni sezione ---
function loadPDFs() {
    let pdfs = JSON.parse(localStorage.getItem('novabusPDFs') || '[]');

    // Pulisce tutte le liste
    Object.values(pdfListMap).forEach(list => {
        list.innerHTML = '';
    });

    if (pdfs.length === 0) {
        Object.values(pdfListMap).forEach(list => {
            list.textContent = 'Nessun documento caricato.';
        });
        return;
    }

    const userRole = localStorage.getItem('userRole');

    pdfs.forEach((pdf, index) => {
        const list = pdfListMap[pdf.destination] || pdfListMap['dipendenti'];
        const div = document.createElement('div');
        div.classList.add('pdf-item');

        const blob = dataURLtoBlob(pdf.data);
        const objectURL = URL.createObjectURL(blob);

        div.innerHTML = `
            <a href="${objectURL}" target="_blank" rel="noopener noreferrer">${pdf.name}</a>
            ${userRole === 'admin' ? `<button class="deleteBtn" data-index="${index}">Elimina</button>` : ''}
        `;
        list.appendChild(div);
    });

    // Aggiunge listener ai bottoni elimina SOLO se admin
    if (userRole === 'admin') {
        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', e => {
                pdfToDeleteIndex = parseInt(e.target.dataset.index);

                const pdfs = JSON.parse(localStorage.getItem('novabusPDFs') || '[]');
                if (!pdfs[pdfToDeleteIndex]) return;
                pdfToDeleteDestination = pdfs[pdfToDeleteIndex].destination;

                if (pdfToDeleteDestination === 'dipendenti') {
                    if (confirm('Sei sicuro di voler eliminare questo PDF?')) {
                        deletePDF(pdfToDeleteIndex);
                        showModal('File eliminato con successo!');
                    }
                } else {
                    deletePasswordInput.value = '';
                    deletePasswordMessage.textContent = '';
                    deletePasswordModal.style.display = 'flex';
                    deletePasswordInput.focus();
                }
            });
        });
    }
}


// --- Gestione modale eliminazione ---

// Chiudi modale
deleteModalClose.addEventListener('click', () => {
    deletePasswordModal.style.display = 'none';
    deletePasswordMessage.textContent = '';
});

// Conferma eliminazione con password
confirmDeleteBtn.addEventListener('click', () => {
    const enteredPass = deletePasswordInput.value.trim();
    let correctPass = null;

    if (pdfToDeleteDestination === 'servizi') correctPass = PASSWORD_SERVIZI;
    else if (pdfToDeleteDestination === 'report') correctPass = PASSWORD_REPORT;

    if (enteredPass === correctPass) {
        deletePasswordModal.style.display = 'none';
        deletePDF(pdfToDeleteIndex);
        showModal('File eliminato con successo!');
    } else {
        deletePasswordMessage.textContent = 'Password errata, riprova.';
    }
});

// Chiudi modale cliccando fuori (optional)
window.addEventListener('click', e => {
    if (e.target === deletePasswordModal) {
        deletePasswordModal.style.display = 'none';
        deletePasswordMessage.textContent = '';
    }
});

// --- Navigazione ---
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const section = e.target.dataset.section;
        if (!section) return;

        // Cambia active link
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        loadSection(section);
    });
});

// --- Modale notifiche ---
function showModal(msg) {
    modalText.textContent = msg;
    modal.style.display = 'block';
}

modalClose.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = e => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
}

// --- All'avvio carica la home ---
loadSection('home');
loadPDFs();
