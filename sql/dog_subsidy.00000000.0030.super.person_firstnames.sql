--
-- PostgreSQL database dump
--

-- Dumped from database version 12.1
-- Dumped by pg_dump version 12.1

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

CREATE TABLE person.firstnames (
    pk smallint NOT NULL,
    first_name text NOT NULL,
    created_at timestamptz NOT NULL
);

ALTER TABLE person.firstnames OWNER TO dog_subsidy;

ALTER TABLE ONLY person.firstnames ADD CONSTRAINT firstnames_pkey PRIMARY KEY (pk);

ALTER TABLE ONLY person.firstnames ADD CONSTRAINT firstnames_natural_pk UNIQUE (first_name);

CREATE SEQUENCE person.firstnames_pk_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE person.firstnames_pk_seq OWNER TO dog_subsidy;

ALTER SEQUENCE person.firstnames_pk_seq OWNED BY person.firstnames.pk;

ALTER TABLE ONLY person.firstnames ALTER COLUMN pk SET DEFAULT nextval('person.firstnames_pk_seq'::regclass);

COMMENT ON TABLE person.firstnames IS 'The collection of all first names in the system.';
COMMENT ON COLUMN person.firstnames.pk IS 'Surrogate primary key for the table.';
COMMENT ON COLUMN person.firstnames.first_name IS 'A unique first name. The first name is any sequence of '
        'names separated by space. This could be further normalized, but programmers also have a life.';
COMMENT ON COLUMN person.firstnames.created_at IS 'Timestamp for row creation.';
COMMENT ON CONSTRAINT firstnames_pkey ON person.firstnames IS 'PK constraint.';
COMMENT ON CONSTRAINT firstnames_natural_pk ON person.firstnames IS 'The natural primary key. '
        'We accept only unique names.';
COMMENT ON SEQUENCE person.firstnames_pk_seq IS 'The sequence dedicated to creating unique primary keys for the '
        'table person.firstnames';