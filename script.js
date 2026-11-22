/* ==========================================
   CRUNCH 2.0 — SIGNATURE EDITION
   Designed & Developed by Yogi
========================================== */

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "crunch_notes_v1";

/* ==========================================
   CONFIGURATION
========================================== */

let notes = [];

try {
    notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(notes)) notes = [];
} catch (error) {
    notes = [];
}

let currentPage = "notes";
let selectedColor = "#ffffff";
let isPinned = false;
let isChecklist = false;
let editingId = null;
let isGrid = false;

/* ==========================================
   LUCIDE ICON SYSTEM
========================================== */

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

/* ==========================================
   LOADING SCREEN - 7 SECONDS
========================================== */

const loadingDuration = 7000;
const loadingStart = Date.now();

const loadingInterval = setInterval(() => {

    const elapsed = Date.now() - loadingStart;

    const percent = Math.min(
        Math.floor((elapsed / loadingDuration) * 100),
        100
    );

    const progress = $("loading-progress");
    const percentage = $("loading-percent");

    if (progress) {
        progress.style.width = percent + "%";
    }

    if (percentage) {
        percentage.textContent = percent + "%";
    }

    if (percent >= 100) {

        clearInterval(loadingInterval);

        setTimeout(() => {

            if ($("loading-screen")) {
                $("loading-screen").classList.add("hidden");
            }

            if ($("app")) {
                $("app").classList.remove("hidden");
            }

            renderNotes();
            refreshIcons();

        }, 200);
    }

}, 50);

/* ==========================================
   STORAGE SYSTEM
========================================== */

function saveStorage() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notes)
    );
}

/* ==========================================
   UTILITIES
========================================== */

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

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);

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

/* ==========================================
   RESET NOTE CREATOR
========================================== */

function resetCreator() {

    $("note-title").value = "";
    $("note-content").value = "";

    selectedColor = "#ffffff";
    isPinned = false;
    isChecklist = false;

    $("note-creator").style.background = "#fffefa";

    $("pin-toggle").classList.remove("selected");
    $("checklist-toggle").classList.remove("selected");

    $("color-options").classList.add("hidden");

    $("note-content").placeholder = "Tulis sesuatu...";

    document.querySelectorAll(".color-options button").forEach(button => {
        button.classList.remove("selected");
    });

}

/* ==========================================
   CREATE NOTE
========================================== */

$("save-note").addEventListener("click", () => {

    const title = $("note-title").value.trim();
    const content = $("note-content").value.trim();

    if (!title && !content) {
        showToast("Catatan masih kosong!");
        return;
    }

    const items = isChecklist
        ? content.split("\n")
            .filter(line => line.trim())
            .map(line => ({
                text: line.replace(/^☐\s*/, "").trim(),
                done: false
            }))
        : [];

    const note = {

        id: Date.now().toString(),

        title: title || "Tanpa Judul",

        content,

        color: selectedColor,

        pinned: isPinned,

        checklist: isChecklist,

        items,

        archived: false,

        trashed: false,

        createdAt: getDate()

    };

    notes.unshift(note);

    saveStorage();

    resetCreator();

    renderNotes();

    showToast("Catatan berhasil disimpan!");

});

/* ==========================================
   COLOR PICKER
========================================== */

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

/* ==========================================
   PIN NOTE
========================================== */

$("pin-toggle").addEventListener("click", () => {

    isPinned = !isPinned;

    $("pin-toggle").classList.toggle(
        "selected",
        isPinned
    );

    showToast(
        isPinned
            ? "Pin diaktifkan"
            : "Pin dinonaktifkan"
    );

});

/* ==========================================
   CHECKLIST MODE
========================================== */

$("checklist-toggle").addEventListener("click", () => {

    isChecklist = !isChecklist;

    $("checklist-toggle").classList.toggle(
        "selected",
        isChecklist
    );

    $("note-content").placeholder = isChecklist
        ? "Tulis daftar tugas, satu item per baris..."
        : "Tulis sesuatu...";

    showToast(
        isChecklist
            ? "Mode checklist aktif"
            : "Mode catatan biasa"
    );

});

/* ==========================================
   RENDER NOTES
========================================== */

function renderNotes() {

    const grid = $("notes-grid");
    const empty = $("empty-state");

    const search = $("search-input").value.toLowerCase();

    grid.innerHTML = "";

    /* FILTER PAGE */

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
            return false;
        }

        return false;

    });

    /* SEARCH */

    filtered = filtered.filter(note => {

        return (
            (note.title || "").toLowerCase().includes(search) ||
            (note.content || "").toLowerCase().includes(search)
        );

    });

    /* SORT PINNED NOTES */

    if (currentPage === "notes") {

        filtered.sort((a, b) =>
            Number(b.pinned) - Number(a.pinned)
        );

    }

    /* PAGE INFORMATION */

    const titles = {

        notes: [
            "Catatan",
            "Semua ide dan pikiranmu, tersimpan di sini."
        ],

        reminders: [
            "Pengingat",
            "Hal yang perlu kamu ingat."
        ],

        archive: [
            "Arsip",
            "Catatan yang sudah kamu simpan di arsip."
        ],

        trash: [
            "Sampah",
            "Catatan yang sudah kamu buang."
        ]

    };

    $("page-title").textContent = titles[currentPage][0];

    $("page-description").textContent = titles[currentPage][1];

    $("note-count").textContent = filtered.length + " Catatan";

    /* CREATOR VISIBILITY */

    $("note-creator").classList.toggle(
        "hidden",
        currentPage !== "notes"
    );

    /* EMPTY STATE */

    if (filtered.length === 0) {

        empty.classList.remove("hidden");

        empty.querySelector("h3").textContent =

            currentPage === "reminders"
                ? "Belum ada pengingat"

            : currentPage === "trash"
                ? "Sampah masih kosong"

            : currentPage === "archive"
                ? "Arsip masih kosong"

            : "Belum ada catatan";

        empty.querySelector("p").textContent =

            currentPage === "notes"
                ? "Mulai tulis ide pertamamu di CRUNCH."

            : "Belum ada data untuk ditampilkan.";

    } else {

        empty.classList.add("hidden");

    }

    /* GENERATE NOTE CARDS */

    filtered.forEach(note => {

        const card = document.createElement("article");

        card.className = "note-card";

        card.style.background = note.color || "#ffffff";

        /* CHECKLIST CONTENT */

        let contentHTML = "";

        if (note.checklist && note.items) {

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
                <p>${escapeHTML(note.content)}</p>
            `;

        }

        /* NOTE ACTIONS */

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

        /* CARD HTML */

        card.innerHTML = `

            ${note.pinned && !note.archived && !note.trashed

                ? `
                    <span class="note-pin">
                        <i data-lucide="pin"></i>
                    </span>
                `

                : ""
            }

            <h3>${escapeHTML(note.title)}</h3>

            ${contentHTML}

            <div class="date">
                <i data-lucide="clock"></i>
                ${escapeHTML(note.createdAt)}
            </div>

            <div class="card-actions">
                ${actions}
            </div>

        `;

        /* CHECKLIST EVENTS */

        card.querySelectorAll("[data-check]").forEach(input => {

            input.addEventListener("change", () => {

                const index = Number(input.dataset.check);

                note.items[index].done = input.checked;

                saveStorage();

                renderNotes();

            });

        });

        /* ACTION EVENTS */

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

    /* GRID VIEW */

    grid.classList.toggle("compact-grid", isGrid);

    /* REFRESH ALL ICONS */

    refreshIcons();

}

/* ==========================================
   NOTE ACTIONS
========================================== */

function handleAction(note, action) {

    switch (action) {

        case "edit":

            openEdit(note);

            break;

        case "pin":

            note.pinned = !note.pinned;

            showToast(
                note.pinned
                    ? "Catatan dipin"
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

            showToast("Catatan dipulihkan");

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

            }

            break;

    }

    saveStorage();

    renderNotes();

}

/* ==========================================
   EDIT NOTE
========================================== */

function openEdit(note) {

    editingId = note.id;

    $("edit-title").value = note.title;

    $("edit-content").value = note.checklist

        ? note.items.map(item => item.text).join("\n")

        : note.content;

    $("edit-modal").classList.remove("hidden");

    refreshIcons();

}

/* CLOSE MODAL */

$("close-modal").addEventListener("click", () => {

    $("edit-modal").classList.add("hidden");

});

/* UPDATE NOTE */

$("update-note").addEventListener("click", () => {

    const note = notes.find(
        item => item.id === editingId
    );

    if (!note) return;

    note.title = $("edit-title").value.trim() || "Tanpa Judul";

    const newContent = $("edit-content").value.trim();

    if (note.checklist) {

        const oldItems = note.items || [];

        note.items = newContent
            .split("\n")
            .filter(line => line.trim())
            .map((line, index) => ({

                text: line.replace(/^☐\s*/, "").trim(),

                done: oldItems[index]?.done || false

            }));

        note.content = newContent;

    } else {

        note.content = newContent;

    }

    saveStorage();

    $("edit-modal").classList.add("hidden");

    renderNotes();

    showToast("Catatan berhasil diperbarui!");

});

/* ==========================================
   SIDEBAR NAVIGATION
========================================== */

document.querySelectorAll(".sidebar-item").forEach(button => {

    button.addEventListener("click", () => {

        currentPage = button.dataset.page;

        document.querySelectorAll(".sidebar-item").forEach(item => {

            item.classList.remove("active");

        });

        button.classList.add("active");

        $("sidebar").classList.remove("open");

        $("search-input").value = "";

        renderNotes();

    });

});

/* ==========================================
   SEARCH SYSTEM
========================================== */

$("search-input").addEventListener("input", () => {

    renderNotes();

});

/* ==========================================
   MOBILE MENU
========================================== */

$("mobile-menu").addEventListener("click", () => {

    $("sidebar").classList.toggle("open");

});

/* ==========================================
   VIEW TOGGLE
========================================== */

$("view-toggle").addEventListener("click", () => {

    isGrid = !isGrid;

    $("view-toggle").innerHTML = isGrid

        ? '<i data-lucide="list"></i>'

        : '<i data-lucide="layout-grid"></i>';

    renderNotes();

    refreshIcons();

    showToast(
        isGrid
            ? "Tampilan ringkas aktif"
            : "Tampilan normal aktif"
    );

});

/* ==========================================
   REFRESH BUTTON
========================================== */

$("refresh-btn").addEventListener("click", () => {

    renderNotes();

    refreshIcons();

    showToast("Catatan diperbarui");

});

/* ==========================================
   INITIALIZATION
========================================== */

renderNotes();

refreshIcons();