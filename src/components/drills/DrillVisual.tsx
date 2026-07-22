import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { DrillVisualId } from '@/src/domain/types';
import { colors } from '@/src/theme';

type Size = 'list' | 'detail';

type Props = {
  id: DrillVisualId;
  size?: Size;
  style?: ViewStyle;
};

type Pt = { x: number; y: number };

function Dot({
  x,
  y,
  r = 3,
  fill = colors.accent,
}: {
  x: number;
  y: number;
  r?: number;
  fill?: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: fill,
      }}
    />
  );
}

function Ring({
  cx,
  cy,
  size,
  borderColor = colors.accent,
  borderWidth = 2,
  fill = 'transparent',
}: {
  cx: number;
  cy: number;
  size: number;
  borderColor?: string;
  borderWidth?: number;
  fill?: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor,
        backgroundColor: fill,
      }}
    />
  );
}

function Line({
  x1,
  y1,
  x2,
  y2,
  color = colors.accent,
  thickness = 2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  thickness?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - thickness / 2,
        width: length,
        height: thickness,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function clockPoints(cx: number, cy: number, radius: number, count: number): Pt[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count - Math.PI / 2;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  });
}

function Diagram({
  id,
  w,
  h,
}: {
  id: DrillVisualId;
  w: number;
  h: number;
}) {
  const cx = w / 2;
  const cy = h / 2;

  if (id === 'par18') {
    const pts = clockPoints(cx, cy + 2, Math.min(w, h) * 0.36, 18);
    return (
      <>
        <Ring cx={cx} cy={cy} size={Math.min(w, h) * 0.72} borderWidth={1.5} />
        <Ring
          cx={cx}
          cy={cy}
          size={14}
          borderWidth={0}
          fill={colors.text}
        />
        {pts.map((p, i) => (
          <Dot key={i} x={p.x} y={p.y} r={i % 3 === 0 ? 3.5 : 2.5} />
        ))}
      </>
    );
  }

  if (id === 'clock') {
    const pts = clockPoints(cx, cy, Math.min(w, h) * 0.34, 4);
    return (
      <>
        <Ring cx={cx} cy={cy} size={Math.min(w, h) * 0.55} borderWidth={1.5} />
        <Ring cx={cx} cy={cy} size={12} borderWidth={0} fill={colors.text} />
        {pts.map((p, i) => (
          <Dot key={i} x={p.x} y={p.y} r={4} />
        ))}
      </>
    );
  }

  if (id === 'gate') {
    const holeY = h * 0.28;
    const gateY = h * 0.58;
    const ballY = h * 0.78;
    return (
      <>
        <Ring cx={cx} cy={holeY} size={14} borderWidth={0} fill={colors.text} />
        <View
          style={{
            position: 'absolute',
            left: cx - 18,
            top: gateY - 10,
            width: 3,
            height: 20,
            backgroundColor: colors.accent,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: cx + 15,
            top: gateY - 10,
            width: 3,
            height: 20,
            backgroundColor: colors.accent,
          }}
        />
        <Dot x={cx} y={ballY} r={4} />
        <Line
          x1={cx}
          y1={ballY - 6}
          x2={cx}
          y2={holeY + 10}
          color={colors.border}
          thickness={1}
        />
      </>
    );
  }

  if (id === 'lag') {
    return (
      <>
        <Ring cx={cx} cy={h * 0.32} size={Math.min(w, h) * 0.28} borderWidth={1.5} />
        <Ring cx={cx} cy={h * 0.32} size={12} borderWidth={0} fill={colors.text} />
        <Dot x={cx} y={h * 0.78} r={4} />
        <Line
          x1={cx}
          y1={h * 0.72}
          x2={cx}
          y2={h * 0.46}
          color={colors.border}
          thickness={1}
        />
      </>
    );
  }

  if (id === 'rings') {
    return (
      <>
        <Ring cx={cx} cy={cy} size={Math.min(w, h) * 0.7} borderWidth={1.5} />
        <Ring cx={cx} cy={cy} size={Math.min(w, h) * 0.46} borderWidth={1.5} />
        <Ring cx={cx} cy={cy} size={Math.min(w, h) * 0.24} borderWidth={1.5} />
        <Ring cx={cx} cy={cy} size={10} borderWidth={0} fill={colors.text} />
      </>
    );
  }

  if (id === 'corridor') {
    const left = w * 0.32;
    const right = w * 0.68;
    return (
      <>
        <Line x1={left} y1={h * 0.18} x2={left} y2={h * 0.82} thickness={2} />
        <Line x1={right} y1={h * 0.18} x2={right} y2={h * 0.82} thickness={2} />
        <Ring cx={cx} cy={h * 0.22} size={12} borderWidth={0} fill={colors.text} />
        <Dot x={cx} y={h * 0.78} r={4} />
      </>
    );
  }

  if (id === 'ladder') {
    const rungs = [0.28, 0.48, 0.68];
    return (
      <>
        <Line
          x1={w * 0.22}
          y1={h * 0.82}
          x2={w * 0.22}
          y2={h * 0.18}
          thickness={2}
        />
        {rungs.map((y, i) => (
          <React.Fragment key={i}>
            <Line
              x1={w * 0.22}
              y1={h * y}
              x2={w * (0.42 + i * 0.12)}
              y2={h * y}
              thickness={2}
            />
            <Dot x={w * (0.5 + i * 0.12)} y={h * y} r={3.5} />
          </React.Fragment>
        ))}
        <Dot x={w * 0.22} y={h * 0.82} r={4} />
      </>
    );
  }

  // pressure — 3-6-9 stations
  const stations = [
    { x: w * 0.22, y: h * 0.7 },
    { x: w * 0.5, y: h * 0.55 },
    { x: w * 0.78, y: h * 0.38 },
  ];
  return (
    <>
      <Ring cx={cx} cy={h * 0.22} size={12} borderWidth={0} fill={colors.text} />
      {stations.map((p, i) => (
        <React.Fragment key={i}>
          <Line
            x1={p.x}
            y1={p.y}
            x2={cx}
            y2={h * 0.28}
            color={colors.border}
            thickness={1}
          />
          <Dot x={p.x} y={p.y} r={4} />
        </React.Fragment>
      ))}
    </>
  );
}

export function DrillVisual({ id, size = 'detail', style }: Props) {
  const dims = useMemo(() => {
    if (size === 'list') return { w: 56, h: 40 };
    return { w: 280, h: 168 };
  }, [size]);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${id} drill diagram`}
      style={[
        styles.frame,
        size === 'list' ? styles.listFrame : styles.detailFrame,
        { width: size === 'list' ? dims.w : '100%', aspectRatio: dims.w / dims.h },
        style,
      ]}
    >
      <View style={styles.canvas}>
        <Diagram id={id} w={dims.w} h={dims.h} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  listFrame: {
    borderRadius: 6,
  },
  detailFrame: {
    borderRadius: 8,
    maxWidth: 420,
    alignSelf: 'stretch',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
});
