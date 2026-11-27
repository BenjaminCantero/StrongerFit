-- Eliminación de cuenta con plazo de gracia de 4 días (RF-16, CU-08, CA-09).
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);
select set_config('t.c', tests.create_user('c@test.dev')::text, true);

-- A solicita eliminar: la fecha se calcula en la base.
select tests.as_user(current_setting('t.a')::uuid);
select lives_ok($$ select public.request_account_deletion() $$, 'A pide eliminar su cuenta');
select is(
  (select scheduled_for - requested_at from public.data_requests where kind = 'delete'),
  interval '4 days', 'scheduled_for = requested_at + 4 días'
);
select is(
  public.request_account_deletion(), (select scheduled_for from public.data_requests where kind = 'delete'),
  'Pedirlo de nuevo devuelve la solicitud abierta'
);
select is((select count(*)::int from public.data_requests where kind = 'delete'), 1, 'No se duplica la solicitud abierta');
select throws_ok($$ update public.data_requests set status = 'done' $$, '42501', null, 'A no puede marcar su solicitud como hecha');
select lives_ok($$ insert into public.data_requests (kind, scheduled_for) values ('export', now()) $$, 'Pedir exportar ignora la fecha enviada');
select is((select scheduled_for from public.data_requests where kind = 'export'), null, 'Exportación sin scheduled_for');
select throws_ok(
  $$ insert into public.data_requests (kind, scheduled_for) values ('delete', now() + interval '400 days') $$,
  '23505', null, 'El cliente no elige la fecha (y sigue habiendo una abierta)'
);

-- B no ve la solicitud de A ni puede cancelarla.
select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.data_requests), 0, 'B no ve solicitudes de A');
select is(public.cancel_account_deletion(), false, 'B no cancela la solicitud de A');

-- A cancela; una segunda cancelación no cambia nada.
select tests.as_user(current_setting('t.a')::uuid);
select is(public.cancel_account_deletion(), true, 'A cancela su solicitud');
select is((select status from public.data_requests where kind = 'delete'), 'cancelled', 'Queda cancelled');
select is(public.cancel_account_deletion(), false, 'Una segunda cancelación no cambia nada');

-- Tras cancelar puede volver a pedirla.
select lives_ok($$ select public.request_account_deletion() $$, 'A puede volver a pedir eliminar');
select is((select count(*)::int from public.data_requests where kind = 'delete' and status = 'pending'), 1, 'Hay una pendiente nueva');

-- Permisos de ejecución.
select tests.as_anon();
select throws_ok($$ select public.cancel_account_deletion() $$, '42501', null, 'anon no cancela');
select throws_ok($$ select public.request_account_deletion() $$, '42501', null, 'anon no solicita');
select tests.as_user(current_setting('t.a')::uuid);
select throws_ok($$ select public.process_account_deletions() $$, '42501', null, 'authenticated no ejecuta el proceso');

-- C pide eliminar y su plazo vence; el de A (pendiente) no.
select tests.as_user(current_setting('t.c')::uuid);
select public.request_account_deletion();
select tests.as_postgres();
update public.data_requests set requested_at = now() - interval '5 days', scheduled_for = now() - interval '1 day'
where user_id = current_setting('t.c')::uuid and kind = 'delete';

select is(public.process_account_deletions(), 1, 'Se procesa solo la solicitud vencida');
select is((select count(*)::int from auth.users where id = current_setting('t.a')::uuid), 1, 'La solicitud no vencida no borra a A');
select is((select status from public.data_requests where user_id = current_setting('t.a')::uuid and kind = 'delete' and status = 'pending'), 'pending', 'La de A sigue pendiente');
select is((select count(*)::int from auth.users where id = current_setting('t.c')::uuid), 0, 'El usuario vencido se elimina');
select is(
  (select count(*)::int from public.data_requests where user_id is null and kind = 'delete' and status = 'done' and completed_at is not null),
  1, 'La solicitud queda done sin dueño como constancia (CA-09)'
);
select is(public.process_account_deletions(), 0, 'Es idempotente: sin vencidas no hace nada');

select * from finish();
rollback;
