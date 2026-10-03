-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERADMIN', 'WORKER', 'WEAVER', 'SHOP', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('FULL_ACCESS', 'RESTRICTED', 'DOWNLOAD_RESTRICTED', 'MONEY_HIDDEN');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LoomStatus" AS ENUM ('ACTIVE', 'IDLE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('WEAVER', 'FACTORY_LOOM');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('WARP', 'RESHAM', 'JARI');

-- CreateEnum
CREATE TYPE "WarpSubtype" AS ENUM ('RESHAM_WARP', 'JARI_WARP');

-- CreateEnum
CREATE TYPE "JariGrade" AS ENUM ('G1', 'G2', 'G3', 'G4', 'G5');

-- CreateEnum
CREATE TYPE "SignatureMethod" AS ENUM ('HERE', 'REMOTE');

-- CreateEnum
CREATE TYPE "MaterialIssueStatus" AS ENUM ('PENDING_SIGNATURE', 'SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QcResult" AS ENUM ('PASSED', 'SEMI', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "FinishingAssignmentStatus" AS ENUM ('AWAITING_RETURN', 'RETURNED');

-- CreateEnum
CREATE TYPE "FinishingCondition" AS ENUM ('PERFECT', 'DAMAGED');

-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('RAISED', 'IN_FINISHING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "QuotationSareeStatus" AS ENUM ('PENDING', 'IN_FINISHING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "BulkOrderStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'DISPATCHED', 'INVOICED');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "DispatchType" AS ENUM ('SHOP', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('QC_PASSED', 'FINISHING_COMPLETE', 'DISPATCHED', 'DAMAGED_REVIEW_NEEDED', 'SOLD');

-- CreateEnum
CREATE TYPE "InventoryRawType" AS ENUM ('READY_SAREE', 'RETURN');

-- CreateEnum
CREATE TYPE "ShopReceiptItemStatus" AS ENUM ('RECEIVED', 'DAMAGED', 'MISSING');

-- CreateEnum
CREATE TYPE "DispatchReceiptStatus" AS ENUM ('PENDING', 'PARTIALLY_RECEIVED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "SareeOrigin" AS ENUM ('WEAVER', 'FACTORY_LOOM', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "SareeStatus" AS ENUM ('UNSOLD', 'RETAIL', 'WHOLESALE', 'RETURNED');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('RETAIL', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "PartyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('PAID', 'PENDING', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PurchaseDiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "VendorBillStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplierReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancialEntryKind" AS ENUM ('INCOME', 'EXPENSE', 'MISC');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('WHOLESALE', 'RETAIL');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('LOGIN', 'LOGOUT', 'FAILED');

-- CreateEnum
CREATE TYPE "GeofenceMode" AS ENUM ('OBSERVE', 'ENFORCE');

-- CreateEnum
CREATE TYPE "GeofenceDecision" AS ENUM ('ALLOWED', 'OUTSIDE', 'INACCURATE', 'UNAVAILABLE', 'EXEMPT', 'NOT_ENFORCED', 'NO_SITE_CONFIGURED');

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('USER', 'ROLE');

-- CreateEnum
CREATE TYPE "WarpRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED');

-- CreateEnum
CREATE TYPE "RateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppMessageKind" AS ENUM ('OTP', 'DOCUMENT', 'REPORT', 'RETAIL_BILL', 'MANUAL');

-- CreateEnum
CREATE TYPE "MaterialReturnStatus" AS ENUM ('PENDING_SIGNATURE', 'APPROVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "IdCounter" (
    "prefix" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IdCounter_pkey" PRIMARY KEY ("prefix")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL,
    "additionalRoles" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[],
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'FULL_ACCESS',
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedWeaverId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPortalAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,

    CONSTRAINT "UserPortalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "kind" "WhatsAppMessageKind" NOT NULL,
    "campaignName" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "templateParams" JSONB,
    "mediaUrl" TEXT,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "providerId" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weaver" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "village" TEXT,
    "cluster" TEXT,
    "looms" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Weaver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryLoom" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "loomNumber" TEXT NOT NULL,
    "location" TEXT,
    "operatorName" TEXT,
    "operatorPhone" TEXT,
    "status" "LoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "installedYear" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoryLoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignLibrary" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "weaverId" TEXT,
    "notesForWeaver" TEXT,
    "colorSlipPhotoUrl" TEXT,
    "designGraphUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignLibrary_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "DesignDispatch" (
    "id" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "colorSlipImageUrl" TEXT,
    "designGraphImageUrl" TEXT,
    "batches" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SareeTypeRate" (
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "makingCharge" DECIMAL(12,2) NOT NULL,
    "retailPrice" DECIMAL(12,2) NOT NULL,
    "wholesalePrice" DECIMAL(12,2) NOT NULL,
    "stdWeightG" DECIMAL(10,2) NOT NULL,
    "warpWeightG" DECIMAL(10,2) NOT NULL,
    "reshamWeightG" DECIMAL(10,2) NOT NULL,
    "jariWeightG" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SareeTypeRate_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "talliedById" TEXT,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSareeRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "sareeId" TEXT,
    "recipientType" "RecipientType",
    "weaverId" TEXT,
    "factoryLoomId" TEXT,
    "designCode" TEXT,
    "sareeTypeCode" TEXT,
    "bulkOrderRef" TEXT,
    "qcPassed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "receivedWeight" DECIMAL(8,2),
    "receivedColor" TEXT,
    "receivedPhotoUrl" TEXT,
    "receivedWarpG" DECIMAL(8,2),
    "receivedReshamG" DECIMAL(8,2),
    "receivedJariReels" DECIMAL(8,2),
    "receivedSellingPrice" DECIMAL(12,2),
    "tallied" BOOLEAN NOT NULL DEFAULT false,
    "talliedById" TEXT,
    "talliedAt" TIMESTAMP(3),

    CONSTRAINT "BatchSareeRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialIssueRecord" (
    "id" TEXT NOT NULL,
    "weaverId" TEXT,
    "factoryLoomId" TEXT,
    "loomNumber" TEXT,
    "batchId" TEXT,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureMethod" "SignatureMethod",
    "signatureCaptured" BOOLEAN NOT NULL DEFAULT false,
    "signatureTimestamp" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "status" "MaterialIssueStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "notes" TEXT,
    "warpRequestId" TEXT,

    CONSTRAINT "MaterialIssueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialIssueItem" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "warpSubtype" "WarpSubtype",
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "jariType" TEXT,
    "jariGrade" "JariGrade",
    "jariColor" TEXT,
    "grnBatchId" TEXT,
    "grnItemId" TEXT,

    CONSTRAINT "MaterialIssueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialReturnRecord" (
    "id" TEXT NOT NULL,
    "weaverId" TEXT,
    "factoryLoomId" TEXT,
    "loomNumber" TEXT,
    "batchId" TEXT,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureMethod" "SignatureMethod",
    "signatureCaptured" BOOLEAN NOT NULL DEFAULT false,
    "signatureTimestamp" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "status" "MaterialReturnStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "deductionAmount" DECIMAL(12,2),
    "deductionReason" TEXT,
    "notes" TEXT,
    "isAutoRecorded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MaterialReturnRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "warpSubtype" "WarpSubtype",
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "jariType" TEXT,
    "jariGrade" "JariGrade",
    "jariColor" TEXT,

    CONSTRAINT "MaterialReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcRecord" (
    "id" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "weaverId" TEXT,
    "factoryLoomId" TEXT,
    "batchId" TEXT,
    "loomNumber" TEXT,
    "result" "QcResult" NOT NULL,
    "defects" TEXT[],
    "makingCharge" DECIMAL(12,2) NOT NULL,
    "deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payable" DECIMAL(12,2) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "qcDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "notes" TEXT,
    "inspectedById" TEXT NOT NULL,

    CONSTRAINT "QcRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishingStaff" (
    "id" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "specialisation" TEXT,
    "notes" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinishingStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishingAssignment" (
    "id" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "designCode" TEXT,
    "sareeType" TEXT,
    "finishingStaffId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FinishingAssignmentStatus" NOT NULL DEFAULT 'AWAITING_RETURN',
    "condition" "FinishingCondition",
    "damageType" TEXT,
    "damageSeverity" "DamageSeverity",
    "damageNotes" TEXT,
    "damagePhotoUrl" TEXT,
    "quotationRef" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinishingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "bulkOrderRef" TEXT,
    "applyGst" BOOLEAN NOT NULL DEFAULT false,
    "gstPct" DECIMAL(5,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "firmId" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'RAISED',
    "raisedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationSaree" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "finishingStatus" "QuotationSareeStatus" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationSaree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOrder" (
    "ref" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BulkOrderStatus" NOT NULL DEFAULT 'ON_TRACK',
    "sareeTypeCode" TEXT,
    "designCode" TEXT,
    "total" INTEGER NOT NULL,
    "done" INTEGER NOT NULL DEFAULT 0,
    "shortage" INTEGER NOT NULL DEFAULT 0,
    "dispatchStatus" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstCode" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "visitingCardUrl" TEXT,
    "photoUrls" TEXT[],
    "tallied" BOOLEAN NOT NULL DEFAULT false,
    "talliedBy" TEXT,
    "talliedDate" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "BulkOrder_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "DispatchRecord" (
    "id" TEXT NOT NULL,
    "type" "DispatchType" NOT NULL,
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lrNumber" TEXT,
    "transportCompany" TEXT,
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "customerId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "challanNumber" TEXT,
    "pricePerSaree" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "gstPct" DECIMAL(5,2),
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "firmId" TEXT,
    "paymentDueDate" TIMESTAMP(3),
    "bulkOrderRef" TEXT,
    "quotationRef" TEXT,
    "pendingTransport" BOOLEAN NOT NULL DEFAULT false,
    "pendingReceipt" BOOLEAN NOT NULL DEFAULT false,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "expectedDelivery" TIMESTAMP(3),
    "specialInstructions" TEXT,
    "dispatchedById" TEXT,
    "receiptStatus" "DispatchReceiptStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "DispatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchSaree" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "receiptStatus" "ShopReceiptItemStatus",
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "DispatchSaree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopReceipt" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT,
    "notes" TEXT,

    CONSTRAINT "ShopReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "status" "ShopReceiptItemStatus" NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "ShopReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryRecord" (
    "sareeId" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL,
    "rawType" "InventoryRawType" NOT NULL,
    "bulkOrderRef" TEXT,
    "batchId" TEXT,
    "quotationRef" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryRecord_pkey" PRIMARY KEY ("sareeId")
);

-- CreateTable
CREATE TABLE "Saree" (
    "id" TEXT NOT NULL,
    "origin" "SareeOrigin" NOT NULL,
    "weaverId" TEXT,
    "factoryLoomId" TEXT,
    "purchaseId" TEXT,
    "batchId" TEXT,
    "designCode" TEXT,
    "sareeTypeCode" TEXT,
    "weightG" DECIMAL(10,2),
    "costPrice" DECIMAL(12,2),
    "color" TEXT,
    "sourceName" TEXT,
    "qcDate" TIMESTAMP(3),
    "status" "SareeStatus" NOT NULL DEFAULT 'UNSOLD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Saree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleRecord" (
    "saleRef" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "channel" "SalesChannel" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "soldById" TEXT,
    "firmId" TEXT,
    "firmLinkedAt" TIMESTAMP(3),
    "firmLinkedById" TEXT,
    "firmLinkNote" TEXT,
    "firmLinkedAuto" BOOLEAN NOT NULL DEFAULT false,
    "billId" TEXT,
    "gstRate" DECIMAL(5,2),
    "gstAmount" DECIMAL(12,2),
    "customerGstin" TEXT,
    "sellerGstin" TEXT,

    CONSTRAINT "SaleRecord_pkey" PRIMARY KEY ("saleRef")
);

-- CreateTable
CREATE TABLE "ReturnRecord" (
    "returnRef" TEXT NOT NULL,
    "sareeId" TEXT NOT NULL,
    "reason" TEXT,
    "refundAmount" DECIMAL(12,2),
    "restocked" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnRecord_pkey" PRIMARY KEY ("returnRef")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "initials" TEXT,
    "shortName" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "gstCode" TEXT,
    "specialty" TEXT,
    "terms" TEXT,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifscCode" TEXT,
    "notes" TEXT,
    "visitingCardUrl" TEXT,
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "rating" INTEGER,
    "firmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utr" TEXT,
    "method" TEXT,
    "firmId" TEXT,
    "purchaseId" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "initials" TEXT,
    "shortName" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "gstCode" TEXT,
    "specialty" TEXT,
    "terms" TEXT,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifscCode" TEXT,
    "notes" TEXT,
    "visitingCardUrl" TEXT,
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sareeCount" INTEGER NOT NULL,
    "gstNumber" TEXT,
    "invoiceNumber" TEXT,
    "billAmount" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2),
    "discountType" "PurchaseDiscountType",
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PurchasePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "invoiceFileName" TEXT,
    "invoiceFileUrl" TEXT,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SareeCodeAlias" (
    "oldCode" TEXT NOT NULL,
    "newCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SareeCodeAlias_pkey" PRIMARY KEY ("oldCode")
);

-- CreateTable
CREATE TABLE "PurchaseSareeLine" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "weight" TEXT,
    "sareeDate" TIMESTAMP(3),
    "sareeType" TEXT,
    "color" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sellPercent" DECIMAL(13,8) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "finalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "imageUrl" TEXT,
    "pieceImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnedPieceNos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "PurchaseSareeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReturnRequest" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "sareeLineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "SupplierReturnStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debitNoteId" TEXT,
    "pieceNos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "approvedPieceNos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "approvedQuantity" INTEGER,

    CONSTRAINT "SupplierReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDebitNote" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "SupplierReturnStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierDebitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "totalValue" DECIMAL(12,2) NOT NULL,
    "urgency" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "firmId" TEXT,
    "grnId" TEXT,
    "grnReceiptId" TEXT,
    "actualReceivedDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBill" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "VendorBillStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "invoiceFileUrl" TEXT,
    "invoiceFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "unitPrice" DECIMAL(12,2),
    "totalPrice" DECIMAL(12,2),
    "invoicedAmount" DECIMAL(12,2),

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "requestedById" TEXT NOT NULL,
    "sareeType" TEXT,
    "quantity" INTEGER NOT NULL,
    "estimatedAmount" DECIMAL(12,2),
    "urgency" TEXT,
    "reason" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedDate" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "address" TEXT,
    "purchaseAmount" DECIMAL(14,2),
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "isRetailSalesFirm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmFinancialEntry" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "kind" "FinancialEntryKind" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FirmFinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeaverPayment" (
    "id" TEXT NOT NULL,
    "weaverId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "utrNumber" TEXT,
    "firmId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchNo" TEXT,
    "loomNumber" TEXT,
    "noOfSarees" INTEGER,
    "deduction" DECIMAL(12,2),
    "recordedById" TEXT,

    CONSTRAINT "WeaverPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utr" TEXT,
    "method" TEXT,
    "firmId" TEXT,
    "billId" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "customerId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "total" DECIMAL(12,2) NOT NULL,
    "paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dispatchId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utr" TEXT,
    "method" TEXT,
    "firmId" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstCode" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'RETAIL',
    "visitingCardUrl" TEXT,
    "whatsapp" TEXT,
    "state" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelSettings" (
    "id" TEXT NOT NULL,
    "labelSize" TEXT NOT NULL DEFAULT '50mm × 25mm (Default)',
    "showBarcode" BOOLEAN NOT NULL DEFAULT true,
    "showCode" BOOLEAN NOT NULL DEFAULT true,
    "showWeaver" BOOLEAN NOT NULL DEFAULT true,
    "showDate" BOOLEAN NOT NULL DEFAULT true,
    "showBranding" BOOLEAN NOT NULL DEFAULT true,
    "defaultPrinter" TEXT NOT NULL DEFAULT 'TSC TE244',
    "connectionType" TEXT NOT NULL DEFAULT 'USB',
    "scanShowPhoto" BOOLEAN NOT NULL DEFAULT true,
    "scanShowCode" BOOLEAN NOT NULL DEFAULT true,
    "scanShowWeaver" BOOLEAN NOT NULL DEFAULT true,
    "scanShowFabric" BOOLEAN NOT NULL DEFAULT true,
    "scanShowColour" BOOLEAN NOT NULL DEFAULT true,
    "scanShowJari" BOOLEAN NOT NULL DEFAULT true,
    "scanShowDispatchDate" BOOLEAN NOT NULL DEFAULT true,
    "scanShowProductionStatus" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "AuditStatus" NOT NULL,
    "device" TEXT,
    "duration" INTEGER,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyMeters" DOUBLE PRECISION,
    "distanceMeters" DOUBLE PRECISION,
    "geofenceDecision" "GeofenceDecision",
    "geofenceMode" "GeofenceMode",

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceSite" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 100,
    "maxAccuracyMeters" INTEGER NOT NULL DEFAULT 75,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofenceSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceRolePolicy" (
    "role" "UserRole" NOT NULL,
    "enforced" BOOLEAN NOT NULL DEFAULT true,
    "mode" "GeofenceMode" NOT NULL DEFAULT 'OBSERVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeofenceRolePolicy_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "GeofenceExemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeofenceExemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "UserRole" NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "recordLabel" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "targetType" "NotificationTargetType" NOT NULL,
    "userId" TEXT,
    "role" "UserRole",
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialStock" (
    "id" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "color" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "currentStock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(12,3) NOT NULL DEFAULT 10,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterialStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrnReceipt" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "firmId" TEXT,
    "supplierName" TEXT NOT NULL,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT,

    CONSTRAINT "GrnReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrnItem" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT,
    "grnId" TEXT NOT NULL,
    "poItemId" TEXT,
    "materialType" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "grade" TEXT,
    "color" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "rejectedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT "GrnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarpRequest" (
    "id" TEXT NOT NULL,
    "weaverId" TEXT NOT NULL,
    "loomNumber" TEXT,
    "warpType" TEXT NOT NULL,
    "lengthMeters" DECIMAL(10,2) NOT NULL,
    "color" TEXT,
    "status" "WarpRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "notes" TEXT,

    CONSTRAINT "WarpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateChangeRequest" (
    "id" TEXT NOT NULL,
    "sareeTypeCode" TEXT NOT NULL,
    "oldMakingCharge" DECIMAL(12,2) NOT NULL,
    "newMakingCharge" DECIMAL(12,2) NOT NULL,
    "oldRetailPrice" DECIMAL(12,2) NOT NULL,
    "newRetailPrice" DECIMAL(12,2) NOT NULL,
    "oldWholesalePrice" DECIMAL(12,2) NOT NULL,
    "newWholesalePrice" DECIMAL(12,2) NOT NULL,
    "status" "RateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "RateChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'XLSX',
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "deliveryHour" INTEGER NOT NULL DEFAULT 9,
    "deliveryMinute" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDownloadHistory" (
    "id" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "downloadUrl" TEXT,
    "downloadedById" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filtersUsed" JSONB,

    CONSTRAINT "ReportDownloadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "UserPermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_empId_key" ON "User"("empId");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedWeaverId_key" ON "User"("linkedWeaverId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserPortalAccess_userId_role_key" ON "UserPortalAccess"("userId", "role");

-- CreateIndex
CREATE INDEX "OtpCode_phoneNumber_idx" ON "OtpCode"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_destination_idx" ON "WhatsAppMessage"("destination");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_relatedType_relatedId_idx" ON "WhatsAppMessage"("relatedType", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "Weaver_code_key" ON "Weaver"("code");

-- CreateIndex
CREATE INDEX "Weaver_status_idx" ON "Weaver"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FactoryLoom_code_key" ON "FactoryLoom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FactoryLoom_loomNumber_key" ON "FactoryLoom"("loomNumber");

-- CreateIndex
CREATE INDEX "FactoryLoom_status_idx" ON "FactoryLoom"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSareeRow_sareeId_key" ON "BatchSareeRow"("sareeId");

-- CreateIndex
CREATE INDEX "BatchSareeRow_weaverId_idx" ON "BatchSareeRow"("weaverId");

-- CreateIndex
CREATE INDEX "BatchSareeRow_factoryLoomId_idx" ON "BatchSareeRow"("factoryLoomId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchSareeRow_batchId_serial_key" ON "BatchSareeRow"("batchId", "serial");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialIssueRecord_warpRequestId_key" ON "MaterialIssueRecord"("warpRequestId");

-- CreateIndex
CREATE INDEX "MaterialIssueRecord_weaverId_idx" ON "MaterialIssueRecord"("weaverId");

-- CreateIndex
CREATE INDEX "MaterialIssueRecord_factoryLoomId_idx" ON "MaterialIssueRecord"("factoryLoomId");

-- CreateIndex
CREATE INDEX "MaterialIssueItem_issueId_idx" ON "MaterialIssueItem"("issueId");

-- CreateIndex
CREATE INDEX "MaterialIssueItem_grnItemId_idx" ON "MaterialIssueItem"("grnItemId");

-- CreateIndex
CREATE INDEX "MaterialReturnRecord_weaverId_idx" ON "MaterialReturnRecord"("weaverId");

-- CreateIndex
CREATE INDEX "MaterialReturnRecord_factoryLoomId_idx" ON "MaterialReturnRecord"("factoryLoomId");

-- CreateIndex
CREATE INDEX "MaterialReturnItem_returnId_idx" ON "MaterialReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "QcRecord_sareeId_idx" ON "QcRecord"("sareeId");

-- CreateIndex
CREATE INDEX "QcRecord_weaverId_idx" ON "QcRecord"("weaverId");

-- CreateIndex
CREATE INDEX "QcRecord_factoryLoomId_idx" ON "QcRecord"("factoryLoomId");

-- CreateIndex
CREATE INDEX "QcRecord_result_idx" ON "QcRecord"("result");

-- CreateIndex
CREATE UNIQUE INDEX "FinishingStaff_empId_key" ON "FinishingStaff"("empId");

-- CreateIndex
CREATE UNIQUE INDEX "FinishingAssignment_sareeId_key" ON "FinishingAssignment"("sareeId");

-- CreateIndex
CREATE INDEX "FinishingAssignment_sareeId_idx" ON "FinishingAssignment"("sareeId");

-- CreateIndex
CREATE INDEX "FinishingAssignment_finishingStaffId_idx" ON "FinishingAssignment"("finishingStaffId");

-- CreateIndex
CREATE INDEX "FinishingAssignment_status_idx" ON "FinishingAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationSaree_quotationId_sareeId_key" ON "QuotationSaree"("quotationId", "sareeId");

-- CreateIndex
CREATE INDEX "BulkOrder_status_idx" ON "BulkOrder"("status");

-- CreateIndex
CREATE INDEX "BulkOrder_customerId_idx" ON "BulkOrder"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchRecord_challanNumber_key" ON "DispatchRecord"("challanNumber");

-- CreateIndex
CREATE INDEX "DispatchRecord_paymentDueDate_idx" ON "DispatchRecord"("paymentDueDate");

-- CreateIndex
CREATE INDEX "DispatchRecord_customerId_idx" ON "DispatchRecord"("customerId");

-- CreateIndex
CREATE INDEX "DispatchSaree_receiptStatus_idx" ON "DispatchSaree"("receiptStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchSaree_dispatchId_sareeId_key" ON "DispatchSaree"("dispatchId", "sareeId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopReceipt_code_key" ON "ShopReceipt"("code");

-- CreateIndex
CREATE INDEX "ShopReceipt_dispatchId_idx" ON "ShopReceipt"("dispatchId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopReceiptItem_receiptId_sareeId_key" ON "ShopReceiptItem"("receiptId", "sareeId");

-- CreateIndex
CREATE INDEX "InventoryRecord_status_idx" ON "InventoryRecord"("status");

-- CreateIndex
CREATE INDEX "Saree_status_idx" ON "Saree"("status");

-- CreateIndex
CREATE INDEX "Saree_weaverId_idx" ON "Saree"("weaverId");

-- CreateIndex
CREATE INDEX "Saree_factoryLoomId_idx" ON "Saree"("factoryLoomId");

-- CreateIndex
CREATE INDEX "SaleRecord_sareeId_idx" ON "SaleRecord"("sareeId");

-- CreateIndex
CREATE INDEX "SaleRecord_firmId_idx" ON "SaleRecord"("firmId");

-- CreateIndex
CREATE INDEX "SaleRecord_date_idx" ON "SaleRecord"("date");

-- CreateIndex
CREATE INDEX "SaleRecord_customerId_idx" ON "SaleRecord"("customerId");

-- CreateIndex
CREATE INDEX "SaleRecord_billId_idx" ON "SaleRecord"("billId");

-- CreateIndex
CREATE INDEX "ReturnRecord_sareeId_createdAt_idx" ON "ReturnRecord"("sareeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_firmId_idx" ON "Supplier"("firmId");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_purchaseId_idx" ON "SupplierPayment"("purchaseId");

-- CreateIndex
CREATE INDEX "SupplierPayment_date_idx" ON "SupplierPayment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "SareeCodeAlias_newCode_idx" ON "SareeCodeAlias"("newCode");

-- CreateIndex
CREATE INDEX "PurchaseSareeLine_purchaseId_idx" ON "PurchaseSareeLine"("purchaseId");

-- CreateIndex
CREATE INDEX "SupplierReturnRequest_status_idx" ON "SupplierReturnRequest"("status");

-- CreateIndex
CREATE INDEX "SupplierReturnRequest_purchaseId_idx" ON "SupplierReturnRequest"("purchaseId");

-- CreateIndex
CREATE INDEX "SupplierReturnRequest_supplierId_idx" ON "SupplierReturnRequest"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierReturnRequest_debitNoteId_idx" ON "SupplierReturnRequest"("debitNoteId");

-- CreateIndex
CREATE INDEX "SupplierDebitNote_status_idx" ON "SupplierDebitNote"("status");

-- CreateIndex
CREATE INDEX "SupplierDebitNote_purchaseId_idx" ON "SupplierDebitNote"("purchaseId");

-- CreateIndex
CREATE INDEX "SupplierDebitNote_supplierId_idx" ON "SupplierDebitNote"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_grnReceiptId_idx" ON "PurchaseOrder"("grnReceiptId");

-- CreateIndex
CREATE INDEX "VendorBill_vendorId_idx" ON "VendorBill"("vendorId");

-- CreateIndex
CREATE INDEX "VendorBill_poId_idx" ON "VendorBill"("poId");

-- CreateIndex
CREATE INDEX "VendorBill_status_idx" ON "VendorBill"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "Firm_isRetailSalesFirm_idx" ON "Firm"("isRetailSalesFirm");

-- CreateIndex
CREATE INDEX "FirmFinancialEntry_firmId_idx" ON "FirmFinancialEntry"("firmId");

-- CreateIndex
CREATE INDEX "FirmFinancialEntry_kind_idx" ON "FirmFinancialEntry"("kind");

-- CreateIndex
CREATE INDEX "WeaverPayment_weaverId_idx" ON "WeaverPayment"("weaverId");

-- CreateIndex
CREATE INDEX "WeaverPayment_paymentDate_idx" ON "WeaverPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_billId_idx" ON "VendorPayment"("billId");

-- CreateIndex
CREATE INDEX "VendorPayment_date_idx" ON "VendorPayment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_code_key" ON "Invoice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dispatchId_key" ON "Invoice"("dispatchId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_date_idx" ON "InvoicePayment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "Customer_type_idx" ON "Customer"("type");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "GeofenceSite_active_idx" ON "GeofenceSite"("active");

-- CreateIndex
CREATE INDEX "GeofenceExemption_userId_expiresAt_idx" ON "GeofenceExemption"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "ActionLog_userId_idx" ON "ActionLog"("userId");

-- CreateIndex
CREATE INDEX "ActionLog_module_idx" ON "ActionLog"("module");

-- CreateIndex
CREATE INDEX "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_role_idx" ON "Notification"("role");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "RawMaterialStock_materialType_idx" ON "RawMaterialStock"("materialType");

-- CreateIndex
CREATE INDEX "GrnReceipt_createdAt_idx" ON "GrnReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "GrnItem_grnId_idx" ON "GrnItem"("grnId");

-- CreateIndex
CREATE INDEX "GrnItem_poItemId_idx" ON "GrnItem"("poItemId");

-- CreateIndex
CREATE INDEX "WarpRequest_weaverId_idx" ON "WarpRequest"("weaverId");

-- CreateIndex
CREATE INDEX "WarpRequest_status_idx" ON "WarpRequest"("status");

-- CreateIndex
CREATE INDEX "RateChangeRequest_sareeTypeCode_idx" ON "RateChangeRequest"("sareeTypeCode");

-- CreateIndex
CREATE INDEX "RateChangeRequest_status_idx" ON "RateChangeRequest"("status");

-- CreateIndex
CREATE INDEX "ReportDownloadHistory_downloadedAt_idx" ON "ReportDownloadHistory"("downloadedAt");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkedWeaverId_fkey" FOREIGN KEY ("linkedWeaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPortalAccess" ADD CONSTRAINT "UserPortalAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignLibrary" ADD CONSTRAINT "DesignLibrary_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_talliedById_fkey" FOREIGN KEY ("talliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_factoryLoomId_fkey" FOREIGN KEY ("factoryLoomId") REFERENCES "FactoryLoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_designCode_fkey" FOREIGN KEY ("designCode") REFERENCES "DesignLibrary"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_sareeTypeCode_fkey" FOREIGN KEY ("sareeTypeCode") REFERENCES "SareeTypeRate"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_bulkOrderRef_fkey" FOREIGN KEY ("bulkOrderRef") REFERENCES "BulkOrder"("ref") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSareeRow" ADD CONSTRAINT "BatchSareeRow_talliedById_fkey" FOREIGN KEY ("talliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueRecord" ADD CONSTRAINT "MaterialIssueRecord_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueRecord" ADD CONSTRAINT "MaterialIssueRecord_factoryLoomId_fkey" FOREIGN KEY ("factoryLoomId") REFERENCES "FactoryLoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueRecord" ADD CONSTRAINT "MaterialIssueRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueRecord" ADD CONSTRAINT "MaterialIssueRecord_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueRecord" ADD CONSTRAINT "MaterialIssueRecord_warpRequestId_fkey" FOREIGN KEY ("warpRequestId") REFERENCES "WarpRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueItem" ADD CONSTRAINT "MaterialIssueItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "MaterialIssueRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIssueItem" ADD CONSTRAINT "MaterialIssueItem_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "GrnItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReturnRecord" ADD CONSTRAINT "MaterialReturnRecord_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReturnRecord" ADD CONSTRAINT "MaterialReturnRecord_factoryLoomId_fkey" FOREIGN KEY ("factoryLoomId") REFERENCES "FactoryLoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReturnRecord" ADD CONSTRAINT "MaterialReturnRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReturnRecord" ADD CONSTRAINT "MaterialReturnRecord_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReturnItem" ADD CONSTRAINT "MaterialReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "MaterialReturnRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_sareeId_fkey" FOREIGN KEY ("sareeId") REFERENCES "BatchSareeRow"("sareeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_factoryLoomId_fkey" FOREIGN KEY ("factoryLoomId") REFERENCES "FactoryLoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRecord" ADD CONSTRAINT "QcRecord_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingAssignment" ADD CONSTRAINT "FinishingAssignment_sareeId_fkey" FOREIGN KEY ("sareeId") REFERENCES "BatchSareeRow"("sareeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingAssignment" ADD CONSTRAINT "FinishingAssignment_finishingStaffId_fkey" FOREIGN KEY ("finishingStaffId") REFERENCES "FinishingStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingAssignment" ADD CONSTRAINT "FinishingAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingAssignment" ADD CONSTRAINT "FinishingAssignment_quotationRef_fkey" FOREIGN KEY ("quotationRef") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_bulkOrderRef_fkey" FOREIGN KEY ("bulkOrderRef") REFERENCES "BulkOrder"("ref") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSaree" ADD CONSTRAINT "QuotationSaree_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOrder" ADD CONSTRAINT "BulkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOrder" ADD CONSTRAINT "BulkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_bulkOrderRef_fkey" FOREIGN KEY ("bulkOrderRef") REFERENCES "BulkOrder"("ref") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchSaree" ADD CONSTRAINT "DispatchSaree_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "DispatchRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReceipt" ADD CONSTRAINT "ShopReceipt_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "DispatchRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReceipt" ADD CONSTRAINT "ShopReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReceiptItem" ADD CONSTRAINT "ShopReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "ShopReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRecord" ADD CONSTRAINT "InventoryRecord_bulkOrderRef_fkey" FOREIGN KEY ("bulkOrderRef") REFERENCES "BulkOrder"("ref") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRecord" ADD CONSTRAINT "InventoryRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_factoryLoomId_fkey" FOREIGN KEY ("factoryLoomId") REFERENCES "FactoryLoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_designCode_fkey" FOREIGN KEY ("designCode") REFERENCES "DesignLibrary"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saree" ADD CONSTRAINT "Saree_sareeTypeCode_fkey" FOREIGN KEY ("sareeTypeCode") REFERENCES "SareeTypeRate"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_sareeId_fkey" FOREIGN KEY ("sareeId") REFERENCES "Saree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_soldById_fkey" FOREIGN KEY ("soldById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_firmLinkedById_fkey" FOREIGN KEY ("firmLinkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRecord" ADD CONSTRAINT "ReturnRecord_sareeId_fkey" FOREIGN KEY ("sareeId") REFERENCES "Saree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseSareeLine" ADD CONSTRAINT "PurchaseSareeLine_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_sareeLineId_fkey" FOREIGN KEY ("sareeLineId") REFERENCES "PurchaseSareeLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnRequest" ADD CONSTRAINT "SupplierReturnRequest_debitNoteId_fkey" FOREIGN KEY ("debitNoteId") REFERENCES "SupplierDebitNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebitNote" ADD CONSTRAINT "SupplierDebitNote_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebitNote" ADD CONSTRAINT "SupplierDebitNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebitNote" ADD CONSTRAINT "SupplierDebitNote_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebitNote" ADD CONSTRAINT "SupplierDebitNote_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_grnReceiptId_fkey" FOREIGN KEY ("grnReceiptId") REFERENCES "GrnReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmFinancialEntry" ADD CONSTRAINT "FirmFinancialEntry_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaverPayment" ADD CONSTRAINT "WeaverPayment_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaverPayment" ADD CONSTRAINT "WeaverPayment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeaverPayment" ADD CONSTRAINT "WeaverPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "VendorBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "DispatchRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceExemption" ADD CONSTRAINT "GeofenceExemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceExemption" ADD CONSTRAINT "GeofenceExemption_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialStock" ADD CONSTRAINT "RawMaterialStock_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnReceipt" ADD CONSTRAINT "GrnReceipt_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnReceipt" ADD CONSTRAINT "GrnReceipt_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnReceipt" ADD CONSTRAINT "GrnReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnItem" ADD CONSTRAINT "GrnItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GrnReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnItem" ADD CONSTRAINT "GrnItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarpRequest" ADD CONSTRAINT "WarpRequest_weaverId_fkey" FOREIGN KEY ("weaverId") REFERENCES "Weaver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarpRequest" ADD CONSTRAINT "WarpRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateChangeRequest" ADD CONSTRAINT "RateChangeRequest_sareeTypeCode_fkey" FOREIGN KEY ("sareeTypeCode") REFERENCES "SareeTypeRate"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateChangeRequest" ADD CONSTRAINT "RateChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateChangeRequest" ADD CONSTRAINT "RateChangeRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDownloadHistory" ADD CONSTRAINT "ReportDownloadHistory_downloadedById_fkey" FOREIGN KEY ("downloadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

