'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function DepartmentRootRedirect() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.departmentId as string;

  useEffect(() => {
    if (departmentId) {
      router.replace(`/departments/${departmentId}/configuration`);
    }
  }, [departmentId, router]);

  return null;
}
