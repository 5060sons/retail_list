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
          objectType: "feed";
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons: {
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }[];
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

    const result = await getShareUrl();
    if ("error" in result) {
      setError(result.error);
      setStatus("error");
      return;
    }

    if (!window.Kakao) {
      setError("카카오톡 SDK 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setStatus("error");
      return;
    }
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY!);
    }

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}/icon.png`,
        link: { mobileWebUrl: result.url, webUrl: result.url },
      },
      buttons: [
        {
          title: "거래명세서 보기",
          link: { mobileWebUrl: result.url, webUrl: result.url },
        },
      ],
    });

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
    </>
  );
}
