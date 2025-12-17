-- CreateTable
CREATE TABLE "EmergencyHistory" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responders" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideHistory" (
    "id" SERIAL NOT NULL,
    "guideId" TEXT NOT NULL,
    "guideTitle" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideHistory_pkey" PRIMARY KEY ("id")
);
