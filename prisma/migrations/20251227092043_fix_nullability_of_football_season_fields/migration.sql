/*
  Warnings:

  - Made the column `current_matchday` on table `football_seasons` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "football_seasons" ALTER COLUMN "current_matchday" SET NOT NULL;
