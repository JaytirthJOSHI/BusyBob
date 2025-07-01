-- The existing policies on 'profiles' are for SELECT and UPDATE, but a user can't
-- create their own profile upon sign-up because no INSERT policy exists that
-- would pass the RLS check.

-- This policy allows any authenticated user to insert their own profile,
-- solving the chicken-and-egg problem during sign-up. The check ensures
-- that the `id` of the new profile row matches the `id` of the user
-- performing the action.

CREATE POLICY "Allow authenticated users to insert their own profile"
ON "public"."profiles" FOR INSERT
WITH CHECK (("auth"."uid"() = "id")); 