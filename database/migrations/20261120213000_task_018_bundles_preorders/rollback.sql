ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_bundle_purchase_id_fkey";
DROP INDEX IF EXISTS "order_items_bundle_purchase_id_idx";
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "bundle_purchase_id";

DROP TABLE IF EXISTS "order_bundles";
DROP TABLE IF EXISTS "cart_bundles";
DROP TABLE IF EXISTS "bundle_items";
DROP TABLE IF EXISTS "bundles";
