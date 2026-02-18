# MyShop SQL migrations

Run against Neon/Postgres using your `DATABASE_URL`.

Example:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init_myshop.sql
```

This creates:
- `sellers`
- `catalog_items`
- `orders`
