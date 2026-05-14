"use client";

import { useState, useEffect } from "react";
import {
  createExternalClient,
  getExternalClientsBySalesperson,
} from "@/lib/actions/emprende-actions";
import { ExternalClient, CreateExternalClientInput } from "@/lib/types";

interface ExternalClientFormProps {
  salespersonId: string;
  onClientCreated?: () => void;
  showList?: boolean;
}

export default function ExternalClientForm({
  salespersonId,
  onClientCreated,
  showList = true,
}: ExternalClientFormProps) {
  const [formData, setFormData] = useState<CreateExternalClientInput>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (showList) {
      fetchClients();
    }
  }, [showList, salespersonId]);

  const fetchClients = async () => {
    try {
      const data = await getExternalClientsBySalesperson(salespersonId);
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.name || !formData.phone) {
        throw new Error("Nombre y teléfono son requeridos");
      }

      const newClient = await createExternalClient(
        salespersonId,
        formData
      );

      if (!newClient) {
        throw new Error("Error al crear cliente");
      }

      setSuccess("Cliente creado exitosamente");
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      setShowForm(false);

      if (showList) {
        fetchClients();
      }

      onClientCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Clientes Externos</h2>

      {error && (
        <div className="mb-4 p-3 bg-destructive text-destructive-foreground rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success text-success-foreground rounded">
          {success}
        </div>
      )}

      {/* Formulario */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90"
        >
          {showForm ? "Cancelar" : "+ Agregar Cliente"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t pt-4">
            <div>
              <label htmlFor="external-client-name" className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                id="external-client-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="external-client-email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="external-client-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="external-client-phone" className="block text-sm font-medium mb-1">Teléfono *</label>
              <input
                id="external-client-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="external-client-address" className="block text-sm font-medium mb-1">Dirección</label>
              <textarea
                id="external-client-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 resize-none"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-success text-white py-2 rounded font-medium hover:bg-success/90 disabled:bg-muted/40"
            >
              {loading ? "Creando..." : "Crear Cliente"}
            </button>
          </form>
        )}
      </div>

      {/* Lista de Clientes */}
      {showList && (
        <div>
          <h3 className="text-lg font-bold mb-4">Tus Clientes</h3>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay clientes externos registrados
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="border rounded-lg p-4 hover:shadow transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold">{client.name}</h4>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                      {client.email && (
                        <p className="text-sm text-gray-600">{client.email}</p>
                      )}
                      {client.address && (
                        <p className="text-sm text-gray-600">{client.address}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
