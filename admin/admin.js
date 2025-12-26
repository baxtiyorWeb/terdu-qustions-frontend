document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://terdu-qustions.onrender.com";
  const currentPath = window.location.pathname;
  const token = localStorage.getItem("teacher_access_token"); // -------------------------------------- // YANGI: TOAST FUNKSIYASI // --------------------------------------
  function showToast(message, type = "default", duration = 3000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Icon qo'shish
    let iconHtml = "";
    if (type === "success") {
      iconHtml = '<i class="fas fa-check-circle me-2"></i> ';
    } else if (type === "error") {
      iconHtml = '<i class="fas fa-times-circle me-2"></i> ';
    } else if (type === "warning") {
      iconHtml = '<i class="fas fa-exclamation-triangle me-2"></i> ';
    }
    toast.innerHTML = iconHtml + message;

    container.appendChild(toast);

    // Toastni ko'rsatish
    setTimeout(() => {
      toast.classList.add("show");
    }, 10); // CSS animatsiyasini ishga tushirish uchun biroz kutish

    // Toastni yashirish va o'chirish
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
  // Globalga qo'shish
  window.showToast = showToast; // --- Umumiy yordamchi funksiyalar --- // Token yo'qligini tekshirish va yo'naltirish
  // --------------------------------------

  if (!token && !currentPath.includes("index.html")) {
    showToast(
      "Siz admin panelga kirish huquqiga ega emassiz. Iltimos, login qiling.",
      "error"
    );
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
    return;
  } // Serverga so'rov yuborish

  async function fetchData(endpoint, method = "GET", data = null) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (response.status === 401) {
        // Unauthorized (Token muddati tugagan)
        localStorage.removeItem("teacher_access_token");
        showToast(
          "Sessiya muddati tugadi yoki ruxsat yo'q. Qayta login qiling.",
          "warning"
        );
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1500);
        return null;
      }

      if (response.status === 204) {
        // No Content (O'chirish uchun)
        return {};
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Server xatosi: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("API Error:", error.message);
      showToast(`Xatolik: ${error.message}`, "error");
      return null;
    }
  } // Chiqish (Logout) funksiyasi

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("teacher_access_token");
      showToast("Tizimdan chiqdingiz.", "success");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1500);
    });
  } // --- Kategoriya boshqaruvi (categories.html) ---

  if (currentPath.includes("categories.html")) {
    const tableBody = document.getElementById("categoriesTableBodyTr");
    const form = document.getElementById("categoryForm");
    const nameInput = document.getElementById("categoryName");
    const idInput = document.getElementById("categoryId");
    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const messageArea = document.getElementById("formMessage"); // Bu toast ishlatilgani uchun optional // Barcha kategoriyalarni yuklash

    async function loadCategories() {
      const tableBody = document.getElementById("categoriesTableBody");
      const categories = await fetchData("/categories");

      // Jadvalni tozalash
      tableBody.innerHTML = "";

      if (categories && Array.isArray(categories) && categories.length > 0) {
        categories.forEach((cat, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
        <td>${index + 1}</td>
        <td>${cat.name}</td>
        <td>${cat.questionsCount || 0}</td>
        <td class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="editCategory(${
            cat.id
          }, '${cat.name.replace(/'/g, "\\'")}')">Tahrirlash</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory(${
            cat.id
          })">O'chirish</button>
        </td>
      `;
          tableBody.appendChild(row);
        });
        document.getElementById("emptyState").style.display = "none"; // Bo'sh holatni yashirish
      } else {
        // Bo'sh holatni ko'rsatish
        document.getElementById("emptyState").style.display = "block";
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const id = idInput.value;
      if (!name) {
        showToast("Kategoriya nomini kiriting.", "warning");
        return;
      }

      submitBtn.disabled = true;
      let result;

      if (id) {
        // Tahrirlash (PATCH)
        result = await fetchData(`/categories/${id}`, "PATCH", { name });
      } else {
        // Yaratish (POST)
        result = await fetchData("/categories", "POST", { name });
      }

      submitBtn.disabled = false;

      if (result) {
        showToast(
          id
            ? "Kategoriya muvaffaqiyatli tahrirlandi."
            : "Yangi kategoriya qo'shildi.",
          "success"
        );
        form.reset();
        idInput.value = "";
        submitBtn.textContent = "Qo'shish";
        cancelBtn.style.display = "none";
        loadCategories();
      }
      // Xato bo'lsa, fetchData funksiyasi allaqachon toast ko'rsatadi
    }); // Tahrirlash tugmasi funksiyasi (Globalga qo'shish kerak)
    window.editCategory = (id, name) => {
      idInput.value = id;
      nameInput.value = name;
      submitBtn.textContent = "Saqlash";
      cancelBtn.style.display = "inline-block";
    }; // O'chirish tugmasi funksiyasi (Globalga qo'shish kerak)

    window.deleteCategory = async (id) => {
      if (confirm(`Rostdan ham ID: ${id} bo'lgan kategoriyani o'chirasizmi?`)) {
        const result = await fetchData(`/categories/${id}`, "DELETE");
        if (result !== null) {
          showToast("Kategoriya muvaffaqiyatli o'chirildi.", "success");
          loadCategories();
        }
      }
    }; // Tahrirlashni bekor qilish

    cancelBtn.addEventListener("click", () => {
      form.reset();
      idInput.value = "";
      submitBtn.textContent = "Qo'shish";
      cancelBtn.style.display = "none";
    });

    loadCategories();
  } // --- Savollar boshqaruvi (questions.html) ---

  // admin.js – Savollar sahifasi uchun yangi logika (variantli + matnli savollar)

  if (currentPath.includes("questions.html")) {
    const tableBody = document.getElementById("questionsTableBody");
    const categorySelect = document.getElementById("categoryId");
    const form = document.getElementById("questionForm");
    const idInput = document.getElementById("questionId");
    const questionTextInput = document.getElementById("questionText");
    const questionTypeSelect = document.getElementById("questionType");
    const multipleChoiceSection = document.getElementById(
      "multipleChoiceSection"
    );
    const textAnswerSection = document.getElementById("textAnswerSection");
    const correctIndexInput = document.getElementById("correctAnswerIndex");
    const correctTextInput = document.getElementById("correctTextAnswer");
    const optionsContainer = document.querySelector(".options-container");
    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");

    // Savol turi o'zgarganda ko'rinishni o'zgartirish
    questionTypeSelect.addEventListener("change", () => {
      if (questionTypeSelect.value === "text") {
        multipleChoiceSection.classList.add("hidden");
        textAnswerSection.classList.remove("hidden");
        correctTextInput.required = true;
      } else {
        multipleChoiceSection.classList.remove("hidden");
        textAnswerSection.classList.add("hidden");
        correctTextInput.required = false;
      }
    });

    // Kategoriyalarni yuklash
    async function loadCategoriesToSelect() {
      const categories = await fetchData("/categories");
      categorySelect.innerHTML =
        '<option value="">--- Kategoriya tanlang ---</option>';
      if (categories && Array.isArray(categories)) {
        categories.forEach((cat) => {
          const opt = document.createElement("option");
          opt.value = cat.id;
          opt.textContent = cat.name;
          categorySelect.appendChild(opt);
        });
      }
    }

    // Savollarni yuklash
    async function loadQuestions() {
      const questions = await fetchData("/questions/all");
      tableBody.innerHTML = questions?.length
        ? ""
        : '<tr><td colspan="6" style="text-align:center; padding:60px; color:#777;">Savol mavjud emas</td></tr>';

      if (questions && Array.isArray(questions)) {
        questions.forEach((q, i) => {
          const isTextQuestion = !q.options || q.options.length === 0;
          const typeLabel = isTextQuestion ? "Matnli" : "Variantli";
          const correctAnswer = isTextQuestion
            ? q.correctTextAnswer || "—"
            : `Index: ${q.correctAnswerIndex} (${
                q.options?.[q.correctAnswerIndex] || "—"
              })`;

          const row = tableBody.insertRow();
          row.innerHTML = `
          <td>${i + 1}</td>
          <td>${q.question.substring(0, 60)}${
            q.question.length > 60 ? "..." : ""
          }</td>
          <td>${q.category?.name || "Noma'lum"}</td>
          <td><span class="badge ${
            isTextQuestion ? "badge-text" : "badge-multiple"
          }">${typeLabel}</span></td>
          <td>${correctAnswer}</td>
          <td class="action-buttons">
            <button class="btn btn-primary btn-sm" onclick="editQuestion(${
              q.id
            })">
              <i class="fas fa-edit"></i> Tahrirlash
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${
              q.id
            })">
              <i class="fas fa-trash"></i> O'chirish
            </button>
          </td>
        `;
        });
      }
    }

    // Forma submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const isTextQuestion = questionTypeSelect.value === "text";
      const questionData = {
        question: questionTextInput.value.trim(),
        categoryId: parseInt(categorySelect.value),
      };

      if (isTextQuestion) {
        questionData.options = [];
        questionData.correctAnswerIndex = null;
        questionData.correctTextAnswer = correctTextInput.value.trim();

        if (!questionData.correctTextAnswer) {
          showToast(
            "Matnli savol uchun to'g'ri javob matni kiritilishi shart!",
            "error"
          );
          return;
        }
      } else {
        const options = Array.from(
          optionsContainer.querySelectorAll(".option-input")
        )
          .map((input) => input.value.trim())
          .filter((opt) => opt !== "");

        if (options.length < 2) {
          showToast(
            "Variantli savol uchun kamida 2 ta variant kiritilishi shart!",
            "error"
          );
          return;
        }

        const correctIndex = parseInt(correctIndexInput.value);
        if (
          isNaN(correctIndex) ||
          correctIndex < 0 ||
          correctIndex >= options.length
        ) {
          showToast(
            "To'g'ri javob indeksi variantlar sonidan oshmasligi kerak!",
            "error"
          );
          return;
        }

        questionData.options = options;
        questionData.correctAnswerIndex = correctIndex;
        questionData.correctTextAnswer = null;
      }

      if (!questionData.question || !questionData.categoryId) {
        showToast("Savol matni va kategoriya tanlanishi shart!", "error");
        return;
      }

      const id = idInput.value;
      submitBtn.disabled = true;

      const result = id
        ? await fetchData(`/questions/${id}`, "PATCH", questionData)
        : await fetchData("/questions", "POST", questionData);

      submitBtn.disabled = false;

      if (result) {
        showToast(
          id ? "Savol muvaffaqiyatli tahrirlandi!" : "Yangi savol qo'shildi!",
          "success"
        );
        form.reset();
        idInput.value = "";
        submitBtn.textContent = "Qo'shish";
        cancelBtn.style.display = "none";
        questionTypeSelect.value = "multiple";
        multipleChoiceSection.classList.remove("hidden");
        textAnswerSection.classList.add("hidden");
        loadQuestions();
      }
    });

    // Tahrirlash
    window.editQuestion = async (id) => {
      const question = await fetchData(`/questions/${id}`);
      if (!question) return;

      idInput.value = question.id;
      questionTextInput.value = question.question;
      categorySelect.value = question.category?.id || "";

      const isTextQuestion = !question.options || question.options.length === 0;

      if (isTextQuestion) {
        questionTypeSelect.value = "text";
        multipleChoiceSection.classList.add("hidden");
        textAnswerSection.classList.remove("hidden");
        correctTextInput.value = question.correctTextAnswer || "";
      } else {
        questionTypeSelect.value = "multiple";
        multipleChoiceSection.classList.remove("hidden");
        textAnswerSection.classList.add("hidden");

        const inputs = optionsContainer.querySelectorAll(".option-input");
        question.options.forEach((opt, i) => {
          if (inputs[i]) inputs[i].value = opt || "";
        });
        // Bo'sh variantlarni tozalash
        for (let i = question.options.length; i < inputs.length; i++) {
          inputs[i].value = "";
        }
        correctIndexInput.value = question.correctAnswerIndex || 0;
      }

      submitBtn.textContent = "Saqlash";
      cancelBtn.style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // O'chirish
    window.deleteQuestion = async (id) => {
      if (
        confirm(
          "Bu savolni o'chirishni tasdiqlaysizmi? Bu amal ortga qaytarilmaydi."
        )
      ) {
        const res = await fetchData(`/questions/${id}`, "DELETE");
        if (res !== null) {
          showToast("Savol muvaffaqiyatli o'chirildi!", "success");
          loadQuestions();
        }
      }
    };

    // Bekor qilish
    cancelBtn.addEventListener("click", () => {
      form.reset();
      idInput.value = "";
      submitBtn.textContent = "Qo'shish";
      cancelBtn.style.display = "none";
      questionTypeSelect.value = "multiple";
      multipleChoiceSection.classList.remove("hidden");
      textAnswerSection.classList.add("hidden");
    });

    // Boshlash
    loadCategoriesToSelect();
    loadQuestions();
  }
});
