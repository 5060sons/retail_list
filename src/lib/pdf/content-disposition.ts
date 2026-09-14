// HTTP 헤더 값은 ASCII(ByteString)만 허용되므로, 한글이 포함된 파일명은
// RFC 5987 형식(filename*=UTF-8''...)으로 인코딩해서 함께 내려준다.
// filename="..."은 한글을 제거한 안전한 대체값(구형 클라이언트용), filename*=은 실제 한글 파일명(최신 브라우저용).
export function contentDisposition(filename: string, disposition: "inline" | "attachment" = "inline"): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
