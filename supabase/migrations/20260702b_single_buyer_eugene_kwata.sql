-- Testing setup: replace the seeded 5-buyer roster with a single buyer so
-- the Buyer dashboard can be viewed end to end. Safe to re-run.
--
-- NOTE: this clears assigned_buyer_id / claimed_by / buyer_id references on
-- users, escalations, and chat_messages before deleting the old buyer rows
-- (they're foreign-keyed, so old rows can't be deleted while referenced).
-- If you already have real escalations/chat history you care about, back
-- them up first — this does not delete conversations, only unlinks which
-- buyer they were pointed at.

update users set assigned_buyer_id = null where assigned_buyer_id is not null;
update chat_messages set buyer_id = null where buyer_id is not null;
update escalations set assigned_buyer_id = null, claimed_by = null, claimed_at = null
  where assigned_buyer_id is not null or claimed_by is not null;

delete from media_buyers;

insert into media_buyers (id, email, name, first_name, initials, avatar_color, title, speciality, bio, years_exp, cal_link, regions, industries)
values (
  '22222222-0000-4000-8000-000000000001',
  'eugenemybizz@gmail.com',
  'Eugene Kwata',
  'Eugene',
  'EK',
  '#201515',
  'Media Buyer',
  'Full-service paid acquisition',
  '8 years of experience in performance media buying and paid acquisition.',
  8,
  null,
  array[]::text[],
  array[]::text[]
);
