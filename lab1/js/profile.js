let deleteTimerId = null;

function initializeProfile() {
  try {
    const params = new URLSearchParams(location.search);
    const studentId = params.get("id");

    if (!studentId) {
      showNotFound("Не указан ID студента");
      return;
    }

    const student = findStudentByIsuId(studentId);

    if (!student) {
      showNotFound("Студент не найден");
      return;
    }

    renderProfile(student);
    setupActions(studentId);
  } catch (error) {
    showNotice("Ошибка: " + error.message, true);
  }
}

function renderProfile(student) {
  document.getElementById("profile-content").hidden = false;
  document.getElementById("profile-not-found").hidden = true;

  document.getElementById("profile-avatar").textContent = getInitials(student.fullName);

  document.getElementById("profile-name").textContent = student.fullName;
  document.getElementById("profile-group").textContent = "Группа " + student.group;

  const statusEl = document.getElementById("profile-status");
  if (student.isForeign) {
    statusEl.textContent = "Иностранный студент";
    statusEl.className = "profile-status foreign";
  } else {
    statusEl.textContent = "Гражданин РФ";
    statusEl.className = "profile-status local";
  }

  document.getElementById("profile-isu").textContent = student.isuId;
  document.getElementById("profile-group-value").textContent = student.group;
  document.getElementById("profile-dorm").textContent = "№" + student.dormitory;
  document.getElementById("profile-room").textContent = student.room;

  document.getElementById("profile-date").textContent = formatDate(student.settlementDate);
  document.getElementById("profile-foreign").textContent = student.isForeign
    ? "Иностранный студент"
    : "Гражданин РФ";

  const notesSection = document.getElementById("notes-section");
  const notesContent = document.getElementById("profile-notes");
  if (student.notes && student.notes.trim()) {
    notesContent.textContent = student.notes;
    notesSection.hidden = false;
  } else {
    notesSection.hidden = true;
  }

  document.title = student.fullName + " — Профиль студента";

  const editUrl = "student-form.html?id=" + encodeURIComponent(student.isuId);
  document.getElementById("edit-btn").setAttribute("href", editUrl);
}

function setupActions(studentId) {
  const deleteBtn = document.getElementById("delete-btn");
  deleteBtn.addEventListener("click", () => handleDelete(studentId));
}

function handleDelete(studentId) {
  const deleteBtn = document.getElementById("delete-btn");

  if (deleteBtn.dataset.confirm !== "yes") {
    deleteBtn.dataset.confirm = "yes";
    deleteBtn.textContent = "Вы уверены?";
    deleteBtn.classList.add("confirming");

    if (deleteTimerId) clearTimeout(deleteTimerId);
    deleteTimerId = setTimeout(() => resetDeleteButton(), 3000);
    return;
  }

  try {
    if (deleteTimerId) clearTimeout(deleteTimerId);

    const student = findStudentByIsuId(studentId);
    const result = deleteStudent(studentId);

    if (result.success) {
      showNotice(student.fullName + ": запись удалена");
      setTimeout(() => {
        location.href = "index.html";
      }, 1500);
    } else {
      showNotice(result.message, true);
      resetDeleteButton();
    }
  } catch (error) {
    showNotice("Ошибка удаления: " + error.message, true);
    resetDeleteButton();
  }
}

function resetDeleteButton() {
  const deleteBtn = document.getElementById("delete-btn");
  deleteBtn.dataset.confirm = "";
  deleteBtn.textContent = "Удалить";
  deleteBtn.classList.remove("confirming");
}

function showNotFound(message) {
  document.getElementById("profile-content").hidden = true;
  document.getElementById("profile-not-found").hidden = false;
  document.getElementById("empty-text").textContent = message;
  document.title = "Студент не найден";
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("error", isError);

  if (!isError) {
    setTimeout(() => {
      notice.hidden = true;
    }, 3000);
  }
}

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName.charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


document.addEventListener("DOMContentLoaded", initializeProfile);
