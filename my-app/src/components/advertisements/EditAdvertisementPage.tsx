import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppNavbar from "@/components/shared/AppNavbar";
import SubmitAdvertisementPage from "@/components/advertisements/SubmitAdvertisementPage";
import advertisementAPI from "@/services/advertisementAPI";

export default function EditAdvertisementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const adId = Number(id);
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    if (!adId) return;
    advertisementAPI
      .getById(adId)
      .then((ad) => {
        setForm({
          title: ad.title,
          location: ad.location,
          property_type: ad.property_type || "Plot",
          description: ad.description || "",
          price_text: ad.price_text || "",
          contact_phone: ad.contact_phone || "",
          contact_email: ad.contact_email || "",
          selling_point: ad.selling_point || "",
        });
      })
      .catch(() => setError("Advertisement not found"))
      .finally(() => setLoading(false));
  }, [adId]);

  if (!adId) return null;
  if (loading) return <TownLoader fullScreen label="Loading advertisement" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (banner) fd.append("file", banner);
      await advertisementAPI.update(adId, fd);
      navigate("/advertise/my");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update advertisement."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar variant="inner" backTo="/advertise/my" logoTagline="Edit advertisement" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-gray-200 bg-white p-5 shadow-soft-sm">
          {Object.entries(form).map(([key, value]) => (
            key === "description" ? (
              <div key={key} className="space-y-1.5">
                <Label>Description</Label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-control border border-input px-3 py-2 text-sm"
                  value={value}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Markdown supported — shown formatted in admin review and public surfaces.
                </p>
              </div>
            ) : (
              <div key={key} className="space-y-1.5">
                <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                <Input
                  required={key !== "contact_email" && key !== "price_text" && key !== "selling_point"}
                  value={value}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            )
          ))}
          <div className="space-y-1.5">
            <Label>Replace banner (optional)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] ?? null)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={submitting}>Resubmit for review</Button>
        </form>
      </main>
    </div>
  );
}
