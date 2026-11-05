DROP TABLE IF EXISTS "editions";
DROP TABLE IF EXISTS "work_categories";
DROP TABLE IF EXISTS "works";
DROP TABLE IF EXISTS "categories";
DROP TABLE IF EXISTS "publishers";
DROP TABLE IF EXISTS "authors";
DROP TYPE IF EXISTS "EditionFormat";

DELETE FROM "_prisma_migrations"
WHERE migration_name = '20261102090000_catalog';
