import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth-actions";
import { getOptionalUser } from "@/lib/session";

/** Signed-in user's name and a sign-out button. Reads the session. */
export async function UserMenu() {
  const user = await getOptionalUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-sm text-muted-foreground md:inline" title={user.email}>
        {user.name}
      </span>
      <form action={signOutAction}>
        <Button variant="ghost" size="icon" type="submit" aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}
