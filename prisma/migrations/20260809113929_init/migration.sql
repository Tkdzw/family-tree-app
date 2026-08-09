-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "placeholderMotherId" TEXT;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_placeholderMotherId_fkey" FOREIGN KEY ("placeholderMotherId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
