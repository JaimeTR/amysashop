import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { compressFileToBuffer } from "@/lib/image-compression-server";

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function POST(request: NextRequest) {
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para actualizar tu perfil." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  if (!service) {
    return NextResponse.json(
      { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const nombre = readText(formData, "nombre");
    const telefono = readText(formData, "telefono");
    const direccion = readText(formData, "direccion");
    const gender = readText(formData, "gender");
    const avatarFile = formData.get("avatarFile");

    let avatarUrl = readText(formData, "avatarUrl");

    if (avatarFile instanceof File && avatarFile.size > 0) {
      const bucketName =
        process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET ||
        process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET ||
        "profile-avatars";

      if (!avatarFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "Selecciona una imagen válida." }, { status: 400 });
      }

      if (avatarFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "La imagen debe ser menor a 5 MB." }, { status: 400 });
      }

      const { buffer, contentType, fileName } = await compressFileToBuffer(avatarFile);
      const objectPath = `${user.id}/${Date.now()}-${fileName}`;

      const upload = await service.storage.from(bucketName).upload(objectPath, buffer, {
        upsert: true,
        cacheControl: "31536000",
        contentType,
      });

      if (upload.error) {
        return NextResponse.json({ error: upload.error.message || "No se pudo subir la imagen." }, { status: 500 });
      }

      const { data } = service.storage.from(bucketName).getPublicUrl(objectPath);

      if (!data?.publicUrl) {
        return NextResponse.json({ error: "No se pudo generar la URL pública del avatar." }, { status: 500 });
      }

      avatarUrl = data.publicUrl;
    }

    const basePayload: Record<string, string | null> = {
      id: user.id,
      nombre: nombre || null,
      telefono: telefono || null,
      direccion: direccion || null,
      gender: gender || null,
      img_avatar: avatarUrl || null,
      avatar_url: avatarUrl || null,
    };

    let saveResult = await service.from("profiles").upsert(basePayload, { onConflict: "id" });

    if (saveResult.error && isMissingColumnError(saveResult.error, "gender")) {
      const { gender: _omitGender, ...fallbackPayload } = basePayload;
      saveResult = await service.from("profiles").upsert(fallbackPayload, { onConflict: "id" });
    }

    if (saveResult.error) {
      return NextResponse.json({ error: saveResult.error.message || "No se pudo guardar el perfil." }, { status: 500 });
    }

    revalidatePath("/perfil");

    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String((error as { message?: string })?.message || error || "No se pudo guardar el perfil.") },
      { status: 500 }
    );
  }
}