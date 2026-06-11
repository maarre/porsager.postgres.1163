
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE DATABASE dog_subsidy WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';
create user dog_subsidy createdb;

ALTER DATABASE dog_subsidy OWNER TO postgres;

COMMENT ON DATABASE dog_subsidy IS 'This example database is created by Swedish government Social Security Agency '
        'for educational purposes. It stores fictive information about dogs with their applied and approved subsidies. '
        'Also fictive information about people related to the dogs are stored. ';
