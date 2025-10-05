## wildberries-tariffs-pipeline

Сервис для регулярной загрузки тарифов (коэффициентов) Wildberries, сохранения ежедневных снэпшотов в PostgreSQL и экспорта актуальных значений в Google Sheets. Готов к запуску в Docker одним командой, без дополнительной ручной настройки на хосте.

Основные возможности:
- Ежедневное хранение ответа WB в таблице `wb_tariffs_box_daily` (JSONB-слепок за день).
- Обновление одного или нескольких Google‑документов (по ID) на лист `stocks_coefs` или указанный в `GOOGLE_SHEET_TITLE`.
- Сортировка по возрастанию коэффициента; нормализация чисел вида `"0,85"` → `0.85`.
- Планировщик: моментальный запуск при старте и далее каждые `FETCH_INTERVAL_MINUTES` минут.
- Health‑endpoint на `/:APP_PORT` для быстрого статуса.

Стек: Node.js + TypeScript, PostgreSQL + Knex, Google Sheets API, Docker Compose.

Репозиторий позиционирован как решение тестового задания.

### Структура
- `src/app.ts` — оркестратор: миграции/сиды, планировщик, health.
- `src/services/wbClient.ts` — клиент WB (добавляет `?date=YYYY-MM-DD`, таймаут, авторизация).
- `src/services/googleSheets.ts` — запись данных в Google Sheets (создание/очистка/наполнение листа).
- `src/repositories/tariffsRepo.ts` — upsert ежедневного payload и список spreadsheet_id.
- `src/postgres/migrations/*` — миграции, включая `wb_tariffs_box_daily`.
- `src/postgres/seeds/*` — сиды (таблица `spreadsheets`).
- `compose.yaml`, `Dockerfile` — контейнеризация.

## Подготовка окружения

1) Скопируйте `example.env` в `.env` и при необходимости измените значения:

- POSTGRES_PORT=5432
- POSTGRES_DB=postgres
- POSTGRES_USER=postgres
- POSTGRES_PASSWORD=postgres
- APP_PORT=5000
- WB_API_TOKEN=…
- WB_API_URL=https://common-api.wildberries.ru/api/v1/tariffs/box
- FETCH_INTERVAL_MINUTES=60
- GOOGLE_CLIENT_EMAIL=…@…gserviceaccount.com
- GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" (с экранированными переносами строк) 
- GOOGLE_SHEET_TITLE=stocks_coefs (опционально)

2) Google Sheets API
- Создайте сервис‑аккаунт в Google Cloud и включите API Google Sheets.
- Поделитесь каждой целевой таблицей с email сервис‑аккаунта (роль Редактор).

3) Список целевых таблиц
- В БД таблица `spreadsheets` хранит `spreadsheet_id` (ID Google‑таблицы).
- Добавьте свои ID через SQL-клиент или psql, например: `INSERT INTO spreadsheets (spreadsheet_id) VALUES ('<ID>');`.

## Запуск в Docker

Рекомендуемый чистый запуск:

```bash
docker compose down --rmi local --volumes
docker compose up --build
```

Что происходит:
- Поднимаются `postgres` и `app`.
- Приложение выполняет миграции и сиды, затем сразу запускает сбор тарифов за сегодня (параметр `date` передаётся в WB) и экспорт в Sheets, после чего будет повторять каждые `FETCH_INTERVAL_MINUTES` минут.

Проверка:
- Health: http://localhost:APP_PORT (по умолчанию 5000) → `{ ok: true }`.
- Логи приложения: `docker logs -f app`.

## Примечания

- Токен WB обязателен для загрузки из API; при его отсутствии экспорт в Sheets будет пропущен до появления данных в БД.
- Переменная `WB_API_URL` может быть переопределена при необходимости; клиент добавляет `?date=YYYY-MM-DD` автоматически.
- Пример сидов может быть отключён в production (заглушки не вставляются). Добавляйте реальные ID вручную.

## Основа

Проект стартовал с официального шаблона btlz-wb-test (Node.js, TypeScript, Docker, PostgreSQL, Knex). Поверх шаблона реализованы бизнес‑фичи по ТЗ: ежедневное хранилище WB, клиент WB с параметром date, репозиторий, интеграция с Google Sheets, планировщик, health‑endpoint, обновлённый compose и env.

## Лицензия

Проект создан для демонстрации навыков.
