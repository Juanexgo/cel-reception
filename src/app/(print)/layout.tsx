import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {children}
    </div>
  );
}
