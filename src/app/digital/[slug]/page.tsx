import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, File, Presentation } from "lucide-react";
import { DigitalCover, DigitalTypeIcon } from "@/components/digital/digital-product-card";
import { DigitalPreviewGallery } from "@/components/digital/digital-preview-gallery";
import { DigitalPurchasePanel } from "@/components/digital/digital-purchase-panel";
import { ShareButtons } from "@/components/digital/share-buttons";
import { getCheckoutSettings } from "@/lib/checkout-settings-server";
import { getPaymentOptionsFromSettings } from "@/lib/checkout-settings";
import { getPublicDigitalProductDetail } from "@/lib/digital-store";
import {
  DIGITAL_FILE_KIND_LABELS,
  DIGITAL_PRODUCT_TYPES,
  formatFileSize,
  formatSoles,
  getDigitalFileKind,
  type DigitalFileInfo,
  type DigitalFileKind,
} from "@/lib/digital-types";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/site-url";
import { DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

type Props = { params: { slug: string } };

const FILE_ICONS: Record<DigitalFileKind, typeof File> = {
  excel: FileSpreadsheet,
  pdf: FileText,
  word: FileText,
  powerpoint: Presentation,
  zip: FileArchive,
  video: FileVideo,
  audio: FileAudio,
  imagen: FileImage,
  otro: File,
};

function FileRow({ file }: { file: DigitalFileInfo }) {
  const kind = getDigitalFileKind(file.name, file.mimeType);
  const Icon = FILE_ICONS[kind];
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/70 px-3 py-2">
      <Icon className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        {file.description ? <p className="truncate text-xs text-muted-foreground">{file.description}</p> : null}
      </div>
      <span className="shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">
        {DIGITAL_FILE_KIND_LABELS[kind]}
        {file.sizeBytes ? ` · ${formatFileSize(file.sizeBytes)}` : ""}
      </span>
    </li>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getPublicDigitalProductDetail(params.slug);
  if (!detail) return { title: "Producto no encontrado" };

  const { product } = detail;
  const typeLabel = DIGITAL_PRODUCT_TYPES[product.productType]?.label || "Producto digital";
  const summary = product.description.length > 120 ? `${product.description.slice(0, 117).trimEnd()}...` : product.description;
  const description = `${summary} ${typeLabel} digital: ${formatSoles(product.price)}. Descarga inmediata al confirmar tu pago.`;
  const path = `/digital/${product.slug}`;
  const image = product.coverUrl ? { url: product.coverUrl, alt: product.name } : DEFAULT_OG_IMAGE;

  return {
    title: `${product.name} - ${typeLabel}`,
    description,
    alternates: { canonical: path },
    openGraph: { title: product.name, description, url: path, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: product.name, description, images: [image.url] },
  };
}

export default async function DigitalProductPage({ params }: Props) {
  const detail = await getPublicDigitalProductDetail(params.slug);
  if (!detail) notFound();

  const { product, files, includedProducts } = detail;
  const settings = await getCheckoutSettings();
  const paymentOptions = getPaymentOptionsFromSettings(settings) as Array<{ value: "yape" | "plin" | "transferencia"; label: string }>;
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/digital/${product.slug}`;
  const galleryImages = [product.coverUrl, ...product.previewImages].filter((src): src is string => Boolean(src));
  const typeLabel = DIGITAL_PRODUCT_TYPES[product.productType]?.label || "Producto digital";
  const totalFiles = files.length + includedProducts.reduce((acc, item) => acc + item.files.length, 0);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      category: typeLabel,
      image: galleryImages.length > 0 ? galleryImages : [`${siteUrl}${DEFAULT_OG_IMAGE.url}`],
      url: productUrl,
      brand: { "@type": "Brand", name: "AMYSA SHOP" },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "PEN",
        price: product.price.toFixed(2),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": `${siteUrl}/#organization` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Productos digitales", item: `${siteUrl}/digital` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">

      <Link href="/digital" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="size-4" /> Productos digitales
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-3">
          {galleryImages.length > 0 ? (
            <DigitalPreviewGallery name={product.name} images={galleryImages} />
          ) : (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/60">
              <DigitalCover product={product} sizes="(max-width: 1024px) 100vw, 560px" priority />
            </div>
          )}
          {product.previewImages.length > 0 ? (
            <p className="text-center text-xs text-muted-foreground">Vista previa: {product.previewImages.length} páginas de muestra</p>
          ) : null}
        </div>

        <div className="space-y-5">
          <header className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <DigitalTypeIcon type={product.productType} className="size-3.5" />
              {typeLabel}
            </span>
            <h1 className="font-[var(--font-display)] text-3xl text-foreground sm:text-4xl">{product.name}</h1>
            {product.subtitle ? <p className="text-base text-muted-foreground">{product.subtitle}</p> : null}
          </header>

          <DigitalPurchasePanel
            product={{ id: product.id, name: product.name, price: product.price, priceBefore: product.priceBefore }}
            paymentOptions={paymentOptions}
            whatsappPhone={whatsappPhone}
          />

          <ShareButtons url={productUrl} title={product.name} text={`Mira ${product.name} en AMYSA SHOP`} />

          {product.description ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Descripción</h2>
              {product.description.split(/\n+/).map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ) : null}

          {product.features.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">¿Qué incluye?</h2>
              <ul className="space-y-1.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {product.idealFor ? (
            <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <h2 className="text-sm font-semibold text-primary">Ideal para</h2>
              <p className="mt-1 text-sm text-foreground">{product.idealFor}</p>
            </section>
          ) : null}

          {totalFiles > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Archivos que recibes <span className="text-sm font-normal text-muted-foreground">({totalFiles})</span>
              </h2>
              {files.length > 0 ? <ul className="space-y-2">{files.map((file) => <FileRow key={file.id} file={file} />)}</ul> : null}
              {includedProducts.map((item) => (
                <div key={item.product.id} className="space-y-2">
                  <Link href={`/digital/${item.product.slug}`} className="text-sm font-semibold text-primary hover:underline">
                    Incluye: {item.product.name}
                  </Link>
                  <ul className="space-y-2">{item.files.map((file) => <FileRow key={file.id} file={file} />)}</ul>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
