import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Use getSession() instead of getUser() — the middleware already validated
  // the session with getUser(). getSession() reads the JWT from the cookie
  // locally (no network roundtrip), saving ~200-500ms.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  let { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .single();

  // Auto-create employee record on first login
  if (!employee) {
    const { data: created } = await supabase
      .from("employees")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New User",
        email: user.email!,
        role: "worker",
      })
      .select()
      .single();

    employee = created;

    // If insert also failed (e.g. RLS or table doesn't exist), sign out
    if (!employee) {
      await supabase.auth.signOut();
      redirect("/login");
    }
  }

  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar employee={employee} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </Providers>
  );
}
