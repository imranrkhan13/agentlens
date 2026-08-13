import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 112, background: "#191b17", position: "relative" }}>
      <div style={{ width: 292, height: 292, display: "flex", border: "38px solid #d9ff57", borderRadius: 999, position: "relative", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 92, height: 92, display: "flex", borderRadius: 999, background: "#f6b63f", boxShadow: "0 0 0 28px #191b17" }} />
        <div style={{ width: 54, height: 54, display: "flex", borderRadius: 999, background: "#fffdf7", position: "absolute", right: -44, top: 10 }} />
      </div>
    </div>,
    size,
  );
}
