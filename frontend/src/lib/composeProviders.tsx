import React from "react";

type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Collapses a list of context providers into a single component, so mounting
 * N providers reads as one flat list instead of N levels of JSX indentation.
 * Order matters: the first provider in the array is outermost.
 */
export function composeProviders(providers: ProviderComponent[]): ProviderComponent {
  return function ComposedProviders({ children }: { children: React.ReactNode }) {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as React.ReactElement | React.ReactNode,
    ) as React.ReactElement;
  };
}
