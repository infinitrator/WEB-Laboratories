const COOKIE_NAME = 'students_dormitory';
const STUDENT_COOKIE_PREFIX = 'student_dormitory_';

function isValidStoredStudent(student) {
  return student && typeof student === 'object' && !Array.isArray(student)
    && typeof student.fullName === 'string'
    && typeof student.group === 'string'
    && typeof student.isuId === 'string';
}

function getStudentCookieNames() {
  return document.cookie
    .split(';')
    .map(cookie => cookie.trim().split('=')[0])
    .filter(name => name.startsWith(STUDENT_COOKIE_PREFIX));
}

function getStudents() {
  const cookieNames = getStudentCookieNames();
  if (cookieNames.length > 0) {
    return cookieNames.flatMap(name => {
      try {
        const student = JSON.parse(getCookie(name));
        return isValidStoredStudent(student)
          ? [student]
          : [];
      } catch (error) {
        console.warn('Student cookie was corrupted', name, error);
        return [];
      }
    });
  }

  // Read data saved by the original version until the next successful change.
  const data = getCookie(COOKIE_NAME);
  if (!data) {
    return [];
  }
  try {
    const students = JSON.parse(data);
    return Array.isArray(students) ? students.filter(isValidStoredStudent) : [];
  } catch (error) {
    console.warn('Cookie data was corrupted', error);
    return [];
  }
}

function saveStudents(students) {
  const previousNames = getStudentCookieNames();
  const currentNames = new Set();

  for (const student of students) {
    const name = STUDENT_COOKIE_PREFIX + student.isuId;
    const data = JSON.stringify(student);
    currentNames.add(name);

    if (`${name}=${encodeURIComponent(data)}`.length > 4000) {
      throw new Error('Запись слишком велика для cookie. Сократите заметку.');
    }

    setCookie(name, data);
    if (getCookie(name) !== data) {
      throw new Error('Браузер не сохранил запись. Проверьте настройки cookie.');
    }
  }

  for (const name of previousNames) {
    if (!currentNames.has(name)) deleteCookie(name);
  }
  deleteCookie(COOKIE_NAME);
}

function addStudent(student) {
  if (isIsuIdExists(student.isuId)) {
    return { 
      success: false, 
      message: `Студент с ИСУ id "${student.isuId}" уже существует` 
    };
  }

  const students = getStudents();
  students.push(student);
  saveStudents(students);

  return { success: true, message: 'Студент добавлен' };
}

function updateStudent(isuId, updatedData) {
  const students = getStudents();
  const index = students.findIndex(s => s.isuId === isuId);

  if (index === -1) {
    return { 
      success: false, 
      message: `Студент с ИСУ id "${isuId}" не найден` 
    };
  }

  if (updatedData.isuId !== isuId && isIsuIdExists(updatedData.isuId)) {
    return { 
      success: false, 
      message: `ИСУ id "${updatedData.isuId}" уже используется другим студентом` 
    };
  }

  students[index] = updatedData;
  saveStudents(students);

  return { success: true, message: 'Данные студента обновлены' };
}

function deleteStudent(isuId) {
  const students = getStudents();
  const filtered = students.filter(s => s.isuId !== isuId);

  if (filtered.length === students.length) {
    return { 
      success: false, 
      message: `Студент с ИСУ id "${isuId}" не найден` 
    };
  }

  saveStudents(filtered);
  return { success: true, message: 'Студент удалён' };
}

function findStudentByIsuId(isuId) {
  const students = getStudents();
  return students.find(s => s.isuId === isuId) || null;
}


function isIsuIdExists(isuId) {
  const students = getStudents();
  return students.some(s => s.isuId === isuId);
}
