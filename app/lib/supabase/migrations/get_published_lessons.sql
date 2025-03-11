-- Function to get published lessons without RLS restrictions
CREATE OR REPLACE FUNCTION get_published_lessons()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'price', l.price,
      'thumbnail_url', l.thumbnail_url,
      'creator_id', l.creator_id,
      'status', l.status,
      'created_at', l.created_at
    )
  FROM 
    lessons l
  WHERE 
    l.status = 'published' 
    AND l.deleted_at IS NULL
  ORDER BY 
    l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION get_published_lessons() TO service_role;
