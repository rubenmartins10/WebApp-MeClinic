-- Add session tracking columns to activity_log
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records: mark all old login records as inactive
UPDATE activity_log SET is_active = FALSE WHERE action_type = 'LOGIN';

-- Index for quick active-session lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_active ON activity_log (is_active, last_seen) WHERE action_type = 'LOGIN' AND is_active = TRUE;
