export function BackgroundScene() {
  return (
    <>
      <div className="bg-scene" aria-hidden="true">
        <div
          className="blob animate-float1"
          style={{
            width: 640, height: 640, top: "-180px", left: "-140px",
            background: "radial-gradient(circle, rgba(110,86,207,0.35), transparent 70%)",
          }}
        />
        <div
          className="blob animate-float2"
          style={{
            width: 560, height: 560, top: "10%", right: "-200px",
            background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)",
          }}
        />
        <div
          className="blob animate-float3"
          style={{
            width: 520, height: 520, bottom: "-160px", left: "20%",
            background: "radial-gradient(circle, rgba(110,86,207,0.18), transparent 70%)",
          }}
        />
        <div
          className="blob animate-float1"
          style={{
            width: 460, height: 460, bottom: "5%", right: "8%",
            background: "radial-gradient(circle, rgba(34,211,238,0.14), transparent 70%)",
            animationDirection: "reverse",
          }}
        />
      </div>
      <div className="noise" aria-hidden="true" />
    </>
  );
}
