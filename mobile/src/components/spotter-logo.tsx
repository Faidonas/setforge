import { Image, type ImageStyle, type StyleProp } from 'react-native';

import artworkMetadata from '@/assets/images/spotter/artwork.json';

type SpotterLogoProps = {
  /** Display width; the approved artwork keeps its original proportions. */
  width?: number;
  /** The surface behind the logo, so the wordmark stays legible. */
  appearance?: 'dark' | 'light';
  markOnly?: boolean;
  style?: StyleProp<ImageStyle>;
};

const artwork = {
  dark: {
    logo: require('@/assets/images/spotter/logo-dark.png'),
    mark: require('@/assets/images/spotter/mark-dark.png'),
  },
  light: {
    logo: require('@/assets/images/spotter/logo-light.png'),
    mark: require('@/assets/images/spotter/mark-light.png'),
  },
};

/** The approved Spotter artwork, shared by every brand placement. */
export function SpotterLogo({
  width = 180,
  appearance = 'dark',
  markOnly = false,
  style,
}: SpotterLogoProps) {
  const aspectRatio = markOnly ? artworkMetadata.mark.aspectRatio : artworkMetadata.logo.aspectRatio;
  return (
    <Image
      accessibilityLabel="Spotter"
      accessibilityRole="image"
      resizeMode="contain"
      source={markOnly ? artwork[appearance].mark : artwork[appearance].logo}
      style={[
        { width, height: width / aspectRatio },
        style,
      ]}
    />
  );
}
