import { Text, View } from "react-native";

import { dashboard as s } from "../../styles/screens/dashboard.styles";

export default function DashboardFooter({ beige = false }: { beige?: boolean }) {
  return (
    <View style={[s.dashboardFooter, beige && s.dashboardFooterBeige]}>
      <Text style={s.dashboardFooterBrand}>MEMORO</Text>
      <Text style={s.dashboardFooterText}>© 2026 Memoro · Help · Privacy · Terms</Text>
    </View>
  );
}
