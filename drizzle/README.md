# Database Migrations

`0000_initial_esg_schema.sql` is the bootstrap PostgreSQL schema for the current Drizzle models.

Apply it to an empty database before starting the app:

```bash
psql "$DATABASE_URL" -f drizzle/0000_initial_esg_schema.sql
```

Future changes should be generated with Drizzle Kit and reviewed into this folder.
