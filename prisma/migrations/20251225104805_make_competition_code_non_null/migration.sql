/*
  Warnings:

  - Made the column `code` on table `football_competitions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "football_competitions" ALTER COLUMN "code" SET NOT NULL;
