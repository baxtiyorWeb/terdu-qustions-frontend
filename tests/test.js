// test.js – Avval Login, keyin Kategoriyalar
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://terdu-qustions-2t6dw6oan.vercel.app";

  // Elementlar
  const categoriesSection = document.getElementById("categories-section");
  const testSection = document.getElementById("test-section");
  const resultModal = document.getElementById("result-modal");
  const authModal = document.getElementById("auth-modal");
  const categoryList = document.getElementById("category-list");
  const answerArea = document.getElementById("answer-area");
  const backToCategoriesBtn = document.getElementById("back-to-categories");
  const logoutBtn = document.getElementById("logout-btn");
  const welcomeMessage = document.getElementById("welcome-message");

  // O'zgaruvchilar
  let questions = [];
  let currentIndex = 0;
  let userAnswers = []; // { type: "multiple"/"text", value: index yoki string }
  let timer;
  let timeLeft = 900; // 15 minut
  let studentToken = localStorage.getItem("student_access_token") || null;
  let studentName = localStorage.getItem("student_full_name") || null;
  let selectedCategoryId = null;

  // --- Utility Functions ---

  // Vaqt formatlash
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Sahifa holatini boshqarish
  function updateUI() {
    // Agar token bor bo'lsa, avtomatik ravishda kategoriya sahifasini yuklaymiz
    if (studentToken && studentName) {
      authModal.classList.remove("initial-active");
      authModal.classList.add("hidden");
      categoriesSection.classList.remove("hidden");
      welcomeMessage.textContent = `Xush kelibsiz, ${studentName}!`;
      loadCategories();
    } else {
      // Aks holda, Login ekranini ko'rsatish
      authModal.classList.add("initial-active");
      authModal.classList.remove("hidden");
      categoriesSection.classList.add("hidden");
      testSection.classList.add("hidden");
    }
  }

  // --- Category Management ---

  // Kategoriyalarni yuklash
  async function loadCategories() {
    try {
      categoryList.innerHTML =
        "<p style='text-align:center; padding:60px;'>Kategoriyalar yuklanmoqda...</p>";
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error("Server xatosi: Kategoriyalar topilmadi");

      const categories = await res.json();
      if (!Array.isArray(categories) || categories.length === 0) {
        categoryList.innerHTML =
          "<p style='text-align:center; color:#e74c3c; padding:60px;'>Kategoriya mavjud emas</p>";
        return;
      }

      categoryList.innerHTML = "";
      categories.forEach((cat) => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.innerHTML = `
          <h3>${cat.name}</h3>
          <p>${cat.description || "Test mavjud"}</p>
          <button class="start-test-btn" data-id="${
            cat.id
          }">Test boshlash</button>
        `;
        categoryList.appendChild(card);
      });
    } catch (err) {
      categoryList.innerHTML = `<p style='color:red;text-align:center;padding:60px;'>Xato: ${err.message}</p>`;
    }
  }

  // Kategoriya tanlash → Testni boshlash
  categoryList.addEventListener("click", (e) => {
    if (e.target.classList.contains("start-test-btn")) {
      selectedCategoryId = e.target.dataset.id;
      startTest(selectedCategoryId);
    }
  });

  // --- Authentication ---

  // Login qilish
  document.getElementById("auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById("student-username").value.trim();
    const password = document.getElementById("student-password").value;

    if (!username || !password) {
      alert("Ism va parolni kiriting!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Kirishda xato");

      studentToken = data.student_access_token;
      studentName = username;
      localStorage.setItem("student_access_token", studentToken);
      localStorage.setItem("student_full_name", username);

      // Login muvaffaqiyatli
      updateUI();
    } catch (err) {
      alert("Xato: " + err.message);
    }
  };

  // Chiqish (Logout)
  logoutBtn.onclick = () => {
    localStorage.removeItem("student_access_token");
    localStorage.removeItem("student_full_name");
    studentToken = null;
    studentName = null;
    alert("Tizimdan chiqdingiz.");
    updateUI();
  };

  // --- Test Flow ---

  // Test boshlash
  async function startTest(categoryId) {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/test/${categoryId}`);
      if (!res.ok) throw new Error("Savollar yuklanmadi");

      questions = await res.json();
      if (questions.length === 0) {
        alert("Bu kategoriyada savol yo'q!");
        return;
      }

      userAnswers = new Array(questions.length).fill(null);
      currentIndex = 0;
      timeLeft = 900; // Har test uchun 15 minut

      categoriesSection.classList.add("hidden");
      testSection.classList.remove("hidden");
      renderQuestion();
      startTimer();
    } catch (err) {
      alert("Xato: " + err.message);
      backToCategories();
    }
  }

  // Savolni ko'rsatish
  function renderQuestion() {
    const q = questions[currentIndex];
    const totalQuestions = questions.length;

    document.getElementById("question-counter").textContent = `${
      currentIndex + 1
    } / ${totalQuestions}`;
    document.getElementById("question-text").textContent = q.question;

    answerArea.innerHTML = "";

    const isTextQuestion = !q.options || q.options.length === 0;

    if (isTextQuestion) {
      // Matnli javob
      const input = document.createElement("input");
      input.type = "text";
      input.className = "text-answer-input";
      input.placeholder = "Javobingizni yozing...";
      input.value = userAnswers[currentIndex]?.value || "";

      input.oninput = () => {
        // Matnli javobni saqlash
        userAnswers[currentIndex] = { type: "text", value: input.value.trim() };
      };
      answerArea.appendChild(input);
    } else {
      // Variantli javob
      q.options.forEach((opt, i) => {
        const btn = document.createElement("div");
        btn.className = "option-btn";
        btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;

        if (userAnswers[currentIndex]?.value === i) {
          btn.classList.add("selected");
        }

        btn.onclick = () => {
          userAnswers[currentIndex] = { type: "multiple", value: i };
          renderQuestion(); // Tanlangan variantni yangilash
        };
        answerArea.appendChild(btn);
      });
    }

    // Navigatsiya tugmalarini yangilash
    document.getElementById("prev-btn").disabled = currentIndex === 0;
    document.getElementById("next-btn").classList.toggle(
      "hidden",
      currentIndex === totalQuestions - 1
    );
    document
      .getElementById("submit-btn")
      .classList.toggle("hidden", currentIndex !== totalQuestions - 1);
  }

  // Timer
  function startTimer() {
    clearInterval(timer);
    document.getElementById("time-left").textContent = formatTime(timeLeft);
    const initialTime = 900;

    timer = setInterval(() => {
      timeLeft--;
      document.getElementById("time-left").textContent = formatTime(timeLeft);
      document.getElementById("progress-indicator").style.width = `${
        (timeLeft / initialTime) * 100
      }%`;

      if (timeLeft <= 120) {
        // 2 daqiqa qolganda rang o'zgarishi
        document.getElementById("time-left").style.color = "#e74c3c";
        document.getElementById("progress-indicator").style.backgroundColor =
          "#e74c3c";
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        submitTest(true); // Vaqt tugashi sababli yakunlash
      }
    }, 1000);
  }

  // Testni yuborish (Backend ga)
  async function submitTest(timeUp = false) {
    clearInterval(timer);

    const answers = questions.map((q, i) => {
      const ans = userAnswers[i];
      const isText = !q.options || q.options.length === 0;
      const value = ans?.value;

      return {
        questionId: q.id,
        userAnswerIndex: isText ? undefined : (value !== null && value !== undefined) ? value : -1,
        userAnswerText: isText ? value || "" : undefined,
      };
    });

    const payload = {
      categoryId: parseInt(selectedCategoryId),
      studentFullName: studentName,
      totalQuestions: questions.length,
      timeSpent: 900 - timeLeft,
      answers,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Natijani saqlashda xato yuz berdi");

      showResultModal(result, timeUp);
    } catch (err) {
      showResultModal(
        { score: 0, total: questions.length },
        timeUp,
        err.message
      );
    }
  }

  // Natija modali
  function showResultModal(data, timeUp = false, error = null) {
    document.getElementById("score-text").textContent = `${data.score || 0} / ${
      data.total || questions.length
    }`;
    document.getElementById("student-name").textContent = studentName;
    testSection.classList.add("hidden"); // Test qismini yashirish

    const total = data.total || questions.length;
    const correct = data.score || 0;
    const attempted = userAnswers.filter(a => a && (a.type === 'text' ? a.value.trim() !== "" : a.value !== -1 && a.value !== null)).length;
    const skipped = total - attempted;
    const wrong = attempted - correct;


    document.getElementById("score-details").innerHTML = `
      <p><strong>Umumiy savollar:</strong> ${total}</p>
      <p><strong>To'g'ri javoblar:</strong> ${correct}</p>
      <p><strong>Noto'g'ri javoblar:</strong> ${wrong > 0 ? wrong : 0}</p>
      <p><strong>O'tkazib yuborilgan/Bo'sh:</strong> ${skipped}</p>
    `;

    let feedback = "Test yakunlandi!";
    if (!error) {
        const percentage = correct / total;
        if (percentage >= 0.9) feedback = "Ajoyib! Eng yuqori ball!";
        else if (percentage >= 0.7) feedback = "Juda yaxshi natija! Tabriklaymiz!";
        else if (percentage >= 0.5) feedback = "Yaxshi. Lekin yana harakat qiling.";
        else feedback = "Yaxshi. Keyingi safar kuchliroq tayyorlaning!";
    }
    
    if (timeUp) feedback += " (Vaqt tugadi)";
    if (error) feedback = "Natija saqlashda xato: " + error;

    document.querySelector(".feedback").textContent = feedback;

    resultModal.classList.add("active");
  }

  // Kategoriyalar sahifasiga qaytish (Test tugagandan keyin yoki Orqaga tugmasi)
  function backToCategories() {
    clearInterval(timer);
    testSection.classList.add("hidden");
    resultModal.classList.remove("active");
    categoriesSection.classList.remove("hidden");
    // loadCategories() – UI update ichida chaqiriladi, shuning uchun bu yerda kerak emas
  }


  // --- Event Listeners ---

  // Orqaga tugmasi (Testdan Kategoriyalarga)
  backToCategoriesBtn.onclick = backToCategories;

  // Natija modalidagi "Yana test tanlash" tugmasi
  document.getElementById("back-to-categories-btn").onclick = backToCategories;

  // Navigatsiya tugmalari
  document.getElementById("prev-btn").onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  };

  document.getElementById("next-btn").onclick = () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    }
  };

  document.getElementById("submit-btn").onclick = () => {
    if (confirm("Testni yakunlashga ishonchingiz komilmi?")) {
      submitTest();
    }
  };

  document.querySelectorAll(".modal .close-btn").forEach((btn) => {
    btn.onclick = () => btn.closest(".modal").classList.remove("active");
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });
  
  // Boshlash
  updateUI();
});