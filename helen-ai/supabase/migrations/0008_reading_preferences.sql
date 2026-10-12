-- Per-student reading preferences are sensitive accessibility data.
alter table public.student_profiles
  add column if not exists reading_preferences jsonb not null
  default '{
    "severity": "moderate",
    "font": "atkinson",
    "text_scale": 120,
    "letter_spacing": 0.04,
    "word_spacing": 0.12,
    "line_height": 1.75,
    "paragraph_spacing": 1.1,
    "max_line_chars": 62,
    "background_tint": "cream",
    "text_color": "#3b3b3b",
    "reading_aid": "none",
    "tts": {
      "enabled": true,
      "word_highlight": true,
      "rate": 0.9,
      "voice": "",
      "pause_seconds": 0.35
    },
    "reading_level": "auto",
    "density": "chunked"
  }'::jsonb;

comment on column public.student_profiles.reading_preferences is
  'Private, student-owned reading accessibility preferences. Share only with consent.';
