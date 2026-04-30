"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ChangeEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  Home,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AmysaAssistantWidget } from "@/components/chat/amysa-assistant-widget";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import {
  getPermissionLabel,
  getPermissionsForRole,
  getRoleLabel,
  resolveRoleFromContext,
  type AccessRole,
} from "@/lib/access-control";
import type { NavProduct } from "@/lib/types";

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueLabels(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;

    const key = normalizeLabel(label);
    if (!seen.has(key)) {
      seen.set(key, label);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    nombre?: string;
    role?: string;
  };
};

type MainNavProps = {
  products: NavProduct[];
};

type ProfileData = {
  nombre: string;
  telefono: string;
  direccion: string;
  gender: string;
  avatar_url: string;
};

const mobileLinks = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/tienda", label: "Tienda", icon: Store },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart },
  { href: "/perfil", label: "Perfil", icon: User },
];

const fallbackPreheaderMessages = [
  "CUPON DE APERTURA: AMYSA2026",
  "PROMOCIONES DIA DE LA MADRE - COMPRA HOY",
  "ENVIO RAPIDO Y ATENCION PERSONALIZADA",
  "NUEVOS INGRESOS TODAS LAS SEMANAS",
  "APROVECHA OFERTAS EXCLUSIVAS ONLINE",
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getProductSearchText(product: NavProduct) {
  return [
    product.name,
    product.category,
    product.brand,
    product.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProductImage(product: NavProduct) {
  return product.images[0] || "/placeholder-product.svg";
}

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 3v9.2a4.8 4.8 0 1 1-4.2-4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 3c.7 2.5 2.4 4 5 4v3.3c-2.1 0-3.9-.7-5-1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 11.9A8 8 0 0 1 8.3 18.8L4 20l1.3-4.2A8 8 0 1 1 20 11.9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.2c.2-.4.5-.6.9-.6h.6c.4 0 .7.3.8.6l.5 1.5c.1.3 0 .7-.2.9l-.6.6c.4.9 1.1 1.7 2 2.2l.6-.6c.2-.2.6-.3.9-.2l1.5.5c.4.1.6.4.6.8v.6c0 .4-.2.7-.6.9-.6.3-1.3.4-2 .2-1.6-.4-3.7-1.8-5-3.1-1.3-1.4-2.7-3.5-3.1-5-.2-.7-.1-1.4.2-2 .2-.4.5-.6.9-.6h.6c.4 0 .7.2.8.6l.5 1.5c.1.3 0 .7-.2.9l-.6.6c.5.9 1.3 1.6 2.2 2l.6-.6c.2-.2.6-.3.9-.2l1.5.5c.4.1.6.4.6.8v.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MainNav({ products }: MainNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "51975646074";
  const whatsappDisplayPhone = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY_PHONE || "965 312 386";
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/amysa.shop/";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL || "http://tiktok.com/@amysa.shop";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nombre: "",
    telefono: "",
    direccion: "",
    gender: "",
    avatar_url: "",
  });
  const [profileDraft, setProfileDraft] = useState<ProfileData>({
    nombre: "",
    telefono: "",
    direccion: "",
    gender: "",
    avatar_url: "",
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [preheaderMessageIndex, setPreheaderMessageIndex] = useState(0);
  const [preheaderMessages, setPreheaderMessages] = useState<string[]>(fallbackPreheaderMessages);
  const deferredQuery = useDeferredValue(searchQuery);
  const cartItems = useCartStore((state) => state.items);
  const favoriteItems = useFavoritesStore((state) => state.items);

  const isAdminRoute = pathname.startsWith("/admin");
  const allowedAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL || "jaimetr1309@gmail.com")
    .trim()
    .toLowerCase();

  const role: AccessRole = resolveRoleFromContext({
    email: user?.email,
    metadataRole: user?.user_metadata?.role,
    superAdminEmail: allowedAdminEmail,
  });
  const accessLevels = getPermissionsForRole(role).map((permission) => getPermissionLabel(permission));
  const profileAvatarUrl = (profileData.avatar_url || profileDraft.avatar_url || "").trim();
  const editingAvatarUrl = (avatarPreview || profileDraft.avatar_url || profileData.avatar_url || "").trim();

  const cartSummary = useMemo(
    () => ({
      count: cartItems.reduce((total, item) => total + item.quantity, 0),
      total: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    [cartItems]
  );

  const categories = useMemo(
    () => uniqueLabels(products.map((product) => product.category).filter(Boolean)),
    [products]
  );

  const searchResults = useMemo(() => {
    const query = normalizeText(deferredQuery);
    if (!query) {
      return [] as NavProduct[];
    }

    return products
      .map((product) => {
        const bag = getProductSearchText(product);
        let score = 0;

        if (bag.includes(query)) score += 4;

        for (const word of query.split(/\s+/).filter((word) => word.length > 2)) {
          if (bag.includes(word)) {
            score += 1;
          }
        }

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6)
      .map((item) => item.product);
  }, [deferredQuery, products]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    let alive = true;

    function mapAuthUser(currentUser: {
      id: string;
      email?: string;
      user_metadata?: { nombre?: string; role?: string };
    } | null): AuthUser | null {
      return currentUser
        ? {
            id: currentUser.id,
            email: currentUser.email,
            user_metadata: {
              nombre: currentUser.user_metadata?.nombre,
              role: currentUser.user_metadata?.role,
            },
          }
        : null;
    }

    function isSupabaseLockError(error: unknown) {
      const message = String((error as { message?: string } | null)?.message || "").toLowerCase();
      return message.includes("lock") && message.includes("stole");
    }

    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!alive) return;
        setUser(mapAuthUser(session?.user ?? null));
      } catch (error) {
        if (!alive) return;

        if (!isSupabaseLockError(error)) {
          console.error("No se pudo cargar sesión de usuario", error);
        }

        setUser(null);
      } finally {
        if (alive) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();
    setMounted(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapAuthUser(session?.user ?? null));
      setLoadingUser(false);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
      setMounted(false);
    };
  }, [supabase]);

  useEffect(() => {
    if (!user?.id) {
      setProfileData({ nombre: "", telefono: "", direccion: "", gender: "", avatar_url: "" });
      setProfileDraft({ nombre: "", telefono: "", direccion: "", gender: "", avatar_url: "" });
      return;
    }

    const userId = user.id;
    const userName = user.user_metadata?.nombre || "";

    let active = true;

    async function loadProfile() {
      let result = await supabase
        .from("profiles")
        .select("nombre,telefono,direccion,gender,avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (result.error && (isMissingColumnError(result.error, "gender") || isMissingColumnError(result.error, "avatar_url"))) {
        result = await supabase
          .from("profiles")
          .select("nombre,telefono,direccion")
          .eq("id", userId)
          .maybeSingle();
      }

      const data = result.data;

      if (!active) return;

      const nextProfile: ProfileData = {
        nombre: String((data as { nombre?: string | null } | null)?.nombre || userName),
        telefono: String((data as { telefono?: string | null } | null)?.telefono || ""),
        direccion: String((data as { direccion?: string | null } | null)?.direccion || ""),
        gender: String((data as { gender?: string | null } | null)?.gender || ""),
        avatar_url: String((data as { avatar_url?: string | null } | null)?.avatar_url || ""),
      };

      setProfileData(nextProfile);
      setProfileDraft(nextProfile);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [supabase, user?.id, user?.user_metadata?.nombre]);

  useEffect(() => {
    if (isAdminRoute) return;

    let active = true;

    async function loadPreheaderMessages() {
      const result = await supabase
        .from("marketing_preheader_messages")
        .select("message")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .limit(20);

      if (!active) return;

      if (result.error || !result.data?.length) {
        setPreheaderMessages(fallbackPreheaderMessages);
        return;
      }

      const messages = result.data
        .map((item) => String((item as { message?: string | null }).message || "").trim())
        .filter(Boolean);

      setPreheaderMessages(messages.length > 0 ? messages : fallbackPreheaderMessages);
      setPreheaderMessageIndex(0);
    }

    loadPreheaderMessages();

    if (preheaderMessages.length <= 1) {
      return () => {
        active = false;
      };
    }

    const timerId = window.setInterval(() => {
      setPreheaderMessageIndex((current) => (current + 1) % preheaderMessages.length);
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(timerId);
    };
  }, [isAdminRoute, preheaderMessages.length, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfileOpen(false);
    router.push("/");
    router.refresh();
  }

  function closeMenus() {
    setCategoriesOpen(false);
    setFavoritesOpen(false);
    setSearchQuery("");
  }

  async function handleSaveProfile() {
    if (!user?.id || savingProfile) return;

    setSavingProfile(true);

    const payload = {
      nombre: profileDraft.nombre.trim(),
      telefono: profileDraft.telefono.trim(),
      direccion: profileDraft.direccion.trim(),
      gender: profileDraft.gender.trim() || null,
      avatar_url: profileDraft.avatar_url.trim() || null,
    };

    let updateResult = await supabase.from("profiles").update(payload).eq("id", user.id);

    if (
      updateResult.error &&
      (isMissingColumnError(updateResult.error, "gender") || isMissingColumnError(updateResult.error, "avatar_url"))
    ) {
      updateResult = await supabase
        .from("profiles")
        .update({
          nombre: payload.nombre,
          telefono: payload.telefono,
          direccion: payload.direccion,
        })
        .eq("id", user.id);
    }

    if (!updateResult.error) {
      const updated: ProfileData = {
        nombre: payload.nombre,
        telefono: payload.telefono,
        direccion: payload.direccion,
        gender: String(payload.gender || ""),
        avatar_url: String(payload.avatar_url || ""),
      };
      setProfileData(updated);
      setProfileDraft(updated);
      setEditingProfile(false);
    }

    setSavingProfile(false);
  }

  function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleUploadProfileAvatar() {
    if (!selectedAvatarFile || !user?.id || uploadingAvatar) {
      return;
    }

    setUploadingAvatar(true);

    try {
      const bucketName =
        process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET ||
        process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET ||
        "profile-avatars";

      const extension = selectedAvatarFile.name.includes(".")
        ? selectedAvatarFile.name.split(".").pop()?.toLowerCase() || "jpg"
        : "jpg";
      const cleanName = selectedAvatarFile.name.replace(/\s+/g, "-").toLowerCase();
      const objectPath = `${user.id}/${Date.now()}-${cleanName || `avatar.${extension}`}`;

      const upload = await supabase.storage.from(bucketName).upload(objectPath, selectedAvatarFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: selectedAvatarFile.type || undefined,
      });

      if (upload.error) {
        return;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

      if (!data?.publicUrl) {
        return;
      }

      setProfileDraft((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      setSelectedAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview("");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (isAdminRoute) {
    return (
      <header className="mb-5">
        <div className="glass-card rounded-[28px] border border-white/40 bg-white/90 px-4 py-4 shadow-[0_18px_55px_rgba(110,71,49,0.08)] backdrop-blur-xl md:px-5 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/admin" className="inline-flex items-center">
              {logoError ? (
                <span className="font-[var(--font-display)] text-2xl text-primary">AMYSA</span>
              ) : (
                <Image
                  src="/logos/amysa-horizontal-primary.png"
                  alt="AMYSA SHOP"
                  width={190}
                  height={62}
                  className="h-11 w-auto"
                  priority
                  onError={() => setLogoError(true)}
                />
              )}
            </Link>

            {loadingUser ? null : user ? (
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="min-w-0 text-right leading-tight">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.user_metadata?.nombre || "Usuario"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getRoleLabel(role)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  aria-label="Perfil"
                  className="border border-primary/20 bg-primary/10 hover:bg-primary/20"
                >
                  {profileAvatarUrl ? (
                    <Image
                      src={profileAvatarUrl}
                      alt="Perfil"
                      width={28}
                      height={28}
                      unoptimized
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="size-4 text-primary" />
                  )}
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">Ingresar</Link>
              </Button>
            )}
          </div>
        </div>

        {profileOpen && mounted
          ? createPortal(
              <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                onClick={() => setProfileOpen(false)}
              >
                <div className="glass-card w-full max-w-md rounded-3xl p-5" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-[var(--font-display)] text-2xl">Perfil de usuario</h2>
                    <Button variant="ghost" size="icon" type="button" onClick={() => setProfileOpen(false)}>
                      <X className="size-4" />
                    </Button>
                  </div>

                  {user ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        {editingAvatarUrl ? (
                          <Image
                            src={editingAvatarUrl}
                            alt="Foto de perfil"
                            width={72}
                            height={72}
                            unoptimized
                            className="size-[72px] rounded-full border border-primary/20 object-cover"
                          />
                        ) : (
                          <span className="grid size-[72px] place-content-center rounded-full border border-primary/20 bg-primary/10">
                            <User className="size-6 text-primary" />
                          </span>
                        )}
                      </div>

                      {editingProfile ? (
                        <div className="grid gap-2">
                          <input
                            value={profileDraft.nombre}
                            onChange={(event) => setProfileDraft((prev) => ({ ...prev, nombre: event.target.value }))}
                            placeholder="Nombre"
                            className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                          />
                          <input
                            value={profileDraft.telefono}
                            onChange={(event) => setProfileDraft((prev) => ({ ...prev, telefono: event.target.value }))}
                            placeholder="Teléfono"
                            className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                          />
                          <input
                            value={profileDraft.direccion}
                            onChange={(event) => setProfileDraft((prev) => ({ ...prev, direccion: event.target.value }))}
                            placeholder="Dirección"
                            className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                          />
                          <select
                            value={profileDraft.gender}
                            onChange={(event) => setProfileDraft((prev) => ({ ...prev, gender: event.target.value }))}
                            className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                          >
                            <option value="">Selecciona género</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                          </select>
                          <input
                            value={profileDraft.avatar_url}
                            onChange={(event) => setProfileDraft((prev) => ({ ...prev, avatar_url: event.target.value }))}
                            placeholder="URL foto de perfil"
                            className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                          />
                          <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="block w-full text-xs" />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadProfileAvatar}
                            disabled={!selectedAvatarFile || uploadingAvatar}
                          >
                            {uploadingAvatar ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
                            Subir imagen
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p>
                            <span className="font-semibold">Nombre:</span> {profileData.nombre || "Sin nombre"}
                          </p>
                          <p>
                            <span className="font-semibold">Correo:</span> {user.email}
                          </p>
                          <p>
                            <span className="font-semibold">Teléfono:</span> {profileData.telefono || "Sin completar"}
                          </p>
                          <p>
                            <span className="font-semibold">Dirección:</span> {profileData.direccion || "Sin completar"}
                          </p>
                          <p>
                            <span className="font-semibold">Género:</span> {profileData.gender || "Sin completar"}
                          </p>
                        </>
                      )}

                      <p className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <span>
                          <span className="font-semibold">Rol:</span> {getRoleLabel(role)}
                        </span>
                      </p>

                      {role !== "cliente" ? (
                        <div>
                          <p className="font-semibold">Niveles de acceso:</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                            {accessLevels.map((level) => (
                              <li key={level}>{level}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    {user ? (
                      editingProfile ? (
                        <>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                              setProfileDraft(profileData);
                              setEditingProfile(false);
                            }}
                            disabled={savingProfile}
                          >
                            Cancelar
                          </Button>
                          <Button type="button" onClick={handleSaveProfile} disabled={savingProfile}>
                            {savingProfile ? "Guardando..." : "Guardar cambios"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="outline" onClick={handleSignOut}>
                            Cerrar sesión
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingProfile(true)}>
                            Modificar perfil
                          </Button>
                        </>
                      )
                    ) : null}
                  </div>
                </div>
              </div>,
              document.body
            )
          : null}

        {user && role === "cliente" && !isAdminRoute ? <AmysaAssistantWidget userId={user.id} userName={user.user_metadata?.nombre} /> : null}
      </header>
    );
  }

  return (
    <header className="relative z-[120] mb-5 space-y-3 md:mb-6 md:space-y-4">
      <div className="rounded-[28px] border border-primary/10 bg-[linear-gradient(135deg,#AE826D_0%,#7E5849_50%,#3B271F_100%)] px-4 py-3 text-white shadow-[0_18px_55px_rgba(110,71,49,0.22)] md:px-5 lg:px-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="hidden justify-start md:flex">
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white transition hover:bg-white/20 hover:text-white"
            >
              <WhatsAppIcon className="size-4 text-white" />
              <span className="text-sm font-semibold tracking-wide">{whatsappDisplayPhone}</span>
            </a>
          </div>
          <div className="flex justify-center text-center text-xs font-semibold md:text-sm">
            <span className="w-full rounded-full bg-white/15 px-4 py-1 uppercase tracking-wide transition-all duration-500 md:w-auto">
              {preheaderMessages[preheaderMessageIndex]}
            </span>
          </div>
          <div className="hidden justify-start md:flex md:justify-end">
            <div className="flex items-center gap-2 text-white">
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid size-9 place-content-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
                >
                  <InstagramIcon className="size-4 text-white" />
                </a>
              ) : null}
              {tiktokUrl ? (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="grid size-9 place-content-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
                >
                  <TikTokIcon className="size-4 text-white" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card relative z-[130] overflow-visible rounded-[28px] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,248,242,0.9))] px-4 py-4 shadow-[0_18px_55px_rgba(110,71,49,0.08)] backdrop-blur-xl md:px-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center gap-3 xl:flex-row xl:items-center">
            <Link href="/" className="inline-flex items-center justify-center">
              {logoError ? (
                <span className="font-[var(--font-display)] text-2xl text-primary">AMYSA</span>
              ) : (
                <Image
                  src="/logos/amysa-horizontal-primary.png"
                  alt="AMYSA SHOP"
                  width={190}
                  height={62}
                  className="h-11 w-auto"
                  priority
                  onError={() => setLogoError(true)}
                />
              )}
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/tienda"
                className="rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                onClick={closeMenus}
              >
                Tienda
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriesOpen((open) => !open);
                    setFavoritesOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Categorías <ChevronDown className="size-3.5" />
                </button>

                {categoriesOpen ? (
                  <div className="absolute left-0 top-full z-[260] mt-2 w-[340px] rounded-3xl border border-white/40 bg-white p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Categorías</p>
                      <button type="button" onClick={() => setCategoriesOpen(false)} className="text-xs font-semibold text-primary">
                        Cerrar
                      </button>
                    </div>
                    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <Link
                            key={category}
                            href={`/tienda?categoria=${encodeURIComponent(category)}`}
                            className="rounded-2xl border border-white/40 bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                            onClick={closeMenus}
                          >
                            {category}
                          </Link>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-white/40 bg-white/70 px-3 py-6 text-sm text-muted-foreground">
                          Aún no hay categorías cargadas.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setFavoritesOpen((open) => !open);
                    setCategoriesOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <Heart className="size-3.5 text-rose-500" />
                  Favoritos <span className="text-xs text-muted-foreground">({favoriteItems.length})</span>
                </button>

                {favoritesOpen ? (
                  <div className="absolute left-0 top-full z-[260] mt-2 w-[340px] rounded-3xl border border-white/40 bg-white p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Favoritos</p>
                      <button type="button" onClick={() => setFavoritesOpen(false)} className="text-xs font-semibold text-primary">
                        Cerrar
                      </button>
                    </div>
                    {favoriteItems.length > 0 ? (
                      <div className="space-y-2">
                        {favoriteItems.slice(0, 4).map((item) => (
                          <Link
                            key={item.productId}
                            href={`/producto/${item.productId}`}
                            className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/80 p-2 transition hover:border-primary/30 hover:bg-primary/5"
                            onClick={closeMenus}
                          >
                            <Image
                              src={item.image || "/placeholder-product.svg"}
                              alt={item.name}
                              width={56}
                              height={56}
                              unoptimized
                              className="size-14 rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category || "Sin categoría"}</p>
                              <p className="text-xs font-semibold text-primary">{formatPrice(item.price)}</p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          href="/favoritos"
                          className="block rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-center text-sm font-semibold text-primary transition hover:bg-primary/10"
                          onClick={closeMenus}
                        >
                          Ver todos los favoritos
                        </Link>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-white/40 bg-white/70 px-3 py-6 text-sm text-muted-foreground">
                        Aún no agregaste favoritos.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end xl:flex-row xl:items-center xl:justify-end">
            <div className="relative z-[250] w-full lg:max-w-[360px] xl:max-w-[420px] xl:flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => {
                    setCategoriesOpen(false);
                    setFavoritesOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Busca productos, marcas o categorías..."
                  className="h-11 w-full rounded-full border border-primary/15 bg-white/85 pl-11 pr-10 text-sm shadow-sm outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>

              {searchQuery.trim() ? (
                <div className="absolute left-0 top-full z-[270] mt-2 w-full rounded-3xl border border-white/40 bg-white p-2 shadow-2xl">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Resultados disponibles</p>
                  </div>
                  <div className="max-h-[340px] space-y-2 overflow-y-auto px-1 pb-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/producto/${product.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/85 p-2 transition hover:border-primary/30 hover:bg-primary/5"
                          onClick={() => setSearchQuery("")}
                        >
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            width={56}
                            height={56}
                            unoptimized
                            className="size-14 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{product.category}</p>
                            <p className="text-xs font-semibold text-primary">{formatPrice(product.price)}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-white/40 bg-white/70 px-3 py-6 text-sm text-muted-foreground">
                        No encontramos productos con esa búsqueda.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/carrito"
              className="hidden items-center gap-3 rounded-full border border-primary/15 bg-white/85 px-4 py-2.5 text-foreground shadow-sm transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary md:inline-flex"
              onClick={closeMenus}
            >
              <span className="grid size-9 place-content-center rounded-full bg-primary/10 text-primary">
                <ShoppingCart className="size-4" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-muted-foreground">Carrito</span>
                <span className="text-sm font-semibold">{formatPrice(cartSummary.total)}</span>
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {cartSummary.count}
              </span>
            </Link>

            {loadingUser ? null : user ? (
              <div className="relative hidden items-center gap-2 sm:flex">
                <div className="text-right leading-tight">
                  <p className="max-w-[160px] truncate text-xs font-semibold text-foreground">
                    {user.user_metadata?.nombre || "Usuario"}
                  </p>
                  <p className="max-w-[160px] truncate text-[11px] font-semibold text-primary">{getRoleLabel(role)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  aria-label="Perfil"
                  className="group border border-primary/20 bg-primary/10 hover:bg-primary/20"
                >
                  {profileAvatarUrl ? (
                    <Image
                      src={profileAvatarUrl}
                      alt="Perfil"
                      width={28}
                      height={28}
                      unoptimized
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="size-4 text-primary" />
                  )}
                </Button>
                <div className="invisible absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-white/30 bg-[#f4ede7]/95 p-3 text-left opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 group-hover:pointer-events-auto">
                  <p className="text-xs text-muted-foreground">Perfil</p>
                  <p className="text-sm font-semibold text-foreground">{user.user_metadata?.nombre || "Usuario"}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{user.email || "Sin correo"}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">{getRoleLabel(role)}</p>
                  <div className="mt-3 border-t border-white/20 pt-3">
                    <button
                      onClick={handleSignOut}
                      className="w-full rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {loadingUser ? null : user ? (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => setProfileOpen(true)}
                aria-label="Perfil"
                className="hidden border border-primary/20 bg-primary/10 hover:bg-primary/20"
              >
                {profileAvatarUrl ? (
                  <Image
                    src={profileAvatarUrl}
                    alt="Perfil"
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="size-4 text-primary" />
                )}
              </Button>
            ) : (
              <Button size="sm" asChild className="hidden">
                <Link href="/login">Ingresar</Link>
              </Button>
            )}

            {!user && !loadingUser ? (
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Ingresar</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="glass-card fixed inset-x-3 bottom-3 z-40 rounded-2xl px-2 py-1.5 md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[10px] font-semibold transition ${
                  isActive ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {profileOpen && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
              onClick={() => setProfileOpen(false)}
            >
              <div className="glass-card w-full max-w-md rounded-3xl p-5" onClick={(event) => event.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-[var(--font-display)] text-2xl">Perfil de usuario</h2>
                  <Button variant="ghost" size="icon" type="button" onClick={() => setProfileOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </div>

                {user ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      {editingAvatarUrl ? (
                        <Image
                          src={editingAvatarUrl}
                          alt="Foto de perfil"
                          width={72}
                          height={72}
                          unoptimized
                          className="size-[72px] rounded-full border border-primary/20 object-cover"
                        />
                      ) : (
                        <span className="grid size-[72px] place-content-center rounded-full border border-primary/20 bg-primary/10">
                          <User className="size-6 text-primary" />
                        </span>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="grid gap-2">
                        <input
                          value={profileDraft.nombre}
                          onChange={(event) => setProfileDraft((prev) => ({ ...prev, nombre: event.target.value }))}
                          placeholder="Nombre"
                          className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                        />
                        <input
                          value={profileDraft.telefono}
                          onChange={(event) => setProfileDraft((prev) => ({ ...prev, telefono: event.target.value }))}
                          placeholder="Teléfono"
                          className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                        />
                        <input
                          value={profileDraft.direccion}
                          onChange={(event) => setProfileDraft((prev) => ({ ...prev, direccion: event.target.value }))}
                          placeholder="Dirección"
                          className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                        />
                        <select
                          value={profileDraft.gender}
                          onChange={(event) => setProfileDraft((prev) => ({ ...prev, gender: event.target.value }))}
                          className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                        >
                          <option value="">Selecciona género</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                        </select>
                        <input
                          value={profileDraft.avatar_url}
                          onChange={(event) => setProfileDraft((prev) => ({ ...prev, avatar_url: event.target.value }))}
                          placeholder="URL foto de perfil"
                          className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
                        />
                        <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="block w-full text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUploadProfileAvatar}
                          disabled={!selectedAvatarFile || uploadingAvatar}
                        >
                          {uploadingAvatar ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
                          Subir imagen
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p>
                          <span className="font-semibold">Nombre:</span> {profileData.nombre || "Sin nombre"}
                        </p>
                        <p>
                          <span className="font-semibold">Correo:</span> {user.email}
                        </p>
                        <p>
                          <span className="font-semibold">Teléfono:</span> {profileData.telefono || "Sin completar"}
                        </p>
                        <p>
                          <span className="font-semibold">Dirección:</span> {profileData.direccion || "Sin completar"}
                        </p>
                        <p>
                          <span className="font-semibold">Género:</span> {profileData.gender || "Sin completar"}
                        </p>
                      </>
                    )}

                    <p className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span>
                        <span className="font-semibold">Rol:</span> {getRoleLabel(role)}
                      </span>
                    </p>

                    {role !== "cliente" ? (
                      <div>
                        <p className="font-semibold">Niveles de acceso:</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                          {accessLevels.map((level) => (
                            <li key={level}>{level}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  {user ? (
                    editingProfile ? (
                      <>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setProfileDraft(profileData);
                            setEditingProfile(false);
                          }}
                          disabled={savingProfile}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" onClick={handleSaveProfile} disabled={savingProfile}>
                          {savingProfile ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="outline" onClick={handleSignOut}>
                          Cerrar sesión
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingProfile(true)}>
                          Modificar perfil
                        </Button>
                      </>
                    )
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {user && role === "cliente" && !isAdminRoute ? <AmysaAssistantWidget userId={user.id} userName={user.user_metadata?.nombre} /> : null}
    </header>
  );
}
