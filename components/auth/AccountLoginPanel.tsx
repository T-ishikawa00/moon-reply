"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { announceCustomerAuthStateChanged } from "@/lib/customer-auth/browser-events";
import styles from "./AccountLoginPanel.module.css";

type AuthMethods = Readonly<{ google: boolean; emailOtp: boolean }>;
type LoginState = "checking" | "signed_out" | "signed_in" | "unavailable";
type EmailStep = "choice" | "email" | "otp";

const noMethods: AuthMethods = { google: false, emailOtp: false };

function safeFailureMessage(kind: "google" | "email_request" | "email_verify") {
  if (kind === "email_verify") {
    return "コードを確認できませんでした。期限を確認して、もう一度お試しください。";
  }
  if (kind === "email_request") {
    return "コードを送信できませんでした。少し時間を置いて、もう一度お試しください。";
  }
  return "Googleでのログインを開始できませんでした。もう一度お試しください。";
}

export function AccountLoginPanel() {
  const router = useRouter();
  const [loginState, setLoginState] = useState<LoginState>("checking");
  const [methods, setMethods] = useState<AuthMethods>(noMethods);
  const [emailStep, setEmailStep] = useState<EmailStep>("choice");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const status = new URLSearchParams(window.location.search).get("status");

    async function inspectSession() {
      try {
        const response = await fetch("/api/account/session", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("session unavailable");
        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !("data" in body) ||
          typeof body.data !== "object" ||
          body.data === null ||
          !("state" in body.data) ||
          !("methods" in body.data) ||
          typeof body.data.methods !== "object" ||
          body.data.methods === null
        ) {
          throw new Error("session unavailable");
        }
        const state = body.data.state;
        const available = body.data.methods as Record<string, unknown>;
        const nextMethods = {
          google: available.google === true,
          emailOtp: available.emailOtp === true,
        };
        if (!active) return;
        if (status === "google_failed") {
          setMessage("Googleでのログインを完了できませんでした。もう一度お試しください。");
        }
        setMethods(nextMethods);
        if (state === "signed_in") setLoginState("signed_in");
        else if (state === "signed_out" && (nextMethods.google || nextMethods.emailOtp)) {
          setLoginState("signed_out");
        } else setLoginState("unavailable");
      } catch {
        if (active) {
          if (status === "google_failed") {
            setMessage("Googleでのログインを完了できませんでした。もう一度お試しください。");
          }
          setLoginState("unavailable");
        }
      }
    }

    void inspectSession();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function startGoogle() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/account/google/start", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("google start failed");
      const body: unknown = await response.json();
      const authorizationUrl =
        typeof body === "object" &&
        body !== null &&
        "data" in body &&
        typeof body.data === "object" &&
        body.data !== null &&
        "authorizationUrl" in body.data &&
        typeof body.data.authorizationUrl === "string"
          ? body.data.authorizationUrl
          : null;
      if (!authorizationUrl) throw new Error("google start failed");
      const destination = new URL(authorizationUrl);
      if (destination.protocol !== "https:" && destination.protocol !== "http:") {
        throw new Error("google start failed");
      }
      window.location.assign(destination.toString());
    } catch {
      setBusy(false);
      setMessage(safeFailureMessage("google"));
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/account/email-otp/request", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("email request failed");
      setEmailStep("otp");
      setMessage("確認コードを送信しました。メールに届いたコードを入力してください。");
    } catch {
      setMessage(safeFailureMessage("email_request"));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/account/email-otp/verify", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) throw new Error("email verify failed");
      announceCustomerAuthStateChanged();
      router.replace("/account");
      router.refresh();
    } catch {
      setMessage(safeFailureMessage("email_verify"));
      setBusy(false);
    }
  }

  if (loginState === "checking") {
    return <p className={styles.status}>ログイン状態を確認しています。</p>;
  }

  if (loginState === "signed_in") {
    return (
      <section className={styles.statusCard} aria-labelledby="already-signed-in">
        <h2 id="already-signed-in">すでにログインしています</h2>
        <Link className={styles.primaryLink} href="/account">
          私の鑑定ノートを見る
        </Link>
      </section>
    );
  }

  if (loginState === "unavailable") {
    return (
      <section className={styles.statusCard} aria-labelledby="auth-unavailable">
        <h2 id="auth-unavailable">現在ログインを利用できません</h2>
        <p>時間を置いてもう一度お試しいただくか、鑑定ノートの依頼画面へお戻りください。</p>
        <Link className={styles.secondaryLink} href="/request">
          鑑定ノートを依頼する
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="login-method-heading">
      <h2 id="login-method-heading">ログイン方法を選ぶ</h2>
      {message ? <p className={styles.notice} role="status">{message}</p> : null}

      {emailStep === "choice" ? (
        <div className={styles.methods}>
          {methods.google ? (
            <button type="button" onClick={() => void startGoogle()} disabled={busy}>
              {busy ? "Googleへ接続しています" : "Googleで続ける"}
            </button>
          ) : null}
          {methods.emailOtp ? (
            <button type="button" onClick={() => setEmailStep("email")} disabled={busy}>
              メールで続ける
            </button>
          ) : null}
        </div>
      ) : null}

      {emailStep === "email" ? (
        <form className={styles.form} onSubmit={requestOtp}>
          <label htmlFor="account-login-email">メールアドレス</label>
          <input
            id="account-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            maxLength={320}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "送信しています" : "コードを送信する"}
          </button>
          <button type="button" className={styles.quietButton} onClick={() => setEmailStep("choice")}>
            ログイン方法を選び直す
          </button>
        </form>
      ) : null}

      {emailStep === "otp" ? (
        <form className={styles.form} onSubmit={verifyOtp}>
          <label htmlFor="account-login-otp">確認コード</label>
          <input
            id="account-login-otp"
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            minLength={6}
            maxLength={12}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "確認しています" : "ログインする"}
          </button>
          <button type="button" className={styles.quietButton} onClick={() => {
            setOtp("");
            setEmailStep("email");
          }}>
            メールアドレスからやり直す
          </button>
        </form>
      ) : null}

      <p className={styles.privacy}>
        ログインコードや鑑定ノートのURLを、第三者に共有しないでください。
      </p>
    </section>
  );
}
