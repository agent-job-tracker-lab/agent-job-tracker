import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/jobs");

  return (
    <main className="login-page">
      <header className="brand-header">
        <span>Agent Job Tracker</span>
      </header>
      <section className="login-card" aria-labelledby="login-heading">
        <h1 id="login-heading">ログイン</h1>
        <p className="login-description">
          登録済みのメールアドレスとパスワードを入力してください。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
