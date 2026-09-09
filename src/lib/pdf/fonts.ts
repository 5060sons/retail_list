import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "NotoSansKR",
    fonts: [
      { src: path.join(process.cwd(), "src/lib/pdf/fonts/NotoSansKR-Regular.woff") },
      {
        src: path.join(process.cwd(), "src/lib/pdf/fonts/NotoSansKR-Bold.woff"),
        fontWeight: "bold",
      },
    ],
  });
}
