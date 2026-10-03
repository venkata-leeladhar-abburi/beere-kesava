-- CreateIndex
CREATE INDEX IF NOT EXISTS "QcRecord_sareeId_qcDate_idx" ON "QcRecord"("sareeId", "qcDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DispatchSaree_sareeId_idx" ON "DispatchSaree"("sareeId");

