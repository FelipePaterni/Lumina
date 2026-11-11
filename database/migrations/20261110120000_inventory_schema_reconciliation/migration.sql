-- Reconcile inventory schema objects when the original migration is recorded
-- as applied but its objects are absent. This is a no-op on healthy databases.
DO $$ BEGIN
  CREATE TYPE "InventoryMovementType" AS ENUM ('PHYSICAL_ADJUSTMENT', 'DIGITAL_ALLOCATION', 'DIGITAL_RELEASE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "inventories" (
  "id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "physical_stock" INTEGER NOT NULL DEFAULT 0,
  "digital_license_limit" INTEGER,
  "digital_allocated" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "inventories_edition_id_key" ON "inventories"("edition_id");

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" TEXT NOT NULL,
  "inventory_id" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "actor_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "inventory_movements_inventory_id_created_at_idx"
  ON "inventory_movements"("inventory_id", "created_at");

CREATE TABLE IF NOT EXISTS "digital_assets" (
  "id" TEXT NOT NULL,
  "edition_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "digital_assets_edition_id_key" ON "digital_assets"("edition_id");

CREATE TABLE IF NOT EXISTS "digital_asset_versions" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "checksum" VARCHAR(128) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "is_original" BOOLEAN NOT NULL DEFAULT false,
  "created_by_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_asset_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "digital_asset_versions_asset_id_version_key"
  ON "digital_asset_versions"("asset_id", "version");
CREATE INDEX IF NOT EXISTS "digital_asset_versions_asset_id_is_original_idx"
  ON "digital_asset_versions"("asset_id", "is_original");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventories_edition_id_fkey'
      AND conrelid = 'public.inventories'::regclass
  ) THEN
    ALTER TABLE "inventories" ADD CONSTRAINT "inventories_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_movements_inventory_id_fkey'
      AND conrelid = 'public.inventory_movements'::regclass
  ) THEN
    ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey"
      FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'digital_assets_edition_id_fkey'
      AND conrelid = 'public.digital_assets'::regclass
  ) THEN
    ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_edition_id_fkey"
      FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'digital_asset_versions_asset_id_fkey'
      AND conrelid = 'public.digital_asset_versions'::regclass
  ) THEN
    ALTER TABLE "digital_asset_versions" ADD CONSTRAINT "digital_asset_versions_asset_id_fkey"
      FOREIGN KEY ("asset_id") REFERENCES "digital_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
