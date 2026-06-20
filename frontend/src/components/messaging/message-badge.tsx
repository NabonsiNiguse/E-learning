import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useMessaging } from "@/context/messaging-context";

export function MessageBadgeButton() {
  const { unreadMessageCount } = useMessaging();

  return (
    <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Messages" asChild>
      <Link to="/messages">
        <MessageSquare className="h-4 w-4" />
        {unreadMessageCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-amber-500 border-background border-2 pointer-events-none">
            {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
