"use client";

import { useState, useEffect } from "react";
import { createSale } from "@/lib/actions/emprende-actions";
import { Product } from "@/lib/types";

interface SalesFormProps {
  salespersonId: string;
  products: Product[];
  onSaleCreated?: () => void;
}

interface FormData {
  product_id: string;
  quantity: number;
  payment_status: "pending" | "partial" | "completed";
  payment_received: number;
  client_type: "internal" | "external";
  client_id?: string;
  external_client_id?: string;
  notes?: string;
}

export default function SalesForm({
  salespersonId,
  products,
  onSaleCreated,
}: SalesFormProps) {
  const [formData, setFormData] = useState<FormData>({
    product_id: "",
    quantity: 1,
    payment_status: "completed",
    payment_received: 0,
    client_type: "external",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (formData.product_id) {
      const product = products.find((p) => p.id === formData.product_id);
      setSelectedProduct(product || null);
      if (product) {
        setTotalAmount(product.price * formData.quantity);
      }
    }
  }, [formData.product_id, formData.quantity, products]);

  useEffect(() => {
    if (formData.payment_status === "completed" && selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        payment_received: selectedProduct.price * formData.quantity,
      }));
    } else if (formData.payment_status === "pending") {
      setFormData((prev) => ({
        ...prev,
        payment_received: 0,
      }));
    }
  }, [formData.payment_status, selectedProduct, formData.quantity]);

  const handleProductChange = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      quantity: 1,
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity > 0 && selectedProduct && quantity <= selectedProduct.stock) {
      setFormData((prev) => ({
        ...prev,
        quantity,
      }));
    }
  };

  const handlePaymentStatusChange = (status: "pending" | "partial" | "completed") => {
    setFormData((prev) => ({
      ...prev,
      payment_status: status,
      payment_received: status === "completed" ? totalAmount : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.product_id) {
        throw new Error("Selecciona un producto");
      }

      if (formData.payment_status === "partial" && formData.payment_received <= 0) {
        throw new Error("Ingresa el monto pagado");
      }

      if (formData.payment_status === "partial" && formData.payment_received > totalAmount) {
        throw new Error("El monto pagado no puede ser mayor al total");
      }

      const newSale = await createSale(salespersonId, formData, selectedProduct!.price);

      if (!newSale) {
        throw new Error("Error al registrar la venta");
      }

      setSuccess("Venta registrada exitosamente");
      setFormData({
        product_id: "",
        quantity: 1,
        payment_status: "completed",
        payment_received: 0,
        client_type: "external",
      });
      setSelectedProduct(null);
      setTotalAmount(0);

      onSaleCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive-foreground text-sm backdrop-blur-md">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-success-foreground text-sm backdrop-blur-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Paso 1: Producto */}
        <div className="space-y-2">
          <label htmlFor="sales-product" className="block text-sm font-semibold text-foreground">Paso 1: Producto *</label>
          <select
            id="sales-product"
            value={formData.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Selecciona un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - Stock: {product.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2: Cantidad */}
        {selectedProduct && (
          <div className="space-y-2">
            <label htmlFor="sales-quantity" className="block text-sm font-semibold text-foreground">
              Paso 2: Cantidad (Max: {selectedProduct.stock}) *
            </label>
            <input
              id="sales-quantity"
              type="number"
              min="1"
              max={selectedProduct.stock}
              value={formData.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        {/* Paso 3: Resumen Total */}
        {selectedProduct && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex justify-between mb-2">
              <span className="text-foreground/70">Precio unitario:</span>
              <span className="font-semibold">${selectedProduct.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Paso 4: Estado de Pago */}
        {selectedProduct && (
          <div className="space-y-3">
            <div className="block text-sm font-semibold text-foreground">Paso 3: Estado de Pago *</div>
            <div className="space-y-2">
              {[
                { value: "completed", label: "Pago Completo" },
                { value: "partial", label: "Pago Parcial" },
                { value: "pending", label: "Sin Pago" },
              ].map((option) => (
                <label key={option.value} className="flex items-center rounded-lg border border-white/20 bg-white/10 p-3 cursor-pointer transition-colors hover:bg-white/15 has-[:checked]:border-primary has-[:checked]:bg-primary/20">
                  <input
                    type="radio"
                    name="payment_status"
                    value={option.value}
                    checked={formData.payment_status === option.value}
                    onChange={() => handlePaymentStatusChange(option.value as "pending" | "partial" | "completed")}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Paso 5: Monto Pagado (si es parcial) */}
        {formData.payment_status === "partial" && selectedProduct && (
          <div className="space-y-2">
            <label htmlFor="sales-payment-received" className="block text-sm font-semibold text-foreground">Paso 4: Monto Pagado *</label>
            <input
              id="sales-payment-received"
              type="number"
              min="0"
              max={totalAmount}
              step="0.01"
              value={formData.payment_received}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_received: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        {/* Advertencia si no está pagado */}
        {formData.payment_status !== "completed" && selectedProduct && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning-foreground text-sm backdrop-blur-md">
              ⚠️ Sin comisión hasta que el cliente pague completamente
            </div>
        )}

        {/* Notas */}
        {selectedProduct && (
          <div className="space-y-2">
            <label htmlFor="sales-notes" className="block text-sm font-medium text-foreground">Notas (opcional)</label>
            <textarea
              id="sales-notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Submit Button */}
        {selectedProduct && (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registrar Venta"}
          </button>
        )}
      </form>
    </div>
  );
}
