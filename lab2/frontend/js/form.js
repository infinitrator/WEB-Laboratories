function field(form, name) {
  return form.elements.namedItem(name);
}

function dateLimits() {
  const today = new Date();
  const maximum = new Date(today.getFullYear(), today.getMonth() + 1,
    Math.min(today.getDate(), new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate()));
  const iso = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  return {min: iso(today), max: iso(maximum)};
}

async function initializeForm() {
  const form = document.getElementById("student-form");
  const limits = dateLimits();
  const dateInput = field(form, "settlementDate");
  dateInput.min = limits.min;
  dateInput.max = limits.max;
  const editId = new URLSearchParams(location.search).get("id");
  if (editId) {
    document.getElementById("form-title").textContent = "Редактирование студента";
    document.getElementById("submit-btn").textContent = "Сохранить изменения";
    try {
      const student = await findStudentByIsuId(editId);
      for (const name of ["fullName", "group", "isuId", "dormitory", "room", "settlementDate", "notes"]) {
        field(form, name).value = student[name] ?? "";
      }
      field(form, "isForeign").checked = !!student.isForeign;
      field(form, "isuId").readOnly = true;
      field(form, "isuId").classList.add("readonly-field");
      if (student.settlementDate < limits.min) dateInput.min = student.settlementDate;
      updateNotesCounter();
    } catch (error) {
      showNotice(error.message, true);
      form.hidden = true;
      return;
    }
  }
  field(form, "notes").addEventListener("input", updateNotesCounter);
  form.addEventListener("input", event => {
    if (event.target.name) clearFieldError(event.target);
  });
  form.addEventListener("submit", handleSubmit);
}

function updateNotesCounter() {
  const remaining = 500 - document.getElementById("notes").value.length;
  const counter = document.getElementById("notes-counter");
  counter.textContent = remaining;
  counter.classList.toggle("negative", remaining < 0);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    fullName: field(form, "fullName").value,
    group: field(form, "group").value,
    isuId: field(form, "isuId").value,
    dormitory: Number(field(form, "dormitory").value),
    room: Number(field(form, "room").value),
    settlementDate: field(form, "settlementDate").value,
    isForeign: field(form, "isForeign").checked,
    notes: field(form, "notes").value
  };
  const editId = new URLSearchParams(location.search).get("id");
  const submit = document.getElementById("submit-btn");
  submit.disabled = true;
  clearAllFormErrors(form);
  try {
    if (editId) await updateStudent(editId, data);
    else await addStudent(data);
    location.href = `index.html?status=${editId ? "updated" : "created"}`;
  } catch (error) {
    if (error.details) {
      showFormErrors(form, error.details);
      const first = form.querySelector(".input-error");
      first?.scrollIntoView({behavior: "smooth", block: "center"});
      first?.focus();
    }
    showNotice(error.message, true);
    submit.disabled = false;
  }
}

function clearFieldError(input) {
  input.classList.remove("input-error");
  input.parentElement.querySelector(".field-error")?.remove();
}

function showFormErrors(form, errors) {
  for (const [name, messages] of Object.entries(errors)) {
    const input = field(form, name);
    if (!input) continue;
    input.classList.add("input-error");
    const div = document.createElement("div");
    div.className = "field-error";
    div.textContent = Array.isArray(messages) ? messages.join(" ") : String(messages);
    input.parentElement.appendChild(div);
  }
}

function clearAllFormErrors(form) {
  form.querySelectorAll(".field-error").forEach(element => element.remove());
  form.querySelectorAll(".input-error").forEach(element => element.classList.remove("input-error"));
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("error", isError);
}

document.addEventListener("DOMContentLoaded", initializeForm);
