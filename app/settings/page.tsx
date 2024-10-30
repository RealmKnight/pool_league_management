"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Format = "Singles" | "Doubles" | "Scotch Doubles" | "Mixed";
type Availability = Record<string, { start: string; end: string } | null>;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FORMATS: Format[] = ["Singles", "Doubles", "Scotch Doubles", "Mixed"];
const RULES = ["APA", "BCA", "Bar/Home"];

const generateTimeOptions = () => {
  const times: string[] = [];

  // Add 06:00 to 23:30
  for (let hour = 6; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      times.push(time);
    }
  }

  // Add 00:00 as the last option
  times.push("00:00");

  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// Add this type for temporary time selection
type TimeSelection = {
  start: string;
  end: string;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tempTimeSelection, setTempTimeSelection] = useState<TimeSelection>({ start: "", end: "" });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    rules_preference: [] as string[],
    format_preference: [] as Format[],
    availability: {} as Availability,
    will_substitute: false,
    contact_preferences: {
      sms: false,
      phone: false,
      push: false,
      email: false,
    },
  });

  const [isDirty, setIsDirty] = useState(false);
  const [originalFormData, setOriginalFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    rules_preference: [] as string[],
    format_preference: [] as Format[],
    availability: {} as Availability,
    will_substitute: false,
    contact_preferences: {
      sms: false,
      phone: false,
      push: false,
      email: false,
    },
  });

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();

        if (error) {
          console.error("Error loading profile:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load profile",
          });
        } else {
          const initialData = {
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone_number: data.phone_number || "",
            rules_preference: data.rules_preference
              ? Array.isArray(data.rules_preference)
                ? data.rules_preference
                : [data.rules_preference]
              : [],
            format_preference: (data.format_preference || []).filter((format): format is Format =>
              FORMATS.includes(format as Format)
            ),
            availability: (data.availability as Record<string, { start: string; end: string } | null>) || {},
            will_substitute: data.will_substitute || false,
            contact_preferences: data.contact_preferences || {
              sms: false,
              phone: false,
              push: false,
              email: false,
            },
          };
          setFormData(initialData);
          setOriginalFormData(initialData);
        }
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, supabase, toast]);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setIsDirty(hasChanges);
  }, [formData, originalFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user?.id) {
        throw new Error("No user ID found");
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          rules_preference: formData.rules_preference,
          format_preference: formData.format_preference,
          availability: formData.availability,
          will_substitute: formData.will_substitute,
          contact_preferences: formData.contact_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setOriginalFormData(formData); // Update original data after successful save
      setIsDirty(false); // Reset dirty state
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityUpdate = (day: string, timeRange: { start: string; end: string } | null) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: timeRange,
      },
    });
    setTempTimeSelection({ start: "", end: "" });
    setSelectedDay(null);
  };

  const handleFormatToggle = (format: Format) => {
    setFormData({
      ...formData,
      format_preference: formData.format_preference.includes(format)
        ? formData.format_preference.filter((f) => f !== format)
        : [...formData.format_preference, format],
    });
  };

  // Add new function to handle dialog close
  const handleDialogClose = (open: boolean, day: string) => {
    if (!open) {
      // Reset temp selection if closing without saving
      setTempTimeSelection({ start: "", end: "" });
    }
    setSelectedDay(open ? day : null);
  };

  // Add function to handle saving time selection
  const handleSaveTimeSelection = (day: string) => {
    // Only save if both times are selected
    if (tempTimeSelection.start && tempTimeSelection.end) {
      handleAvailabilityUpdate(day, tempTimeSelection);
    }
  };

  // Add handler for rules toggle
  const handleRulesToggle = (rule: string) => {
    setFormData({
      ...formData,
      rules_preference: formData.rules_preference.includes(rule)
        ? formData.rules_preference.filter((r) => r !== rule)
        : [...formData.rules_preference, rule],
    });
  };

  const handleContactPreferenceChange = (type: keyof typeof formData.contact_preferences) => {
    setFormData({
      ...formData,
      contact_preferences: {
        ...formData.contact_preferences,
        [type]: !formData.contact_preferences[type],
      },
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">Update your personal information and preferences.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-medium mb-3">Contact Preferences</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how you would like to receive notifications and updates
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={formData.contact_preferences.sms}
                    onCheckedChange={() => handleContactPreferenceChange("sms")}
                  />
                  <Label htmlFor="sms">SMS/Text Messages</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="phone"
                    checked={formData.contact_preferences.phone}
                    onCheckedChange={() => handleContactPreferenceChange("phone")}
                  />
                  <Label htmlFor="phone">Phone Calls</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push"
                    checked={formData.contact_preferences.push}
                    onCheckedChange={() => handleContactPreferenceChange("push")}
                  />
                  <Label htmlFor="push">Push Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={formData.contact_preferences.email}
                    onCheckedChange={() => handleContactPreferenceChange("email")}
                  />
                  <Label htmlFor="email">Email Updates</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* League Preferences Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>League Preferences</CardTitle>
            <CardDescription>Set your preferred rules and game formats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rules Preference</Label>
              <div className="grid grid-cols-2 gap-4">
                {RULES.map((rule) => (
                  <div key={rule} className="flex items-center space-x-2">
                    <Checkbox
                      id={rule}
                      checked={formData.rules_preference.includes(rule)}
                      onCheckedChange={() => handleRulesToggle(rule)}
                    />
                    <Label htmlFor={rule}>{rule}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Format Preferences</Label>
              <div className="grid grid-cols-2 gap-4">
                {FORMATS.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={format}
                      checked={formData.format_preference.includes(format)}
                      onCheckedChange={() => handleFormatToggle(format)}
                    />
                    <Label htmlFor={format}>{format}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set your available playing times for each day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DAYS.map((day) => (
                <Dialog key={day} open={selectedDay === day} onOpenChange={(open) => handleDialogClose(open, day)}>
                  <DialogTrigger asChild>
                    <Button
                      variant={formData.availability[day] ? "default" : "outline"}
                      className="w-full h-24 flex flex-col"
                    >
                      <span>{day}</span>
                      {formData.availability[day] && (
                        <span className="text-xs mt-2">
                          {formData.availability[day]?.start} - {formData.availability[day]?.end}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Set Availability for {day}</DialogTitle>
                      <DialogDescription>Choose your available time range.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="start">Start Time</Label>
                          <Select
                            value={tempTimeSelection.start}
                            onValueChange={(value) => setTempTimeSelection({ ...tempTimeSelection, start: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="end">End Time</Label>
                          <Select
                            value={tempTimeSelection.end}
                            onValueChange={(value) => setTempTimeSelection({ ...tempTimeSelection, end: value })}
                            disabled={!tempTimeSelection.start} // Disable if no start time selected
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
                              {TIME_OPTIONS.filter(
                                (time) => !tempTimeSelection.start || time > tempTimeSelection.start
                              ).map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            handleAvailabilityUpdate(day, null);
                            setTempTimeSelection({ start: "", end: "" });
                          }}
                        >
                          Clear Availability
                        </Button>
                        <Button
                          onClick={() => handleSaveTimeSelection(day)}
                          disabled={!tempTimeSelection.start || !tempTimeSelection.end}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>

            {/* Move substitute checkbox here */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="substitute"
                checked={formData.will_substitute}
                onCheckedChange={(checked) => setFormData({ ...formData, will_substitute: checked as boolean })}
              />
              <Label
                htmlFor="substitute"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Will play as substitute in times I am available
              </Label>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Always visible save button */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
          <Button
            onClick={handleSubmit}
            disabled={saving || !isDirty}
            variant={isDirty ? "default" : "secondary"}
            className="min-w-[100px]"
          >
            {saving ? "Saving..." : isDirty ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
