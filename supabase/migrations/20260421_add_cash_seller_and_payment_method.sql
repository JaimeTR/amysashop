-- Caja AMYSA: agregar vendedor y metodo de pago/gasto

alter table if exists public.amysa_cash_income
  add column if not exists seller_id text,
  add column if not exists seller_name text,
  add column if not exists payment_method text not null default 'efectivo';

alter table if exists public.amysa_cash_expense
  add column if not exists payment_method text not null default 'efectivo';

create index if not exists idx_amysa_cash_income_seller_id
  on public.amysa_cash_income (seller_id);

create index if not exists idx_amysa_cash_income_payment_method
  on public.amysa_cash_income (payment_method);

create index if not exists idx_amysa_cash_expense_payment_method
  on public.amysa_cash_expense (payment_method);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'amysa_cash_income_payment_method_check'
      and conrelid = 'public.amysa_cash_income'::regclass
  ) then
    alter table public.amysa_cash_income
      add constraint amysa_cash_income_payment_method_check
      check (payment_method in ('efectivo', 'yape', 'transferencia', 'tarjeta_credito', 'plin', 'otro'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'amysa_cash_expense_payment_method_check'
      and conrelid = 'public.amysa_cash_expense'::regclass
  ) then
    alter table public.amysa_cash_expense
      add constraint amysa_cash_expense_payment_method_check
      check (payment_method in ('efectivo', 'yape', 'transferencia', 'tarjeta_credito', 'plin', 'otro'));
  end if;
end
$$;
