/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FF5E3A'; // Naranja deportivo vibrante
const tintColorDark = '#FF6B4A';

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    primary: '#FF5E3A',
    secondary: '#5856D6',
    success: '#34C759',
    card: '#F2F2F7',
    border: '#E5E5EA',
    accent: '#FF9500',
  },
  dark: {
    text: '#F2F2F7',
    background: '#121214',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#48484A',
    tabIconSelected: tintColorDark,
    primary: '#FF6B4A',
    secondary: '#7D7AFF',
    success: '#30D158',
    card: '#1C1C1E',
    border: '#2C2C2E',
    accent: '#FF9F0A',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
