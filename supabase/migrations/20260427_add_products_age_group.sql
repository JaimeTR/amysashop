alter table public.products
add column if not exists age_group text;

comment on column public.products.age_group is 'Grupo etario del producto para filtros de tienda: adultos, ninos, bebes o unisex.';

do $$
begin
  alter table public.products
    add constraint products_age_group_check
    check (age_group is null or age_group in ('adultos', 'ninos', 'bebes', 'unisex'));
exception
  when duplicate_object then null;
end $$;