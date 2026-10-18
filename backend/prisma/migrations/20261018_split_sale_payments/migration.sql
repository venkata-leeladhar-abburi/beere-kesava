-- Split counter payments: a retail bill paid with more than one method (e.g.
-- part cash, part UPI). Each saree on such a bill gets SaleRecord.paymentMethod
-- = 'split' and one SalePayment row per method, adding up to its amount.
-- Purely additive: existing sales keep their single paymentMethod/paymentRef.

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleRef" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalePayment_saleRef_idx" ON "SalePayment"("saleRef");

-- CreateIndex
CREATE INDEX "SalePayment_method_idx" ON "SalePayment"("method");

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleRef_fkey" FOREIGN KEY ("saleRef") REFERENCES "SaleRecord"("saleRef") ON DELETE CASCADE ON UPDATE CASCADE;

-- See 20261014_enable_rls: every table gets RLS, or the Data API serves it.
ALTER TABLE "SalePayment" ENABLE ROW LEVEL SECURITY;
