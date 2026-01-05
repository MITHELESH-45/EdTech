import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, LogOut, Save, Edit2 } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return <></>;
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleSave = () => {
    updateProfile({ name: editName, email: editEmail });
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-1">
        <ToolSidebar />

        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-6" data-testid="heading-profile">
              My Profile
            </h1>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle data-testid="text-user-name">{user.name}</CardTitle>
                    <CardDescription data-testid="text-user-email">{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        data-testid="input-edit-email"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} data-testid="button-save-profile">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(user.name);
                          setEditEmail(user.email);
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 py-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="font-medium" data-testid="text-joined-date">
                          {format(new Date(user.joinedDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Sign out of your account. You can sign back in anytime.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  );
}
