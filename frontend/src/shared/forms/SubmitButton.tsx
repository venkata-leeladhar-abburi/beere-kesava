/**
 * One implementation of "disabled + busy while submitting" instead of each
 * form hand-rolling its own isSubmitting boolean and spinner.
 */
import { Button, type ButtonProps } from "../ui/primitives/Button";
import { Icon } from "../ui/primitives/Icon";

export interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  submitting: boolean;
  submittingLabel?: string;
}

export function SubmitButton({ submitting, submittingLabel = "Saving…", children, disabled, ...rest }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={submitting || disabled} {...rest}>
      {submitting ? (
        <>
          <Icon name="spinner" size="sm" className="animate-spin" />
          {submittingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
