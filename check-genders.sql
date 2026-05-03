-- Verificar cuántos géneros hay en BD
SELECT COUNT(*) as total_registros FROM genders;

-- Ver los géneros únicos
SELECT DISTINCT name, COUNT(*) as cantidad 
FROM genders 
GROUP BY name 
ORDER BY cantidad DESC;

-- Ver si hay valores NULL o espacios en blanco
SELECT name, LENGTH(name) as longitud
FROM genders
ORDER BY name;
