import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import AppNavbar from "@/components/shared/AppNavbar";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropdown } from "@/components/ui/dropdown";
import { propertyAPI } from "@/services/api";
import advertisementAPI from "@/services/advertisementAPI";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";

const PROPERTY_TYPES = ["Land", "Plot", "Villa", "Apartment", "Project", "Commercial"];
const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((t) => ({ value: t, label: t }));

export default function SubmitAdvertisementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const backTo = user ? ROLE_HOME_ROUTE[user.role] : "/home";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    location: "",
    property_type: "Plot",
    description: "",
    price_text: "",
    contact_phone: "",
    contact_email: "",
    selling_point: "",
    property_id: "",
  });

  const { data: myProperties = [] } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => propertyAPI.getMyProperties(),
  });

  const onChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!banner) {
      setError("Please upload a banner image.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("location", form.location);
      fd.append("property_type", form.property_type);
      fd.append("description", form.description);
      fd.append("price_text", form.price_text);
      fd.append("contact_phone", form.contact_phone);
      if (form.contact_email) fd.append("contact_email", form.contact_email);
      if (form.selling_point) fd.append("selling_point", form.selling_point);
      if (form.property_id) fd.append("property_id", form.property_id);
      fd.append("ad_type", form.property_type === "Project" ? "project" : "property");
      fd.append("file", banner);

      await advertisementAPI.submit(fd);
      navigate("/advertise/my");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit advertisement."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {submitting ? <TownLoader overlay label="Submitting advertisement" /> : null}
      <AppNavbar variant="inner" backTo={backTo} logoTagline="Advertise" />

      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-5 sm:py-6 pb-16 safe-bottom">
        <div className="mb-6 text-center">
          <Megaphone className="mx-auto size-10 text-secondary-500" />
          <h1 className="mt-3 font-display text-xl sm:text-2xl font-semibold text-gray-900">Advertise your property</h1>
          <p className="mt-1 text-sm text-gray-600 px-2">
            Submit your advertisement for admin review. Once approved, it can appear on the homepage slider.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-gray-200 bg-white p-5 sm:p-6 shadow-soft-sm">
          <div className="space-y-1.5">
            <Label htmlFor="ad-title">Property / project name</Label>
            <Input id="ad-title" required value={form.title} onChange={(e) => onChange("title", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ad-location">Location</Label>
            <Input id="ad-location" required placeholder="Avadi, Chennai" value={form.location} onChange={(e) => onChange("location", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ad-type">Property type</Label>
            <Dropdown
              id="ad-type"
              fullWidth
              value={form.property_type}
              onChange={(v) => onChange("property_type", v)}
              options={PROPERTY_TYPE_OPTIONS}
              aria-label="Property type"
            />
          </div>

          {myProperties.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="ad-property">Link existing listing (optional)</Label>
              <Dropdown
                id="ad-property"
                fullWidth
                value={form.property_id || ""}
                onChange={(v) => onChange("property_id", v)}
                placeholder="None"
                options={[
                  { value: "", label: "None" },
                  ...myProperties.map((p: { id: number; bhk_type: string; locality: string; city: string }) => ({
                    value: String(p.id),
                    label: `${p.bhk_type} — ${p.locality}, ${p.city}`,
                  })),
                ]}
                aria-label="Link existing listing"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="ad-price">Price / starting price</Label>
            <Input id="ad-price" placeholder="₹18.5 Lakhs onwards" value={form.price_text} onChange={(e) => onChange("price_text", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ad-selling">Short selling point (optional)</Label>
            <Input id="ad-selling" placeholder="Premium residential plots" value={form.selling_point} onChange={(e) => onChange("selling_point", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ad-desc">Description</Label>
            <textarea
              id="ad-desc"
              required
              rows={4}
              className="w-full rounded-control border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder={"### Project name\n\n**Key highlights**\n* Amenity one\n* Amenity two"}
            />
            <p className="text-xs text-muted-foreground">
              Markdown supported — headings, bold, and lists render formatted for admins and viewers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ad-phone">Contact number</Label>
              <Input id="ad-phone" required inputMode="tel" value={form.contact_phone} onChange={(e) => onChange("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-email">Email (optional)</Label>
              <Input id="ad-email" type="email" value={form.contact_email} onChange={(e) => onChange("contact_email", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Banner image (16:5 or wide landscape recommended)</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-brand-200 bg-brand-50/30 px-4 py-8 hover:border-brand-400">
              <Upload className="size-8 text-brand-500" />
              <span className="text-sm font-medium text-gray-700">
                {banner ? banner.name : "Upload banner image"}
              </span>
              <span className="text-xs text-gray-500">JPG, JPEG, PNG, WebP, or HEIC</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                className="hidden"
                onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            Submit for review
          </Button>
        </form>
      </main>
    </div>
  );
}
