-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "firmId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "firmId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "firmId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Purchase_firmId_idx" ON "Purchase"("firmId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vendor_firmId_idx" ON "Vendor"("firmId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Customer_firmId_idx" ON "Customer"("firmId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
