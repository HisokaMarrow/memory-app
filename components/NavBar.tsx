import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";

import { s as hs } from "../styles/header";
import { HOVER } from "../styles/main";

export default function NavBar({
  scrolled,
  onNavClick,
}: {
  scrolled: boolean;
  onNavClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const links = [
    { label: "How It Works", id: "how-it-works"  },
    { label: "Train",        id: "what-you-train" },
    { label: "Vault",        id: "vault"          },
  ];

  return (
    <View style={[hs.root, scrolled && hs.rootScrolled]}>
      <TouchableOpacity style={hs.logo} onPress={() => {}}>
        <Image source={require("../assets/images/logo.png")} style={hs.logoImg} resizeMode="cover" />
        <Text style={hs.logoName}>MEMORO</Text>
      </TouchableOpacity>

      <View style={hs.nav}>
        {links.map((l) => (
          <TouchableOpacity key={l.id} onPress={() => onNavClick(l.id)}>
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
          // @ts-ignore
          onMouseEnter={(e: any) => { e.currentTarget.style.opacity = HOVER.navBtnOpacity; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.opacity = HOVER.navBtnOpacityBase; }}
        >
          <Text style={hs.btnFilledText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
