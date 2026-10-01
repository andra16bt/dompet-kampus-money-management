// Storage key
const STORAGE_KEY = "dompetKampus";

// App state
let state = {
  budget: 0,
  expenses: [],
  activeCategory: "Makan",
};

// Category metadata
const categoryMeta = {
  Makan: {
    name: "MAKAN",
    color: "var(--cat-food)",
    bgClass: "cat-makan",
    icon: '<path d="M4 3h8v2H4zM2 5h12v2H2zM1 7h14v2H1zM3 9h10v2H3zM2 11h12v2H2z"/>',
  },
  Transport: {
    name: "TRANSPORT",
    color: "var(--cat-transport)",
    bgClass: "cat-transport",
    icon: '<path d="M9 2h2v4H9zM1 6h7v2H1zM1 8h14v2H1zM2 10h4v4H2zM10 10h4v4h-4z"/>',
  },
  Nongkrong: {
    name: "NONGKRONG",
    color: "var(--cat-social)",
    bgClass: "cat-nongkrong",
    icon: '<path d="M3 2h8v2H3zM2 4h10v6H2zM12 5h3v4h-3zM4 12h6v2H4z"/>',
  },
  Kuliah: {
    name: "KULIAH",
    color: "var(--cat-academic)",
    bgClass: "cat-kuliah",
    icon: '<path d="M3 2h10v2H3zM2 4h12v7H2zM4 11h8v2H4zM2 13h12v1H2z"/>',
  },
  Lainnya: {
    name: "LAINNYA",
    color: "var(--cat-other)",
    bgClass: "cat-lainnya",
    icon: '<path d="M7 1h2v3H7zM4 4h8v2H4zM1 6h14v2H1zM3 8h10v2H3zM2 10h12v2H2zM4 12h8v2H4z"/>',
  },
};

// Month names
const monthNames = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

// Format number with thousand separators
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse formatted number string to number
function parseFormattedNumber(str) {
  return parseInt(str.replace(/\./g, ""), 10) || 0;
}

// Format input field with thousand separators
function formatInputValue(input) {
  const cursorPos = input.selectionStart;
  const oldValue = input.value;
  const oldLength = oldValue.length;
  
  // Remove all non-numeric characters
  const numericValue = oldValue.replace(/\D/g, "");
  
  // Format with thousand separators
  const formattedValue = numericValue ? formatNumber(parseInt(numericValue, 10)) : "";
  
  // Update input value
  input.value = formattedValue;
  
  // Adjust cursor position
  const newLength = formattedValue.length;
  const diff = newLength - oldLength;
  input.setSelectionRange(cursorPos + diff, cursorPos + diff);
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  initUI();
  initEventListeners();
  updateAll();
});

// Load data from localStorage
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = JSON.parse(stored);
      console.log("Data loaded:", state);
    } catch (e) {
      console.error("Failed to load data:", e);
      state = { budget: 0, expenses: [], activeCategory: "Makan" };
    }
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  console.log("Data saved:", state);
}

// Initialize UI elements
function initUI() {
  // Set current month
  const currentMonth = new Date().getMonth();
  document.getElementById("currentMonth").textContent =
    monthNames[currentMonth];

  // Set current level (month number)
  document.getElementById("currentLevel").textContent = currentMonth + 1;

  // Initialize category chips
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => {
    const category = chip.dataset.category;
    if (category === state.activeCategory) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  document.getElementById("selectedCatLabel").textContent =
    state.activeCategory;

  // Show/hide budget input based on whether budget is set
  const budgetInputGroup = document.getElementById("budgetInputGroup");
  if (state.budget > 0) {
    budgetInputGroup.style.display = "none";
  } else {
    budgetInputGroup.style.display = "flex";
  }
}

// Initialize event listeners
function initEventListeners() {
  // Budget buttons
  document
    .getElementById("setBudgetBtn")
    .addEventListener("click", showBudgetInput);
  document
    .getElementById("confirmBudgetBtn")
    .addEventListener("click", setBudget);
  document
    .getElementById("cancelBudgetBtn")
    .addEventListener("click", hideBudgetInput);
  document.getElementById("budgetInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") setBudget();
  });

  // Format budget input on input
  const budgetInput = document.getElementById("budgetInput");
  budgetInput.addEventListener("input", () => formatInputValue(budgetInput));

  // Format expense amount input on input
  const expenseAmountInput = document.getElementById("expenseAmount");
  expenseAmountInput.addEventListener("input", () => formatInputValue(expenseAmountInput));

  // Category chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const category = chip.dataset.category;
      state.activeCategory = category;

      document
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      document.getElementById("selectedCatLabel").textContent = category;

      saveData();
    });
  });

  // Add expense form
  document.getElementById("expenseForm").addEventListener("submit", addExpense);

  // Reset button
  document.getElementById("resetAllBtn").addEventListener("click", resetMonth);
}

// Show budget input
function showBudgetInput() {
  const budgetInputGroup = document.getElementById("budgetInputGroup");
  budgetInputGroup.style.display = "flex";
  document.getElementById("budgetInput").focus();
}

// Hide budget input
function hideBudgetInput() {
  const budgetInputGroup = document.getElementById("budgetInputGroup");
  budgetInputGroup.style.display = "none";
  document.getElementById("budgetInput").value = "";
}

// Set budget
function setBudget() {
  const input = document.getElementById("budgetInput");
  const value = parseFormattedNumber(input.value);

  if (!value || value < 10000) {
    showToast("BUDGET INVALID!", "Masukkan minimal Rp 10.000", "danger");
    return;
  }

  state.budget = value;
  saveData();

  hideBudgetInput();
  updateAll();

  showToast("BUDGET SET!", `Uang saku: ${formatRupiah(value)}`, "success");

  // Update tips
  updateTips();
}

// Add expense
function addExpense(e) {
  e.preventDefault();

  const nameInput = document.getElementById("expenseName");
  const amountInput = document.getElementById("expenseAmount");

  const name = nameInput.value.trim();
  const amount = parseFormattedNumber(amountInput.value);

  // Validation
  if (!name) {
    showToast("NAMA KOSONG!", "Isi nama pengeluaran", "danger");
    return;
  }

  if (!amount || amount < 100) {
    showToast("NOMINAL INVALID!", "Minimal Rp 100", "danger");
    return;
  }

  if (state.budget === 0) {
    showToast(
      "SET BUDGET DULU!",
      "Atur uang saku sebelum mencatat pengeluaran",
      "warning",
    );
    showBudgetInput();
    return;
  }

  const currentTotal = getTotalExpenses();
  if (currentTotal + amount > state.budget) {
    showToast("UANG TIDAK CUKUP!", "Pengeluaran melebihi sisa uang", "danger");
    return;
  }

  // Create expense
  const expense = {
    id: Date.now(),
    name,
    amount,
    category: state.activeCategory,
    date: new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  state.expenses.push(expense);
  saveData();

  // Reset form
  nameInput.value = "";
  amountInput.value = "";

  updateAll();

  // Show success toast
  showToast(
    "PENGELUARAN DITAMBAH!",
    `${name} (-${formatRupiah(amount)})`,
    "success",
  );

  // Check for low money warning
  const remaining = state.budget - (currentTotal + amount);
  const percentage = (remaining / state.budget) * 100;

  if (percentage < 20 && percentage > 0) {
    setTimeout(() => {
      showToast(
        "⚠ LOW HP!",
        `Sisa uang < 20% (${Math.round(percentage)}%)`,
        "warning",
      );
    }, 1500);
  }
}

// Show custom confirm modal
function showConfirm(message, title, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const msgEl = document.getElementById("modalMessage");
  const titleEl = document.getElementById("modalTitle");
  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");

  msgEl.textContent = message;
  titleEl.textContent = title || "KONFIRMASI";

  const cleanup = () => {
    modal.classList.remove("show");
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  confirmBtn.onclick = () => {
    cleanup();
    onConfirm();
  };

  cancelBtn.onclick = cleanup;
  modal.classList.add("show");
}

// Delete expense
function deleteExpense(id) {
  showConfirm(
    "Hapus pengeluaran ini? Uang akan dikembalikan ke sisa saldo.",
    "HAPUS ITEM",
    () => {
      state.expenses = state.expenses.filter((e) => e.id !== id);
      saveData();
      updateAll();
      showToast("PENGELUARAN DIHAPUS", "Uang dikembalikan ke saldo", "info");
    },
  );
}

// Reset month
function resetMonth() {
  showConfirm(
    "Hapus semua pengeluaran dan mulai bulan baru?\n\nData akan direset ke awal!",
    "NEW GAME",
    () => {
      state.expenses = [];
      saveData();
      updateAll();
      showToast("NEW GAME!", "Semua pengeluaran direset", "info");
    },
  );
}

// Calculate total expenses
function getTotalExpenses() {
  return state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

// Calculate category totals
function getCategoryTotals() {
  const totals = {};
  state.expenses.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  });
  return totals;
}

// Format currency
function formatRupiah(amount) {
  return "Rp " + amount.toLocaleString("id-ID");
}

// Update all UI components
function updateAll() {
  updateBudgetDisplay();
  updateHUD();
  updateSummary();
  updateExpenseList();
  updateCategoryStats();
  updateHPBar();
  updateHearts();
}

// Update budget display
function updateBudgetDisplay() {
  const budgetDisplay = document.getElementById("budgetDisplay");
  const summaryBudget = document.getElementById("summaryBudget");

  if (state.budget > 0) {
    const formatted = formatRupiah(state.budget);
    budgetDisplay.textContent = formatted;
    summaryBudget.textContent = formatted;

    // Update tips based on budget
    updateTips();
  } else {
    budgetDisplay.textContent = "Belum diset";
    summaryBudget.textContent = "Rp 0";
  }
}

// Update HUD
function updateHUD() {
  const totalExpense = getTotalExpenses();
  const hudScore = document.getElementById("hudScoreValue");

  hudScore.textContent = formatRupiah(totalExpense);
}

// Update summary
function updateSummary() {
  const totalExpense = getTotalExpenses();
  const remaining = Math.max(0, state.budget - totalExpense);

  document.getElementById("summaryExpense").textContent =
    formatRupiah(totalExpense);
  document.getElementById("remainingAmount").textContent =
    formatRupiah(remaining);

  // Update balance percentage
  const percentage = state.budget > 0 ? (remaining / state.budget) * 100 : 100;
  document.getElementById("balancePercent").textContent =
    `${Math.round(percentage)}% POOL`;
}

// Update HP bar
function updateHPBar() {
  const totalExpense = getTotalExpenses();
  const remaining = Math.max(0, state.budget - totalExpense);
  const percentage = state.budget > 0 ? (remaining / state.budget) * 100 : 100;

  document.getElementById("hpPercent").textContent = Math.round(percentage);

  // Update HP bar segments (10 segments)
  const segments = document.getElementById("hpSegments");
  if (!segments) return;

  const filledCount = Math.min(10, Math.ceil(percentage / 10));
  let segmentsHTML = "";

  let status = "AMAN";
  let segmentClass = "filled";

  if (percentage <= 25) {
    status = "BAHAYA";
    segmentClass = "danger";
  } else if (percentage <= 50) {
    status = "WASPADA";
    segmentClass = "warning";
  }

  for (let i = 0; i < 10; i++) {
    if (i < filledCount) {
      segmentsHTML += `<div class="hp-segment ${segmentClass}"></div>`;
    } else {
      segmentsHTML += '<div class="hp-segment empty"></div>';
    }
  }

  segments.innerHTML = segmentsHTML;
  document.getElementById("hpBarLabel").textContent =
    `HP ${Math.round(percentage)}% [${status}]`;

  // Update status badge
  const statusBadge = document.getElementById("statusBadge");
  statusBadge.textContent = `STATUS: ${status}`;
  statusBadge.className = "status-badge";

  if (percentage <= 25) {
    statusBadge.classList.add("danger");
  } else if (percentage <= 50) {
    statusBadge.classList.add("warning");
  }
}

// Update hearts display
function updateHearts() {
  const totalExpense = getTotalExpenses();
  const remaining = Math.max(0, state.budget - totalExpense);
  const percentage = state.budget > 0 ? (remaining / state.budget) * 100 : 100;

  const hearts = document.querySelectorAll(".pixel-heart");
  const fullHearts = Math.ceil((percentage / 100) * 4);

  hearts.forEach((heart, index) => {
    if (index < fullHearts) {
      heart.classList.remove("empty");
      heart.classList.add("filled");
    } else {
      heart.classList.remove("filled");
      heart.classList.add("empty");
    }
  });
}

// Update expense list
function updateExpenseList() {
  const list = document.getElementById("expenseList");
  const itemCount = document.getElementById("itemCount");

  if (state.expenses.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>BELUM ADA PENGELUARAN.<br>MULAI GAME!</p>
      </div>
    `;
    itemCount.textContent = "0";
    return;
  }

  // Sort by date descending (newest first)
  const sortedExpenses = [...state.expenses].sort((a, b) => b.id - a.id);

  let listHTML = "";

  sortedExpenses.forEach((expense) => {
    const meta = categoryMeta[expense.category];

    listHTML += `
      <div class="expense-row">
        <div class="expense-row-left">
          <div class="expense-icon ${meta.bgClass}">
            <svg viewBox="0 0 16 16">${meta.icon}</svg>
          </div>
          <div class="expense-details">
            <div class="expense-name">${escapeHtml(expense.name)}</div>
            <div class="expense-meta">${meta.name} • ${expense.date}</div>
          </div>
        </div>
        <div class="expense-row-right">
          <div class="expense-amount">-${formatRupiah(expense.amount)}</div>
          <button class="btn-delete" onclick="deleteExpense(${expense.id})" aria-label="Hapus">
            ✕
          </button>
        </div>
      </div>
    `;
  });

  list.innerHTML = listHTML;
  itemCount.textContent = state.expenses.length;
}

// Update category statistics
function updateCategoryStats() {
  const container = document.getElementById("categoryStats");
  const categoryTotals = getCategoryTotals();
  const totalExpense = getTotalExpenses();

  if (Object.keys(categoryTotals).length === 0) {
    container.innerHTML = `
      <div class="empty-state-small">
        <p>Belum ada data kategori</p>
      </div>
    `;
    return;
  }

  // Sort by amount descending
  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  );

  let statsHTML = "";

  sortedCategories.forEach(([category, amount]) => {
    const meta = categoryMeta[category];
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    const filledSegments = Math.min(10, Math.ceil(percentage / 10));

    let segmentsHTML = "";
    for (let i = 0; i < 10; i++) {
      if (i < filledSegments) {
        segmentsHTML += `<div class="stat-segment filled ${meta.bgClass}"></div>`;
      } else {
        segmentsHTML += '<div class="stat-segment"></div>';
      }
    }

    statsHTML += `
      <div class="stat-item">
        <div class="stat-header">
          <div class="stat-label">
            <span class="stat-color" style="background-color: ${meta.color}"></span>
            <span>${meta.name} (${Math.round(percentage)}%)</span>
          </div>
          <div class="stat-value">${formatRupiah(amount)}</div>
        </div>
        <div class="stat-bar">
          ${segmentsHTML}
        </div>
      </div>
    `;
  });

  container.innerHTML = statsHTML;
}

// Update tips based on current state
function updateTips() {
  const tipsText = document.getElementById("tipsText");

  if (state.budget === 0) {
    tipsText.textContent = "Set uang saku untuk mulai tracking pengeluaran!";
    return;
  }

  const totalExpense = getTotalExpenses();
  const remaining = state.budget - totalExpense;
  const daysRemaining =
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
    new Date().getDate() +
    1;

  if (remaining <= 0) {
    tipsText.textContent =
      "Uang habis! Tunggu bulan depan atau kurangi pengeluaran.";
  } else if (remaining / daysRemaining < 25000) {
    tipsText.textContent = `Hemat Rp ${Math.round(remaining / daysRemaining).toLocaleString("id-ID")}/hari untuk bertahan sampai akhir bulan!`;
  } else {
    const dailyBudget = Math.round(state.budget / 30);
    tipsText.textContent = `Target harian: Rp ${dailyBudget.toLocaleString("id-ID")}/hari untuk Rank A!`;
  }
}

// Show toast notification
function showToast(title, message, type = "info") {
  const toast = document.getElementById("retroToast");
  const titleEl = document.getElementById("toastTitle");
  const messageEl = document.getElementById("toastMessage");

  if (!toast || !titleEl || !messageEl) return;

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Set color based on type
  toast.style.backgroundColor = getToastColor(type);

  // Show toast
  toast.classList.add("show");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Get toast color based on type
function getToastColor(type) {
  switch (type) {
    case "success":
      return "var(--status-safe)";
    case "warning":
      return "var(--status-alert)";
    case "danger":
      return "var(--status-danger)";
    default:
      return "var(--status-alert)";
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
window.deleteExpense = deleteExpense;
window.showBudgetInput = showBudgetInput;
window.hideBudgetInput = hideBudgetInput;
