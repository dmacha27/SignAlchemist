import { memo } from 'react';
import { ImgComparisonSlider } from '@img-comparison-slider/react';

const ImageComparison = memo(({ firstImage, secondImage }) => {
  return (
    <ImgComparisonSlider>
      <img slot="first" src={firstImage} />
      <img slot="second" src={secondImage} />
      <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
        <path
          stroke="#000"
          d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2"
          strokeWidth="1"
          fill="#fff"
        />
      </svg>
    </ImgComparisonSlider>
  );
}
);

export default ImageComparison;