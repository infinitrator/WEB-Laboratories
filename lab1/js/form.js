function initializeForm() {
  const form = document.getElementById("student-form");
  const formTitle = document.getElementById("form-title");
  const submitBtn = document.getElementById("submit-btn");
  const notesTextarea = document.getElementById("notes");
  const notesCounter = document.getElementById("notes-counter");
  const settlementDateInput = document.getElementById("settlementDate");
  const dateLimits = getSettlementDateLimits();
  settlementDateInput.min = dateLimits.min;
  settlementDateInput.max = dateLimits.max;

  const params = new URLSearchParams(location.search);
  const editId = params.get("id");

  if (editId) {
    formTitle.textContent = "Редактирование студента";
    submitBtn.textContent = "Сохранить изменения";
    loadStudentForEdit(editId);
  } else {
    formTitle.textContent = "Добавление студента";
    submitBtn.textContent = "Добавить студента";
  }

  notesTextarea.addEventListener("input", () => {
    const remaining = 500 - notesTextarea.value.length;
    notesCounter.textContent = remaining;
    notesCounter.classList.toggle("negative", remaining < 0);
  });

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.name) {
      clearFieldError(field);
    }
  });

  form.addEventListener("submit", handleSubmit);
}

function loadStudentForEdit(id) {
  const student = findStudentByIsuId(id);

  if (!student) {
    showNotice("Студент не найден", true);
    setTimeout(() => {
      location.href = "index.html";
    }, 1500);
    return;
  }

  const form = document.getElementById("student-form");
  form.fullName.value = student.fullName || "";
  form.group.value = student.group || "";
  form.isuId.value = student.isuId || "";
  form.dormitory.value = student.dormitory || "";
  form.room.value = student.room || "";
  form.settlementDate.value = student.settlementDate || "";
  if (student.settlementDate < form.settlementDate.min) {
    form.settlementDate.min = student.settlementDate;
  }
  form.isForeign.checked = student.isForeign || false;
  form.notes.value = student.notes || "";

  const notesCounter = document.getElementById("notes-counter");
  notesCounter.textContent = 500 - (student.notes?.length || 0);

  document.getElementById("isuId").readOnly = true;
  document.getElementById("isuId").classList.add("readonly-field");
}


function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;

  const data = {
    fullName: form.fullName.value,
    group: form.group.value,
    isuId: form.isuId.value,
    dormitory: form.dormitory.value,
    room: form.room.value,
    settlementDate: form.settlementDate.value,
    isForeign: form.isForeign.checked,
    notes: form.notes.value
  };

  const editId = new URLSearchParams(location.search).get("id");
  const previousDate = editId ? findStudentByIsuId(editId)?.settlementDate : null;
  const validation = validateStudent(data, previousDate);

  if (!validation.isValid) {
    showFormErrors(form, validation.errors);
    showNotice("Исправьте ошибки в форме", true);

    const firstErrorField = form.querySelector(".input-error");
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      firstErrorField.focus();
    }
    return;
  }

  const studentData = validation.normalized;
  try {
    let result;

    if (editId) {
      result = updateStudent(editId, studentData);
    } else {
      result = addStudent(studentData);
    }

    if (result.success) {
      const status = editId ? "updated" : "created";
      location.href = `index.html?status=${status}`;
    } else {
      showNotice(result.message, true);
    }
  } catch (error) {
    showNotice("Ошибка сохранения: " + error.message, true);
  }
}

function clearFieldError(field) {
  field.classList.remove("input-error");
  field.parentElement.querySelector(".field-error")?.remove();
}

function showFormErrors(form, errors) {
  clearAllFormErrors(form);

  for (const fieldName in errors) {
    const input = form.elements[fieldName];
    if (!input) continue;

    input.classList.add("input-error");

    const errorDiv = document.createElement("div");
    errorDiv.className = "field-error";
    errorDiv.textContent = errors[fieldName];

    const hint = input.parentElement.querySelector(".form-hint");
    if (hint) {
      hint.insertAdjacentElement("afterend", errorDiv);
    } else {
      input.insertAdjacentElement("afterend", errorDiv);
    }
  }
}

function clearAllFormErrors(form) {
  form.querySelectorAll(".field-error").forEach(element => element.remove());
  form.querySelectorAll(".input-error").forEach(element => {
    element.classList.remove("input-error");
  });
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

document.addEventListener("DOMContentLoaded", initializeForm);
