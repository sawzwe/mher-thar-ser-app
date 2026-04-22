"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plugs, CheckCircle } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type IntegrationsResponse = {
  gtmContainerId: string | null;
  updatedAt: string | null;
};

export default function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [gtm, setGtm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => {
    setClientReady(true);
  }, []);

  const { data, isLoading, error } = useQuery<IntegrationsResponse>({
    queryKey: ["admin-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/integrations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load integrations");
      return json as IntegrationsResponse;
    },
  });

  useEffect(() => {
    if (!data) return;
    setGtm(data.gtmContainerId ?? "");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (gtmContainerId: string) => {
      const res = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gtmContainerId: gtmContainerId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      return json as IntegrationsResponse;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-integrations"], updated);
      setFormError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => {
      setFormError((e as Error).message);
    },
  });

  if (error) {
    return (
      <div className="p-8 animate-admin-enter">
        <p className="text-danger">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl animate-admin-enter">
      <AdminPageHeader
        title="Integrations"
        subtitle="Add your Google Tag Manager container ID. Configure GA4, Meta Pixel, and other tags inside the GTM web app—no code deploys."
      />

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-text-secondary text-[13px]">
          <Plugs className="w-5 h-5 text-brand" weight="duotone" />
          <span>Google Tag Manager</span>
        </div>

        <Input
          label="GTM container ID"
          labelMy="GTM အမှတ်စဉ်"
          value={gtm}
          onChange={(e) => setGtm(e.target.value.toUpperCase())}
          placeholder="GTM-XXXXXXX"
          hint="From Tag Manager: Admin → Install Google Tag Manager. Leave empty to use NEXT_PUBLIC_GTM_ID only, or to disable GTM when neither is set."
          disabled={!clientReady || isLoading}
        />

        {formError && (
          <p className="text-[13px] text-danger" role="alert">
            {formError}
          </p>
        )}

        {data?.updatedAt && (
          <p className="text-[12px] text-text-muted">
            Last saved{" "}
            {new Date(data.updatedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate(gtm.trim())}
            loading={saveMutation.isPending}
            disabled={!clientReady || isLoading}
          >
            Save
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[13px] text-success">
              <CheckCircle weight="fill" className="w-4 h-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
