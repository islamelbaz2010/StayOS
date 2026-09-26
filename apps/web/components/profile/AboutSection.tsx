"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import { useUpdateProfile, type UserProfileUpdate } from "@/lib/queries/settings";
import { getApiErrorMessage } from "@/lib/utils";

const SPOKEN_LANGUAGES = ["en", "ar", "fr", "de", "es", "tr"] as const;
const INTEREST_OPTIONS = [
  "travel",
  "food",
  "culture",
  "history",
  "nature",
  "beach",
  "photography",
  "music",
  "sports",
  "art",
] as const;

export function AboutSection() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const userLanguages = user?.languages ?? [];
  const userInterests = user?.interests ?? [];

  function startEdit() {
    setBio(user?.bio ?? "");
    setLocation(user?.location ?? "");
    setLanguages([...userLanguages]);
    setInterests([...userInterests]);
    setError(null);
    setEditing(true);
  }

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload: UserProfileUpdate = {
        bio: bio.trim() || null,
        location: location.trim() || null,
        languages,
        interests,
      };
      await updateProfile.mutateAsync(payload);
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(getApiErrorMessage(err, tc("error")));
    } finally {
      setSaving(false);
    }
  }

  const hasContent =
    user?.bio || user?.location || userLanguages.length > 0 || userInterests.length > 0;

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-neutral-900">{t("aboutYou")}</h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="btn-secondary text-sm"
          >
            {hasContent ? t("edit") : t("add")}
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t("bio")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="input mt-1 w-full text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">{t("bioHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {t("location")}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              className="input mt-1 w-full text-sm"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">
              {t("languages")}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPOKEN_LANGUAGES.map((lang) => {
                const active = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggle(languages, lang, setLanguages)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary-700 bg-primary-700 text-white"
                        : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    {t(`languageNames.${lang}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-neutral-700">
              {t("interests")}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const active = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggle(interests, interest, setInterests)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary-700 bg-primary-700 text-white"
                        : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    {t(`interestNames.${interest}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error && (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? tc("loading") : tc("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary text-sm"
            >
              {tc("cancel")}
            </button>
          </div>
        </form>
      ) : hasContent ? (
        <div className="mt-4 space-y-3">
          {user?.bio && (
            <p className="text-sm text-neutral-800">{user.bio}</p>
          )}
          {user?.location && (
            <p className="text-sm text-neutral-600">
              <span className="font-medium text-neutral-900">
                {t("location")}:{" "}
              </span>
              {user.location}
            </p>
          )}
          {userLanguages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">
                {t("languages")}:
              </span>
              {userLanguages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {t(`languageNames.${lang}`)}
                </span>
              ))}
            </div>
          )}
          {userInterests.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">
                {t("interests")}:
              </span>
              {userInterests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {t(`interestNames.${interest}`)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">{t("aboutEmpty")}</p>
      )}
    </div>
  );
}
