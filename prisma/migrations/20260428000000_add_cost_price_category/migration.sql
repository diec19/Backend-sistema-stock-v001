-- AlterTable
ALTER TABLE "products" ADD COLUMN "cost_price" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "category" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");
