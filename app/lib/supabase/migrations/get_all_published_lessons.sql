-- Simple function to get all published lessons
CREATE OR REPLACE FUNCTION get_all_published_lessons()
RETURNS SETOF lessons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM lessons
  WHERE status = 'published' AND deleted_at IS NULL
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_published_lessons() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_published_lessons() TO service_role;
