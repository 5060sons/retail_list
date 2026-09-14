"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: {
          objectType: "text";
          text: string;
          link: { mobileWebUrl: string; webUrl: string };
        }) => void;
      };
    };
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export function KakaoShareButton({
  getShareUrl,
  title,
  description,
}: {
  getShareUrl: () => Promise<{ url: string } | { error: string }>;
  title: string;
  description: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  if (!KAKAO_JS_KEY) {
    return (
      <p className="text-xs text-gray-400">
        카카오톡 공유 기능을 쓰려면 Kakao Developers 키 설정이 필요합니다.
      </p>
    );
  }

  async function handleShare() {
    setStatus("loading");
    setError(null);
    setDebugUrl(null);

    const result = await getShareUrl();
    if ("error" in result) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setDebugUrl(result.url);
    console.log("[kakao-share] generated url:", result.url);
    console.log("[kakao-share] KAKAO_JS_KEY:", KAKAO_JS_KEY);

    if (!window.Kakao) {
      setError("카카오톡 SDK 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setStatus("error");
      return;
    }

    console.log("[kakao-share] Kakao already initialized?", window.Kakao.isInitialized());
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY!);
      console.log("[kakao-share] called init, now initialized?", window.Kakao.isInitialized());
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: "text",
        text: `${title}\n${description}`,
        link: { mobileWebUrl: result.url, webUrl: result.url },
      });
    } catch (e) {
      console.error("[kakao-share] sendDefault threw:", e);
      setError(`카카오 SDK 호출 중 오류: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
      return;
    }

    setStatus("idle");
  }

  return (
    <>
      <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js" strategy="afterInteractive" />
      <button
        type="button"
        onClick={handleShare}
        disabled={status === "loading"}
        className="rounded-md border border-yellow-400 bg-yellow-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-400 disabled:opacity-50"
      >
        {status === "loading" ? "링크 생성 중..." : "카카오톡으로 공유"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {debugUrl && (
        <p className="mt-1 max-w-md break-all text-xs text-gray-400">생성된 링크: {debugUrl}</p>
      )}
    </>
  );
}
