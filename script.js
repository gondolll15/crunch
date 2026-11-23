// ==========================================
// CRUNCH 2.0 — SIGNATURE EDITION
// Designed & Developed by Yogi Pratama
// ==========================================

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "crunch_notes_v1";
const LABEL_KEY = "crunch_labels_v1";

// ==========================================
// STORAGE
// ==========================================

let notes = [];
let labels = [];

try {
    const savedNotes = JSON.parse(localStorage.getItem(STORAGE_KEY));
    notes = Array.isArray(savedNotes) ? savedNotes : [];
} catch {
    notes = [];
}

try {
    const savedLabels = JSON.parse(localStorage.getItem(LABEL_KEY));
    labels = Array.isArray(savedLabels) ? savedLabels : [];
} catch {
    labels = [];
}

// ==========================================
// APPLICATION STATE
// ==========================================

let currentPage = "notes";
let activeLabel = null;

let selectedColor = "#ffffff";
let isPinned = false;
let isChecklist = false;

let editingId = null;
let isGrid = false;

let checklistItems = [];

// ==========================================
// ICON SYSTEM
// ==========================================

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==========================================
// STORAGE FUNCTIONS
// ==========================================

function saveStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        localStorage.setItem(LABEL_KEY, JSON.stringify(labels));
        return true;
    } catch (error) {
        showToast("Penyimpanan penuh atau tidak tersedia!");
        return false;
    }
}

// ==========================================
// UTILITIES
// ==========================================

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function getDate() {
    return new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatReminder(value) {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function toDateTimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

// ==========================================
// LOADING SCREEN
// ==========================================

const loadingDuration = 7000;
const loadingStart = Date.now();

const loadingInterval = setInterval(() => {

    const elapsed = Date.now() - loadingStart;

    const percent = Math.min(
        Math.floor(elapsed / loadingDuration * 100),
        100
    );

    $("loading-progress").style.width = percent + "%";
    $("loading-percent").textContent = percent + "%";

    if (percent >= 100) {

        clearInterval(loadingInterval);

        setTimeout(() => {

            $("loading-screen").classList.add("hidden");
            $("app").classList.remove("hidden");

            renderLabels();
            renderNotes();
            refreshIcons();

        }, 200);
    }

}, 50);

// ==========================================
// CHECKLIST EDITOR
// ==========================================

function renderChecklistInputs() {

    const container = $("checklist-inputs");

    container.innerHTML = checklistItems.map((item, index) => `

        <div class="checklist-input-row">

            <i data-lucide="square"></i>

            <input
                type="text"
                class="checklist-text"
                data-index="${index}"
                value="${escapeHTML(item.text)}"
                placeholder="Daftar tugas..."
            >

            <button
                type="button"
                data-remove-check="${index}"
                title="Hapus item"
            >
                <i data-lucide="x"></i>
            </button>

        </div>

    `).join("");

    container.querySelectorAll(".checklist-text").forEach(input => {

        input.addEventListener("input", () => {

            const index = Number(input.dataset.index);

            checklistItems[index].text = input.value;

        });

    });

    container.querySelectorAll("[data-remove-check]").forEach(button => {

        button.addEventListener("click", () => {

            const index = Number(button.dataset.removeCheck);

            checklistItems.splice(index, 1);

            renderChecklistInputs();

        });

    });

    refreshIcons();
}

function addChecklistItem() {

    checklistItems.push({
        text: "",
        done: false
    });

    renderChecklistInputs();

    const inputs = document.querySelectorAll(".checklist-text");

    if (inputs.length) {
        inputs[inputs.length - 1].focus();
    }
}

$("add-check-item").addEventListener("click", addChecklistItem);

// ==========================================
// RESET CREATOR
// ==========================================

function resetCreator() {

    $("note-title").value = "";
    $("note-content").value = "";
    $("note-reminder").value = "";
    $("note-label").value = "";

    selectedColor = "#ffffff";
    isPinned = false;
    isChecklist = false;

    checklistItems = [];

    $("note-creator").style.background = "#ffffff";

    $("pin-toggle").classList.remove("selected");
    $("checklist-toggle").classList.remove("selected");

    $("color-options").classList.add("hidden");
    $("checklist-editor").classList.add("hidden");

    $("note-content").classList.remove("hidden");

    $("note-content").placeholder = "Tulis sesuatu...";

    document.querySelectorAll(".color-options button").forEach(button => {
        button.classList.remove("selected");
    });

    renderChecklistInputs();
}

// ==========================================
// OPEN CREATOR
// ==========================================

function openCreator(type = "text") {

    if (currentPage !== "notes") {
        currentPage = "notes";
        activeLabel = null;
        updateNavigation();
        renderNotes();
    }

    resetCreator();

    isChecklist = type === "checklist";

    $("checklist-toggle").classList.toggle(
        "selected",
        isChecklist
    );

    $("checklist-editor").classList.toggle(
        "hidden",
        !isChecklist
    );

    $("note-content").classList.toggle(
        "hidden",
        isChecklist
    );

    if (isChecklist) {
        checklistItems = [{ text: "", done: false }];
        renderChecklistInputs();
    }

    $("note-creator").classList.remove("hidden");

    $("floating-menu").classList.add("hidden");
    $("floating-button").classList.remove("active");

    $("note-title").focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    refreshIcons();
}

// ==========================================
// FLOATING MENU
// ==========================================

$("floating-button").addEventListener("click", () => {

    const menu = $("floating-menu");

    menu.classList.toggle("hidden");

    $("floating-button").classList.toggle(
        "active",
        !menu.classList.contains("hidden")
    );

});

document.querySelectorAll("[data-create]").forEach(button => {

    button.addEventListener("click", () => {
        openCreator(button.dataset.create);
    });

});

$("close-creator").addEventListener("click", () => {

    $("note-creator").classList.add("hidden");
    resetCreator();

});

// ==========================================
// CREATE NOTE
// ==========================================

$("save-note").addEventListener("click", () => {

    const title = $("note-title").value.trim();

    let content = $("note-content").value.trim();

    let items = [];

    if (isChecklist) {

        items = checklistItems
            .filter(item => item.text.trim())
            .map(item => ({
                text: item.text.trim(),
                done: false
            }));

        if (items.length === 0 && !title) {
            showToast("Isi checklist terlebih dahulu!");
            return;
        }

        content = items.map(item => item.text).join("\n");

    } else if (!title && !content) {

        showToast("Catatan masih kosong!");
        return;

    }

    const reminderValue = $("note-reminder").value;

    const note = {

        id: Date.now().toString(),

        title: title || "Tanpa Judul",

        content,

        color: selectedColor,

        pinned: isPinned,

        checklist: isChecklist,

        items,

        label: $("note-label").value,

        reminder: reminderValue
            ? new Date(reminderValue).toISOString()
            : "",

        archived: false,

        trashed: false,

        createdAt: getDate()

    };

    notes.unshift(note);

    if (!saveStorage()) {
        notes.shift();
        return;
    }

    resetCreator();

    $("note-creator").classList.add("hidden");

    renderNotes();

    showToast("Catatan berhasil disimpan!");

});

// ==========================================
// COLOR PICKER
// ==========================================

$("color-toggle").addEventListener("click", () => {

    $("color-options").classList.toggle("hidden");

});

document.querySelectorAll(".color-options button").forEach(button => {

    button.addEventListener("click", () => {

        selectedColor = button.dataset.color;

        $("note-creator").style.background = selectedColor;

        document.querySelectorAll(".color-options button").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        $("color-options").classList.add("hidden");

    });

});

// ==========================================
// PIN NOTE
// ==========================================

$("pin-toggle").addEventListener("click", () => {

    isPinned = !isPinned;

    $("pin-toggle").classList.toggle("selected", isPinned);

    showToast(isPinned ? "Pin diaktifkan" : "Pin dinonaktifkan");

});

// ==========================================
// CHECKLIST MODE
// ==========================================

$("checklist-toggle").addEventListener("click", () => {

    isChecklist = !isChecklist;

    $("checklist-toggle").classList.toggle("selected", isChecklist);

    $("checklist-editor").classList.toggle("hidden", !isChecklist);

    $("note-content").classList.toggle("hidden", isChecklist);

    if (isChecklist && checklistItems.length === 0) {

        checklistItems = [{ text: "", done: false }];

        renderChecklistInputs();

    }

    showToast(
        isChecklist
            ? "Mode checklist aktif"
            : "Mode catatan biasa"
    );

});

// ==========================================
// LABEL SYSTEM
// ==========================================

function renderLabels() {

    const container = $("label-list");

    container.innerHTML = labels.map(label => `

        <div class="label-item ${activeLabel === label.id ? "active" : ""}"
             data-label-id="${escapeHTML(label.id)}">

            <i data-lucide="tag"></i>

            <span>${escapeHTML(label.name)}</span>

            <button
                class="label-delete"
                data-delete-label="${escapeHTML(label.id)}"
                title="Hapus label"
            >
                <i data-lucide="x"></i>
            </button>

        </div>

    `).join("");

    container.querySelectorAll("[data-label-id]").forEach(item => {

        item.addEventListener("click", event => {

            if (event.target.closest("[data-delete-label]")) return;

            activeLabel = item.dataset.labelId;
            currentPage = "notes";

            updateNavigation();
            renderNotes();

            closeSidebar();

        });

    });

    container.querySelectorAll("[data-delete-label]").forEach(button => {

        button.addEventListener("click", event => {

            event.stopPropagation();

            const id = button.dataset.deleteLabel;

            if (!confirm("Hapus label ini? Catatan tidak akan ikut terhapus.")) {
                return;
            }

            labels = labels.filter(label => label.id !== id);

            notes.forEach(note => {
                if (note.label === id) note.label = "";
            });

            if (activeLabel === id) activeLabel = null;

            saveStorage();
            renderLabels();
            renderNotes();

            showToast("Label berhasil dihapus!");

        });

    });

    const options = labels.map(label => `
        <option value="${escapeHTML(label.id)}">
            ${escapeHTML(label.name)}
        </option>
    `).join("");

    $("note-label").innerHTML =
        '<option value="">Tanpa label</option>' + options;

    $("edit-label").innerHTML =
        '<option value="">Tanpa label</option>' + options;

    refreshIcons();
}

// ==========================================
// CREATE LABEL
// ==========================================

$("add-label").addEventListener("click", () => {

    $("label-modal").classList.remove("hidden");

    $("label-name").value = "";

    $("label-name").focus();

});

$("close-label-modal").addEventListener("click", () => {

    $("label-modal").classList.add("hidden");

});

$("save-label").addEventListener("click", () => {

    const name = $("label-name").value.trim();

    if (!name) {
        showToast("Nama label belum diisi!");
        return;
    }

    const exists = labels.some(
        label => label.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        showToast("Label sudah tersedia!");
        return;
    }

    labels.push({
        id: Date.now().toString(),
        name
    });

    saveStorage();

    renderLabels();

    $("label-modal").classList.add("hidden");

    showToast("Label berhasil dibuat!");

});

// ==========================================
// PAGE NAVIGATION
// ==========================================

function updateNavigation() {

    document.querySelectorAll(".sidebar-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === currentPage && !activeLabel
        );

    });

    renderLabels();

}

document.querySelectorAll(".sidebar-item").forEach(button => {

    button.addEventListener("click", () => {

        currentPage = button.dataset.page;

        activeLabel = null;

        $("search-input").value = "";

        $("note-creator").classList.add("hidden");

        updateNavigation();

        renderNotes();

        closeSidebar();

    });

});

// ==========================================
// MOBILE SIDEBAR
// ==========================================

function closeSidebar() {

    $("sidebar").classList.remove("open");

    $("mobile-overlay").classList.remove("show");

}

$("mobile-menu").addEventListener("click", () => {

    $("sidebar").classList.toggle("open");

    $("mobile-overlay").classList.toggle(
        "show",
        $("sidebar").classList.contains("open")
    );

});

$("mobile-overlay").addEventListener("click", closeSidebar);

// ==========================================
// PAGE INFORMATION
// ==========================================

function getPageInformation() {

    const pages = {

        notes: [
            "Catatan",
            "Semua ide dan pikiranmu, tersimpan di sini."
        ],

        reminders: [
            "Pengingat",
            "Hal-hal penting yang perlu kamu ingat."
        ],

        archive: [
            "Arsip",
            "Catatan yang sudah kamu simpan."
        ],

        trash: [
            "Sampah",
            "Catatan yang sudah kamu buang."
        ],

        settings: [
            "Setelan",
            "Kelola pengaturan dan data CRUNCH."
        ]

    };

    if (activeLabel) {

        const label = labels.find(
            item => item.id === activeLabel
        );

        return [
            label ? label.name : "Label",
            "Catatan berdasarkan label pilihanmu."
        ];

    }

    return pages[currentPage] || pages.notes;

}

// ==========================================
// RENDER NOTES
// ==========================================

function renderNotes() {

    const grid = $("notes-grid");
    const empty = $("empty-state");

    const search = $("search-input").value
        .trim()
        .toLowerCase();

    grid.innerHTML = "";

    $("note-creator").classList.toggle(
        "hidden",
        currentPage !== "notes"
    );

    $("floating-area").classList.toggle(
        "hidden",
        currentPage !== "notes"
    );

    // FILTER

    let filtered = notes.filter(note => {

        if (currentPage === "notes") {
            return !note.archived && !note.trashed;
        }

        if (currentPage === "archive") {
            return note.archived && !note.trashed;
        }

        if (currentPage === "trash") {
            return note.trashed;
        }

        if (currentPage === "reminders") {
            return Boolean(note.reminder) && !note.trashed && !note.archived;
        }

        return false;

    });

    // LABEL FILTER

    if (activeLabel) {

        filtered = filtered.filter(
            note => note.label === activeLabel
        );

    }

    // SEARCH

    filtered = filtered.filter(note => {

        const label = labels.find(
            item => item.id === note.label
        );

        return (

            (note.title || "").toLowerCase().includes(search) ||

            (note.content || "").toLowerCase().includes(search) ||

            (label?.name || "").toLowerCase().includes(search)

        );

    });

    // SORT

    if (currentPage === "notes") {

        filtered.sort((a, b) =>
            Number(b.pinned) - Number(a.pinned)
        );

    }

    if (currentPage === "reminders") {

        filtered.sort((a, b) =>
            new Date(a.reminder) - new Date(b.reminder)
        );

    }

    // PAGE HEADING

    const info = getPageInformation();

    $("page-title").textContent = info[0];

    $("page-description").textContent = info[1];

    $("note-count").textContent =
        filtered.length + " Catatan";

    // LABEL INFO

    $("active-label-info").classList.toggle(
        "hidden",
        !activeLabel
    );

    if (activeLabel) {

        $("active-label-info").textContent =
            "Label: " + info[0];

    }

    // REMINDER COUNT

    const reminderCount = notes.filter(note =>
        note.reminder &&
        !note.archived &&
        !note.trashed &&
        new Date(note.reminder) >= new Date()
    ).length;

    $("reminder-count").textContent = reminderCount;

    $("reminder-count").classList.toggle(
        "hidden",
        reminderCount === 0
    );

    // EMPTY STATE

    if (filtered.length === 0) {

        empty.classList.remove("hidden");

        const emptyTitles = {
            notes: "Belum ada catatan",
            reminders: "Belum ada pengingat",
            archive: "Arsip masih kosong",
            trash: "Sampah masih kosong"
        };

        empty.querySelector("h3").textContent =
            emptyTitles[currentPage] || "Belum ada data";

        empty.querySelector("p").textContent =
            currentPage === "notes"
                ? "Mulai tulis ide pertamamu di CRUNCH."
                : "Belum ada data untuk ditampilkan.";

    } else {

        empty.classList.add("hidden");

    }

    // GENERATE CARDS

    filtered.forEach(note => {

        const card = document.createElement("article");

        card.className = "note-card";

        card.style.background = note.color || "#ffffff";

        // CHECKLIST CONTENT

        let contentHTML = "";

        if (note.checklist && Array.isArray(note.items)) {

            contentHTML = note.items.map((item, index) => `

                <label class="check-row">

                    <input
                        type="checkbox"
                        data-check="${index}"
                        ${item.done ? "checked" : ""}
                        ${note.trashed ? "disabled" : ""}
                    >

                    <span>${escapeHTML(item.text)}</span>

                </label>

            `).join("");

        } else {

            contentHTML = `
                <p>${escapeHTML(note.content || "")}</p>
            `;

        }

        // LABEL

        const label = labels.find(
            item => item.id === note.label
        );

        const labelHTML = label
            ? `
                <span class="note-label-badge">
                    <i data-lucide="tag"></i>
                    ${escapeHTML(label.name)}
                </span>
            `
            : "";

        // REMINDER

        const reminderHTML = note.reminder
            ? `
                <div class="reminder-badge">
                    <i data-lucide="bell"></i>
                    ${escapeHTML(formatReminder(note.reminder))}
                </div>
            `
            : "";

        // ACTIONS

        let actions = "";

        if (note.trashed) {

            actions = `
                <button data-action="restore">
                    <i data-lucide="rotate-ccw"></i>
                    Pulihkan
                </button>

                <button data-action="delete">
                    <i data-lucide="trash-2"></i>
                    Hapus Permanen
                </button>
            `;

        } else if (note.archived) {

            actions = `
                <button data-action="restore-archive">
                    <i data-lucide="archive-restore"></i>
                    Kembalikan
                </button>

                <button data-action="trash">
                    <i data-lucide="trash-2"></i>
                    Buang
                </button>
            `;

        } else {

            actions = `
                <button data-action="edit">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>

                <button data-action="pin">
                    <i data-lucide="pin"></i>
                    ${note.pinned ? "Lepas Pin" : "Pin"}
                </button>

                <button data-action="archive">
                    <i data-lucide="archive"></i>
                    Arsip
                </button>

                <button data-action="trash">
                    <i data-lucide="trash-2"></i>
                    Buang
                </button>
            `;

        }

        // CARD HTML

        card.innerHTML = `

            ${note.pinned && !note.archived && !note.trashed
                ? `
                    <span class="note-pin">
                        <i data-lucide="pin"></i>
                    </span>
                `
                : ""
            }

            <h3>${escapeHTML(note.title || "Tanpa Judul")}</h3>

            ${contentHTML}

            ${labelHTML}

            ${reminderHTML}

            <div class="date">
                <i data-lucide="clock"></i>
                ${escapeHTML(note.createdAt || "")}
            </div>

            <div class="card-actions">
                ${actions}
            </div>

        `;

        // CHECKLIST EVENTS

        card.querySelectorAll("[data-check]").forEach(input => {

            input.addEventListener("change", () => {

                const index = Number(input.dataset.check);

                if (!note.items[index]) return;

                note.items[index].done = input.checked;

                saveStorage();

                renderNotes();

            });

        });

        // ACTION EVENTS

        card.querySelectorAll("[data-action]").forEach(button => {

            button.addEventListener("click", () => {

                handleAction(
                    note,
                    button.dataset.action
                );

            });

        });

        grid.appendChild(card);

    });

    grid.classList.toggle("compact-grid", isGrid);

    refreshIcons();

}

// ==========================================
// NOTE ACTIONS
// ==========================================

function handleAction(note, action) {

    switch (action) {

        case "edit":

            openEdit(note);

            break;

        case "pin":

            note.pinned = !note.pinned;

            showToast(
                note.pinned
                    ? "Catatan disematkan"
                    : "Pin dilepas"
            );

            break;

        case "archive":

            note.archived = true;

            showToast("Catatan masuk arsip");

            break;

        case "trash":

            note.trashed = true;

            note.archived = false;

            note.pinned = false;

            showToast("Catatan dipindahkan ke sampah");

            break;

        case "restore":

            note.trashed = false;

            showToast("Catatan berhasil dipulihkan");

            break;

        case "restore-archive":

            note.archived = false;

            showToast("Catatan dikembalikan");

            break;

        case "delete":

            if (confirm("Hapus catatan secara permanen?")) {

                notes = notes.filter(
                    item => item.id !== note.id
                );

                showToast("Catatan dihapus permanen");

            } else {

                return;

            }

            break;

    }

    saveStorage();

    renderNotes();

}

// ==========================================
// EDIT NOTE
// ==========================================

function openEdit(note) {

    editingId = note.id;

    $("edit-title").value = note.title || "";

    $("edit-content").value = note.checklist
        ? (note.items || []).map(item => item.text).join("\n")
        : (note.content || "");

    $("edit-label").value = note.label || "";

    $("edit-reminder").value =
        toDateTimeLocal(note.reminder);

    $("edit-modal").classList.remove("hidden");

    refreshIcons();

}

// CLOSE EDIT MODAL

$("close-modal").addEventListener("click", () => {

    $("edit-modal").classList.add("hidden");

});

// UPDATE NOTE

$("update-note").addEventListener("click", () => {

    const note = notes.find(
        item => item.id === editingId
    );

    if (!note) return;

    note.title =
        $("edit-title").value.trim() || "Tanpa Judul";

    const newContent = $("edit-content").value.trim();

    if (note.checklist) {

        const oldItems = note.items || [];

        note.items = newContent
            .split("\n")
            .filter(line => line.trim())
            .map((line, index) => ({
                text: line.trim(),
                done: oldItems[index]?.done || false
            }));

        note.content = newContent;

    } else {

        note.content = newContent;

    }

    note.label = $("edit-label").value;

    const reminderValue = $("edit-reminder").value;

    note.reminder = reminderValue
        ? new Date(reminderValue).toISOString()
        : "";

    saveStorage();

    $("edit-modal").classList.add("hidden");

    renderNotes();

    showToast("Catatan berhasil diperbarui!");

});

// ==========================================
// SEARCH
// ==========================================

$("search-input").addEventListener("input", () => {

    $("clear-search").classList.toggle(
        "hidden",
        !$("search-input").value
    );

    renderNotes();

});

$("clear-search").addEventListener("click", () => {

    $("search-input").value = "";

    $("clear-search").classList.add("hidden");

    renderNotes();

});

// ==========================================
// VIEW TOGGLE
// ==========================================

$("view-toggle").addEventListener("click", () => {

    isGrid = !isGrid;

    $("view-toggle").innerHTML = isGrid
        ? '<i data-lucide="list"></i>'
        : '<i data-lucide="layout-grid"></i>';

    renderNotes();

    showToast(
        isGrid
            ? "Tampilan ringkas aktif"
            : "Tampilan normal aktif"
    );

});

// ==========================================
// REFRESH
// ==========================================

$("refresh-btn").addEventListener("click", () => {

    renderLabels();

    renderNotes();

    showToast("CRUNCH diperbarui");

});

// ==========================================
// SETTINGS
// ==========================================

document.querySelector('[data-page="settings"]')
    .addEventListener("click", () => {

        $("settings-modal").classList.remove("hidden");

        refreshIcons();

    });

$("close-settings").addEventListener("click", () => {

    $("settings-modal").classList.add("hidden");

});

// ==========================================
// EXPORT DATA
// ==========================================

$("export-notes").addEventListener("click", () => {

    const data = {
        app: "CRUNCH",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        notes,
        labels
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "crunch-backup.json";

    link.click();

    URL.revokeObjectURL(url);

    showToast("Backup berhasil dibuat!");

});

// ==========================================
// IMPORT DATA
// ==========================================

$("import-trigger").addEventListener("click", () => {

    $("import-file").click();

});

$("import-file").addEventListener("change", async event => {

    const file = event.target.files[0];

    if (!file) return;

    try {

        const text = await file.text();

        const data = JSON.parse(text);

        const importedNotes = Array.isArray(data)
            ? data
            : data.notes;

        const importedLabels = Array.isArray(data.labels)
            ? data.labels
            : [];

        if (!Array.isArray(importedNotes)) {
            throw new Error("Format backup tidak sesuai");
        }

        if (!confirm(
            "Impor data akan mengganti data CRUNCH yang sekarang. Lanjutkan?"
        )) {
            event.target.value = "";
            return;
        }

        notes = importedNotes;

        labels = importedLabels;

        if (!saveStorage()) {
            throw new Error("Penyimpanan gagal");
        }

        renderLabels();

        renderNotes();

        $("settings-modal").classList.add("hidden");

        showToast("Data berhasil diimpor!");

    } catch (error) {

        showToast("File backup tidak valid!");

    }

    event.target.value = "";

});

// ==========================================
// MODAL BACKDROP
// ==========================================

["edit-modal", "label-modal", "settings-modal"].forEach(id => {

    $(id).addEventListener("click", event => {

        if (event.target === $(id)) {
            $(id).classList.add("hidden");
        }

    });

});

// ==========================================
// KEYBOARD SHORTCUT
// ==========================================

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        $("floating-menu").classList.add("hidden");

        $("floating-button").classList.remove("active");

        $("edit-modal").classList.add("hidden");

        $("label-modal").classList.add("hidden");

        $("settings-modal").classList.add("hidden");

        $("note-creator").classList.add("hidden");

        closeSidebar();

    }

});

// ==========================================
// INITIALIZATION
// ==========================================

renderLabels();

renderNotes();

refreshIcons();
