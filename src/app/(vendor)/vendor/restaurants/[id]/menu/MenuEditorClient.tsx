"use client";

import { MenuEditor } from "@/components/admin/MenuEditor";

interface Props {
  restaurantId: string;
  restaurantSlug: string;
  apiPath: string;
}

export function MenuEditorClient({ restaurantId, restaurantSlug, apiPath }: Props) {
  return (
    <MenuEditor
      restaurantId={restaurantId}
      restaurantSlug={restaurantSlug}
      apiPath={apiPath}
    />
  );
}
