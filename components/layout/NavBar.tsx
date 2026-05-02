import { useState } from "react";
import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import { router } from "expo-router";

import { HOVER } from "../../styles/web";
import { s as hs } from "./NavBar.styles";

const links = [
  { label: "How It Works", id: "how-it-works"  },
  { label: "Train",        id: "what-you-train" },
  { label: "Memory Test",  id: "memory-test"    },
  { label: "Vault",        id: "vault"          },
];

export default function NavBar({
  scrolled,
  onNavClick,
}: {
  scrolled: boolean;
  onNavClick?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  function handleNavClick(id: string) {
    if (onNavClick) {
      onNavClick(id);
    } else if (Platform.OS === "web") {
      sessionStorage.setItem("scrollTo", id);
      router.push("/");
    }
  }

  return (
    <View style={[hs.root, scrolled && hs.rootScrolled]}>
      <TouchableOpacity
        style={hs.logo}
        onPress={() => handleNavClick("page-top")}
      >
        <Image source={require("../../assets/images/logo.png")} style={hs.logoImg} resizeMode="cover" />
        <Text style={hs.logoName}>MEMORO</Text>
      </TouchableOpacity>

      <View style={hs.nav}>
        {links.map((l) => (
          <TouchableOpacity key={l.id} onPress={() => handleNavClick(l.id)}>
            <Text
              style={[hs.navLink, hovered === l.id && hs.navLinkActive]}
              // @ts-ignore web-only
              onMouseEnter={() => setHovered(l.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={hs.btnRow}>
        <TouchableOpacity
          style={hs.btnFilled}
          onPress={() => router.push("/login")}
          // @ts-ignore web-only
          onMouseEnter={(e: any) => { e.currentTarget.style.opacity = HOVER.navBtnOpacity; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.opacity = HOVER.navBtnOpacityBase; }}
        >
          <Text style={hs.btnFilledText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
