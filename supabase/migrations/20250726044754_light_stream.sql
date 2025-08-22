/*
  # Fix user creation trigger

  1. Database Functions
    - `handle_new_user()` - Automatically creates user profile when auth user is created
    - `update_user_points()` - Updates user points when actions are logged

  2. Triggers
    - `on_auth_user_created` - Triggers after new auth user creation
    - `trigger_update_user_points` - Triggers after new action insertion

  3. Security
    - Functions use SECURITY DEFINER to bypass RLS for system operations
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', ''), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user points
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET points = points + NEW.points,
      updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists for updating user points
DROP TRIGGER IF EXISTS trigger_update_user_points ON public.actions;
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();