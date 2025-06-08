import React from 'react';
import { Circle, Svg, SvgProps } from 'react-native-svg';

interface CircleComponentProps extends SvgProps {
  size?: number;
}

const CircleComponent: React.FC<CircleComponentProps> = ({ size = 36,stroke,strokeWidth,fill = "red", ...props }) => {
  const radius = (size / 2) - 3; // subtract strokeWidth to keep circle inside SVG
  const center = size / 2;

  return (
    <Svg height={size} width={size} {...props}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
    </Svg>
  );
};

export default CircleComponent;
