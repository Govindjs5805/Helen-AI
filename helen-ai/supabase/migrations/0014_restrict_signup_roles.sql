create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  new_role public.user_role;
  teacher_institute text;
  teacher_place text;
begin
  new_role := case
    when requested_role in ('student', 'teacher', 'parent') then requested_role::public.user_role
    else 'student'::public.user_role
  end;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), new_role)
  on conflict (id) do nothing;

  if new_role = 'teacher' then
    teacher_institute := nullif(trim(new.raw_user_meta_data->>'institute_name'), '');
    teacher_place := nullif(trim(new.raw_user_meta_data->>'place'), '');
    if teacher_institute is null or teacher_place is null then
      raise exception 'Teacher registration requires an institute name and place';
    end if;

    insert into public.teacher_profiles (id, institute_name, place, designation)
    values (new.id, teacher_institute, teacher_place,
            nullif(trim(new.raw_user_meta_data->>'designation'), ''))
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;