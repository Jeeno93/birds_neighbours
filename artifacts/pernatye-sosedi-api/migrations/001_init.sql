CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  city TEXT NOT NULL DEFAULT 'Москва',
  district TEXT NOT NULL DEFAULT 'Центр',
  lat FLOAT,
  lng FLOAT,
  experience_years INT NOT NULL DEFAULT 0,
  help_status TEXT NOT NULL DEFAULT 'ready',
  sit_types TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  other_pets JSONB DEFAULT '[]',
  rating FLOAT NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  age_months INT,
  food TEXT DEFAULT '',
  schedule TEXT DEFAULT '',
  diseases TEXT[] DEFAULT '{}',
  medications TEXT DEFAULT '',
  catch_notes TEXT DEFAULT '',
  vet_notes TEXT DEFAULT '',
  sit_location TEXT DEFAULT 'flexible',
  was_examined BOOLEAN DEFAULT FALSE,
  vet_name TEXT,
  vet_contact TEXT,
  last_checkup_date TEXT,
  medication_experience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birds JSONB NOT NULL DEFAULT '[]',
  sit_type TEXT NOT NULL DEFAULT 'full',
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  district TEXT NOT NULL DEFAULT '',
  comment TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  comment TEXT DEFAULT '',
  rating INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_birds_user_id ON birds(user_id);
CREATE INDEX IF NOT EXISTS idx_sit_requests_user_id ON sit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user_id ON reviews(to_user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
