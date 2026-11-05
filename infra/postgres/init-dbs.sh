#!/bin/sh
# Creates prod + qa databases and least-privilege roles on first boot.
# Passwords come from the environment (env_file) — never hardcoded.
set -eu
psql -v ON_ERROR_STOP=1 --username postgres <<-SQL
	CREATE ROLE app_prod LOGIN PASSWORD '${DB_PROD_PASSWORD}';
	CREATE ROLE app_qa   LOGIN PASSWORD '${DB_QA_PASSWORD}';
	CREATE DATABASE makazoh_prod OWNER app_prod;
	CREATE DATABASE makazoh_qa   OWNER app_qa;
SQL
psql -v ON_ERROR_STOP=1 --username postgres -d makazoh_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -v ON_ERROR_STOP=1 --username postgres -d makazoh_qa   -c "CREATE EXTENSION IF NOT EXISTS postgis;"
