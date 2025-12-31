-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('HOME', 'AWAY', 'DRAW');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'SUSPENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_competitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "area_id" INTEGER NOT NULL,
    "current_season_id" INTEGER,
    "code" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_seasons" (
    "id" SERIAL NOT NULL,
    "football_competition_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "current_matchday" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "tla" TEXT NOT NULL,
    "crest_url" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_matches" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "matchday" INTEGER NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "home_team_goals" INTEGER,
    "away_team_goals" INTEGER,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "football_season_id" INTEGER NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_bets" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "prediction" "MatchResult" NOT NULL,
    "football_match_id" INTEGER NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "match_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_users" (
    "user_id" TEXT NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "competition_users_pkey" PRIMARY KEY ("user_id","competition_id")
);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_expires_at_idx" ON "verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "football_competitions_current_season_id_key" ON "football_competitions"("current_season_id");

-- CreateIndex
CREATE UNIQUE INDEX "football_competitions_code_key" ON "football_competitions"("code");

-- CreateIndex
CREATE INDEX "football_competitions_area_id_idx" ON "football_competitions"("area_id");

-- CreateIndex
CREATE INDEX "football_competitions_code_idx" ON "football_competitions"("code");

-- CreateIndex
CREATE INDEX "football_seasons_football_competition_id_idx" ON "football_seasons"("football_competition_id");

-- CreateIndex
CREATE INDEX "football_seasons_start_date_end_date_idx" ON "football_seasons"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "football_seasons_football_competition_id_start_date_key" ON "football_seasons"("football_competition_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "football_teams_tla_key" ON "football_teams"("tla");

-- CreateIndex
CREATE INDEX "football_teams_name_idx" ON "football_teams"("name");

-- CreateIndex
CREATE INDEX "football_teams_tla_idx" ON "football_teams"("tla");

-- CreateIndex
CREATE INDEX "football_matches_season_id_idx" ON "football_matches"("season_id");

-- CreateIndex
CREATE INDEX "football_matches_date_idx" ON "football_matches"("date");

-- CreateIndex
CREATE INDEX "football_matches_status_idx" ON "football_matches"("status");

-- CreateIndex
CREATE INDEX "football_matches_home_team_id_idx" ON "football_matches"("home_team_id");

-- CreateIndex
CREATE INDEX "football_matches_away_team_id_idx" ON "football_matches"("away_team_id");

-- CreateIndex
CREATE INDEX "football_matches_matchday_idx" ON "football_matches"("matchday");

-- CreateIndex
CREATE INDEX "football_matches_date_id_idx" ON "football_matches"("date", "id");

-- CreateIndex
CREATE INDEX "football_matches_season_id_status_date_idx" ON "football_matches"("season_id", "status", "date");

-- CreateIndex
CREATE INDEX "football_matches_status_date_id_idx" ON "football_matches"("status", "date", "id");

-- CreateIndex
CREATE INDEX "football_matches_season_id_date_id_idx" ON "football_matches"("season_id", "date", "id");

-- CreateIndex
CREATE INDEX "football_matches_season_id_status_home_team_goals_away_team_idx" ON "football_matches"("season_id", "status", "home_team_goals", "away_team_goals");

-- CreateIndex
CREATE INDEX "football_matches_date_status_idx" ON "football_matches"("date", "status");

-- CreateIndex
CREATE INDEX "competitions_football_season_id_idx" ON "competitions"("football_season_id");

-- CreateIndex
CREATE INDEX "competitions_is_active_idx" ON "competitions"("is_active");

-- CreateIndex
CREATE INDEX "competitions_is_active_id_idx" ON "competitions"("is_active", "id");

-- CreateIndex
CREATE INDEX "match_bets_user_id_idx" ON "match_bets"("user_id");

-- CreateIndex
CREATE INDEX "match_bets_football_match_id_idx" ON "match_bets"("football_match_id");

-- CreateIndex
CREATE INDEX "match_bets_competition_id_idx" ON "match_bets"("competition_id");

-- CreateIndex
CREATE INDEX "match_bets_competition_id_user_id_idx" ON "match_bets"("competition_id", "user_id");

-- CreateIndex
CREATE INDEX "match_bets_user_id_competition_id_football_match_id_idx" ON "match_bets"("user_id", "competition_id", "football_match_id");

-- CreateIndex
CREATE INDEX "match_bets_competition_id_football_match_id_user_id_idx" ON "match_bets"("competition_id", "football_match_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_bets_user_id_football_match_id_competition_id_key" ON "match_bets"("user_id", "football_match_id", "competition_id");

-- CreateIndex
CREATE INDEX "competition_users_user_id_idx" ON "competition_users"("user_id");

-- CreateIndex
CREATE INDEX "competition_users_competition_id_idx" ON "competition_users"("competition_id");

-- CreateIndex
CREATE INDEX "competition_users_competition_id_is_active_idx" ON "competition_users"("competition_id", "is_active");

-- CreateIndex
CREATE INDEX "competition_users_user_id_is_active_idx" ON "competition_users"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_competitions" ADD CONSTRAINT "football_competitions_current_season_id_fkey" FOREIGN KEY ("current_season_id") REFERENCES "football_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_seasons" ADD CONSTRAINT "football_seasons_football_competition_id_fkey" FOREIGN KEY ("football_competition_id") REFERENCES "football_competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "football_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "football_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "football_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_football_season_id_fkey" FOREIGN KEY ("football_season_id") REFERENCES "football_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_bets" ADD CONSTRAINT "match_bets_football_match_id_fkey" FOREIGN KEY ("football_match_id") REFERENCES "football_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_bets" ADD CONSTRAINT "match_bets_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_bets" ADD CONSTRAINT "match_bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_users" ADD CONSTRAINT "competition_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_users" ADD CONSTRAINT "competition_users_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
