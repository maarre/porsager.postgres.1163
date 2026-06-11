#!/usr/bin/env bash
set -ex
export PGPASSWORD='postgres'
psql -f sql/dog_subsidy.00000000.0000.super.baseline.sql -U postgres -w postgres
psql -f sql/dog_subsidy.00000000.0010.super.person.sql -U postgres -w dog_subsidy postgres
psql -f sql/dog_subsidy.00000000.0030.super.person_firstnames.sql -U postgres -w dog_subsidy
psql -f sql/dog_subsidy.20251027.0020.super.fn_sp.sql -U postgres -w dog_subsidy
npm install
npm run build
node dist/main.js data/*.json
