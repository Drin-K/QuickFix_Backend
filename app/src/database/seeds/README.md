# Database seeds

Demo seed data lives in `src/database/seeds/csv`.

Run migrations first, then seed:

```bash
npm run migration:run
npm run seed
```

The seed script uses natural keys from the CSV files, such as `email`,
`tenantName`, `cityName`, `categoryName`, and `serviceTitle`, then resolves the
database IDs automatically.

Demo login password for every seeded user:

```text
Password123!
```

Seeded demo users:

```text
admin@quickfix.test
client@quickfix.test
arben.plumbing@quickfix.test
lira.electric@quickfix.test
drita.clean@quickfix.test
besa.hvac@quickfix.test
colorpro@quickfix.test
fixplus@quickfix.test
```
