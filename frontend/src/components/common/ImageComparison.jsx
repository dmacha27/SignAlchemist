import { memo } from "react";
import PropTypes from "prop-types";
import { ImgComparisonSlider } from "@img-comparison-slider/react";

/**
 * ImageComparison component renders a slider that allows the user to compare two images side by side.
 *
 * @param {Object} props - The props for the component.
 * @param {string} props.firstImage - The URL or path to the first image.
 * @param {string} props.secondImage - The URL or path to the second image.
 */
const ImageComparison = memo(({ firstImage, secondImage }) => {
  return (
    <ImgComparisonSlider>
      <img slot="first" src={firstImage} alt="Original" />
      <img slot="second" src={secondImage} alt="Processed" />
      <svg
        slot="handle"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        viewBox="-8 -3 16 6"
      >
        <path
          stroke="#000"
          d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2"
          strokeWidth="1"
          fill="#fff"
        />
      </svg>
    </ImgComparisonSlider>
  );
});

ImageComparison.propTypes = {
  firstImage: PropTypes.string.isRequired, // base64 string
  secondImage: PropTypes.string.isRequired,
};

export default ImageComparison;
