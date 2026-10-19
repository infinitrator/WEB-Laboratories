let deleteTimerId = null;

function initializePage() {
  try {
    renderStudents();
    showStatus();

    document.getElementById("search-input").addEventListener("input", renderStudents);

    document.getElementById("students-table-body").addEventListener("click", handleTableClick);
  } catch (error) {
    showNotice("Ошибка инициализации: " + error.message, true);
  }
}

function renderStudents() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput.value.trim().toLowerCase();
  
  const students = getStudents();
  
  const visibleStudents = students.filter(student => {
    if (!query) return true;
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.group.toLowerCase().includes(query) ||
      student.isuId.includes(query)
    );
  });

  const tableBody = document.getElementById("students-table-body");
  const table = document.getElementById("students-table");
  const emptyState = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptyText = document.getElementById("empty-text");
  const resultsSummary = document.getElementById("results-summary");

  tableBody.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (const student of visibleStudents) {
    fragment.appendChild(createStudentRow(student));
  }
  tableBody.appendChild(fragment);

  const isSearching = query !== "";
  table.hidden = visibleStudents.length === 0;
  emptyState.hidden = visibleStudents.length !== 0;

  emptyTitle.textContent = isSearching ? "Ничего не найдено" : "Список пуст";
  emptyText.textContent = isSearching 
    ? "Попробуйте другой запрос" 
    : "Добавьте первого студента";

  resultsSummary.textContent = isSearching
    ? `Найдено: ${visibleStudents.length} из ${students.length}`
    : `Записей: ${students.length}`;

  updateStats(students);
}

function createStudentRow(student) {
  const row = document.createElement("tr");
  row.dataset.id = student.isuId;

  const profileUrl = `student-profile.html?id=${encodeURIComponent(student.isuId)}`;
  const editUrl = `student-form.html?id=${encodeURIComponent(student.isuId)}`;

  row.innerHTML = `
    <td data-label="Студент">
      <div class="student-cell">
        <div class="avatar">${shielding(getInitials(student.fullName))}</div>
        <div>
          <a href="${profileUrl}" class="student-name">${shielding(student.fullName)}</a>
          <div class="student-foreign">
            ${student.isForeign ? "Иностранный студент" : "Гражданин РФ"}
          </div>
        </div>
      </div>
    </td>
    <td data-label="Группа" class="student-group">${shielding(student.group)}</td>
    <td data-label="ИСУ ID" class="student-isu">${shielding(student.isuId)}</td>
    <td data-label="Общежитие" class="student-dorm">№${shielding(student.dormitory)}</td>
    <td data-label="Срок заселения" class="student-date">${formatDate(student.settlementDate)}</td>
    <td data-label="Действия">
      <div class="row-actions">
        <a href="${profileUrl}" class="btn-icon" title="Просмотр">Просмотр</a>
        <a href="${editUrl}" class="btn-icon" title="Редактировать">Изменить</a>
        <button class="btn-icon action-delete" title="Удалить">Удалить</button>
      </div>
    </td>
  `;

  return row;
}

function handleTableClick(event) {
  const button = event.target.closest("button.action-delete");
  if (!button) return;

  const row = button.closest("tr");
  const id = row?.dataset.id;
  if (!id) return;

  if (button.dataset.confirm !== "yes") {
    document.querySelectorAll("button.action-delete").forEach(resetDeleteButton);
    
    button.dataset.confirm = "yes";
    button.textContent = "Да?";
    button.classList.add("confirming");

    if (deleteTimerId) clearTimeout(deleteTimerId);
    deleteTimerId = setTimeout(() => resetDeleteButton(button), 3000);
    return;
  }

  try {
    if (deleteTimerId) clearTimeout(deleteTimerId);
    
    const student = findStudentByIsuId(id);
    const result = deleteStudent(id);
    
    if (result.success) {
      showNotice(`${student.fullName}: запись удалена`);
      renderStudents();
    } else {
      showNotice(result.message, true);
    }
  } catch (error) {
    showNotice("Ошибка удаления: " + error.message, true);
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
  document.getElementById("foreign-count").textContent = 
    students.filter(s => s.isForeign).length;
}

function showStatus() {
  const params = new URLSearchParams(location.search);
  const status = params.get("status");
  
  if (status === "created") {
    showNotice("Студент успешно добавлен");
  } else if (status === "updated") {
    showNotice("Данные студента обновлены");
  }
  
  if (status) {
    history.replaceState({}, "", location.pathname);
  }
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("error", isError);

  setTimeout(() => {
    notice.hidden = true;
  }, 4000);
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

function shielding(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", initializePage);
