-- Setup Settings Module tables

-- 1. Create business_context table
CREATE TABLE public.business_context (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    service_objective TEXT,
    communication_tone TEXT,
    classification_rules TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for business_context
ALTER TABLE public.business_context ENABLE ROW LEVEL SECURITY;

-- Create policies for business_context
CREATE POLICY "Users can view their own business context" 
    ON public.business_context FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business context" 
    ON public.business_context FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business context" 
    ON public.business_context FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business context" 
    ON public.business_context FOR DELETE 
    USING (auth.uid() = user_id);


-- 2. Create qualification_questions table
CREATE TABLE public.qualification_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for qualification_questions
ALTER TABLE public.qualification_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for qualification_questions
CREATE POLICY "Users can view their own qualification questions" 
    ON public.qualification_questions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own qualification questions" 
    ON public.qualification_questions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own qualification questions" 
    ON public.qualification_questions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own qualification questions" 
    ON public.qualification_questions FOR DELETE 
    USING (auth.uid() = user_id);

-- Optional: Add an index on user_id for qualification_questions for performance
CREATE INDEX idx_qualification_questions_user_id ON public.qualification_questions(user_id);
