"use client";

import React, { use } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { MockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyForm } from "@/features/properties/components/property-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ProtectedRoute } from "@/components/shared/protected-route";

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const property = MockStore.getPropertyById(resolvedParams.id);

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="تعديل العقار"
          breadcrumbs={[
            { label: "العقارات", href: "/properties" },
            { label: "تعديل العقار" },
          ]}
        />
        <EmptyState
          icon={AlertTriangle}
          title="العقار غير موجود"
          description="لم يتم العثور على العقار المطلوب، ربما تم حذفه أو أن المعرّف غير صحيح."
          actionLabel="العودة لقائمة العقارات"
          onAction={() => {
            window.location.href = "/properties";
          }}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute module="properties" action="edit">
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          title={`تعديل العقار: ${property.code}`}
          description={`تحديث بيانات ومواصفات (${property.title})`}
          breadcrumbs={[
            { label: "العقارات", href: "/properties" },
            { label: property.code, href: `/properties/${property.id}` },
            { label: "تعديل" },
          ]}
          secondaryActions={
            <Link
              href={`/properties/${property.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-secondary-text hover:text-primary-text bg-surface border border-neutral-border rounded-xl transition-colors"
            >
              <span>معاينة العقار</span>
            </Link>
          }
        />

        <PropertyForm initialData={property} isEditing={true} />
      </div>
    </ProtectedRoute>
  );
}
