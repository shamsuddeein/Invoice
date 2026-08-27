import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer'

// react-pdf rendering of the AUSAD brand lockup — the DEFAULT logo on invoice &
// receipt PDFs when no custom logo is uploaded.
const CYAN = '#00CCFF'
const CYAN_TEXT = '#00B4D8'
const BLUE = '#003399'

export default function BrandLogoPDF() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Svg width={38} height={38} viewBox="0 0 100 100">
        <Path
          d="M 22,106 C 22,48 68,18 125,18 C 182,18 226,48 226,106 C 226,140 206,168 178,168 C 166,168 156,161 146,148 L 136,134"
          stroke={CYAN}
          strokeWidth={24}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 36,156 L 86,84 L 136,156"
          stroke={BLUE}
          strokeWidth={24}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={123} cy={58} r={13.5} fill={BLUE} />
      </Svg>
      <View style={{ marginLeft: 8 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 18, color: BLUE, letterSpacing: 0.8 }}>
          AUSAD
        </Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: CYAN_TEXT, letterSpacing: 0.3, marginTop: 1 }}>
          Innovation Limited
        </Text>
      </View>
    </View>
  )
}
