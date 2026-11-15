# Svoyak

Мобильный клиент [SIGame](https://sigame.vladimirkhil.com/) на протоколе [SIOnline](https://github.com/VladimirKhil/SIOnline).

Совместим с официальными комнатами: вы можете играть с друзьями на оригинальном клиенте.

## Стек

- React 17 + Redux Toolkit + SignalR (как в SIOnline)
- Vite + SCSS / SCSS Modules (мобильная оболочка)
- PWA (`vite-plugin-pwa`)
- Лицензия: **GPL-3.0** (см. `LICENSE`, `NOTICE`)

## Команды

```bash
npm install
npm run smoke      # проверка discovery официальных серверов
npm run dev       # http://localhost:5173
npm run build
npm run preview -- --host   # раздача сборки в LAN (для установки PWA)
npm run check-types
```

## Установка на телефон (PWA)

Манифест и service worker уже в сборке (`vite-plugin-pwa`, иконки в `public/pwa/`).

1. Собери и отдай по сети: `npm run build && npm run preview -- --host`
2. На телефоне открой `http://<IP-ПК>:4173` (тот же Wi‑Fi)

**Android (Chrome):** меню ⋮ → «Установить приложение» / «Добавить на главный экран».  
Полноценная установка обычно требует **HTTPS** (localhost — исключение). С HTTP часто остаётся только ярлык «на экран».

**iOS (Safari):** Поделиться → «На экран „Домой“».

После деплоя на домен с HTTPS установка работает как у обычного приложения.

## Деплой на Vercel

В корне есть `vercel.json`: same-origin прокси `/si/*` → серверы SIGame (без него онлайн не работает — CORS только для официального домена).

После пуша в репозиторий дождись деплоя и проверь `https://<твой-проект>.vercel.app/si/discovery` — должен ответить JSON, а не 404.

## Конфиг серверов и CORS

Официальный API отдаёт CORS только для `https://sigame.vladimirkhil.com`.
Поэтому в dev (и на своём домене) запросы идут через same-origin proxy:

- `/si/discovery` → discovery
- `/si/server` → game host + SignalR
- `/si/proxy` → запасной SIGame proxy (`server2:8080`)

В настройках есть переключатель **«Использовать прокси-соединение SIGame»** (при HAPP/VPN лучше выключен).

## Структура

- `src/client`, `src/logic`, `src/state`, `src/model` — протокол SIOnline (без изменений по смыслу)
- `src/components` — экраны SIOnline
- `src/mobile` — мобильная оболочка (SCSS Modules)
- `src/scss/mobile.scss` — mobile-first overrides
