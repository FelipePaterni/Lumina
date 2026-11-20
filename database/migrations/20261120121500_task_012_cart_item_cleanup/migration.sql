ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_edition_id_fkey";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_edition_id_fkey"
  FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
