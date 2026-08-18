import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { T, F } from "@/features/dashboards/components/beere-dashboard/theme";

export interface StatItem {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
  crimson?: boolean;
  goldVal?: boolean;
  onClick?: () => void;
}

export interface LuxuryStatsCardProps {
  stats: StatItem[];
  className?: string;
  style?: React.CSSProperties;
}

function SmallTile({ item, isLastInRow = false }: { item: StatItem; isLastInRow?: boolean }) {
  if (!item) return null;
  return (
    <motion.div
      whileHover={item.onClick ? { backgroundColor: "rgba(245,232,208,0.06)" } : undefined}
      onClick={item.onClick}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "26px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderRight: isLastInRow ? "none" : "1px solid rgba(245,232,208,0.12)",
        cursor: item.onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      {/* 1. Icon (Top) */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 13,
        background: "rgba(245,232,208,0.08)",
        border: "1px solid rgba(245,232,208,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginBottom: 4,
      }}>
        {item.icon}
      </div>

      {/* 2. Number (Below Icon) */}
      <div style={{
        fontFamily: F.display,
        fontWeight: 400,
        fontSize: "clamp(32px, 4.5vw, 52px)",
        color: item.crimson ? "#F47B72" : item.goldVal ? T.goldLight : "#FFFDF9",
        lineHeight: 1.0,
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {item.value}
      </div>

      {/* 3. Heading (Below Number) */}
      <div style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: "clamp(10px, 1.3vw, 12px)",
        color: "rgba(245,232,208,0.90)",
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        lineHeight: 1.35,
        marginTop: 2,
      }}>
        {item.label}
      </div>

      {/* 4. Subtitle (Below Heading) */}
      {item.sub && (
        <div style={{
          fontFamily: F.ui,
          fontWeight: 500,
          fontSize: "clamp(11px, 1.2vw, 12px)",
          color: "rgba(245,232,208,0.70)",
          letterSpacing: "0.1px",
          lineHeight: 1.4,
          marginTop: 2,
        }}>
          {item.sub}
        </div>
      )}
    </motion.div>
  );
}

function FeaturedTile({ item }: { item: StatItem }) {
  if (!item) return null;
  return (
    <motion.div
      whileHover={item.onClick ? { backgroundColor: "rgba(200,155,71,0.24)" } : undefined}
      onClick={item.onClick}
      style={{
        padding: "24px 24px 26px",
        background: "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.08) 100%)",
        borderTop: "1px solid rgba(245,232,208,0.12)",
        borderBottom: "1px solid rgba(245,232,208,0.12)",
        position: "relative",
        cursor: item.onClick ? "pointer" : "default",
      }}
    >
      <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#C89B47,#E7C983)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: Icon on left, action on right */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: "rgba(200,155,71,0.18)",
            border: "1px solid rgba(200,155,71,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {item.icon}
          </div>
          {item.onClick && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid rgba(200,155,71,0.38)",
                background: "rgba(200,155,71,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={14} color={T.goldLight} />
            </motion.div>
          )}
        </div>

        {/* Number */}
        <div style={{
          fontFamily: F.display,
          fontWeight: 400,
          fontSize: "clamp(32px, 4.5vw, 52px)",
          color: T.goldLight,
          lineHeight: 1.0,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {item.value}
        </div>

        {/* Heading */}
        <div style={{
          fontFamily: F.ui,
          fontWeight: 700,
          fontSize: "clamp(11px, 1.4vw, 12px)",
          color: "rgba(200,155,71,1)",
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          lineHeight: 1.35,
          marginTop: 2,
        }}>
          {item.label}
        </div>

        {/* Subtitle */}
        {item.sub && (
          <div style={{
            fontFamily: F.ui,
            fontWeight: 500,
            fontSize: "clamp(11px, 1.2vw, 12px)",
            color: "rgba(231,201,131,0.95)",
            letterSpacing: "0.1px",
            lineHeight: 1.4,
            marginTop: 2,
          }}>
            {item.sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DesktopRow({ stats, className = "", style }: LuxuryStatsCardProps) {
  return (
    <div
      className={`hidden xl:flex w-full ${className}`}
      style={{
        background: "linear-gradient(135deg, #4A061B 0%, #2C0913 100%)",
        borderRadius: 24,
        alignItems: "stretch",
        boxShadow: "0 24px 72px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,155,71,0.16)",
        minHeight: 140,
        overflow: "hidden",
        ...style,
      }}
    >
      {stats.map((item, i) => (
        <motion.div
          key={item.label}
          whileHover={item.onClick ? { backgroundColor: "rgba(245,232,208,0.06)" } : undefined}
          onClick={item.onClick}
          style={{
            flex: "1 1 0px",
            minWidth: 0,
            padding: "20px 16px",
            background: item.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
            borderRight: i < stats.length - 1 ? "1px solid rgba(245,232,208,0.12)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "relative",
            cursor: item.onClick ? "pointer" : "default",
          }}
        >
          {item.highlight && (
            <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#C89B47,#E7C983)" }} />
          )}

          {/* Left: Icon Box */}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: item.highlight ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.08)",
            border: `1px solid ${item.highlight ? "rgba(200,155,71,0.42)" : "rgba(245,232,208,0.14)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {item.icon}
          </div>

          {/* Right Column: Heading -> Number -> Subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 1. Heading (Top) */}
            <div style={{
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: "clamp(10px, 1.3vw, 12px)",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              marginBottom: 4,
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.3,
              color: item.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)",
            }}>
              {item.label}
            </div>

            {/* 2. Number (Middle) */}
            <div style={{
              fontFamily: F.display,
              fontWeight: 400,
              fontSize: "clamp(28px, 3.5vw, 44px)",
              color: item.crimson ? "#F47B72" : item.highlight || item.goldVal ? T.goldLight : "#FFFDF9",
              lineHeight: 1.0,
              marginBottom: 4,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}>
              {item.value}
            </div>

            {/* 3. Subtitle (Bottom) */}
            {item.sub && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontFamily: F.ui,
                  fontWeight: 500,
                  fontSize: "clamp(11px, 1.2vw, 12px)",
                  color: item.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.70)",
                  letterSpacing: "0.1px",
                  lineHeight: 1.3,
                }}>
                  {item.sub}
                </span>
                {item.highlight && item.onClick && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "1px solid rgba(200,155,71,0.38)",
                      background: "rgba(200,155,71,0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={10} color={T.goldLight} />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LuxuryStatsCard({ stats, className = "", style }: LuxuryStatsCardProps) {
  if (!stats || stats.length === 0) return null;

  // Render stacked grid for mobile/tablet (< xl)
  const renderStackedGrid = () => {
    if (stats.length === 5) {
      const featuredIdx = stats.findIndex((s) => s.highlight);
      const hiIdx = featuredIdx >= 0 ? featuredIdx : 2;
      const featuredItem = stats[hiIdx];
      const otherItems = stats.filter((_, i) => i !== hiIdx);
      const top2 = otherItems.slice(0, 2);
      const bottom2 = otherItems.slice(2, 4);

      return (
        <div
          className={`xl:hidden ${className}`}
          style={{
            background: "linear-gradient(135deg, #4A061B 0%, #2C0913 100%)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 24px 72px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,155,71,0.16)",
            position: "relative",
            zIndex: 20,
            ...style,
          }}
        >
          {/* Top Row: 2 tiles */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(245,232,208,0.12)" }}>
            <SmallTile item={top2[0]} />
            <SmallTile item={top2[1]} isLastInRow />
          </div>

          {/* Middle Row: Featured Full-Width Tile */}
          <FeaturedTile item={featuredItem} />

          {/* Bottom Row: 2 tiles */}
          <div style={{ display: "flex" }}>
            <SmallTile item={bottom2[0]} />
            <SmallTile item={bottom2[1]} isLastInRow />
          </div>
        </div>
      );
    }

    if (stats.length === 4) {
      const top2 = stats.slice(0, 2);
      const bottom2 = stats.slice(2, 4);

      return (
        <div
          className={`xl:hidden ${className}`}
          style={{
            background: "linear-gradient(135deg, #4A061B 0%, #2C0913 100%)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 24px 72px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,155,71,0.16)",
            position: "relative",
            zIndex: 20,
            ...style,
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid rgba(245,232,208,0.12)" }}>
            <SmallTile item={top2[0]} />
            <SmallTile item={top2[1]} isLastInRow />
          </div>
          <div style={{ display: "flex" }}>
            <SmallTile item={bottom2[0]} />
            <SmallTile item={bottom2[1]} isLastInRow />
          </div>
        </div>
      );
    }

    const rows: StatItem[][] = [];
    for (let i = 0; i < stats.length; i += 2) {
      rows.push(stats.slice(i, i + 2));
    }

    return (
      <div
        className={`xl:hidden ${className}`}
        style={{
          background: "linear-gradient(135deg, #4A061B 0%, #2C0913 100%)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 72px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,155,71,0.16)",
          position: "relative",
          zIndex: 20,
          ...style,
        }}
      >
        {rows.map((row, rIdx) => (
          <div
            key={rIdx}
            style={{
              display: "flex",
              borderBottom: rIdx < rows.length - 1 ? "1px solid rgba(245,232,208,0.12)" : "none",
            }}
          >
            <SmallTile item={row[0]} />
            {row[1] ? <SmallTile item={row[1]} isLastInRow /> : <div style={{ flex: 1 }} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <DesktopRow stats={stats} className={className} style={style} />
      {renderStackedGrid()}
    </>
  );
}
