-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "weaverId" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "AuthSession_weaverId_idx" ON "AuthSession"("weaverId");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Locks the table to Supabase's Data API roles (anon, authenticated). No
-- policies on purpose: the app connects as the table owner, which RLS does
-- not restrict, so only the backend can read or end a session.
ALTER TABLE "AuthSession" ENABLE ROW LEVEL SECURITY;
