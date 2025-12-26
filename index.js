// js/index.js
document.addEventListener("DOMContentLoaded", () => {
  // DOM elementlarini olish
  const modal = document.getElementById("loginModal");
  const openBtn = document.getElementById("openLoginModal");
  const closeBtn = document.querySelector(".close-btn");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  // Backend API manzili (NestJS default port 3000 da ishlaydi)
  const API_BASE_URL = "https://terdu-qustions.onrender.com";
  const LOGIN_ENDPOINT = "/auth/login";

  // --- Modalni boshqarish funksiyalari ---

  // Modalni ochish
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.add("active");
    loginMessage.innerHTML = ""; // Xabarlarni tozalash
  });

  // Modalni yopish
  const closeModal = () => {
    modal.classList.remove("active");
  };

  closeBtn.addEventListener("click", closeModal);

  // Modal tashqarisini bosganda yopish
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // --- Login logikasi (Fetch API) ---

  // Xabar chiqarish funksiyasi
  const showMessage = (message, type) => {
    loginMessage.textContent = message;
    loginMessage.className = `message-area ${type}`;
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Form ma'lumotlarini olish
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Tugmani o'chirish va yuklanish holatini ko'rsatish
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = "Kirilmoqda...";
    loginMessage.innerHTML = "";

    try {
      const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Muvaffaqiyatli login
        const token = data.access_token;

        // Tokenni local storage ga saqlash
        localStorage.setItem("teacher_access_token", token);
        showMessage("Muvaffaqiyatli kirdingiz! Yuborilmoqda...", "success");

        // === ALERT o'rniga TOAST ishlatilishi ===
        showToast(
          "success",
          "Kirish Muvaffaqiyatli",
          "O'qituvchi tokeni saqlandi. Admin paneliga yo'naltirilmoqda.",
          3500
        );

        // 1.5 soniyadan keyin admin paneliga yo'naltirish
        setTimeout(() => {
          closeModal();
          window.location.href = "./admin/admin.html"; // O'qituvchi paneliga yo'naltirish
        }, 1500);
      } else {
        // Xatolik: Username yoki parol noto'g'ri
        const errorMessage =
          data.message || "Login amalga oshmadi. Qayta urinib ko'ring.";
        showMessage(errorMessage, "error");

        // === ALERT o'rniga TOAST ishlatilishi ===
        showToast("error", "Kirishda Xato", errorMessage);
      }
    } catch (error) {
      // Server bilan bog'lanishdagi xato
      console.error("Login xatosi:", error);
      showMessage(
        "Serverga ulanishda xato. Backend ishlayotganligiga ishonch hosil qiling.",
        "error"
      );

      // === ALERT o'rniga TOAST ishlatilishi ===
      showToast(
        "error",
        "Ulanish Xatosi",
        "Serverga ulanib bo'lmadi. Backend manzilini tekshiring."
      );
    } finally {
      // Tugmani tiklash
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "Kirish";
    }
  });
});
