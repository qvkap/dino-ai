# 🦖 Dino AI Master

**Chrome Extension + Python AI для автоматического прохождения игры Chrome Dino с использованием OpenAI GPT**

![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Chrome Extension](https://img.shields.io/badge/chrome_ext-v1.0-brightgreen)

## ✨ Возможности

- 🤖 **Автоматическая игра** - AI автоматически прыгает и уклоняется от препятствий
- 💬 **Советы игроку** - Получайте рекомендации в реальном времени
- 📊 **Анализ статистики** - Подробный анализ вашего геймплея
- 🧠 **GPT-powered** - Использует OpenAI для интеллектуального анализа
- ⚡ **Реал-тайм** - WebSocket для мгновенного взаимодействия

## 📋 Требования

- Python 3.9+
- Chrome/Chromium браузер
- OpenAI API ключ
- pip зависимости

## 🚀 Быстрый старт

### 1. Установка Backend

```bash
# Клонируйте репозиторий
git clone https://github.com/qvkap/dino-ai.git
cd dino-ai

# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate

# Установите зависимости
pip install -r requirements.txt

# Установите OpenAI ключ
export OPENAI_API_KEY="sk-your-key-here"
```

### 2. Установка Chrome Extension

1. Откройте `chrome://extensions/`
2. Включите "Developer mode" (верхний правый угол)
3. Нажмите "Load unpacked"
4. Выберите папку `chrome-extension`
5. Extension готова!

### 3. Запуск Backend

```bash
python app.py
```

Backend будет доступен на `http://localhost:5000`

### 4. Используйте Extension

1. Откройте новую вкладку в Chrome (появится динозаврик)
2. Нажмите на иконку Extension в правом верхнем углу
3. Выберите режим:
   - **Auto Play** - AI играет автоматически
   - **Advisor Mode** - Советы в реальном времени
   - **Statistics** - Анализ геймплея

## 📁 Структура проекта

```
dino-ai/
├── app.py                 # Flask backend с AI логикой
├── requirements.txt       # Python зависимости
├── Dockerfile            # Docker конфиг
├── docker-compose.yml    # Docker Compose
├── chrome-extension/
│   ├── manifest.json     # Конфигурация Extension
│   ├── popup.html        # UI Extension
│   ├── popup.css         # Стили
│   ├── popup.js          # Логика Extension
│   ├── content.js        # Content script (инъекция в страницу)
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── ai_engine.js      # AI логика для браузера
├── .env.example          # Пример переменных окружения
└── README.md             # Этот файл
```

## 🔧 Конфигурация

Создайте `.env` файл в корне:

```env
OPENAI_API_KEY=sk-your-key-here
FLASK_ENV=development
FLASK_DEBUG=True
CORS_ORIGINS=chrome-extension://*
```

## 📚 API Endpoints

### WebSocket: `ws://localhost:5000/ws`

**Отправка:**
```json
{
  "action": "analyze",
  "game_state": {
    "score": 1250,
    "obstacles": [[100, 50], [150, 50]],
    "player_y": 0,
    "speed": 6
  }
}
```

**Ответ:**
```json
{
  "action": "jump",
  "confidence": 0.95,
  "reason": "Препятствие в 100px впереди",
  "advice": "Прыгайте сейчас для оптимального уклонения"
}
```

## 🐳 Docker

```bash
# Сборка
docker-compose build

# Запуск
docker-compose up

# Backend будет на http://localhost:5000
```

## 🎮 Режимы

### Auto Play Mode
- AI полностью управляет игрой
- Показывает решения в реальном времени
- Отслеживает рекорд

### Advisor Mode
- Вы играете, AI дает советы
- Подсветка рекомендуемого момента для прыжка
- Анализ вашей техники

### Statistics Mode
- Детальный анализ игры
- Графики производительности
- Рекомендации по улучшению

## 🔐 Безопасность

- OpenAI ключ хранится локально в переменных окружения
- WebSocket защищен CORS проверками
- Extension работает только с localhost

## 📝 Лицензия

MIT License

## 🤝 Contributing

Контрибьюции приветствуются! Сделайте fork, создайте branch и отправьте PR.

---

**Создано с ❤️ для Chrome Dino Game Lovers**