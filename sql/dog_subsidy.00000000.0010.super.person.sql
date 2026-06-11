
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

CREATE SCHEMA person;

ALTER SCHEMA person OWNER TO postgres;
GRANT ALL ON SCHEMA person TO pg_database_owner;
GRANT USAGE ON SCHEMA person TO PUBLIC;

COMMENT ON SCHEMA person IS 'This schema host tables related to people.';
