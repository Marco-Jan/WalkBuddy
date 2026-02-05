declare module 'react-icons/fa' {
  import { SVGAttributes, ReactElement } from 'react';

  interface IconProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    title?: string;
  }
  type Icon = (props: IconProps) => ReactElement;

  export const FaPaw: Icon;
  export const FaInbox: Icon;
  export const FaUser: Icon;
  export const FaSignOutAlt: Icon;
  export const FaSignInAlt: Icon;
  export const FaUserPlus: Icon;
  export const FaShieldAlt: Icon;
  export const FaClock: Icon;
  export const FaCircle: Icon;
  export const FaMapMarkerAlt: Icon;
  export const FaEnvelope: Icon;
  export const FaSave: Icon;
  export const FaArrowLeft: Icon;
  export const FaPaperPlane: Icon;
}
