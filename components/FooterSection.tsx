import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

import { foot as fs } from "../styles/main";

const LINKS = ["About", "Contact", "Privacy", "Terms"];

export default function FooterSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <View style={fs.section}>
      <View style={fs.inner}>
        <View style={fs.logoWrap}>
          <Image
            source={require("../assets/images/logo.png")}
            style={fs.logoImg}
            resizeMode="cover"
          />
          <Text style={fs.logoName}>MEMORO</Text>
        </View>

        <View style={fs.links}>
          {LINKS.map((item) => (
            <TouchableOpacity key={item}>
              <Text
                style={[fs.link, hovered === item && fs.linkActive]}
                // @ts-ignore web-only
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={fs.copy}>© 2026 Memoro</Text>
      </View>
    </View>
  );
}
