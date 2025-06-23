/*
  # Kid Mode Feature

  1. New table for kid mode settings
    - `kid_mode_settings` - Stores kid mode state, DOB, and admin verification

  2. Security
    - Enable RLS on kid_mode_settings table
    - Add policies for authenticated users to manage their own settings

  3. Features
    - Date of birth tracking
    - Kid mode toggle with admin code protection
    - Auto-disable at 13 years old
*/

-- Add date_of_birth to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS kid_mode_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS kid_mode_admin_code text DEFAULT '0013';

-- Create kid_mode_settings table for additional settings
CREATE TABLE IF NOT EXISTS kid_mode_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  date_of_birth date,
  admin_code text DEFAULT '0013',
  enabled_at timestamptz,
  disabled_at timestamptz,
  auto_disabled_at_13 boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kid_mode_settings ENABLE ROW LEVEL SECURITY;

-- Kid mode settings policies
CREATE POLICY "Users can read own kid mode settings"
  ON kid_mode_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own kid mode settings"
  ON kid_mode_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own kid mode settings"
  ON kid_mode_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own kid mode settings"
  ON kid_mode_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kid_mode_settings_user_id ON kid_mode_settings(user_id);

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date date)
RETURNS integer AS $$
BEGIN
  RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- Function to check if kid mode should auto-disable
CREATE OR REPLACE FUNCTION check_kid_mode_auto_disable()
RETURNS trigger AS $$
BEGIN
  -- If user is 13 or older and kid mode is enabled, auto-disable it
  IF NEW.date_of_birth IS NOT NULL AND NEW.enabled = true THEN
    IF calculate_age(NEW.date_of_birth) >= 13 THEN
      NEW.enabled := false;
      NEW.disabled_at := now();
      NEW.auto_disabled_at_13 := true;
      
      -- Also update the users table
      UPDATE users 
      SET kid_mode_enabled = false 
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-disable kid mode at 13
CREATE TRIGGER kid_mode_auto_disable_trigger
  BEFORE INSERT OR UPDATE ON kid_mode_settings
  FOR EACH ROW
  EXECUTE FUNCTION check_kid_mode_auto_disable();

-- Function to sync kid_mode_settings with users table
CREATE OR REPLACE FUNCTION sync_users_kid_mode()
RETURNS trigger AS $$
BEGIN
  -- Update users table when kid_mode_settings changes
  UPDATE users 
  SET 
    kid_mode_enabled = NEW.enabled,
    date_of_birth = NEW.date_of_birth
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync with users table
CREATE TRIGGER sync_users_kid_mode_trigger
  AFTER INSERT OR UPDATE ON kid_mode_settings
  FOR EACH ROW
  EXECUTE FUNCTION sync_users_kid_mode(); 