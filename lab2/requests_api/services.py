"""Student operations and filtering, independent of HTTP routing."""

from datetime import date

from rest_framework.exceptions import NotFound

from . import repository
from .errors import Conflict


def _json_ready(data):
    return {key: value.isoformat() if isinstance(value, date) else value for key, value in data.items()}


def list_students(filters=None):
    students = repository.list_all()
    filters = filters or {}
    exact_filters = {key: value.isoformat() if isinstance(value, date) else value
                     for key, value in filters.items() if key not in ("q", "fullName")}
    result = []
    for student in students:
        if any(student.get(key) != value for key, value in exact_filters.items()):
            continue
        if "fullName" in filters and filters["fullName"].casefold() not in student.get("fullName", "").casefold():
            continue
        if "q" in filters:
            needle = filters["q"].casefold()
            if not any(needle in str(student.get(key, "")).casefold() for key in ("fullName", "group", "isuId")):
                continue
        result.append(student)
    return result


def get_student(isu_id):
    for student in repository.list_all():
        if student.get("isuId") == isu_id:
            return student
    raise NotFound("Студент не найден.")


def create_student(data):
    student = _json_ready(data)

    def operation(students):
        if any(item.get("isuId") == student["isuId"] for item in students):
            raise Conflict()
        students.append(student)
        return student, True

    return repository.mutate(operation)


def update_student(isu_id, data):
    updates = _json_ready(data)

    def operation(students):
        current = next((item for item in students if item.get("isuId") == isu_id), None)
        if current is None:
            raise NotFound("Студент не найден.")
        new_id = updates.get("isuId", isu_id)
        if new_id != isu_id and any(item.get("isuId") == new_id for item in students):
            raise Conflict()
        current.update(updates)
        return current, True

    return repository.mutate(operation)


def delete_student(isu_id):
    def operation(students):
        for index, student in enumerate(students):
            if student.get("isuId") == isu_id:
                students.pop(index)
                return None, True
        raise NotFound("Студент не найден.")

    repository.mutate(operation)
