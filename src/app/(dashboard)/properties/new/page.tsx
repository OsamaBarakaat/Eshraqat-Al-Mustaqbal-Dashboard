"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyForm } from "@/features/properties/components/property-form";
import { ProtectedRoute } from "@/components/shared/protected-route";

export default function NewPropertyPage() {
  return (
    <ProtectedRoute module="properties" action="create">
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          title="إضافة عقار جديد"
          description="أدخل تفاصيل ومواصفات العقار، السعر، الموقع والوسائط لنشره على منصة إشراقة المستقبل أو حفظه كمسودة."
          breadcrumbs={[
            { label: "العقارات", href: "/properties" },
            { label: "إضافة عقار جديد" },
          ]}
        />

        <PropertyForm isEditing={false} />
      </div>
    </ProtectedRoute>
  );
}
