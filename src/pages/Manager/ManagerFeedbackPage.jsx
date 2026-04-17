/**
 * ManagerFeedbackPage.jsx
 * Manager page to view all feedback across fields (UI skeleton only).
 */

/**
 * ManagerFeedbackPage
 * @returns {JSX.Element} feedback page skeleton
 */
export default function ManagerFeedbackPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-headline font-bold">Feedback</h1>
        <p className="text-sm text-on-surface-variant">View all feedback from all fields.</p>
      </header>

      <div className="bg-surface-container p-6 rounded-xl">
        {/* TODO: Replace with FeedbackTable */}
        <p className="text-sm text-on-surface-variant">Coming soon.</p>
      </div>
    </div>
  );
}
