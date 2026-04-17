/**
 * ManagerPrivacyPage.jsx
 * Manager page for creating/updating the single system privacy document.
 * UI skeleton only.
 */

/**
 * ManagerPrivacyPage
 * @returns {JSX.Element} privacy page skeleton
 */
export default function ManagerPrivacyPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-headline font-bold">Privacy Policy</h1>
        <p className="text-sm text-on-surface-variant">Edit the system privacy policy shown on the Home site.</p>
      </header>

      <div className="bg-surface-container p-6 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Title</label>
          <input
            className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Privacy Policy"
            type="text"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Content</label>
          <textarea
            className="w-full min-h-48 bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Write policy content..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-on-primary hover:opacity-90"
          >
            Save
          </button>
        </div>

        {/* TODO: show last updated info from API */}
      </div>
    </div>
  );
}
