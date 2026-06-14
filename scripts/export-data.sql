-- ============================================================
-- EXPORT DATA - Ejecutar en proyecto VIEJO (rzsgflwlbbxzjvyegshs)
-- Ejecuta bloque por bloque, copia el resultado al proyecto NUEVO
-- ============================================================

-- 1. categories
SELECT 'INSERT INTO public.categories (id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.categories;

-- 2. brands
SELECT 'INSERT INTO public.brands (id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.brands;

-- 3. sub_categories
SELECT 'INSERT INTO public.sub_categories (id, category_id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(category_id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.sub_categories;

-- 4. sub_brands
SELECT 'INSERT INTO public.sub_brands (id, brand_id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(brand_id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.sub_brands;

-- 5. genders
SELECT 'INSERT INTO public.genders (id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.genders;

-- 6. age_groups
SELECT 'INSERT INTO public.age_groups (id, name, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal(created_at) || ');'
FROM public.age_groups;

-- 7. profiles
SELECT 'INSERT INTO public.profiles (id, nombre, telefono, direccion, is_admin, created_at, role, gender, avatar_url, img_avatar) VALUES (' || 
  quote_literal(id) || ', ' || quote_nullable(nombre) || ', ' || quote_nullable(telefono) || ', ' || 
  quote_nullable(direccion) || ', ' || COALESCE(is_admin::text, 'false') || ', ' || quote_literal(created_at) || ', ' || 
  quote_nullable(role) || ', ' || quote_nullable(gender) || ', ' || quote_nullable(avatar_url) || ', ' || 
  quote_nullable(img_avatar) || ');'
FROM public.profiles;

-- 8. products
SELECT 'INSERT INTO public.products (id, name, description, price, images, category_id, stock, active, created_at, code, brand, sub_brand, sub_category, sku, nso, precio_normal, precio_catalogo, precio_oferta, descuento_porcentaje, resumen, contenido, regalos, imagen_principal, galeria_imagenes, tags, is_pack, campaign_id, updated_at, price_before, cost, operating_cost, profit_margin, gender, age_group, seller_markup_percentage) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_nullable(description) || ', ' || 
  price || ', ' || quote_literal(images) || ', ' || quote_nullable(category_id) || ', ' || 
  stock || ', ' || active || ', ' || quote_literal(created_at) || ', ' || quote_nullable(code) || ', ' || 
  quote_nullable(brand) || ', ' || quote_nullable(sub_brand) || ', ' || quote_nullable(sub_category) || ', ' || 
  quote_nullable(sku) || ', ' || quote_nullable(nso) || ', ' || COALESCE(precio_normal::text, 'NULL') || ', ' || 
  COALESCE(precio_catalogo::text, 'NULL') || ', ' || COALESCE(precio_oferta::text, 'NULL') || ', ' || 
  COALESCE(descuento_porcentaje::text, 'NULL') || ', ' || quote_nullable(resumen) || ', ' || 
  quote_nullable(contenido) || ', ' || COALESCE(quote_literal(regalos), '''{}''') || ', ' || 
  quote_nullable(imagen_principal) || ', ' || COALESCE(quote_literal(galeria_imagenes), '''{}''') || ', ' || 
  COALESCE(quote_literal(tags), '''{}''') || ', ' || COALESCE(is_pack::text, 'false') || ', ' || 
  quote_nullable(campaign_id) || ', ' || COALESCE(quote_literal(updated_at), 'NULL') || ', ' || 
  COALESCE(price_before::text, 'NULL') || ', ' || COALESCE(cost::text, '0') || ', ' || 
  COALESCE(operating_cost::text, '0') || ', ' || COALESCE(profit_margin::text, '0') || ', ' || 
  quote_nullable(gender) || ', ' || quote_nullable(age_group) || ', ' || 
  COALESCE(seller_markup_percentage::text, '0') || ');'
FROM public.products;

-- 9. salespeople
SELECT 'INSERT INTO public.salespeople (id, user_id, name, email, phone, commission_percentage, status, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_nullable(user_id) || ', ' || quote_literal(name) || ', ' || 
  quote_nullable(email) || ', ' || quote_nullable(phone) || ', ' || COALESCE(commission_percentage::text, '10') || ', ' || 
  quote_literal(COALESCE(status, 'active')) || ', ' || quote_literal(created_at) || ');'
FROM public.salespeople;

-- 10. external_clients
SELECT 'INSERT INTO public.external_clients (id, name, email, phone, address, salesperson_id, created_at, updated_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_nullable(email) || ', ' || 
  quote_nullable(phone) || ', ' || quote_nullable(address) || ', ' || quote_nullable(salesperson_id) || ', ' || 
  quote_literal(created_at) || ', ' || COALESCE(quote_literal(updated_at), 'NULL') || ');'
FROM public.external_clients;

-- 11. orders
SELECT 'INSERT INTO public.orders (id, user_id, total, status, created_at, total_amount, channel, payment_method, payment_status, customer_name, delivery_method, shipping_amount, discount_amount, subtotal_amount, coupon_code) VALUES (' || 
  quote_literal(id) || ', ' || quote_nullable(user_id) || ', ' || COALESCE(total::text, 'NULL') || ', ' || 
  quote_literal(COALESCE(status, 'pendiente')) || ', ' || quote_literal(created_at) || ', ' || 
  COALESCE(total_amount::text, 'NULL') || ', ' || quote_nullable(channel) || ', ' || quote_nullable(payment_method) || ', ' || 
  quote_literal(COALESCE(payment_status, 'pendiente')) || ', ' || quote_nullable(customer_name) || ', ' || 
  quote_nullable(delivery_method) || ', ' || COALESCE(shipping_amount::text, 'NULL') || ', ' || 
  COALESCE(discount_amount::text, 'NULL') || ', ' || COALESCE(subtotal_amount::text, 'NULL') || ', ' || 
  quote_nullable(coupon_code) || ');'
FROM public.orders;

-- 12. landing_pages
SELECT 'INSERT INTO public.landing_pages (id, slug, title, image, product_id, active, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(slug) || ', ' || quote_literal(title) || ', ' || 
  quote_nullable(image) || ', ' || quote_nullable(product_id) || ', ' || active || ', ' || quote_literal(created_at) || ');'
FROM public.landing_pages;

-- 13. sales
SELECT 'INSERT INTO public.sales (id, salesperson_id, product_id, client_id, external_client_id, quantity, unit_price, total_amount, payment_status, payment_received, commission_status, commission_amount, notes, created_at, updated_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_nullable(salesperson_id) || ', ' || quote_nullable(product_id) || ', ' || 
  quote_nullable(client_id) || ', ' || quote_nullable(external_client_id) || ', ' || quantity || ', ' || 
  unit_price || ', ' || total_amount || ', ' || quote_literal(payment_status) || ', ' || 
  COALESCE(payment_received::text, '0') || ', ' || quote_literal(COALESCE(commission_status, 'pending')) || ', ' || 
  COALESCE(commission_amount::text, '0') || ', ' || quote_nullable(notes) || ', ' || quote_literal(created_at) || ', ' || 
  COALESCE(quote_literal(updated_at), 'NULL') || ');'
FROM public.sales;

-- 14. sales_commissions
SELECT 'INSERT INTO public.sales_commissions (id, sale_id, salesperson_id, commission_percentage, commission_amount, status, paid_at, created_at, updated_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(sale_id) || ', ' || quote_nullable(salesperson_id) || ', ' || 
  COALESCE(commission_percentage::text, '0') || ', ' || COALESCE(commission_amount::text, '0') || ', ' || 
  quote_literal(COALESCE(status, 'pending')) || ', ' || COALESCE(quote_literal(paid_at), 'NULL') || ', ' || 
  quote_literal(created_at) || ', ' || COALESCE(quote_literal(updated_at), 'NULL') || ');'
FROM public.sales_commissions;

-- 15. chat_sessions
SELECT 'INSERT INTO public.chat_sessions (id, client_id, status, lead_stage, lead_score, lead_summary, source, last_message_at, lead_name, lead_phone, lead_email, lead_interest, lead_category, lead_brand, joined_by_admin_id, joined_at, created_at, updated_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(client_id) || ', ' || quote_literal(status) || ', ' || 
  quote_literal(lead_stage) || ', ' || lead_score || ', ' || quote_nullable(lead_summary) || ', ' || 
  quote_literal(source) || ', ' || quote_literal(last_message_at) || ', ' || quote_nullable(lead_name) || ', ' || 
  quote_nullable(lead_phone) || ', ' || quote_nullable(lead_email) || ', ' || quote_nullable(lead_interest) || ', ' || 
  quote_nullable(lead_category) || ', ' || quote_nullable(lead_brand) || ', ' || quote_nullable(joined_by_admin_id) || ', ' || 
  COALESCE(quote_literal(joined_at), 'NULL') || ', ' || quote_literal(created_at) || ', ' || quote_literal(updated_at) || ');'
FROM public.chat_sessions;

-- 16. chat_messages
SELECT 'INSERT INTO public.chat_messages (id, session_id, sender, content, metadata, created_at) VALUES (' || 
  quote_literal(id) || ', ' || quote_literal(session_id) || ', ' || quote_literal(sender) || ', ' || 
  quote_literal(content) || ', ' || COALESCE(quote_literal(metadata), 'NULL') || ', ' || quote_literal(created_at) || ');'
FROM public.chat_messages;

-- 17. marketing_coupons
SELECT 'INSERT INTO public.marketing_coupons (code, description, discount_type, discount_value, min_subtotal, active, starts_at, ends_at, created_at, updated_at) VALUES (' || 
  quote_literal(code) || ', ' || quote_nullable(description) || ', ' || quote_literal(discount_type) || ', ' || 
  discount_value || ', ' || min_subtotal || ', ' || active || ', ' || 
  COALESCE(quote_literal(starts_at), 'NULL') || ', ' || COALESCE(quote_literal(ends_at), 'NULL') || ', ' || 
  quote_literal(created_at) || ', ' || quote_literal(updated_at) || ');'
FROM public.marketing_coupons;

-- 18. marketing_preheader_messages
SELECT 'INSERT INTO public.marketing_preheader_messages (message, sort_order, active, created_at, updated_at) VALUES (' || 
  quote_literal(message) || ', ' || sort_order || ', ' || active || ', ' || 
  quote_literal(created_at) || ', ' || quote_literal(updated_at) || ');'
FROM public.marketing_preheader_messages;

-- 19. amysa_cash_income
SELECT 'INSERT INTO public.amysa_cash_income (product_id, product_name, unit_type, quantity, unit_price, total, was_sold, notes, created_by, seller_id, seller_name, payment_method, shipping_method, created_at) VALUES (' || 
  quote_literal(product_id) || ', ' || quote_literal(product_name) || ', ' || quote_literal(unit_type) || ', ' || 
  quantity || ', ' || unit_price || ', ' || total || ', ' || was_sold || ', ' || quote_nullable(notes) || ', ' || 
  quote_nullable(created_by) || ', ' || quote_nullable(seller_id) || ', ' || quote_nullable(seller_name) || ', ' || 
  quote_literal(payment_method) || ', ' || quote_literal(shipping_method) || ', ' || quote_literal(created_at) || ');'
FROM public.amysa_cash_income;

-- 20. amysa_cash_expense
SELECT 'INSERT INTO public.amysa_cash_expense (concept, expense_type, amount, notes, created_by, payment_method, created_at) VALUES (' || 
  quote_literal(concept) || ', ' || quote_literal(expense_type) || ', ' || amount || ', ' || 
  quote_nullable(notes) || ', ' || quote_nullable(created_by) || ', ' || quote_literal(payment_method) || ', ' || 
  quote_literal(created_at) || ');'
FROM public.amysa_cash_expense;

-- 21. app_settings
SELECT 'INSERT INTO public.app_settings (key, value, updated_at) VALUES (' || 
  quote_literal(key) || ', ' || quote_literal(value) || ', ' || quote_literal(updated_at) || ');'
FROM public.app_settings;
