import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { requireAdminUser } from "@/lib/admin";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
    t?: string;
  };
};

type ProductCatalogRow = {
  id: string;
  active: boolean;
  stock: number;
};

type BrandRow = {
  id: string;
  name: string;
};

type SubBrandRow = {
  id: string;
  name: string;
  brand_id: string;
};

type SubCategoryRow = {
  id: string;
  name: string;
  category_id: string;
};

async function createCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/admin/tienda?error=Ingresa+nombre+de+categoría");
  }

  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Categoría+creada+correctamente");
}

async function updateCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+categoría");
  }

  const { error } = await supabase.from("categories").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Categoría+actualizada+correctamente&t=${Date.now()}#category-${id}`);
}

async function deleteCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Categoría+inválida");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Categoría+eliminada+correctamente");
}

async function createBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/admin/tienda?error=Ingresa+nombre+de+marca");
  }

  const { error } = await supabase.from("brands").upsert({ name }, { onConflict: "name", ignoreDuplicates: true });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Marca+registrada+correctamente");
}

async function updateBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+marca");
  }

  const { error } = await supabase.from("brands").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Marca+actualizada+correctamente&t=${Date.now()}#brand-${id}`);
}

async function deleteBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Marca+inválida");
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Marca+eliminada+correctamente");
}

async function createSubBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const brandId = String(formData.get("brandId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!brandId || !name) {
    redirect("/admin/tienda?error=Selecciona+marca+y+escribe+submarca");
  }

  const { error } = await supabase
    .from("sub_brands")
    .upsert({ brand_id: brandId, name }, { onConflict: "brand_id,name", ignoreDuplicates: true });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Submarca+registrada+correctamente");
}

async function updateSubBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+submarca");
  }

  const { error } = await supabase.from("sub_brands").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Submarca+actualizada+correctamente&t=${Date.now()}#subbrand-${id}`);
}

async function deleteSubBrandAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Submarca+inválida");
  }

  const { error } = await supabase.from("sub_brands").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Submarca+eliminada+correctamente");
}

async function createSubCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!categoryId || !name) {
    redirect("/admin/tienda?error=Selecciona+categoría+y+escribe+subcategoría");
  }

  const { error } = await supabase
    .from("sub_categories")
    .upsert({ category_id: categoryId, name }, { onConflict: "category_id,name", ignoreDuplicates: true });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Subcategoría+registrada+correctamente");
}

async function updateSubCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+subcategoría");
  }

  const { error } = await supabase.from("sub_categories").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Subcategoría+actualizada+correctamente&t=${Date.now()}#subcategory-${id}`);
}

async function deleteSubCategoryAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Subcategoría+inválida");
  }

  const { error } = await supabase.from("sub_categories").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Subcategoría+eliminada+correctamente");
}

async function createGenderAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/admin/tienda?error=Ingresa+nombre+de+género");
  }

  const { error } = await supabase.from("genders").upsert({ name }, { onConflict: "name", ignoreDuplicates: true });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Género+registrado+correctamente");
}

async function updateGenderAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+género");
  }

  const { error } = await supabase.from("genders").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Género+actualizado+correctamente&t=${Date.now()}#gender-${id}`);
}

async function deleteGenderAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Género+inválido");
  }

  const { error } = await supabase.from("genders").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Género+eliminado+correctamente");
}

async function createAgeGroupAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/admin/tienda?error=Ingresa+nombre+de+grupo+de+edad");
  }

  const { error } = await supabase.from("age_groups").upsert({ name }, { onConflict: "name", ignoreDuplicates: true });

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Grupo+de+edad+registrado+correctamente");
}

async function updateAgeGroupAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!id || !name) {
    redirect("/admin/tienda?error=Completa+los+datos+de+grupo+de+edad");
  }

  const { error } = await supabase.from("age_groups").update({ name }).eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect(`/admin/tienda?ok=Grupo+de+edad+actualizado+correctamente&t=${Date.now()}#agegroup-${id}`);
}

async function deleteAgeGroupAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("store.manage");
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/tienda?error=Grupo+de+edad+inválido");
  }

  const { error } = await supabase.from("age_groups").delete().eq("id", id);

  if (error) {
    redirect(`/admin/tienda?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tienda");
  redirect("/admin/tienda?ok=Grupo+de+edad+eliminado+correctamente");
}

export default async function AdminTiendaPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdminUser("store.manage");

  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("id,name").order("name", { ascending: true }),
    supabase.from("products").select("id,active,stock").order("created_at", { ascending: false }).limit(1500),
  ]);

  // Intentar cargar tablas maestras, fallback si no existen
  const brandsResult = await supabase.from("brands").select("id,name").order("name", { ascending: true });
  const subBrandsResult = await supabase.from("sub_brands").select("id,name,brand_id").order("name", { ascending: true });
  const subCategoriesResult = await supabase.from("sub_categories").select("id,name,category_id").order("name", { ascending: true });

  const categories = categoriesResult.data || [];
  const products = (productsResult.data || []) as ProductCatalogRow[];
  const brands = !brandsResult.error && brandsResult.data ? (brandsResult.data as BrandRow[]) : [];
  const subBrands = !subBrandsResult.error && subBrandsResult.data ? (subBrandsResult.data as SubBrandRow[]) : [];
  const subCategories = !subCategoriesResult.error && subCategoriesResult.data ? (subCategoriesResult.data as SubCategoryRow[]) : [];
  const gendersResult = await supabase.from("genders").select("id,name").order("name", { ascending: true });
  const ageGroupsResult = await supabase.from("age_groups").select("id,name").order("name", { ascending: true });
  const genders = !gendersResult.error && gendersResult.data ? (gendersResult.data as { id: string; name: string }[]) : [];
  const ageGroups = !ageGroupsResult.error && ageGroupsResult.data ? (ageGroupsResult.data as { id: string; name: string }[]) : [];

  const activeCount = products.filter((item) => item.active).length;

  const subBrandsByBrandId = new Map<string, SubBrandRow[]>();
  for (const subBrand of subBrands) {
    const list = subBrandsByBrandId.get(subBrand.brand_id) || [];
    list.push(subBrand);
    subBrandsByBrandId.set(subBrand.brand_id, list);
  }

  for (const [brandId, list] of Array.from(subBrandsByBrandId.entries())) {
    subBrandsByBrandId.set(
      brandId,
      [...list].sort((a, b) => a.name.localeCompare(b.name, "es"))
    );
  }

  const subCategoriesByCategoryId = new Map<string, SubCategoryRow[]>();
  for (const subCategory of subCategories) {
    const list = subCategoriesByCategoryId.get(subCategory.category_id) || [];
    list.push(subCategory);
    subCategoriesByCategoryId.set(subCategory.category_id, list);
  }

  for (const [categoryId, list] of Array.from(subCategoriesByCategoryId.entries())) {
    subCategoriesByCategoryId.set(
      categoryId,
      [...list].sort((a, b) => a.name.localeCompare(b.name, "es"))
    );
  }

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <h1 className="font-[var(--font-display)] text-3xl">Gestión de tienda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registra estructura comercial persistente: marcas con submarcas y categorías con subcategorías.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subcategorías</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{subCategories.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Marcas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{brands.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submarcas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{subBrands.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Productos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{activeCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {/* COLUMNA IZQUIERDA: CATEGORÍAS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Nueva categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createCategoryAction} className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                name="name"
                placeholder="Nombre de categoría"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <Button type="submit">Crear categoría</Button>
            </form>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay categorías registradas.</p>
              ) : (
                categories.map((category) => (
                  <article id={`category-${category.id}`} key={category.id} className="rounded-xl border bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border bg-white/80 px-3 py-1 text-sm font-medium">{category.name}</span>
                      <div className="flex items-center gap-1">
                        <details className="group" key={`${category.id}-${searchParams?.ok || ""}-${searchParams?.error || ""}-${searchParams?.t || ""}`}>
                          <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                            <span className="inline-flex items-center gap-1">
                              <Pencil className="size-3.5" />
                              Editar
                            </span>
                          </summary>
                          <form action={updateCategoryAction} className="mt-2 flex items-center gap-2">
                            <input type="hidden" name="id" value={category.id} />
                            <input
                              name="name"
                              defaultValue={category.name}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              required
                            />
                            <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                          </form>
                        </details>
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={category.id} />
                          <Button type="submit" size="icon" variant="ghost" className="size-8 text-destructive-foreground hover:bg-destructive/10" aria-label="Eliminar categoría">
                            <X className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: SUBCATEGORÍAS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Subcategoría bajo categoría padre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createSubCategoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <select name="categoryId" className="h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                <option value="">Selecciona categoría padre</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                name="name"
                placeholder="Nombre de subcategoría"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <Button type="submit">Agregar</Button>
            </form>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay categorías registradas.</p>
              ) : (
                categories.map((category) => {
                  const categorySubCategories = subCategoriesByCategoryId.get(category.id) || [];

                  return (
                    <article key={category.id} className="rounded-xl border bg-white/70 p-3 text-sm">
                      <p className="mb-2 font-semibold">{category.name}</p>
                      {categorySubCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin subcategorías registradas.</p>
                      ) : (
                        <div className="space-y-2">
                          {categorySubCategories.map((subCategory) => (
                            <div id={`subcategory-${subCategory.id}`} key={subCategory.id} className="rounded-lg border bg-white/80 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium">{subCategory.name}</span>
                                <div className="flex items-center gap-1">
                                  <details className="group" key={`${subCategory.id}-${searchParams?.ok || ""}-${searchParams?.error || ""}-${searchParams?.t || ""}`}>
                                    <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                                      <span className="inline-flex items-center gap-1">
                                        <Pencil className="size-3.5" />
                                        Editar
                                      </span>
                                    </summary>
                                    <form action={updateSubCategoryAction} className="mt-2 flex items-center gap-2">
                                      <input type="hidden" name="id" value={subCategory.id} />
                                      <input
                                        name="name"
                                        defaultValue={subCategory.name}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                        required
                                      />
                                      <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                                    </form>
                                  </details>
                                  <form action={deleteSubCategoryAction}>
                                    <input type="hidden" name="id" value={subCategory.id} />
                                    <Button
                                      type="submit"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 text-destructive-foreground hover:bg-destructive/10"
                                      aria-label="Eliminar subcategoría"
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {/* COLUMNA IZQUIERDA: MARCAS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Nueva marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createBrandAction} className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                name="name"
                placeholder="Nombre de marca"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <Button type="submit">Crear marca</Button>
            </form>

            <div className="space-y-2">
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay marcas registradas.</p>
              ) : (
                brands.map((brand) => (
                  <article id={`brand-${brand.id}`} key={brand.id} className="rounded-xl border bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border bg-white/80 px-3 py-1 text-sm font-medium">{brand.name}</span>
                      <div className="flex items-center gap-1">
                        <details className="group" key={`${brand.id}-${searchParams?.ok || ""}-${searchParams?.error || ""}-${searchParams?.t || ""}`}>
                          <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                            <span className="inline-flex items-center gap-1">
                              <Pencil className="size-3.5" />
                              Editar
                            </span>
                          </summary>
                          <form action={updateBrandAction} className="mt-2 flex items-center gap-2">
                            <input type="hidden" name="id" value={brand.id} />
                            <input
                              name="name"
                              defaultValue={brand.name}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              required
                            />
                            <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                          </form>
                        </details>
                        <form action={deleteBrandAction}>
                          <input type="hidden" name="id" value={brand.id} />
                          <Button type="submit" size="icon" variant="ghost" className="size-8 text-destructive-foreground hover:bg-destructive/10" aria-label="Eliminar marca">
                            <X className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: SUBMARCAS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Submarca bajo marca padre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createSubBrandAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <select name="brandId" className="h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                <option value="">Selecciona marca padre</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <input
                name="name"
                placeholder="Nombre de submarca"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <Button type="submit">Agregar</Button>
            </form>

            <div className="space-y-2">
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay marcas registradas.</p>
              ) : (
                brands.map((brand) => {
                  const brandSubBrands = subBrandsByBrandId.get(brand.id) || [];

                  return (
                    <article key={brand.id} className="rounded-xl border bg-white/70 p-3 text-sm">
                      <p className="mb-2 font-semibold">{brand.name}</p>
                      {brandSubBrands.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin submarcas registradas.</p>
                      ) : (
                        <div className="space-y-2">
                          {brandSubBrands.map((subBrand) => (
                            <div id={`subbrand-${subBrand.id}`} key={subBrand.id} className="rounded-lg border bg-white/80 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium">{subBrand.name}</span>
                                <div className="flex items-center gap-1">
                                  <details className="group" key={`${subBrand.id}-${searchParams?.ok || ""}-${searchParams?.error || ""}-${searchParams?.t || ""}`}>
                                    <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                                      <span className="inline-flex items-center gap-1">
                                        <Pencil className="size-3.5" />
                                        Editar
                                      </span>
                                    </summary>
                                    <form action={updateSubBrandAction} className="mt-2 flex items-center gap-2">
                                      <input type="hidden" name="id" value={subBrand.id} />
                                      <input
                                        name="name"
                                        defaultValue={subBrand.name}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                        required
                                      />
                                      <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                                    </form>
                                  </details>
                                  <form action={deleteSubBrandAction}>
                                    <input type="hidden" name="id" value={subBrand.id} />
                                    <Button
                                      type="submit"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 text-destructive-foreground hover:bg-destructive/10"
                                      aria-label="Eliminar submarca"
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {/* COLUMNA IZQUIERDA: GÉNEROS */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Géneros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createGenderAction} className="flex gap-2">
              <input name="name" placeholder="Nombre de género" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" required />
              <Button type="submit">Crear</Button>
            </form>

            <div className="space-y-2">
              {genders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay géneros registrados.</p>
              ) : (
                genders.map((g) => (
                  <article id={`gender-${g.id}`} key={g.id} className="rounded-xl border bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border bg-white/80 px-3 py-1 text-sm font-medium">{g.name}</span>
                      <div className="flex items-center gap-1">
                        <details className="group">
                          <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                            <span className="inline-flex items-center gap-1"><Pencil className="size-3.5"/> Editar</span>
                          </summary>
                          <form action={updateGenderAction} className="mt-2 flex items-center gap-2">
                            <input type="hidden" name="id" value={g.id} />
                            <input name="name" defaultValue={g.name} className="h-8 rounded-md border border-input bg-background px-2 text-xs" required />
                            <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                          </form>
                        </details>
                        <form action={deleteGenderAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <Button type="submit" size="icon" variant="ghost" className="size-8 text-destructive-foreground hover:bg-destructive/10" aria-label="Eliminar género">
                            <X className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: GRUPOS DE EDAD */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Grupos de Edad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createAgeGroupAction} className="flex gap-2">
              <input name="name" placeholder="Nombre de grupo de edad" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" required />
              <Button type="submit">Crear</Button>
            </form>

            <div className="space-y-2">
              {ageGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay grupos de edad registrados.</p>
              ) : (
                ageGroups.map((a) => (
                  <article id={`agegroup-${a.id}`} key={a.id} className="rounded-xl border bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border bg-white/80 px-3 py-1 text-sm font-medium">{a.name}</span>
                      <div className="flex items-center gap-1">
                        <details className="group">
                          <summary className="list-none cursor-pointer rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground hover:bg-accent group-open:hidden">
                            <span className="inline-flex items-center gap-1"><Pencil className="size-3.5"/> Editar</span>
                          </summary>
                          <form action={updateAgeGroupAction} className="mt-2 flex items-center gap-2">
                            <input type="hidden" name="id" value={a.id} />
                            <input name="name" defaultValue={a.name} className="h-8 rounded-md border border-input bg-background px-2 text-xs" required />
                            <Button type="submit" size="sm" className="h-8 px-2 text-xs">Guardar</Button>
                          </form>
                        </details>
                        <form action={deleteAgeGroupAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <Button type="submit" size="icon" variant="ghost" className="size-8 text-destructive-foreground hover:bg-destructive/10" aria-label="Eliminar grupo de edad">
                            <X className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
