// results.js – FINAL VERSIYA: Loading abadiy emas, har doim natija chiqadi

document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE_URL = "https://terdu-qustions.onrender.com";
  const token = localStorage.getItem("teacher_access_token");

  // Elementlar
  const loading = document.getElementById("loading");
  const noResults = document.getElementById("no-results");
  const resultsWrapper = document.getElementById("results-wrapper");
  const resultsTableBody = document.getElementById("resultsTableBody");

  // Toast container (admin.html da bor)
  const toastContainer = document.getElementById("toast-container");

  // Toast funksiyasi
  function showToast(message, type = "info") {
    if (!toastContainer) return; // agar container yo'q bo'lsa

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Token yo'q bo'lsa
  if (!token) {
    showToast("Kirish huquqi yo'q! Login sahifasiga yo'naltirilmoqda...", "error");
    loading.classList.add("hidden");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
    return;
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("teacher_access_token");
      showToast("Tizimdan chiqdingiz!", "success");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    });
  }

  // Fetch funksiyasi – xatoliklarni to'g'ri ishlov berish
  async function fetchData(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 401 — sessiya tugagan
      if (response.status === 401) {
        localStorage.removeItem("teacher_access_token");
        showToast("Sessiya tugadi. Qayta kirish kerak.", "error");
        setTimeout(() => (window.location.href = "../index.html"), 2000);
        return null;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server xatosi: ${response.status} – ${errText || "Noma'lum xato"}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Fetch xatosi:", err);
      showToast("Server bilan bog'lanib bo'lmadi: " + err.message, "error");
      return null;
    }
  }

  // Kategoriyalar
  const categoriesMap = new Map();

  async function loadCategories() {
    const categories = await fetchData("/categories");
    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => categoriesMap.set(cat.id, cat.name));
    }
  }

  // Vaqt va sana formatlash
  function formatTimeSpent(seconds) {
    if (!seconds) return "0 sekund";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins} daqiqa` : `${mins} daqiqa ${secs} sekund`;
  }

  function formatDate(isoString) {
    if (!isoString) return "Noma'lum";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  }

  // Natijalarni yuklash – HAR DOIM loading yashiriladi
  async function loadResults() {
    // Har qanday holatda loading yashiriladi
    loading.classList.add("hidden");

    const results = await fetchData("/results/teacher-all");

    if (results === null) {
      // fetchData ichida toast chiqqan
      noResults.classList.remove("hidden");
      noResults.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size:5rem; color:#e74c3c; margin-bottom:20px;"></i>
        <p>Server bilan bog'lanishda xato yuz berdi. Keyinroq urinib ko'ring.</p>
      `;
      return;
    }

    if (!Array.isArray(results) || results.length === 0) {
      noResults.classList.remove("hidden");
      return;
    }

    // Muvaffaqiyatli yuklandi
    resultsWrapper.classList.remove("hidden");
    resultsTableBody.innerHTML = "";

    results.forEach((result, index) => {
      const studentName = result.studentFullName || "Noma'lum o'quvchi";
      const categoryName = categoriesMap.get(result.categoryId) || `ID: ${result.categoryId || '—'}`;
      const total = result.totalQuestions || 1;
      const score = result.totalScore || 0;
      const percentage = ((score / total) * 100).toFixed(1);
      const timeSpent = formatTimeSpent(result.timeSpent);
      const date = formatDate(result.createdAt);

      let scoreClass = "score-bad";
      if (score / total >= 0.7) scoreClass = "score-good";
      else if (score / total >= 0.5) scoreClass = "score-medium";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${studentName}</strong></td>
        <td>${categoryName}</td>
        <td class="${scoreClass}">${score} / ${total} (${percentage}%)</td>
        <td>${timeSpent}</td>
        <td>${date}</td>
        <td>
          <button class="details-btn" onclick="showDetails(${result.id})">
            <i class="fas fa-eye"></i> Batafsil
          </button>
        </td>
      `;
      resultsTableBody.appendChild(row);
    });

    showToast(`${results.length} ta natija muvaffaqiyatli yuklandi`, "success");
  }

  window.showDetails = (id) => {
    showToast(`Natija ID: ${id}. Batafsil ko'rish tez orada qo'shiladi.`, "info");
  };

  // Boshlash
  showToast("Natijalar yuklanmoqda...", "info");
  await loadCategories();
  await loadResults();
});