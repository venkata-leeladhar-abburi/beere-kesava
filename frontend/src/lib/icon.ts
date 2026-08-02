import type { ComponentType } from "react";

/**
 * Props accepted by every icon component used in this app.
 *
 * `size` must be `string | number`, not `number`: both `lucide-react` and
 * `@phosphor-icons/react` type it that way (they forward it to the SVG
 * width/height attributes, which accept CSS lengths like "1em"). Declaring
 * it as `number` makes every icon fail to type-check against the alias.
 */
export interface IconProps {
  size?: string | number;
  color?: string;
}

/**
 * A renderable icon. Use this instead of hand-writing
 * `React.ComponentType<{ size?: number; color?: string }>` — that shape was
 * duplicated across six files and did not accept lucide icons.
 */
export type IconComponent = ComponentType<IconProps>;
