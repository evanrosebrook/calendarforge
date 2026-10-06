import { ImageResponse } from "next/og";

export const alt = "Calendar Forge custom calendar maker with a printable monthly calendar preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const days = [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "stretch",
        background: "#f4f3ed",
        color: "#191a18",
        fontFamily: "Arial, sans-serif",
        padding: "58px 62px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 530,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "8px 52px 4px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 25, fontWeight: 700, letterSpacing: "-0.7px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              marginRight: 14,
              borderRadius: 12,
              background: "#ed5a3f",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              paddingTop: 7,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, top: 13, borderTop: "3px solid rgba(255,255,255,.65)" }} />
            31
          </div>
          Calendar Forge
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c43e29", fontSize: 18, fontWeight: 800, letterSpacing: "2.6px", textTransform: "uppercase", marginBottom: 17 }}>
            Free custom calendar maker
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 65, lineHeight: 0.98, letterSpacing: "-3.5px" }}>
            Build it. Print it. Make it yours.
          </div>
          <div style={{ color: "#686b65", fontSize: 22, lineHeight: 1.4, marginTop: 24 }}>
            1–12 months · holidays · date notes · PDF, SVG, ICS, CSV &amp; XLSX
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "#686b65", fontSize: 18 }}>
          No account required
          <div style={{ width: 5, height: 5, borderRadius: 999, background: "#ed5a3f", margin: "0 12px" }} />
          calendarforge.net
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            width: 570,
            height: 454,
            border: "2px solid #c9c6b9",
            borderRadius: 8,
            background: "#e6e1d5",
            transform: "rotate(3deg)",
          }}
        />
        <div
          style={{
            width: 570,
            height: 454,
            display: "flex",
            flexDirection: "column",
            background: "#fffefa",
            border: "2px solid #bbb9b0",
            padding: "27px 30px 28px",
            boxShadow: "0 20px 45px rgba(33,30,22,.14)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "3px solid #191a18", paddingBottom: 13 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 35, letterSpacing: "-1.3px" }}>October 2026</div>
            <div style={{ color: "#686b65", fontSize: 13, fontWeight: 700, letterSpacing: "1.5px" }}>MONTHLY PLAN</div>
          </div>
          <div style={{ display: "flex", width: "100%", padding: "14px 0 8px" }}>
            {weekdays.map((weekday) => (
              <div key={weekday} style={{ width: "14.285%", display: "flex", justifyContent: "center", color: "#686b65", fontSize: 12, fontWeight: 800 }}>
                {weekday}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", width: "100%", borderTop: "1px solid #d9d9d2", borderLeft: "1px solid #d9d9d2" }}>
            {days.map((day, index) => (
              <div
                key={`${day}-${index}`}
                style={{
                  width: "14.285%",
                  height: 57,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  borderRight: "1px solid #d9d9d2",
                  borderBottom: "1px solid #d9d9d2",
                  padding: "8px 9px",
                  background: index % 7 === 0 || index % 7 === 6 ? "#eeece3" : "#fffefa",
                  color: index < 4 ? "#aaa9a3" : "#191a18",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <span
                  style={day === 12 ? {
                    width: 28,
                    height: 28,
                    marginTop: -4,
                    marginRight: -4,
                    borderRadius: 999,
                    background: "#ed5a3f",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  } : undefined}
                >
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: -23,
            top: 17,
            width: 110,
            height: 110,
            border: "3px solid #1e4f8a",
            borderRadius: 999,
            color: "#1e4f8a",
            background: "#fffefa",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(9deg)",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
          }}
        >
          <span>Print</span>
          <span>ready</span>
        </div>
      </div>
    </div>,
    size,
  );
}
