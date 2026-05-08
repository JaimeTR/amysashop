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
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Registrar Venta</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Producto */}
        <div>
          <label className="block text-sm font-medium mb-2">Producto</label>
          <select
            value={formData.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
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

        {/* Cantidad */}
        {selectedProduct && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Cantidad (Stock disponible: {selectedProduct.stock})
            </label>
            <input
              type="number"
              min="1"
              max={selectedProduct.stock}
              value={formData.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        )}

        {/* Total Amount Display */}
        {selectedProduct && (
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between">
              <span className="font-medium">Precio unitario:</span>
              <span>${selectedProduct.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-2 text-lg font-bold">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Estado de Pago */}
        <div>
          <label className="block text-sm font-medium mb-2">Estado de Pago</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="payment_status"
                value="completed"
                checked={formData.payment_status === "completed"}
                onChange={() => handlePaymentStatusChange("completed")}
                className="mr-2"
              />
              <span>Pago Completo</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment_status"
                value="partial"
                checked={formData.payment_status === "partial"}
                onChange={() => handlePaymentStatusChange("partial")}
                className="mr-2"
              />
              <span>Pago Parcial</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment_status"
                value="pending"
                checked={formData.payment_status === "pending"}
                onChange={() => handlePaymentStatusChange("pending")}
                className="mr-2"
              />
              <span>Sin Pago</span>
            </label>
          </div>
        </div>

        {/* Monto Pagado (si es parcial) */}
        {formData.payment_status === "partial" && (
          <div>
            <label className="block text-sm font-medium mb-2">Monto Pagado</label>
            <input
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
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        )}

        {/* Comisión Info */}
        {formData.payment_status !== "completed" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            ⚠️ Sin comisión hasta que pague cliente
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            className="w-full border rounded px-3 py-2 resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedProduct}
          className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary/90 disabled:bg-gray-400"
        >
          {loading ? "Registrando..." : "Registrar Venta"}
        </button>
      </form>
    </div>
  );
}
