/*
  Warnings:

  - Made the column `matchday` on table `football_matches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `home_team_id` on table `football_matches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `away_team_id` on table `football_matches` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."football_matches" DROP CONSTRAINT "football_matches_away_team_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."football_matches" DROP CONSTRAINT "football_matches_home_team_id_fkey";

-- AlterTable
ALTER TABLE "football_matches" ALTER COLUMN "matchday" SET NOT NULL,
ALTER COLUMN "home_team_id" SET NOT NULL,
ALTER COLUMN "away_team_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "football_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "football_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
