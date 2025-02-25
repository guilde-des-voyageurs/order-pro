-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy for inserting sync logs
CREATE POLICY "Users can insert sync logs"
ON sync_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for updating sync logs
CREATE POLICY "Users can update their sync logs"
ON sync_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for selecting sync logs
CREATE POLICY "Users can view their sync logs"
ON sync_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sync_logs' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;
