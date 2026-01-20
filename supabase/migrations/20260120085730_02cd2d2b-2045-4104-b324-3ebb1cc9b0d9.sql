-- Fix interview_simulations RLS policies to prevent public data exposure
-- Drop existing policies and recreate with proper security

-- interview_simulations: Remove public access via NULL user_id
DROP POLICY IF EXISTS "Users can view their own interview simulations" ON public.interview_simulations;
DROP POLICY IF EXISTS "Users can update their own interview simulations" ON public.interview_simulations;
DROP POLICY IF EXISTS "Users can create interview simulations" ON public.interview_simulations;

CREATE POLICY "Users can view their own interview simulations" 
ON public.interview_simulations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview simulations" 
ON public.interview_simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create interview simulations" 
ON public.interview_simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- interview_simulation_turns: Remove public access via NULL user_id
DROP POLICY IF EXISTS "Users can view turns for their simulations" ON public.interview_simulation_turns;
DROP POLICY IF EXISTS "Users can insert turns for their simulations" ON public.interview_simulation_turns;

CREATE POLICY "Users can view turns for their simulations" 
ON public.interview_simulation_turns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM interview_simulations 
  WHERE interview_simulations.id = interview_simulation_turns.simulation_id 
  AND auth.uid() = interview_simulations.user_id
));

CREATE POLICY "Users can insert turns for their simulations" 
ON public.interview_simulation_turns 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM interview_simulations 
  WHERE interview_simulations.id = interview_simulation_turns.simulation_id 
  AND auth.uid() = interview_simulations.user_id
));

-- sales_simulations: Remove public access via NULL user_id
DROP POLICY IF EXISTS "Users can view own simulations" ON public.sales_simulations;
DROP POLICY IF EXISTS "Users can update own simulations" ON public.sales_simulations;
DROP POLICY IF EXISTS "Users can create simulations" ON public.sales_simulations;

CREATE POLICY "Users can view own simulations" 
ON public.sales_simulations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations" 
ON public.sales_simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create simulations" 
ON public.sales_simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- sales_simulation_turns: Remove public access via NULL user_id
DROP POLICY IF EXISTS "Users can view turns of own simulations" ON public.sales_simulation_turns;
DROP POLICY IF EXISTS "Users can update turns of own simulations" ON public.sales_simulation_turns;
DROP POLICY IF EXISTS "Users can create turns for own simulations" ON public.sales_simulation_turns;

CREATE POLICY "Users can view turns of own simulations" 
ON public.sales_simulation_turns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM sales_simulations 
  WHERE sales_simulations.id = sales_simulation_turns.simulation_id 
  AND auth.uid() = sales_simulations.user_id
));

CREATE POLICY "Users can update turns of own simulations" 
ON public.sales_simulation_turns 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM sales_simulations 
  WHERE sales_simulations.id = sales_simulation_turns.simulation_id 
  AND auth.uid() = sales_simulations.user_id
));

CREATE POLICY "Users can create turns for own simulations" 
ON public.sales_simulation_turns 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM sales_simulations 
  WHERE sales_simulations.id = sales_simulation_turns.simulation_id 
  AND auth.uid() = sales_simulations.user_id
));