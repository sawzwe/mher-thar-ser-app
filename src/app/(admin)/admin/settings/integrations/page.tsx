"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plugs, CheckCircle, Code } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type IntegrationsResponse = {
  gtmContainerId: string | null;
  customScripts: string | null;
  updatedAt: string | null;
};

export default function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [gtm, setGtm] = useState("");
  const [customScripts, setCustomScripts] = useState("");
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
    setCustomScripts(data.customScripts ?? "");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { gtmContainerId: string; customScripts: string }) => {
      const res = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gtmContainerId: payload.gtmContainerId || null,
          customScripts: payload.customScripts || null,
        }),
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
        subtitle="Inject marketing and analytics tags site-wide. No deploys needed — changes go live after saving."
      />

      <div className="space-y-4">
        {/* GTM */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-text-secondary text-[13px] font-semibold">
            <Plugs className="w-4 h-4 text-brand" weight="duotone" />
            Google Tag Manager
          </div>

          <Input
            label="Container ID"
            value={gtm}
            onChange={(e) => setGtm(e.target.value.toUpperCase())}
            placeholder="GTM-XXXXXXX"
            hint="Add GA4, Meta Pixel, Ads, and more inside the GTM web UI after saving."
            disabled={!clientReady || isLoading}
          />
        </div>

        {/* Custom scripts */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-text-secondary text-[13px] font-semibold">
            <Code className="w-4 h-4 text-brand" weight="duotone" />
            Custom script tags
          </div>

          <Textarea
            label="Script HTML"
            value={customScripts}
            onChange={(e) => setCustomScripts(e.target.value)}
            placeholder={`<script async src="https://example.com/widget.js"></script>\n<script>\n  window.myConfig = { key: "..." };\n</script>`}
            hint="Paste full <script> tags. Injected at the start of <body> on every page."
            disabled={!clientReady || isLoading}
            rows={18}
            className="min-h-[22rem] font-mono text-[13px]"
          />
        </div>

        {/* Footer */}
        {formError && (
          <p className="text-[13px] text-danger" role="alert">{formError}</p>
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
            onClick={() => saveMutation.mutate({ gtmContainerId: gtm.trim(), customScripts: customScripts.trim() })}
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
