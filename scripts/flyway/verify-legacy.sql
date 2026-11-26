-- Adoption check for 20261126000100_care_portal.sql. The expected catalog
-- fingerprints are from that migration on Supabase PostgreSQL 17. They contain
-- schema and permissions only. An unknown representation requires manual review.
DO $verify_portal$
DECLARE
  previous_path text := current_setting('search_path');
  mismatches text;
BEGIN
  PERFORM set_config('search_path', 'pg_catalog', true);
  IF (SELECT count(*) FROM pg_class WHERE oid IN (to_regclass('storage.objects'), to_regclass('storage.buckets')) AND relrowsecurity) <> 2 THEN
    RAISE EXCEPTION 'Cannot adopt the portal: Storage row-level security is missing.';
  END IF;

  -- The catalog metadata is rendered with the same search path and ordering in every project.
  WITH portal_tables AS (
    SELECT c.oid, c.relname AS name, c.relrowsecurity AS rls, c.relkind
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('profiles', 'patient_intakes', 'doctor_patient_assignments')
  ), policies AS (
    SELECT * FROM pg_policies
    WHERE (schemaname = 'public' AND tablename IN (SELECT name FROM portal_tables))
       OR (schemaname = 'storage' AND tablename IN ('objects', 'buckets') AND policyname IN (
         'Only administrators manage the reports bucket', 'Authenticated portal storage',
         'Private reports require authentication', 'Care team reads private reports', 'Patients attach private reports',
         'Reports are immutable', 'Patients remove their private reports'))
  ), definitions(category, definition) AS (
    SELECT 'tables', jsonb_build_array(name, relkind, rls) FROM portal_tables
    UNION ALL
    SELECT 'columns', jsonb_build_array(t.name, a.attname, format_type(a.atttypid, a.atttypmod),
             a.attnotnull, a.attgenerated, a.attidentity, pg_get_expr(d.adbin, d.adrelid))
    FROM portal_tables t JOIN pg_attribute a ON a.attrelid=t.oid
    LEFT JOIN pg_attrdef d ON (d.adrelid,d.adnum)=(a.attrelid,a.attnum)
    WHERE a.attnum > 0 AND NOT a.attisdropped
    UNION ALL
    SELECT 'constraints', jsonb_build_array(t.name, c.contype, c.convalidated, pg_get_constraintdef(c.oid))
    FROM portal_tables t JOIN pg_constraint c ON c.conrelid=t.oid WHERE c.contype IN ('c','p','u','f')
    UNION ALL
    SELECT 'index', jsonb_build_array(i.indisvalid, pg_get_indexdef(i.indexrelid))
    FROM pg_index i WHERE i.indexrelid = to_regclass('public.doctor_patient_assignments_patient_idx')
    UNION ALL
    SELECT 'triggers', jsonb_build_array(t.tgenabled, pg_get_triggerdef(t.oid))
    FROM pg_trigger t
    WHERE (t.tgrelid=to_regclass('auth.users') AND t.tgname='create_care_profile_after_signup')
       OR (t.tgrelid=to_regclass('public.patient_intakes') AND t.tgname='stamp_care_intake_before_write')
    UNION ALL
    SELECT 'functions', jsonb_build_array(p.proname,l.lanname,p.prorettype::regtype::text,p.prosecdef,p.proconfig,
             btrim(regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g')),
             has_function_privilege('anon',p.oid,'execute'), has_function_privilege('authenticated',p.oid,'execute'))
    FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
    WHERE p.oid IN (to_regprocedure('private.create_care_profile()'), to_regprocedure('private.stamp_care_intake()'))
    UNION ALL
    SELECT 'policies', jsonb_build_array(schemaname, tablename, policyname, cmd, permissive,
             ARRAY(SELECT unnest(roles) ORDER BY 1), qual, with_check)
    FROM policies
    UNION ALL
    SELECT 'table privileges', jsonb_build_array(t.name, r, priv, has_table_privilege(r,t.oid,priv))
    FROM portal_tables t CROSS JOIN unnest(ARRAY['anon','authenticated']) r
    CROSS JOIN unnest(ARRAY['select','insert','update','delete','truncate','references','trigger']) priv
    UNION ALL
    SELECT 'column privileges', jsonb_build_array(t.name, a.attname, r, priv, has_column_privilege(r,t.oid,a.attnum,priv))
    FROM portal_tables t JOIN pg_attribute a ON a.attrelid=t.oid
    CROSS JOIN unnest(ARRAY['anon','authenticated']) r CROSS JOIN unnest(ARRAY['select','insert','update','references']) priv
    WHERE a.attnum>0 AND NOT a.attisdropped
    UNION ALL
    SELECT 'bucket', jsonb_build_array(b.id,b.name,b.public,b.file_size_limit,ARRAY(SELECT unnest(b.allowed_mime_types) ORDER BY 1))
    FROM storage.buckets b WHERE b.id='patient-reports'
  ), actual AS (
    SELECT category, md5(string_agg(definition::text, E'\n' ORDER BY definition::text COLLATE "C")) AS digest
    FROM definitions GROUP BY category
  ), expected(category,digest) AS (VALUES
    ('tables', '96f239187272951659b568f1e670a163'),
    ('columns', '7ea690768669940ed919ab5869999fc1'),
    ('constraints', '07a5ee60fb022fcc44b12f8a023fe538'),
    ('index', '151f5ec3724c40b0d07a263d3be74af1'),
    ('triggers', 'ed17f77d22344e81d273e6c09e88cb60'),
    ('functions', 'a79a6bd3eb0c4be82aa44457c0075eac'),
    ('policies', 'e84279284b35eaf7c899351d3ec07ae5'),
    ('table privileges', '7a0ab404f48be0090edfea76eb334ec6'),
    ('column privileges', '5fc36ba841bce845ddee4c100b98eaab'),
    ('bucket', 'd74812e0f5dae348379dec32cd8ef816')
  )
  SELECT string_agg(e.category, ', ' ORDER BY e.category) INTO mismatches
  FROM expected e LEFT JOIN actual a USING (category)
  WHERE a.digest IS DISTINCT FROM e.digest;

  IF mismatches IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot adopt the existing portal; baseline mismatch in: %', mismatches
      USING HINT = 'Compare these definitions with 20261126000100_care_portal.sql before retrying.';
  END IF;
  PERFORM set_config('search_path', previous_path, true);
END;
$verify_portal$;
