import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer'

// react-pdf rendering of the AUSAD brand lockup — the DEFAULT logo on invoice &
// receipt PDFs when no custom logo is uploaded. react-pdf's <Image> can only
// rasterize PNG/JPEG, so the default is drawn with native <Svg> primitives here.
// The mark uses the same swoosh path as the on-screen BrandLogo; it's filled solid
// navy (react-pdf stroke gradients are unreliable) while the on-screen/PNG paths
// keep the cyan→navy gradient. Sized to sit in the header logo slot (~34px mark,
// marginBottom mirrors the old <Image> style).
const NAVY = '#1E3A8A'

// Cubic bézier swoosh in a 48×48 box — identical to BrandLogo's MARK_PATH.
const MARK_PATH = 'M6 39 C 11 20 27 12 41 15'

export default function BrandLogoPDF() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Svg width={34} height={34} viewBox="0 0 48 48">
        <Path d={MARK_PATH} stroke={NAVY} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Circle cx={41} cy={11} r={4.6} fill={NAVY} />
      </Svg>
      <View style={{ marginLeft: 8 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 20, color: NAVY, letterSpacing: 0.5 }}>AUSAD</Text>
        <View
          style={{
            marginTop: 3,
            backgroundColor: NAVY,
            borderRadius: 8,
            paddingVertical: 2,
            paddingHorizontal: 7,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#FFFFFF', letterSpacing: 0.4 }}>
            Innovation Limited
          </Text>
        </View>
      </View>
    </View>
  )
}
