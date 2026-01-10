declare module '@lottiefiles/dotlottie-react' {
  import { Component } from 'react';

  export interface DotLottieReactProps {
    src: string;
    loop?: boolean;
    autoplay?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }

  export class DotLottieReact extends Component<DotLottieReactProps> {}
}


