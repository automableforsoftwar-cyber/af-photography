-- Persist AI Assistant conversations (Community + Start Learning)
-- Linked to auth user + n8n Session ID

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('community', 'learning')),
  course_id text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, scope, course_id)
);

CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('community', 'learning')),
  course_id text,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS chatbot_messages_user_session_idx
  ON public.chatbot_messages (user_id, session_id, created_at);

CREATE INDEX IF NOT EXISTS chatbot_messages_user_scope_course_idx
  ON public.chatbot_messages (user_id, scope, course_id, created_at);

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_sessions_select_own" ON public.chatbot_sessions;
CREATE POLICY "chatbot_sessions_select_own"
  ON public.chatbot_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chatbot_sessions_insert_own" ON public.chatbot_sessions;
CREATE POLICY "chatbot_sessions_insert_own"
  ON public.chatbot_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chatbot_sessions_update_own" ON public.chatbot_sessions;
CREATE POLICY "chatbot_sessions_update_own"
  ON public.chatbot_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "chatbot_messages_select_own" ON public.chatbot_messages;
CREATE POLICY "chatbot_messages_select_own"
  ON public.chatbot_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chatbot_messages_insert_own" ON public.chatbot_messages;
CREATE POLICY "chatbot_messages_insert_own"
  ON public.chatbot_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
