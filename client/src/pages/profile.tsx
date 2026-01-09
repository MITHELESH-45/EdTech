import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, LogOut, Save, Edit2, Shield, Award, BookOpen, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

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
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2" data-testid="heading-profile">
                My Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </motion.div>

            {/* Profile Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-1" data-testid="text-user-name">{user.name}</CardTitle>
                      <CardDescription className="text-base mb-3" data-testid="text-user-email">{user.email}</CardDescription>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified Account
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {format(new Date(user.joinedDate), "MMM yyyy")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          data-testid="input-edit-name"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          data-testid="input-edit-email"
                          className="h-11"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={handleSave} data-testid="button-save-profile" className="flex-1">
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
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Full Name</p>
                          <p className="text-base font-semibold">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-chart-1" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Email Address</p>
                          <p className="text-base font-semibold break-all">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-chart-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Member Since</p>
                          <p className="text-base font-semibold" data-testid="text-joined-date">
                            {format(new Date(user.joinedDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center flex-shrink-0">
                          <Award className="h-5 w-5 text-chart-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Account Status</p>
                          <p className="text-base font-semibold">Active</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        data-testid="button-edit-profile"
                        className="w-full md:w-auto"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Profile Information
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-4 md:grid-cols-3"
            >
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <Badge variant="outline" className="bg-primary/10 border-primary/30">0</Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Courses Completed</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-gradient-to-br from-chart-1/5 to-chart-1/10 border-chart-1/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-8 w-8 text-chart-1" />
                    <Badge variant="outline" className="bg-chart-1/10 border-chart-1/30">0</Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Activity Points</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-8 w-8 text-chart-4" />
                    <Badge variant="outline" className="bg-chart-4/10 border-chart-4/30">0</Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Actions
                  </CardTitle>
                  <CardDescription>
                    Sign out of your account. You can sign back in anytime.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleLogout} data-testid="button-logout" className="w-full md:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
    </div>
  );
}
