import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 38, background: "#191b17" }}>
      <div style={{ width: 104, height: 104, display: "flex", alignItems: "center", justifyContent: "center", border: "14px solid #d9ff57", borderRadius: 999, position: "relative" }}>
        <div style={{ width: 34, height: 34, display: "flex", borderRadius: 999, background: "#f6b63f", boxShadow: "0 0 0 10px #191b17" }} />
        <div style={{ width: 18, height: 18, display: "flex", borderRadius: 999, background: "#fffdf7", position: "absolute", right: -17, top: 5 }} />
      </div>
    </div>,
    size,
  );
}
