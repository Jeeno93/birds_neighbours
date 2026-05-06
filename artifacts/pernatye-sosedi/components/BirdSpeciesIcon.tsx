import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { BirdSpecies, SPECIES_IMAGES } from "@/context/AppContext";

interface Props {
  species: BirdSpecies;
  size?: number;
  style?: StyleProp<ImageStyle>;
  rounded?: boolean;
}

export function BirdSpeciesIcon({ species, size = 24, style, rounded = true }: Props) {
  const source = SPECIES_IMAGES[species] ?? SPECIES_IMAGES.other;
  return (
    <Image
      source={source}
      resizeMode="cover"
      style={[
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 0,
        },
        style,
      ]}
    />
  );
}
