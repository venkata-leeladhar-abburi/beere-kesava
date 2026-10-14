import { lazy, Suspense, type ComponentProps } from "react";

/**
 * The camera scanner's decoder (@zxing, ~450 KB before compression) loads the
 * first time a scanner opens, not with the app: most sessions never scan.
 * The implementation renders nothing while closed, so skipping it entirely
 * until `open` changes nothing a caller can see.
 */
const Impl = lazy(() =>
  import("./CameraScannerModalImpl").then((m) => ({ default: m.CameraScannerModal }))
);

export function CameraScannerModal(props: ComponentProps<typeof Impl>) {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <Impl {...props} />
    </Suspense>
  );
}
