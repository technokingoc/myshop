# MyShop SQL migrations

Run against Neon/Postgres using your `DATABASE_URL`.

Example:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init_myshop.sql
psql "$DATABASE_URL" -f db/migrations/0002_sellers_header_template.sql
```

`0001` creates:
- `sellers`
- `catalog_items`
- `orders`

`0002` adds:
- `sellers.header_template` (default `compact`)
