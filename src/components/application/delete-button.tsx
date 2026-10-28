"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Submit button that asks for confirmation before deleting. */
export function DeleteButton() {
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="text-destructive"
      onClick={(e) => {
        if (!window.confirm("Delete this application and its history?")) e.preventDefault();
      }}
    >
      <Trash2 /> Delete
    </Button>
  );
}
