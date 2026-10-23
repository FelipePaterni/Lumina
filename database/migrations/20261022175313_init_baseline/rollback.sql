-- Rollback for 20261022175313_init_baseline
DROP TABLE IF EXISTS "health_persistence";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261022175313_init_baseline';
