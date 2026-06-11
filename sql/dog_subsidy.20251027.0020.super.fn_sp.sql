
CREATE OR REPLACE FUNCTION person.fn_firstnames_getpk_v1(  _first_name text )
RETURNS smallint
LANGUAGE plpgsql

AS $function$
DECLARE
    _firstnames_pk smallint;
BEGIN
    SELECT pk into _firstnames_pk
    FROM person.firstnames
    WHERE  (first_name=_first_name ) ;
    RETURN _firstnames_pk;
END;
$function$;

CREATE OR REPLACE PROCEDURE person.sp_firstnames_lookup_v1( IN _first_name text,   INOUT _pk smallint,   INOUT _created_at timestamp with time zone )
LANGUAGE plpgsql

AS $procedure$
BEGIN
    SELECT  pk ,  created_at
    INTO  _pk  ,  _created_at
    FROM person.firstnames
    WHERE  (first_name=_first_name )  ;END;
$procedure$;

CREATE OR REPLACE FUNCTION person.fn_firstnames_filter_query_v1(
    _paginate boolean,
    _start integer,
    _forward boolean,
    _pagesize integer,
    _names text[],
    _conditions text[],
    _first_values text[],
    _second_values text[])
RETURNS RECORD
LANGUAGE plpgsql

AS $function$
DECLARE
    arg_counter_ int;
    query_ text;
    pk_condition_ text;
    direction_ text;
    len_ integer;
    name_ text;
    type_ text;
    condition_ text;
    first_value_ text;
    second_value_ text;
    query_parameters_ text[];
    parts_ text[];
    parts_len_ integer;
    result_ RECORD;
BEGIN
    arg_counter_ := 1;
    if _start is null then
        _start := 2147483647;
    end if;
    pk_condition_ := CASE WHEN _forward THEN ' < ' ELSE ' > ' END;
    query_ := E'SELECT  pk,  first_name,  created_at\nFROM person.firstnames\n';
    len_ := cardinality(_names);

    if _paginate then
        query_ := concat(query_, E'WHERE pk', pk_condition_, _start, E'\n');
    elsif len_ > 0 then
        query_ := concat(query_, E'WHERE ');
    end if;
    for condition_counter in 1..len_ loop
        if _paginate or condition_counter > 1 then
            query_ := concat(query_, 'AND ');
        end if;
        name_ :=  quote_ident(_names[condition_counter]);
        if name_ = 'pk' then
            type_ := 'smallint';
        elsif name_ = 'first_name' then
            type_ := 'text';
        elsif name_ = 'created_at' then
            type_ := 'timestamp with time zone';
        else
            RAISE WARNING 'Possible injection, name= %', name_;
            query_ := E'SELECT  pk,  first_name,  created_at\nFROM person.firstnames WHERE False=True\n';
            SELECT query_, query_parameters_ INTO result_;
            RETURN result_;
        end if;
        condition_ := _conditions[condition_counter];
        first_value_ := _first_values[condition_counter];
        RAISE LOG 'query_parameters_[condition_counter]: %', query_parameters_[condition_counter];
        if condition_ in ('is null', 'is not null', 'is true', 'is false') then
            query_ := concat(query_, name_, ' ', condition_, E'\n');
        elsif condition_ = 'in' then
            parts_ := string_to_array(first_value_, ',');
            parts_len_ := cardinality(parts_);
            query_ := concat(query_, name_, ' IN(');
            for part_counter in 1..parts_len_ loop
                query_parameters_ := array_append(query_parameters_, parts_[part_counter]);
                if part_counter <> 1 then
                    query_ := concat(query_, E', ');
                end if;
                if type_ = 'text' then
                    query_ := concat(query_,'$1[' , arg_counter_, E']');
                else
                    query_ := concat(query_,'CAST($1[' , arg_counter_, E'] AS ', type_, E')');
                end if;
                arg_counter_ := arg_counter_ + 1;
            end loop;
            query_ := concat(query_, E')\n');
        elsif condition_ in ('=', '<', '>', '<=','>=', '<>', 'ilike', 'not ilike', 'like', 'not like',
            'similar to', 'not similar to', 'is distinct from', 'is not distinct from', '~', '~*', '!~', '!~*') then
            query_parameters_ := array_append(query_parameters_, first_value_);
            if type_ = 'text' then
                query_ := concat(query_, name_, ' ', condition_, ' $1[' , arg_counter_, E']\n');
            else
                query_ := concat(query_, name_, ' ', condition_, ' CAST($1[' , arg_counter_, E'] AS ', type_, E')\n');
            end if;
            arg_counter_ := arg_counter_ + 1;
        elsif condition_ in ('between', 'not between') then
            second_value_ := _second_values[condition_counter];
            query_parameters_ := array_append(query_parameters_, first_value_);
            query_parameters_ := array_append(query_parameters_, second_value_);
            if type_ = 'text' then
                query_ := concat(query_, name_, E' ', condition_, E' $1[', arg_counter_, E'] AND $1[', arg_counter_+1, E']\n');
            else
                query_ := concat(query_, name_, E' ', condition_, E' CAST($1[', arg_counter_, E'] AS ', type_, E') AND CAST($1[', arg_counter_+1, E'] AS ', type_, E')\n');
            end if;
            arg_counter_ := arg_counter_ + 2;
        else
            RAISE WARNING 'Possible injection, condition= %', condition_;
            query_ := E'SELECT  pk,  first_name,  created_at\nFROM person.firstnames WHERE False=True\n';
            SELECT query_, query_parameters_ INTO result_;
            RETURN result_;
        end if;
    end loop;
    if _paginate then
        direction_ := CASE WHEN _forward THEN ' DESC ' ELSE ' ASC ' END;
        query_ := concat(query_, E'ORDER BY pk', direction_, E'LIMIT ', _pagesize, E'\n');
        if not _forward then
            query_ := concat(E'SELECT * FROM (', query_, E') TMP ORDER BY pk DESC');
        end if;
    end if;
    SELECT query_, query_parameters_ INTO result_;
    RETURN result_;
END
$function$;

CREATE OR REPLACE FUNCTION person.fn_firstnames_filter_v1(_start integer,
    _forward boolean,
    _pagesize integer,
    _names text[],
    _conditions text[],
    _first_values text[],
    _second_values text[])
RETURNS TABLE( pk smallint,  first_name text,  created_at timestamp with time zone)
LANGUAGE plpgsql

AS $function$
DECLARE
    query_ text;
    query_parameters_ text[];
BEGIN
	SELECT q, p FROM person.fn_firstnames_filter_query_v1(true, _start, _forward, _pagesize, _names, _conditions, _first_values,_second_values)
	    AS (q text, p text[]) INTO query_, query_parameters_;
    RAISE LOG 'query_parameters_: %', query_parameters_;
    RAISE LOG 'query_: %', query_;
    RETURN QUERY EXECUTE query_ USING query_parameters_;
END
$function$;

CREATE OR REPLACE FUNCTION person.fn_firstnames_select_v1(_cursor refcursor,
    _start integer,
    _forward boolean,
    _pagesize integer,
    _names text[],
    _conditions text[],
    _first_values text[],
    _second_values text[],
    _select text[])
RETURNS refcursor
LANGUAGE plpgsql

AS $function$
DECLARE
    elem_ text;
    query_ text;
	select_ text;
	first_ boolean;
    query_parameters_ text[];
BEGIN
	SELECT q, p FROM person.fn_firstnames_filter_query_v1(true, _start, _forward, _pagesize, _names, _conditions, _first_values, _second_values)
	    AS (q text, p text[]) INTO query_, query_parameters_;
	select_ := 'SELECT ';
	first_ := True;
	FOREACH elem_ IN ARRAY _select
    LOOP
		if elem_ not in ( 'pk',  'first_name',  'created_at') then
			RAISE WARNING 'possible injection: %', elem_;
			CONTINUE; -- Just ignore this column
		end if;
		if first_ then
			select_ := select_ || elem_;
			first_ := False;
		else
			select_ := select_ || ', ' || elem_;
		end if;
    END LOOP;
	select_ = select_ || E'\nFROM (' || query_ || E') sel\n';
    RAISE LOG 'query_parameters_: %', query_parameters_;
    RAISE LOG 'select_: %', select_;
    OPEN _cursor FOR EXECUTE select_ USING query_parameters_;
    RETURN _cursor;
END
$function$;

CREATE OR REPLACE FUNCTION person.fn_firstnames_aggregate_v1(
    _cursor refcursor,
    _offset integer,
    _limit integer,
    _names text[],
    _conditions text[],
    _first_values text[],
    _second_values text[],
    _groupby text[],
    _count text[],
    _avg text[],
    _max text[],
    _min text[],
    _sum text[],
    _orderby text[],
    _asc_desc text[])
RETURNS refcursor
LANGUAGE plpgsql

AS $function$
DECLARE
    arg_counter_ int;
    query_ text;
    filter_len_ integer;
    name_ text;
    quoted_name_ text;
    type_ text;
    condition_ text;
    value_ text;
    filter_ text;
    query_parameters_ text[];
    parts_ text[];
    parts_len_ integer;
    group_by_len_     integer;
    order_by_len_     integer;
    asc_desc_len_     integer;
    asc_desc_         text;
    first_            boolean;
BEGIN
    arg_counter_ := 1;
    query_ := E'SELECT ';
    group_by_len_ := cardinality(_groupby);
    first_ := true;
    for group_counter in 1..group_by_len_ loop
        name_ := _groupby[group_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        if first_ then
            query_ := concat(query_, quoted_name_);
            first_ := false;
        else
            query_ := concat(query_, E', ', quoted_name_);
        end if;
    end loop;
    for cnt_counter in 1..cardinality(_count) loop
        name_ := _count[cnt_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        query_ := concat(query_, E', count(', quoted_name_, E') as ', quote_ident(concat(name_, '_cnt')));
    end loop;
    for avg_counter in 1..cardinality(_avg) loop
        name_ := _avg[avg_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        query_ := concat(query_, E', avg(', quoted_name_, E') as ', quote_ident(concat(name_, '_avg')));
    end loop;
    for max_counter in 1..cardinality(_max) loop
        name_ := _max[max_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        query_ := concat(query_, E', max(', quoted_name_, E') as ', quote_ident(concat(name_, '_max')));
    end loop;
    for min_counter in 1..cardinality(_min) loop
        name_ := _min[min_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        query_ := concat(query_, E', min(', quoted_name_, E') as ', quote_ident(concat(name_, '_min')));
    end loop;
    for sum_counter in 1..cardinality(_sum) loop
        name_ := _sum[sum_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        query_ := concat(query_, E', sum(', quoted_name_, E') as ', quote_ident(concat(name_, '_sum')));
    end loop;
    query_ := concat(query_, E'\nFROM (\n');

    SELECT q, p FROM person.fn_firstnames_filter_query_v1(false, 0, true, 0, _names, _conditions, _first_values, _second_values)
	    AS (q text, p text[]) INTO filter_, query_parameters_;

    query_ := query_ || filter_ || E') filter\n';
    query_ := query_ || E'GROUP BY ';
    first_ := true;
    for group_counter in 1..group_by_len_ loop
        name_ = _groupby[group_counter];
        if name_ !~* '^(pk|first_name|created_at)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        if first_ then
            query_ := concat(query_, quoted_name_);
            first_ := false;
        else
            query_ := concat(query_, E', ', quoted_name_);
        end if;
    end loop;
    order_by_len_ := cardinality(_orderby);
    asc_desc_len_ := cardinality(_asc_desc);
    for order_counter in 1..order_by_len_ loop
        name_ := _orderby[order_counter];
        if name_ !~* '^(pk|first_name|created_at|pk_cnt|first_name_cnt|created_at_cnt|pk_avg|first_name_avg|created_at_avg|pk_max|first_name_max|created_at_max|pk_min|first_name_min|created_at_min|pk_sum|first_name_sum|created_at_sum)$' then
            RAISE WARNING 'Possible injection, name= %', name_;
            continue;
        end if;
        quoted_name_ := quote_ident(name_);
        if order_counter = 1 then
            query_ := concat(query_, E'\nORDER BY ', quoted_name_);
        else
            query_ := concat(query_, E', ', quoted_name_);
        end if;
        if order_counter <= asc_desc_len_ then
            asc_desc_ := _asc_desc[order_counter];
            if char_length(asc_desc_) > 0 and asc_desc_ !~* 'asc|desc' then
                RAISE EXCEPTION 'Possible injection: %', asc_desc_;
            end if;
            query_ := concat(query_, E' ', asc_desc_);
        end if;
    end loop;
    query_ := concat(query_, E'\nLIMIT ', _limit, ' OFFSET ', _offset, E'\n;');
    RAISE LOG 'query_: %', query_;
    OPEN _cursor FOR EXECUTE query_ USING query_parameters_;
    RETURN _cursor;
END
$function$;

CREATE OR REPLACE PROCEDURE person.sp_firstnames_create_v1( OUT _pk smallint,   IN _first_name text,   IN _created_at timestamp with time zone = null  )
LANGUAGE plpgsql

AS $procedure$
DECLARE
    pk_ smallint;
    created_at_ timestamp with time zone;
BEGIN
    if _created_at is null then
        _created_at = NOW();
    end if;
    if  _first_name is null  then
        _pk = NULL;
    else
        CALL person.sp_firstnames_lookup_v1(_first_name, pk_, created_at_);
        if pk_ is null then
            INSERT INTO person.firstnames (first_name , created_at)
            VALUES(_first_name,_created_at)
            RETURNING pk INTO _pk;
        else
            _pk := pk_;
        end if;
    end if;
END;
$procedure$;
