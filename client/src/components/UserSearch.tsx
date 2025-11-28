import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Card } from "@/components/ui/card";
import type { User } from "@shared/schema";

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

export function UserSearch({ onSelectUser }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/search/${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(query.length > 0)}
            className="pl-9"
            data-testid="input-user-search"
          />
        </div>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                  data-testid={`button-user-result-${user.username}`}
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.username}</p>
                    {user.firstName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
