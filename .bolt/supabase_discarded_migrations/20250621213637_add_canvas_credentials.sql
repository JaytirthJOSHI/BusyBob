create table
  public.canvas_credentials (
    id bigint generated by default as identity,
    created_at timestamp with time zone not null default now(),
    user_id uuid not null,
    canvas_url text not null,
    access_token text not null,
    constraint canvas_credentials_pkey primary key (id),
    constraint canvas_credentials_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;

-- Enable Row Level Security
alter table public.canvas_credentials enable row level security;

-- Create policy for users to manage their own credentials
create policy "Allow users to manage their own Canvas credentials" on public.canvas_credentials for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);