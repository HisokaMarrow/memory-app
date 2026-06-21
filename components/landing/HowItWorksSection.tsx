import { View, Text, useWindowDimensions } from "react-native";
import { how as hw } from "./HowItWorksSection.styles";

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: "🎯", title: "Accept a quest",           desc: "The system assigns focused quests for sharper memory, faster maths, richer vocabulary, or clearer thinking." },
  { n: "02", icon: "🧘", title: "Train daily — 2 to 5 min", desc: "Focused micro-sessions, scientifically ordered for maximum cognitive transfer." },
  { n: "03", icon: "📈", title: "Track your progress",      desc: "Watch your scores, streaks and capabilities climb — with data that makes improvement visible." },
];

export default function HowItWorksSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const last = STEPS.length - 1;
  return (
    <View nativeID="how-it-works" style={[hw.section, isMobile && hw.sectionMobile]}>
      <View style={[hw.inner, isMobile && hw.innerMobile]}>
        <View>
          <Text style={hw.eyebrow}>How It Works</Text>
          <Text style={[hw.h2, isMobile && hw.h2Mobile]}>Simple to start.{"\n"}Built to last.</Text>
          <Text style={[hw.subText, isMobile && hw.subTextMobile]}>
            Consistency over intensity. Five minutes a day outperforms one hour a week — every time.
          </Text>
        </View>
        <View>
          {STEPS.map((step, i) => (
            <View key={step.n} style={i < last ? hw.stepPad : hw.stepPadLast}>
              <View style={[hw.stepRow, isMobile && hw.stepRowMobile]}>
                <View style={hw.stepLeft}>
                  <View style={[hw.stepIconWrap, isMobile && hw.stepIconWrapMobile]}><Text style={hw.stepIconText}>{step.icon}</Text></View>
                  {i < last && <View style={hw.stepLine} />}
                </View>
                <View style={hw.stepContent}>
                  <Text style={hw.stepNum}>STEP {step.n}</Text>
                  <Text style={hw.stepTitle}>{step.title}</Text>
                  <Text style={hw.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
