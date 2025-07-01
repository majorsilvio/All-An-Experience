import { Pressable, PressableProps, TextStyle } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedText } from "./ThemedText";

export type ThemedButtonProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  text: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  textStyle?: TextStyle;
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  text,
  type = "default",
  textStyle,
  ...otherProps
}: ThemedButtonProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "buttonBackground"
  );
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, "buttontext");

  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor,
          flex: 1,
          paddingVertical: 20,
          paddingHorizontal: 10,
          borderRadius: 15,
          opacity: pressed ? 0.5 : 1
        },
      ]}
      {...otherProps}
    >
      <ThemedText type={type} style={[textStyle, { color: textColor }]}>{text}</ThemedText>
    </Pressable>
  );
}
