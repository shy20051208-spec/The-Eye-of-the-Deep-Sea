import * as React from 'react';

declare global {
  namespace JSX {
    type Element = React.ReactElement;
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}
export {};
