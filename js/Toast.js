// js/Toast.js
/**
 * Chiroyli, animatsiyali toast bildirishnomalarini ko'rsatish funksiyasi.
 * @param {string} type - 'success', 'error', 'info' kabi toast turi.
 * @param {string} title - Toast sarlavhasi.
 * @param {string} message - Toastning asosiy matni.
 * @param {number} duration - Toast qancha vaqt ko'rsatilishi (millisekundda). Default: 3000ms.
 */
function showToast(type, title, message, duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // Icon tanlash
  let iconClass = "";
  switch (type) {
    case "success":
      iconClass = "fas fa-check-circle";
      break;
    case "error":
      iconClass = "fas fa-times-circle";
      break;
    case "info":
    default:
      iconClass = "fas fa-info-circle";
      type = "info"; // Agar notog'ri type kelsa, info qilib qo'yamiz
      break;
  }

  // Toast elementini yaratish
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <p>${message}</p>
        </div>
    `;

  // Containerga qo'shish
  container.appendChild(toast);

  // Animatsiya (Kirish)
  setTimeout(() => {
    toast.classList.add("show");
  }, 10); // Kichik kechikish CSS animatsiyasini ishga tushirish uchun

  // Yo'q bo'lib ketish logikasi
  const removeToast = () => {
    toast.classList.remove("show");
    // Yo'qolish animatsiyasidan keyin elementni o'chirish
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400); // CSS transition vaqtiga moslash
  };

  // Belgilangan vaqtdan keyin avtomatik yopish
  setTimeout(removeToast, duration);
}