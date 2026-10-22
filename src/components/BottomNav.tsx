"use client";

import { usePathname } from "next/navigation";
import BottomNavShell from "@/components/BottomNavShell";

export default function BottomNav() {
  const pathname = usePathname();
  return <BottomNavShell pathname={pathname} />;
}
