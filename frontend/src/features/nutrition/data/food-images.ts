import type { ImageSourcePropType } from 'react-native';

export const foodImages: Partial<Record<string, ImageSourcePropType>> = {
  chicken: require('../../../../assets/images/preview-chicken.jpg'),
  avocado: require('../../../../assets/images/preview-avocado.jpg'),
  bread: require('../../../../assets/images/preview-bread.jpg'),
};
