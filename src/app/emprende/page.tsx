"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CommissionsDashboard from "@/components/emprende/commissions-dashboard";
import SalesForm from "@/components/emprende/sales-form";
import SalesTable from "@/components/emprende/sales-table";
import ExternalClientForm from "@/components/emprende/external-client-form";
import EmpendeAdminDashboard from "@/components/emprende/admin-dashboard";
import { getSalesperson } from "@/lib/actions/emprende-actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Product, Salesperson } from "@/lib/types";

export default function EmprenderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "clients">(
    "dashboard"
  );
  const [refreshSales, setRefreshSales] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminSalespeople, setAdminSalespeople] = useState<Salesperson[]>([]);
  const [adminSelectedSalespersonId, setAdminSelectedSalespersonId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        // Get user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);

        // Check if user is salesperson or admin
        if (
          import { redirect } from "next/navigation";

          export default function EmprendeRedirectPage() {
            redirect("/admin/emprende");
          }
          setSalesperson(null);
