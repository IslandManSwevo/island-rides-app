/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOnTheScreen(): R;
      toHaveDisplayValue(value: string | RegExp): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmpty(): R;
      toBeVisible(): R;
      toContainElement(element: ReactTestInstance | null): R;
      toHaveProp(prop: string, value?: any): R;
      toHaveStyle(style: object | object[]): R;
    }
  }
}

export {};