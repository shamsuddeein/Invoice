import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer'

// react-pdf rendering of the AUSAD brand lockup — the DEFAULT logo on invoice &
// receipt PDFs when no custom logo is uploaded. Drawn with native vector primitives
// for crisp PDF rasterization and vector printing.
const CYAN = '#00C4FE'
const NAVY = '#06155E'

export default function BrandLogoPDF() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Svg width={36} height={36} viewBox="0 0 100 100">
        <Path
          d="M 16,45 C 16,19 36,8 60,8 C 84,8 98,19 98,42 C 98,56 90,66 80,66 C 75,66 71,63 67,58 L 62,50"
          stroke={CYAN}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 21,68 L 43,36 L 65,68"
          stroke={NAVY}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={59.5} cy={25} r={6.2} fill={NAVY} />
      </Svg>
      <View style={{ marginLeft: 6 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 18, color: NAVY, letterSpacing: 0.8 }}>
          AUSAD
        </Text>
        <View
          style={{
            marginTop: 2,
            backgroundColor: NAVY,
            borderRadius: 3,
            paddingVertical: 2,
            paddingHorizontal: 6,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: '#FFFFFF', letterSpacing: 0.4 }}>
            Innovation Limited
          </Text>
        </View>
      </View>
    </View>
  )
}
