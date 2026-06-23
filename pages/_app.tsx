import "@/styles/globals.css";
import "../documents/design_handoff_court/court.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
