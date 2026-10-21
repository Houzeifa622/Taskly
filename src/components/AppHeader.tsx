"use client";

import { usePathname } from "next/navigation";
import HeaderShell from "@/components/HeaderShell";

export default function AppHeader() {
  const pathname = usePathname();

  return <HeaderShell pathname={pathname} />;
}
