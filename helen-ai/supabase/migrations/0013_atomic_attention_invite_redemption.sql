create or replace function public.redeem_attention_share_invite(
  p_token_hash text,
  p_recipient_user_id uuid,
  p_recipient_email text,
  p_recipient_role text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  invite_row public.attention_share_invites%rowtype;
  actual_email text;
  actual_role text;
begin
  select lower(email), role
    into actual_email, actual_role
    from public.profiles
    where id = p_recipient_user_id;

  if actual_email is null
    or actual_email <> lower(p_recipient_email)
    or actual_role <> p_recipient_role
    or actual_role not in ('parent', 'teacher') then
    return false;
  end if;

  select *
    into invite_row
    from public.attention_share_invites
    where token_hash = p_token_hash
      and lower(recipient_email) = actual_email
      and redeemed_at is null
      and revoked_at is null
      and expires_at > now()
    for update;

  if not found then
    return false;
  end if;

  if p_recipient_role = 'teacher' and not exists (
    select 1
      from public.profiles student_profile
      join public.classroom_students membership
        on membership.student_id = student_profile.student_id
      join public.classrooms classroom
        on classroom.id = membership.classroom_id
      where student_profile.id = invite_row.student_id
        and classroom.teacher_id = p_recipient_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1
      from public.attention_shares
      where student_id = invite_row.student_id
        and recipient_user_id = p_recipient_user_id
        and revoked_at is null
  ) then
    return false;
  end if;

  update public.attention_share_invites
    set redeemed_by = p_recipient_user_id, redeemed_at = now()
    where id = invite_row.id;

  insert into public.attention_shares (
    student_id, recipient_user_id, recipient_role,
    share_focus_summary, share_task_progress, share_accommodations
  ) values (
    invite_row.student_id, p_recipient_user_id, p_recipient_role,
    invite_row.share_focus_summary, invite_row.share_task_progress,
    invite_row.share_accommodations
  )
  on conflict (student_id, recipient_user_id) do update
    set recipient_role = excluded.recipient_role,
        share_focus_summary = excluded.share_focus_summary,
        share_task_progress = excluded.share_task_progress,
        share_accommodations = excluded.share_accommodations,
        created_at = now(),
        revoked_at = null;

  return true;
end;
$$;

revoke all on function public.redeem_attention_share_invite(text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.redeem_attention_share_invite(text, uuid, text, text)
  to service_role;
