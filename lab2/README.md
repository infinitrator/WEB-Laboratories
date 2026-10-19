# Лабораторная работа №2 — Django REST Framework

Проект развивает первую лабораторную из `../lab1`: сохранены её страницы, оформление и поля студента. Вместо cookie данные теперь хранятся в `data/students.json`, а браузер обращается к серверному API.

## Запуск

```bash
cd lab2
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 127.0.0.1:8000
```

Откройте `http://127.0.0.1:8000/`. База данных и миграции не нужны. Сервер предназначен для локальной демонстрации: JSON-файл защищён от одновременной записи потоков одного процесса, поэтому запускайте один процесс сервера. При необходимости задайте путь к файлу переменной `STUDENTS_FILE`.

## API

| Метод | Адрес | Результат |
| --- | --- | --- |
| `GET` | `/api/requests` | Список студентов, 200 |
| `GET` | `/api/requests/{isuId}` | Студент, 200 или 404 |
| `POST` | `/api/requests` | Создать, 201 |
| `PATCH` | `/api/requests/{isuId}` | Частично обновить, 200 |
| `DELETE` | `/api/requests/{isuId}` | Удалить, 204 |
| `QUERY` | `/api/requests` | Фильтрация с JSON-телом, 200 |

`GET /api/requests?group=M3301&dormitory=8` фильтрует по группе и общежитию. Также доступны `room`, `isForeign`, `isuId`, `settlementDate`, `fullName` (частичное совпадение) и `q` (поиск по ФИО, группе и ИСУ). Те же поля принимает `QUERY` в JSON-теле, например:

```bash
curl -X QUERY http://127.0.0.1:8000/api/requests \
  -H 'Content-Type: application/json' \
  -d '{"group":"M3301","dormitory":8,"isForeign":false}'
```

Пример создания:

```bash
TODAY=$(TZ=Europe/Moscow date +%F)
curl -X POST http://127.0.0.1:8000/api/requests \
  -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Иванов Иван\",\"group\":\"M3301\",\"isuId\":\"262144\",\"dormitory\":8,\"room\":512,\"settlementDate\":\"$TODAY\",\"isForeign\":false,\"notes\":\"\"}"
```

Для `settlementDate` укажите дату от текущего дня до одного календарного месяца вперёд. Сервер проверяет те же ограничения полей, что и форма первой лабы. ИСУ ID уникален. Ошибки возвращаются единообразно:

```json
{"error":{"code":"validation_error","message":"Проверьте поля запроса.","details":{"isuId":["..."]}}}
```

Используются коды 200, 201, 204, 400, 404, 409, 422 и 500. `400` — неверный формат запроса, `409` — занятый ИСУ ID, `422` — ошибки полей.

## Структура и проверка

- `dormitory_api/` — настройки и маршруты Django.
- `requests_api/views.py` — HTTP-обработчики; `serializers.py` — проверка входа; `services.py` — операции и фильтрация; `repository.py` — работа с JSON-файлом; `errors.py` — формат ошибок.
- `frontend/` — страницы и стиль первой лабы, подключённые к API.
- `data/students.json` — серверные записи (изначально пуст).

Проверка: `python manage.py check` и `python manage.py test requests_api`. Старые записи из cookie первой лабы автоматически не переносятся: cookie принадлежат прежнему адресу страницы. В новом проекте записи создаются через интерфейс или API.
