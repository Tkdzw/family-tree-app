-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "otherNames" TEXT,
    "surname" TEXT,
    "gender" TEXT,
    "birthYear" INTEGER,
    "birthYearApprox" BOOLEAN NOT NULL DEFAULT false,
    "birthPlace" TEXT,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "deathYear" INTEGER,
    "totem" TEXT,
    "notes" TEXT,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relType" TEXT NOT NULL DEFAULT 'biological',

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Union" (
    "id" TEXT NOT NULL,
    "partnerAId" TEXT NOT NULL,
    "partnerBId" TEXT,
    "type" TEXT,
    "notes" TEXT,

    CONSTRAINT "Union_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_firstName_surname_idx" ON "Person"("firstName", "surname");

-- CreateIndex
CREATE INDEX "ParentChild_childId_idx" ON "ParentChild"("childId");

-- CreateIndex
CREATE INDEX "ParentChild_parentId_idx" ON "ParentChild"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "ParentChild"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
