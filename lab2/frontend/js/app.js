let deleteTimerId = null;
let searchTimerId = null;
let latestRequest = 0;

function initializePage() {
  renderStudents();
  showStatus();
  document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(searchTimerId);
    searchTimerId = setTimeout(renderStudents, 250);
  });
  document.getElementById("filters").addEventListener("submit", event => {
    event.preventDefault();
    renderStudents();
  });
  document.getElementById("reset-filters").addEventListener("click", () => {
    document.getElementById("filters").reset();
    document.getElementById("search-input").value = "";
    renderStudents();
  });
  document.getElementById("students-table-body").addEventListener("click", handleTableClick);
}

async function renderStudents() {
  const requestId = ++latestRequest;
  const form = document.getElementById("filters");
  const filters = {
    q: document.getElementById("search-input").value.trim(),
    group: form.elements.group.value.trim(),
    dormitory: form.elements.dormitory.value,
    room: form.elements.room.value,
    isForeign: form.elements.isForeign.value
  };
  const isFiltering = Object.values(filters).some(value => value !== "");
  try {
    const students = await getStudents(filters);
    if (requestId !== latestRequest) return;
    const tableBody = document.getElementById("students-table-body");
    const table = document.getElementById("students-table");
    const emptyState = document.getElementById("empty-state");
    tableBody.replaceChildren(...students.map(createStudentRow));
    table.hidden = students.length === 0;
    table.parentElement.hidden = students.length === 0;
    emptyState.hidden = students.length !== 0;
    document.getElementById("empty-title").textContent = isFiltering ? "Ничего не найдено" : "Список пуст";
    document.getElementById("empty-text").textContent = isFiltering ? "Попробуйте изменить фильтры" : "Добавьте первого студента";
    document.getElementById("results-summary").textContent = isFiltering
      ? `Найдено: ${students.length}` : `Записей: ${students.length}`;
    updateStats(students);
  } catch (error) {
    if (requestId === latestRequest) showNotice(error.message, true);
  }
}

function createStudentRow(student) {
  const row = document.createElement("tr");
  row.dataset.id = student.isuId;
  const profileUrl = `student-profile.html?id=${encodeURIComponent(student.isuId)}`;
  const editUrl = `student-form.html?id=${encodeURIComponent(student.isuId)}`;
  row.innerHTML = `
    <td data-label="Студент"><div class="student-cell"><div class="avatar">${getInitials(student.fullName)}</div><div>
      <a href="${profileUrl}" class="student-name">${shielding(student.fullName)}</a>
      <div class="student-foreign">${student.isForeign ? "Иностранный студент" : "Гражданин РФ"}</div>
    </div></div></td>
    <td data-label="Группа" class="student-group">${shielding(student.group)}</td>
    <td data-label="ИСУ ID" class="student-isu">${shielding(student.isuId)}</td>
    <td data-label="Общежитие" class="student-dorm">№${student.dormitory}</td>
    <td data-label="Срок заселения" class="student-date">${formatDate(student.settlementDate)}</td>
    <td data-label="Действия"><div class="row-actions">
      <a href="${profileUrl}" class="btn-icon" title="Просмотр">Просмотр</a>
      <a href="${editUrl}" class="btn-icon" title="Редактировать">Изменить</a>
      <button class="btn-icon action-delete" title="Удалить">Удалить</button>
    </div></td>`;
  return row;
}

async function handleTableClick(event) {
  const button = event.target.closest("button.action-delete");
  if (!button) return;
  const id = button.closest("tr")?.dataset.id;
  if (!id) return;
  if (button.dataset.confirm !== "yes") {
    document.querySelectorAll("button.action-delete").forEach(resetDeleteButton);
    button.dataset.confirm = "yes";
    button.textContent = "Да?";
    button.classList.add("confirming");
    clearTimeout(deleteTimerId);
    deleteTimerId = setTimeout(() => resetDeleteButton(button), 3000);
    return;
  }
  clearTimeout(deleteTimerId);
  button.disabled = true;
  try {
    await deleteStudent(id);
    showNotice("Запись удалена");
    await renderStudents();
  } catch (error) {
    showNotice(error.message, true);
    button.disabled = false;
    resetDeleteButton(button);
  }
}

function resetDeleteButton(button) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.dataset.confirm = "";
  button.textContent = "Удалить";
  button.classList.remove("confirming");
}

function updateStats(students) {
  document.getElementById("dorm-count").textContent = students.length;
  document.getElementById("foreign-count").textContent = students.filter(s => s.isForeign).length;
}

function showStatus() {
  const status = new URLSearchParams(location.search).get("status");
  if (status === "created") showNotice("Студент успешно добавлен");
  if (status === "updated") showNotice("Данные студента обновлены");
  if (status) history.replaceState({}, "", location.pathname);
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("error", isError);
  if (!isError) setTimeout(() => notice.hidden = true, 4000);
}

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("ru-RU", {year: "numeric", month: "long", day: "numeric"});
}

function shielding(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", initializePage);
