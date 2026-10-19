import json
import tempfile
from pathlib import Path
from datetime import timedelta

from django.test import SimpleTestCase, override_settings
from django.utils import timezone


class RequestsApiTests(SimpleTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.file = Path(self.temp.name) / "students.json"
        self.setting = override_settings(STUDENTS_FILE=self.file, DEBUG=False)
        self.setting.enable()
        self.addCleanup(self.setting.disable)
        self.student = {
            "fullName": "Иванов Иван", "group": "M3301", "isuId": "262144",
            "dormitory": 8, "room": 512,
            "settlementDate": timezone.localdate().isoformat(),
            "isForeign": False, "notes": "Проверка"
        }

    def request_json(self, method, path, data):
        return self.client.generic(method, path, json.dumps(data), content_type="application/json")

    def test_crud_and_get_query_filters(self):
        created = self.request_json("POST", "/api/requests", self.student)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["isuId"], "262144")
        self.assertEqual(created["Location"], "/api/requests/262144")
        self.assertEqual(self.client.get("/api/requests/262144").json()["fullName"], "Иванов Иван")
        self.assertEqual(len(self.client.get("/api/requests?group=M3301&dormitory=8").json()), 1)
        self.assertEqual(self.client.get("/api/requests?group=M3302").json(), [])
        query = self.request_json("QUERY", "/api/requests", {"group": "M3301", "isForeign": False})
        self.assertEqual(query.status_code, 200)
        self.assertEqual(len(query.json()), 1)
        patched = self.request_json("PATCH", "/api/requests/262144", {"room": 513})
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.json()["room"], 513)
        self.assertEqual(self.client.delete("/api/requests/262144").status_code, 204)
        self.assertEqual(self.client.get("/api/requests/262144").status_code, 404)
        self.assertEqual(self.client.get("/api/requests").json(), [])

    def test_validation_conflict_and_errors(self):
        bad = self.request_json("POST", "/api/requests", {**self.student, "isuId": "123"})
        self.assertEqual(bad.status_code, 422)
        self.assertEqual(bad.json()["error"]["code"], "validation_error")
        self.assertEqual(self.request_json("POST", "/api/requests", self.student).status_code, 201)
        duplicate = self.request_json("POST", "/api/requests", self.student)
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.json()["error"]["code"], "conflict")
        self.assertEqual(self.client.get("/api/requests?unknown=x").status_code, 422)
        self.assertEqual(self.client.get("/api/requests?group=M3301&group=M3301").status_code, 400)
        self.assertEqual(self.request_json("PATCH", "/api/requests/262144", {}).status_code, 400)
        self.assertEqual(self.client.get("/api/missing").status_code, 404)
        broken = self.client.generic("POST", "/api/requests", "{", content_type="application/json")
        self.assertEqual(broken.status_code, 400)
        self.assertIn("error", broken.json())

    def test_date_and_storage_error(self):
        old = {**self.student, "settlementDate": (timezone.localdate() - timedelta(days=1)).isoformat()}
        self.assertEqual(self.request_json("POST", "/api/requests", old).status_code, 422)
        self.file.write_text("not-json", encoding="utf-8")
        with self.assertLogs("requests_api.errors", level="ERROR"):
            broken = self.client.get("/api/requests")
        self.assertEqual(broken.status_code, 500)
        self.assertEqual(broken.json()["error"]["code"], "internal_error")
