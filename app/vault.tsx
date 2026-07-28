import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import DashboardShell from "../components/dashboard/DashboardShell";
import { dashboard as s } from "../styles/screens/dashboard.styles";

// The Vault is intentionally locked. Gating it at the page level means the
// real technique library never renders no matter how /vault is reached
// (sidebar, header, or a typed URL).
export default function VaultScreen() {
  return (
    <DashboardShell
      active="vault"
      lightHeader
      title="Vault"
      subtitle="Memory techniques — coming soon."
    >
      {({ isMobile }) => (
        <View style={s.vaultLockWrap}>
          <View style={[s.vaultLockCard, isMobile && s.vaultLockCardMobile]}>
            <View style={s.vaultLockIcon}>
              <Feather name="lock" size={34} color="#E85D2A" />
            </View>
            <View style={s.vaultLockBadge}>
              <Feather name="clock" size={12} color="#E85D2A" />
              <Text style={s.vaultLockBadgeText}>Coming soon</Text>
            </View>
            <Text style={s.vaultLockTitle}>The Vault is locked</Text>
            <Text style={s.vaultLockText}>
              We&rsquo;re building a library of proven memory techniques — the methods memory
              champions actually use — with guided lessons you can practise right here. It&rsquo;ll
              unlock soon.
            </Text>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}
