import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Mail, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  frequency: "weekly" | "monthly";
  is_active: boolean;
  created_at: string;
}

export const SubscriberManager = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newFrequency, setNewFrequency] = useState<"weekly" | "monthly">("weekly");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("analytics_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscribers((data || []) as Subscriber[]);
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("analytics_subscribers")
        .insert({
          email: newEmail.trim(),
          name: newName.trim() || null,
          frequency: newFrequency,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already subscribed");
        } else {
          throw error;
        }
        return;
      }

      setSubscribers(prev => [data as Subscriber, ...prev]);
      setNewEmail("");
      setNewName("");
      setDialogOpen(false);
      toast.success("Subscriber added successfully");
    } catch (err) {
      console.error("Failed to add subscriber:", err);
      toast.error("Failed to add subscriber");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("analytics_subscribers")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setSubscribers(prev =>
        prev.map(s => (s.id === id ? { ...s, is_active: !currentStatus } : s))
      );
      toast.success(currentStatus ? "Subscription paused" : "Subscription resumed");
    } catch (err) {
      console.error("Failed to update subscriber:", err);
      toast.error("Failed to update subscription");
    }
  };

  const handleUpdateFrequency = async (id: string, frequency: "weekly" | "monthly") => {
    try {
      const { error } = await supabase
        .from("analytics_subscribers")
        .update({ frequency })
        .eq("id", id);

      if (error) throw error;

      setSubscribers(prev =>
        prev.map(s => (s.id === id ? { ...s, frequency } : s))
      );
      toast.success("Frequency updated");
    } catch (err) {
      console.error("Failed to update frequency:", err);
      toast.error("Failed to update frequency");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;

    try {
      const { error } = await supabase
        .from("analytics_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubscribers(prev => prev.filter(s => s.id !== id));
      toast.success("Subscriber removed");
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
      toast.error("Failed to remove subscriber");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Report Subscribers
            </CardTitle>
            <CardDescription>
              Manage stakeholders who receive automated analytics reports
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSubscribers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscriber</DialogTitle>
                  <DialogDescription>
                    Add a stakeholder to receive automated analytics reports
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub-email">Email Address</Label>
                    <Input
                      id="sub-email"
                      type="email"
                      placeholder="stakeholder@company.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-name">Name (Optional)</Label>
                    <Input
                      id="sub-name"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Report Frequency</Label>
                    <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as "weekly" | "monthly")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSubscriber} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Subscriber
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No subscribers yet</p>
            <p className="text-sm">Add stakeholders to receive automated reports</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {subscribers.map((subscriber) => (
                  <motion.tr
                    key={subscriber.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {subscriber.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={subscriber.frequency}
                        onValueChange={(v) => handleUpdateFrequency(subscriber.id, v as "weekly" | "monthly")}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subscriber.is_active}
                          onCheckedChange={() => handleToggleActive(subscriber.id, subscriber.is_active)}
                        />
                        <Badge
                          variant="outline"
                          className={subscriber.is_active 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-muted text-muted-foreground"
                          }
                        >
                          {subscriber.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subscriber.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
