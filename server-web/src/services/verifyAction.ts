
type VerificationStatus = "verified" | "failed" | "unknown";

interface DesktopWindow {
  app: string;
  minimized: boolean;
  focused: boolean;
}

interface DesktopSnapshot {
  openWindows: DesktopWindow[];
  files: {
    path: string;
    contents: string[];
    selectedFile: string | null;
  } | null;
  terminal: {
    lastLines: string[];
  } | null;
}

interface Action {
  tool: string;
  args: Record<string, unknown>;
}

interface VerificationResult {
  status: VerificationStatus;
  message: string;
}

export function verifyAction(
  action: Action,
  desktop: DesktopSnapshot,
  executionResult: "success" | "failed"
): VerificationResult {

  if (executionResult === "failed") {
    return {
      status: "failed",
      message: "Frontend reported action execution failure.",
    };
  }

  const windows = desktop.openWindows;

  switch (action.tool) {

    case "open_app": {
      const app = action.args.appId;

      if (typeof app !== "string") {
        return {
          status: "failed",
          message: "Invalid application identifier.",
        };
      }

      const found = windows.some(w => w.app === app);

      return {
        status: found ? "verified" : "failed",
        message: found
          ? `${app} is present in the desktop windows.`
          : `${app} was not found in the desktop windows.`,
      };
    }

    case "close_app": {
      const app = action.args.appId;

      if (typeof app !== "string") {
        return {
          status: "failed",
          message: "Invalid application identifier.",
        };
      }

      const stillOpen = windows.some(w => w.app === app);

      return {
        status: stillOpen ? "failed" : "verified",
        message: stillOpen
          ? `${app} is still open.`
          : `${app} is no longer open.`,
      };
    }

    case "open_folder": {
      const path = action.args.path;

      if (!Array.isArray(path) ||
          !path.every(p => typeof p === "string")) {
        return {
          status: "failed",
          message: "Invalid folder path.",
        };
      }

      const expected = path.join("/");
      const filesOpen = windows.some(w => w.app === "files");

      const matched =
        filesOpen && desktop.files?.path === expected;

      return {
        status: matched ? "verified" : "failed",
        message: matched
          ? `Folder ${expected} is open.`
          : `Folder ${expected} was not confirmed open.`,
      };
    }

    case "open_file":
      return {
        status: "unknown",
        message:
          "The snapshot does not expose which file is actively opened.",
      };

    case "run_command":
      return {
        status: "unknown",
        message:
          "Terminal history alone cannot reliably prove command success.",
      };

    default:
      return {
        status: "unknown",
        message: `No verification rule for ${action.tool}.`,
      };
  }
}
