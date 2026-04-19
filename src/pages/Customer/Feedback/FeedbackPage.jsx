import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useNotification } from '../../../context/NotificationContext';
import bookingService from '../../../services/bookingService';

import '../../../styles/FeedbackPage.css';

function formatDateTime(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RATING_LABELS = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời',
};

function RatingStars({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="fb-rating-container">
      <div
        className="fb-stars"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isActive = n <= (hovered || value);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              onMouseEnter={() => !disabled && setHovered(n)}
              disabled={disabled}
              className={`fb-star-btn ${isActive ? 'active' : ''}`}
              aria-label={`Rate ${n} star`}
            >
              ★
            </button>
          );
        })}
      </div>
      <div className="fb-rating-text">
        <span className="fb-rating-number">{value}/5</span>
        <span className="fb-rating-label">— {RATING_LABELS[value] || ''}</span>
      </div>
    </div>
  );
}

function SubmittedStars({ rating }) {
  return (
    <div className="fb-submitted-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star ${n <= rating ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notifyError, notifySuccess } = useNotification();

  const bookingId = String(searchParams.get('bookingId') || '').trim();
  const fieldNameFromQuery = String(searchParams.get('fieldName') || '').trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [item, setItem] = useState(null);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [rate, setRate] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldName = item?.fieldName || fieldNameFromQuery || 'Sân bóng';

  const selectedSlot = useMemo(() => {
    const list = item?.eligibleSlots || [];
    return list.find((s) => String(s.id) === String(selectedSlotId)) || null;
  }, [item?.eligibleSlots, selectedSlotId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!bookingId) {
        setError('Thiếu bookingId để gửi feedback.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await bookingService.getFeedbackEligibility(bookingId);
        if (!alive) return;

        const nextItem = data?.item || null;
        setItem(nextItem);

        const firstEligible = nextItem?.eligibleSlots?.[0]?.id || '';
        setSelectedSlotId(firstEligible);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu feedback.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [bookingId]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlotId) {
      notifyError('Không có slot hợp lệ để đánh giá.');
      return;
    }

    if (!Number.isInteger(Number(rate)) || Number(rate) < 1 || Number(rate) > 5) {
      notifyError('Điểm rating phải từ 1 đến 5.');
      return;
    }

    setSubmitting(true);
    try {
      await bookingService.createFeedback({
        bookingDetailId: selectedSlotId,
        rate: Number(rate),
        content: String(content || '').trim(),
      });

      notifySuccess('Gửi đánh giá thành công. Cảm ơn bạn đã phản hồi!');
      navigate('/profile', { state: { activeTab: 'bookings' }, replace: true });
    } catch (e) {
      notifyError(e?.response?.data?.message || e?.message || 'Gửi feedback thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/profile', { state: { activeTab: 'bookings' } })}
          className="fb-back-btn"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại lịch sử đặt sân
        </button>

        {/* Main Card */}
        <div className="fb-card">
          {/* Header */}
          <div className="fb-header">
            <div className="fb-header-top">
              <div className="fb-header-icon">
                <span className="material-symbols-outlined">rate_review</span>
              </div>
              <div>
                <h1 className="fb-title">Đánh giá sân</h1>
                <div className="fb-meta">
                  <div className="fb-meta-item">
                    <span className="material-symbols-outlined">confirmation_number</span>
                    Booking: <span className="fb-meta-value">{bookingId || 'N/A'}</span>
                  </div>
                  <div className="fb-meta-item">
                    <span className="material-symbols-outlined">sports_tennis</span>
                    Sân: <span className="fb-meta-value">{fieldName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="fb-body">
            {/* Loading State */}
            {loading && (
              <div className="fb-loading">
                <div className="fb-spinner" />
                <span className="fb-loading-text">Đang tải dữ liệu feedback...</span>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="fb-error">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Cannot Submit State */}
            {!loading && !error && item && !item.canSubmit && (
              <div className="fb-cannot-submit">
                <div className="fb-cannot-icon">
                  <span className="material-symbols-outlined">
                    {item.isPaid === false ? 'pending' : 'task_alt'}
                  </span>
                </div>
                <div className="fb-cannot-text">
                  {item.isPaid === false
                    ? 'Booking chưa ở trạng thái Paid nên chưa thể gửi đánh giá.'
                    : 'Bạn chưa có slot nào đã kết thúc để đánh giá hoặc bạn đã đánh giá hết các slot đủ điều kiện.'}
                </div>

                {(item.submittedSlots || []).length > 0 && (
                  <div className="fb-submitted-section">
                    <div className="fb-submitted-label">Đánh giá đã gửi</div>
                    <div className="fb-submitted-list">
                      {item.submittedSlots.map((slot) => (
                        <div key={slot.id} className="fb-submitted-item">
                          <div className="fb-submitted-slot">
                            <span className="material-symbols-outlined">schedule</span>
                            {formatDateTime(slot.startTime)} – {formatDateTime(slot.endTime)}
                          </div>
                          <div className="fb-submitted-rating">
                            <SubmittedStars rating={slot.feedback?.rate || 0} />
                            <span className="fb-submitted-rating-num">
                              {slot.feedback?.rate || '-'}/5
                            </span>
                          </div>
                          {slot.feedback?.content && (
                            <div className="fb-submitted-comment">
                              &ldquo;{slot.feedback.content}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Form */}
            {!loading && !error && item && item.canSubmit && (
              <form className="fb-form" onSubmit={onSubmit}>
                {/* Slot Selector */}
                <div className="fb-form-group">
                  <label className="fb-label">
                    <span className="material-symbols-outlined">event_available</span>
                    Chọn slot đã kết thúc
                  </label>
                  <div className="fb-select-wrapper">
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="fb-select"
                      disabled={submitting}
                    >
                      {(item.eligibleSlots || []).map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {`${formatDateTime(slot.startTime)} – ${formatDateTime(slot.endTime)}`}
                        </option>
                      ))}
                    </select>
                    <span className="fb-select-arrow material-symbols-outlined">expand_more</span>
                  </div>
                  {selectedSlot && (
                    <div className="fb-slot-status">
                      <span className="material-symbols-outlined">check_circle</span>
                      Trạng thái: {selectedSlot.status || 'N/A'}
                    </div>
                  )}
                </div>

                {/* Star Rating */}
                <div className="fb-form-group">
                  <label className="fb-label">
                    <span className="material-symbols-outlined">star</span>
                    Đánh giá
                  </label>
                  <RatingStars
                    value={Number(rate)}
                    onChange={(v) => setRate(v)}
                    disabled={submitting}
                  />
                </div>

                {/* Comment */}
                <div className="fb-form-group">
                  <label className="fb-label">
                    <span className="material-symbols-outlined">chat</span>
                    Nhận xét
                  </label>
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sân này..."
                    className="fb-textarea"
                    disabled={submitting}
                  />
                  <div className="fb-char-count">{content.length}/2000</div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="fb-submit-btn"
                >
                  {submitting ? (
                    <>
                      <span className="fb-btn-spinner" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
