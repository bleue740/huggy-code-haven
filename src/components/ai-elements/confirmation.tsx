import { CheckIcon, XIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToolState =
  | "approval-requested"
  | "approval-responded"
  | "input-streaming"
  | "input-available"
  | "output-denied"
  | "output-available"
  | "partial-call"
  | "call"
  | "result";

type ToolUIPartApproval =
  | { id: string; approved?: never; reason?: never }
  | { id: string; approved: boolean; reason?: string }
  | undefined;

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ConfirmationContextValue {
  approval: ToolUIPartApproval;
  state: ToolState;
}

const ConfirmationContext =
  createContext<ConfirmationContextValue | null>(null);

const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error(
      "Confirmation components must be used within Confirmation"
    );
  }
  return context;
};

/* ------------------------------------------------------------------ */
/*  Confirmation (root)                                                */
/* ------------------------------------------------------------------ */

export type ConfirmationProps = ComponentProps<typeof Alert> & {
  approval?: ToolUIPartApproval;
  state: ToolState;
};

export const Confirmation = ({
  className,
  approval,
  state,
  ...props
}: ConfirmationProps) => {
  if (!approval || state === "input-streaming" || state === "input-available") {
    return null;
  }

  return (
    <ConfirmationContext.Provider value={{ approval, state }}>
      <Alert
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </ConfirmationContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  ConfirmationTitle                                                   */
/* ------------------------------------------------------------------ */

export type ConfirmationTitleProps = ComponentProps<typeof AlertDescription>;

export const ConfirmationTitle = ({
  className,
  ...props
}: ConfirmationTitleProps) => (
  <AlertDescription className={cn("inline", className)} {...props} />
);

/* ------------------------------------------------------------------ */
/*  ConfirmationRequest                                                */
/* ------------------------------------------------------------------ */

export interface ConfirmationRequestProps {
  children?: ReactNode;
}

export const ConfirmationRequest = ({
  children,
}: ConfirmationRequestProps) => {
  const { state } = useConfirmation();

  if (state !== "approval-requested") {
    return null;
  }

  return <>{children}</>;
};

/* ------------------------------------------------------------------ */
/*  ConfirmationAccepted                                               */
/* ------------------------------------------------------------------ */

export interface ConfirmationAcceptedProps {
  children?: ReactNode;
}

export const ConfirmationAccepted = ({
  children,
}: ConfirmationAcceptedProps) => {
  const { approval, state } = useConfirmation();

  if (
    !approval?.approved ||
    (state !== "approval-responded" &&
      state !== "output-denied" &&
      state !== "output-available")
  ) {
    return null;
  }

  return <>{children}</>;
};

/* ------------------------------------------------------------------ */
/*  ConfirmationRejected                                               */
/* ------------------------------------------------------------------ */

export interface ConfirmationRejectedProps {
  children?: ReactNode;
}

export const ConfirmationRejected = ({
  children,
}: ConfirmationRejectedProps) => {
  const { approval, state } = useConfirmation();

  if (
    approval?.approved !== false ||
    (state !== "approval-responded" &&
      state !== "output-denied" &&
      state !== "output-available")
  ) {
    return null;
  }

  return <>{children}</>;
};

/* ------------------------------------------------------------------ */
/*  ConfirmationActions                                                */
/* ------------------------------------------------------------------ */

export type ConfirmationActionsProps = ComponentProps<"div">;

export const ConfirmationActions = ({
  className,
  ...props
}: ConfirmationActionsProps) => {
  const { state } = useConfirmation();

  if (state !== "approval-requested") {
    return null;
  }

  return (
    <div
      className={cn("flex items-center gap-2 mt-1", className)}
      {...props}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  ConfirmationAction                                                 */
/* ------------------------------------------------------------------ */

export type ConfirmationActionProps = ComponentProps<typeof Button>;

export const ConfirmationAction = (props: ConfirmationActionProps) => (
  <Button size="sm" {...props} />
);
