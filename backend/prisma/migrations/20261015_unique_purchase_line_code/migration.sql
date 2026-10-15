-- A purchase line's code is the barcode on its pieces' tags. Two purchases
-- from one supplier entered with the same invoice number minted identical
-- codes (PSG-EXOL-001 twice), so scans couldn't tell the sarees apart.
-- Those were re-coded on 2026-10-10; this stops it happening again.
-- Fails, changing nothing, if any duplicate codes exist.

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseSareeLine_code_key" ON "PurchaseSareeLine"("code");
