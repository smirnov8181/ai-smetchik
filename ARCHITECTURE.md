# Архитектура проекта AI Smetchik / ContractorCheck

## Общая схема

```mermaid
graph TB
    subgraph "Frontend (Next.js App Router)"
        ROOT["/ — Выбор региона<br/>RU / US"]
        
        subgraph "RU Region (/ru)"
            RU_LAND["Landing Page<br/>LandingContent"]
            RU_AUTH["Login / Register<br/>Supabase Auth"]
            RU_DASH["Dashboard<br/>Список смет и проверок"]
            RU_EST_NEW["Новая смета<br/>EstimateForm + FileUpload"]
            RU_EST_ID["Результат сметы<br/>EstimateResult + EstimateTable"]
            RU_VER_NEW["Новая проверка<br/>VerificationForm + FileUpload"]
            RU_VER_ID["Результат проверки<br/>VerificationResult + Paywall"]
            RU_SHARE["Публичная ссылка<br/>/share/[token]"]
        end
        
        subgraph "US Region (/us)"
            US_LAND["Landing Page<br/>USLanding"]
            US_AUTH["Login / Register"]
            US_DASH["Dashboard<br/>Только проверки"]
            US_VER_NEW["New Verification<br/>Inline Form"]
            US_VER_ID["Verification Result<br/>+ Paywall"]
        end
    end

    ROOT --> RU_LAND
    ROOT --> US_LAND
    RU_LAND --> RU_AUTH --> RU_DASH
    US_LAND --> US_AUTH --> US_DASH
    RU_DASH --> RU_EST_NEW & RU_VER_NEW
    RU_EST_NEW --> RU_EST_ID
    RU_VER_NEW --> RU_VER_ID
    US_DASH --> US_VER_NEW --> US_VER_ID
    RU_EST_ID -.->|"share token"| RU_SHARE

    subgraph "API Routes (/api)"
        API_EST["POST /api/estimates<br/>Создание сметы (SSE)"]
        API_EST_GET["GET /api/estimates/[id]<br/>Polling статуса"]
        API_VER["POST /api/verify<br/>Создание проверки (SSE)"]
        API_VER_GET["GET /api/verify/[id]<br/>Polling + Paywall"]
        API_PAY["POST /api/verify/[id]/pay<br/>Stripe Checkout"]
        API_SHARE["GET /api/share/[token]<br/>Публичный доступ"]
        API_EXPORT["GET /api/estimates/[id]/export<br/>CSV экспорт"]
        API_WEBHOOK["POST /api/webhooks/stripe<br/>Подтверждение оплаты"]
        API_CRON["GET /api/admin/update-prices<br/>Cron: обновление цен"]
    end

    RU_EST_NEW -->|"FormData"| API_EST
    RU_EST_ID -->|"polling 3s"| API_EST_GET
    RU_VER_NEW -->|"FormData"| API_VER
    RU_VER_ID -->|"polling 3s"| API_VER_GET
    US_VER_NEW -->|"FormData"| API_VER
    US_VER_ID -->|"polling 3s"| API_VER_GET
    RU_VER_ID -->|"оплата"| API_PAY
    US_VER_ID -->|"payment"| API_PAY
    RU_SHARE --> API_SHARE
    RU_EST_ID -->|"экспорт"| API_EXPORT

    subgraph "AI Pipeline (lib/ai)"
        direction TB
        NORM["1. Normalizer<br/>GPT-4o<br/>Текст/фото -> JSON"]
        EXTR["2. Extractor<br/>GPT-4o<br/>JSON -> WorkItem[]"]
        CALC["3. Calculator<br/>Fuzzy match по каталогу<br/>-> PricedWorkItem[]"]
        GEN["4. Generator<br/>GPT-4o-mini<br/>-> Итоговая смета"]
        
        VPARSE["1. Parser<br/>GPT-4o / XLSX parser<br/>Разбор сметы подрядчика"]
        VVERIFY["2. Verifier<br/>Сравнение с каталогом цен"]
        VRESULT["3. Result Generator<br/>GPT-4o-mini<br/>Вердикт + рекомендации"]
    end

    API_EST --> NORM --> EXTR --> CALC --> GEN
    API_VER --> VPARSE --> VVERIFY --> VRESULT

    subgraph "External Services"
        OPENROUTER["OpenRouter API<br/>GPT-4o / GPT-4o-mini"]
        SUPABASE["Supabase<br/>PostgreSQL + Auth<br/>+ Storage + RLS"]
        STRIPE["Stripe<br/>Checkout + Webhooks"]
        FIRECRAWL["Firecrawl API<br/>Web Scraping"]
        VERCEL["Vercel<br/>Hosting + Cron"]
    end

    NORM & EXTR & GEN & VPARSE & VRESULT -->|"inference"| OPENROUTER
    CALC & VVERIFY -->|"price_catalog<br/>price_catalog_us"| SUPABASE
    API_EST & API_VER & API_EST_GET & API_VER_GET -->|"estimates<br/>verifications<br/>files"| SUPABASE
    RU_AUTH & US_AUTH -->|"Auth"| SUPABASE
    API_PAY -->|"Checkout Session"| STRIPE
    STRIPE -->|"webhook event"| API_WEBHOOK
    API_WEBHOOK -->|"is_paid = true"| SUPABASE
    API_CRON --> FIRECRAWL
    FIRECRAWL -->|"markdown"| OPENROUTER
    API_CRON -->|"upsert prices"| SUPABASE
    VERCEL -->|"cron 1-го числа"| API_CRON

    subgraph "Database (Supabase PostgreSQL)"
        DB_EST["estimates<br/>user_id, input, result, status"]
        DB_VER["verifications<br/>user_id, parsed_items, result, is_paid"]
        DB_FILES["estimate_files<br/>verification_files"]
        DB_SUBS["subscriptions<br/>plan, usage, stripe_id"]
        DB_PRICES_RU["price_catalog<br/>Москва: мин/сред/макс"]
        DB_PRICES_US["price_catalog_us<br/>US: 20 metro areas"]
    end

    style OPENROUTER fill:#10a37f,color:#fff
    style SUPABASE fill:#3ecf8e,color:#fff
    style STRIPE fill:#635bff,color:#fff
    style FIRECRAWL fill:#ff6b35,color:#fff
    style VERCEL fill:#000,color:#fff
```

## Потоки данных

| Поток | Описание |
|---|---|
| **Создание сметы** | Форма -> API (SSE) -> Normalizer -> Extractor -> Calculator (каталог цен) -> Generator -> БД -> Polling -> UI |
| **Проверка подрядчика** | Форма + файл -> API (SSE) -> Parser (AI/XLSX) -> Verifier (каталог цен) -> Result Generator -> БД -> Paywall -> UI |
| **Оплата** | Кнопка "Разблокировать" -> Stripe Checkout -> Webhook -> `is_paid=true` -> Полный результат |
| **Обновление цен** | Vercel Cron -> Firecrawl (скрейпинг) -> GPT-4o-mini (извлечение) -> Агрегация (IQR) -> Upsert в БД |

## AI Pipeline: Создание сметы

```mermaid
flowchart LR
    A["Ввод пользователя<br/>текст / фото / PDF"] --> B["Normalizer<br/>GPT-4o"]
    B -->|"структурированный JSON<br/>{rooms, areas, works}"| C["Extractor<br/>GPT-4o"]
    C -->|"WorkItem[]<br/>{category, work, unit, qty}"| D["Calculator<br/>Fuzzy Match"]
    D -->|"PricedWorkItem[]<br/>+ материалы"| E["Generator<br/>GPT-4o-mini"]
    E -->|"EstimateResult<br/>секции, итоги, саммари"| F["БД + UI"]
    
    DB[(price_catalog)] --> D
```

## AI Pipeline: Проверка подрядчика

```mermaid
flowchart LR
    A["Смета подрядчика<br/>PDF / XLSX / фото"] --> B{"Формат?"}
    B -->|"XLSX"| C["XLSX Parser<br/>прямой разбор"]
    B -->|"PDF / фото / текст"| D["AI Parser<br/>GPT-4o"]
    C --> E["Parsed Items"]
    D --> E
    E --> F["Verifier<br/>Сравнение с каталогом"]
    F --> G["Result Generator<br/>GPT-4o-mini"]
    G -->|"вердикт + рекомендации"| H["БД + Paywall + UI"]
    
    DB[(price_catalog)] --> F
```

## Структура базы данных

```mermaid
erDiagram
    users ||--o{ estimates : "создает"
    users ||--o{ verifications : "создает"
    users ||--|| subscriptions : "имеет"
    estimates ||--o{ estimate_files : "содержит"
    verifications ||--o{ verification_files : "содержит"
    
    users {
        uuid id PK
        string email
        string provider
    }
    estimates {
        uuid id PK
        uuid user_id FK
        jsonb input
        jsonb result
        string status
        float total_amount
        string share_token
        string region
    }
    verifications {
        uuid id PK
        uuid user_id FK
        jsonb parsed_items
        jsonb result
        string status
        boolean is_paid
        string region
    }
    subscriptions {
        uuid id PK
        uuid user_id FK
        string plan
        int usage_count
        string stripe_customer_id
    }
    price_catalog {
        uuid id PK
        string category
        string work_name
        string unit
        float price_min
        float price_avg
        float price_max
    }
    price_catalog_us {
        uuid id PK
        string category
        string work_name
        string unit
        float price_min
        float price_avg
        float price_max
        string region
    }
```

## Стек технологий

| Слой | Технологии |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | Next.js API Routes, SSE streaming |
| **AI** | OpenRouter (GPT-4o, GPT-4o-mini) |
| **БД / Auth** | Supabase (PostgreSQL + Auth + Storage + RLS) |
| **Платежи** | Stripe (Checkout + Webhooks) |
| **Скрейпинг** | Firecrawl API |
| **Хостинг** | Vercel (+ Cron Jobs) |
| **Парсинг файлов** | pdf-parse-fork, xlsx |
