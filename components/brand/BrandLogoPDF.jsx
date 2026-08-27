import { View, Text, Svg, Path, Circle, Rect, Defs, LinearGradient, Stop } from '@react-pdf/renderer'

// react-pdf rendering of the AUSAD horizontal brand lockup with gradient badge
const CYAN = '#00C4FE'
const NAVY = '#06155E'

export default function BrandLogoPDF() {
  return (
    <View style={{ marginBottom: 10 }}>
      <Svg width={180} height={50} viewBox="0 0 280 78">
        <Defs>
          <LinearGradient id="pdfInnoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={CYAN} />
            <Stop offset="100%" stopColor={NAVY} />
          </LinearGradient>
        </Defs>

        {/* Symbol Mark */}
        <Path
          d="M 12,34 C 12,15 24,7 40,7 C 57,7 71,15 71,33 C 71,43 64,49 55,49"
          stroke={CYAN}
          strokeWidth={9.6}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 43,27 L 55,49"
          stroke={CYAN}
          strokeWidth={9.6}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 14,45 L 29,24 L 44,45"
          stroke={NAVY}
          strokeWidth={9.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={41} cy={18} r={4.2} fill={NAVY} />

        {/* Wordmark */}
        <Text
          x={88}
          y={38}
          style={{
            fontFamily: 'Helvetica-Bold',
            fontSize: 44,
            fill: NAVY,
          }}
        >
          AUSAD
        </Text>

        {/* Gradient Badge */}
        <Rect x={86} y={47} width={186} height={25} rx={5} fill="url(#pdfInnoGrad)" />
        <Text
          x={179}
          y={64.5}
          textAnchor="middle"
          style={{
            fontFamily: 'Helvetica-Bold',
            fontSize: 13,
            fill: '#ffffff',
          }}
        >
          Innovation Limited
        </Text>
      </Svg>
    </View>
  )
}
