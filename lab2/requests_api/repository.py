"""JSON file storage. One process, concurrent request threads protected by one lock."""

import json
import threading
from pathlib import Path

from django.conf import settings

_lock = threading.Lock()


def _path():
    return Path(settings.STUDENTS_FILE)


def _read():
    path = _path()
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as source:
        data = json.load(source)
    if not isinstance(data, list) or any(not isinstance(item, dict) for item in data):
        raise ValueError("Students file must contain a JSON array of objects")
    return data


def list_all():
    with _lock:
        return _read()


def mutate(operation):
    """Run one read/change/write transaction; operation returns (result, changed)."""
    with _lock:
        students = _read()
        result, changed = operation(students)
        if changed:
            path = _path()
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(students, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return result
