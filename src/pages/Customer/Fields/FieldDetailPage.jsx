import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/axios";
import DEFAULT_FIELD_IMAGE_URL from "../../../utils/defaultFieldImage";
import { usePreviewMode } from "../../../context/PreviewModeContext";
import { useAuth } from "../../../context/AuthContext";
import useCustomerBanners from "../../../hooks/useCustomerBanners";
import { useNotification } from "../../../context/NotificationContext";
import bookingService from "../../../services/bookingService";
import AdBannerVertical from "../Community/components/AdBannerVertical";
import AdBannerHorizontal from "../Community/components/AdBannerHorizontal";
import { FIELD_DETAIL_VERTICAL_POOL } from "../../../data/ads/fieldDetailAdsCopy";
import { FIELD_DETAIL_HORIZONTAL_POOL } from "../../../data/ads/fieldDetailHorizontalCopy";
import { getRandomAdsFromPool } from "../../../utils/adUtils";

const UTILITY_LABELS = {
  parking: "Parking",
  lighting: "Lighting",
  wifi: "WiFi",
  shower: "Shower",
};

const UTILITY_ICONS = {
  parking: "local_parking",
  lighting: "light_mode",
  wifi: "wifi",
  shower: "shower",
};

const pad2 = (value) => String(value).padStart(2, "0");

const toMinutes = (value) => {
  if (!value) return null;
  const [hours, minutes] = String(value)
    .split(":")
    .map((v) => Number(v));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const buildTimeSlots = (openingTime, closingTime, slotDuration) => {
  const startMinutes = toMinutes(openingTime || "06:00");
  const endMinutes = toMinutes(closingTime || "22:00");
  const duration = Number(slotDuration) || 60;

  if (startMinutes === null || endMinutes === null || duration <= 0) return [];
  if (endMinutes <= startMinutes) return [];

  const slots = [];
  for (let t = startMinutes; t + duration <= endMinutes; t += duration) {
    const startH = Math.floor(t / 60);
    const startM = t % 60;
    const end = t + duration;
    const endH = Math.floor(end / 60);
    const endM = end % 60;
    slots.push(`${pad2(startH)}:${pad2(startM)} - ${pad2(endH)}:${pad2(endM)}`);
  }

  return slots;
};

function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isPastDate = (day) => {
    const dateTs = new Date(year, month, day).setHours(0, 0, 0, 0);
    const todayTs = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).setHours(0, 0, 0, 0);
    return dateTs < todayTs;
  };

  const isSelected = (day) => {
    const date = new Date(year, month, day);
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  const isToday = (day) => {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  const handleSelectDate = (day) => {
    if (isPastDate(day)) return;
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    onSelectDate(`${y}-${m}-${d}`);
  };

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="rounded-xl border border-[#474944]/30 bg-[#121410] p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
        >
          <span className="material-symbols-outlined text-base">
            chevron_left
          </span>
        </button>
        <span className="font-headline text-sm font-bold text-[#fdfdf6]">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#abaca5] transition-colors hover:bg-[#242721] hover:text-[#fdfdf6]"
        >
          <span className="material-symbols-outlined text-base">
            chevron_right
          </span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-headline text-xs font-bold text-[#abaca5] py-1"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <button
                type="button"
                onClick={() => handleSelectDate(day)}
                disabled={isPastDate(day)}
                className={
                  isPastDate(day)
                    ? "flex h-full w-full items-center justify-center rounded-lg font-headline text-xs text-[#555] cursor-not-allowed"
                    : isSelected(day)
                      ? "flex h-full w-full items-center justify-center rounded-lg bg-[#8eff71] font-headline text-xs font-bold text-[#0d6100]"
                      : isToday(day)
                        ? "flex h-full w-full items-center justify-center rounded-lg bg-[#242721] font-headline text-xs font-bold text-[#8eff71] transition-colors hover:bg-[#474944]/50"
                        : "flex h-full w-full items-center justify-center rounded-lg font-headline text-xs text-[#fdfdf6] transition-colors hover:bg-[#474944]/50"
                }
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function getPrimaryFieldImage(imageValue) {
  if (Array.isArray(imageValue)) {
    const firstValid = imageValue.find(
      (img) => typeof img === "string" && img.trim(),
    );
    return firstValid || DEFAULT_FIELD_IMAGE_URL;
  }

  if (typeof imageValue === "string" && imageValue.trim()) {
    return imageValue;
  }

  return DEFAULT_FIELD_IMAGE_URL;
}

function normalizeRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function getInitials(name) {
  const text = String(name || "").trim();
  if (!text) return "U";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0].slice(0, 1)}${words[words.length - 1].slice(0, 1)}`.toUpperCase();
}

const RATING_LABELS = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Tuyệt vời",
};

function formatFeedbackDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFeedbackSlotRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "N/A";

  const startText = start.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endText = end.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startText} - ${endText}`;
}

export default function FieldDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isPreviewMode } = usePreviewMode();
  const { user: authUser } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const { isAuthenticated } = useAuth();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { banners: detailBanners } = useCustomerBanners("field_detail_banner");
  const { banners: horizontalBanners } = useCustomerBanners(
    "field_detail_horizontal",
  );

  const horizontalCopies = useMemo(
    () => getRandomAdsFromPool(FIELD_DETAIL_HORIZONTAL_POOL, 3),
    [],
  );
  const verticalCopies = useMemo(
    () => getRandomAdsFromPool(FIELD_DETAIL_VERTICAL_POOL, 3),
    [],
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const bookingIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("bookingId") || "";
  }, [location.search]);

  const [activeFeedbackBookingId, setActiveFeedbackBookingId] = useState("");

  useEffect(() => {
    const initialId = String(
      location.state?.feedbackBookingId || bookingIdFromQuery || "",
    ).trim();
    if (initialId) setActiveFeedbackBookingId(initialId);
  }, [location.state, bookingIdFromQuery]);

  const feedbackBookingId = activeFeedbackBookingId;
  const [feedbackEligibility, setFeedbackEligibility] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [selectedFeedbackSlotId, setSelectedFeedbackSlotId] = useState("");
  const [feedbackRate, setFeedbackRate] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const feedbackSectionRef = useRef(null);
  const feedbackFormRef = useRef(null);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const isSlotPast = (slot) => {
    if (selectedDate !== todayStr) return false;
    const start = slot.split(" - ")[0];
    const startMinutes = toMinutes(start);
    if (startMinutes === null) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= startMinutes;
  };

  const fetchField = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/fields/${id}/full`);
      if (response.data.success) {
        setField(response.data.data);
      } else {
        setError("Field not found");
      }
    } catch (err) {
      console.error("Error fetching field:", err);
      setError("Failed to load field data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchField();
  }, [fetchField]);

  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDate || !id) return;
    try {
      const response = await axiosInstance.get(
        `/api/bookings/field/${id}/slots?date=${selectedDate}`,
      );
      if (response.data.success) {
        setBookedSlots(response.data.bookedSlots || []);
      }
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  }, [selectedDate, id]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const fetchEligibility = useCallback(async () => {
    if (!id || !authUser) {
      setFeedbackEligibility(null);
      setFeedbackError("");
      setSelectedFeedbackSlotId("");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");

    try {
      let data;
      if (feedbackBookingId) {
        data = await bookingService.getFeedbackEligibility(feedbackBookingId);
      } else {
        data = await bookingService.getFeedbackEligibilityByField(id);
      }

      const item = data?.item || null;

      if (!item) {
        setFeedbackEligibility(null);
        if (feedbackBookingId) {
          setFeedbackError("Không tải được thông tin đánh giá.");
        }
        return;
      }

      const itemFieldId = String(item.fieldId || "").trim();
      if (itemFieldId && itemFieldId !== String(id)) {
        setFeedbackEligibility(null);
        if (feedbackBookingId) {
          setFeedbackError("Booking này không thuộc sân đang xem.");
        }
        return;
      }

      const slots = item.reviewableSlots || [
        ...(item.eligibleSlots || []).map(s => ({ ...s, hasFeedback: false })),
        ...(item.submittedSlots || []).map(s => ({ ...s, hasFeedback: true }))
      ];

      const firstSlotId = slots[0]?.id || "";

      setFeedbackEligibility({
        ...item,
        reviewableSlots: slots
      });
      setSelectedFeedbackSlotId(String(firstSlotId || ""));
    } catch (err) {
      setFeedbackEligibility(null);
      if (feedbackBookingId) {
        setFeedbackError(
          err?.response?.data?.message || "Không tải được thông tin đánh giá.",
        );
      }
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackBookingId, id, authUser]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  useEffect(() => {
    if (feedbackBookingId && feedbackSectionRef.current) {
      feedbackSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [feedbackBookingId, feedbackSectionRef]);

  const reviewableSlots = useMemo(() => {
    if (!feedbackEligibility) return [];
    return feedbackEligibility.reviewableSlots || [];
  }, [feedbackEligibility]);

  const canShowAddFeedback = useMemo(() => {
    return reviewableSlots.some(slot => !slot.hasFeedback);
  }, [reviewableSlots]);

  const selectedFeedbackSlot = useMemo(() => {
    return reviewableSlots.find(
      (slot) => String(slot.id) === String(selectedFeedbackSlotId),
    );
  }, [reviewableSlots, selectedFeedbackSlotId]);

  useEffect(() => {
    if (!selectedFeedbackSlot) {
      setFeedbackRate(5);
      setFeedbackContent("");
      return;
    }

    const existingFeedback = selectedFeedbackSlot.feedback;
    if (existingFeedback) {
      setFeedbackRate(Number(existingFeedback.rate) || 5);
      setFeedbackContent(String(existingFeedback.content || ""));
      return;
    }

    setFeedbackRate(5);
    setFeedbackContent("");
  }, [selectedFeedbackSlot]);

  const resetFeedbackForm = () => {
    if (selectedFeedbackSlot?.feedback) {
      setFeedbackRate(Number(selectedFeedbackSlot.feedback.rate) || 5);
      setFeedbackContent(String(selectedFeedbackSlot.feedback.content || ""));
      return;
    }
    setFeedbackRate(5);
    setFeedbackContent("");
  };

  const handleSubmitFeedback = async (event) => {
    event.preventDefault();

    if (!selectedFeedbackSlotId) {
      notifyError("Vui lòng chọn ca sân để đánh giá.");
      return;
    }

    const trimmedContent = String(feedbackContent || "").trim();
    if (!trimmedContent) {
      notifyError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    const normalizedRate = Number(feedbackRate);
    if (!Number.isFinite(normalizedRate) || normalizedRate < 1 || normalizedRate > 5) {
      notifyError("Số sao không hợp lệ.");
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const existingFeedbackId = String(selectedFeedbackSlot?.feedback?.id || "");
      const payload = {
        rate: normalizedRate,
        content: trimmedContent,
      };

      if (existingFeedbackId) {
        await bookingService.updateFeedback(existingFeedbackId, payload);
        notifySuccess("Đã cập nhật đánh giá.");
      } else {
        await bookingService.createFeedback({
          bookingDetailId: selectedFeedbackSlotId,
          ...payload,
        });
        notifySuccess("Đã gửi đánh giá.");
      }

      await fetchEligibility();
      await fetchField();

      setIsFeedbackFormOpen(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể gửi đánh giá.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      await bookingService.deleteFeedback(feedbackId);
      notifySuccess("Đã xóa đánh giá.");

      await fetchEligibility();
      await fetchField();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể xóa đánh giá.");
    }
  };

  const handleEditFromList = (fb) => {
    // We need to find if this feedback belongs to the current booking we have eligibility for,
    // OR we need to fetch eligibility for THAT feedback's booking.
    // For simplicity, if we don't have feedbackBookingId or it's different, we might need more logic.
    // However, the user said "navigate sang field detail thôi", so they might arrive without bookingId.

    // If we have eligibility and the slot is in reviewableSlots, great.
    const slotId = fb.bookingDetailID;
    const bId = fb.bookingID;

    if (bId && bId !== feedbackBookingId) {
      setActiveFeedbackBookingId(bId);
      // The useEffect for eligibility will trigger automatically
    }

    const existsInSlots = (slots) => slots.find(s => String(s.id) === String(slotId));

    if (existsInSlots(reviewableSlots)) {
      setSelectedFeedbackSlotId(String(slotId));
      setIsFeedbackFormOpen(true);
      setTimeout(() => {
        feedbackFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      // If it doesn't exist yet, it's because eligibility is still loading for the new bId.
      // We'll set a "pending open" state.
      setPendingFeedbackSlotId(String(slotId));
    }
  };

  const [pendingFeedbackSlotId, setPendingFeedbackSlotId] = useState(null);

  useEffect(() => {
    if (pendingFeedbackSlotId && !feedbackLoading && reviewableSlots.length > 0) {
      const found = reviewableSlots.find(s => String(s.id) === String(pendingFeedbackSlotId));
      if (found) {
        setSelectedFeedbackSlotId(pendingFeedbackSlotId);
        setIsFeedbackFormOpen(true);
        setPendingFeedbackSlotId(null);
        setTimeout(() => {
          feedbackFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [pendingFeedbackSlotId, feedbackLoading, reviewableSlots]);

  const toggleSlot = (slot) => {
    if (bookedSlots.includes(slot)) return;
    if (isSlotPast(slot)) return;
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8eff71]"></div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-headline text-2xl font-bold text-[#ff4d6d]">
          Field not found
        </h1>
        <button
          onClick={() => navigate("/fields")}
          className="mt-4 font-headline text-[#8eff71] underline"
        >
          Back to Fields
        </button>
      </div>
    );
  }

  const fieldData = field.field || field;
  const services = field.services || [];
  const feedbacks = Array.isArray(field.feedbacks) ? field.feedbacks : [];
  const feedbackSummary = field.feedbackSummary || {};
  const heroImage = getPrimaryFieldImage(fieldData?.image);

  const fromSummary = Number(feedbackSummary?.avgRate);
  const fromField = Number(fieldData?.rating);
  const avgRateNumber = Number.isFinite(fromSummary) && fromSummary > 0
    ? normalizeRate(fromSummary)
    : Number.isFinite(fromField) && fromField > 0
      ? normalizeRate(fromField)
      : 5;

  const avgRateText = avgRateNumber.toFixed(1);
  const totalFeedback = Number(feedbackSummary?.total) || feedbacks.length;

  const parsePrice = (priceText) => {
    const digits = String(priceText ?? "").replace(/[^\d]/g, "");
    return Number(digits) || 0;
  };

  const fieldPricePerHour =
    fieldData.hourlyPrice || parsePrice(fieldData.price);
  const timeSlots = buildTimeSlots(
    fieldData.openingTime,
    fieldData.closingTime,
    fieldData.slotDuration,
  );
  const slotDurationMinutes = Number(fieldData.slotDuration) || 60;
  const pricePerSlot = Math.round(
    fieldPricePerHour * (slotDurationMinutes / 60),
  );
  const fieldTotal = pricePerSlot * selectedSlots.length;
  const grandTotal = fieldTotal;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/fields/' + id, message: 'Vui lòng đăng nhập để đặt sân' } });
      return;
    }

    if (isPreviewMode) {
      alert(
        "Bạn đang ở chế độ xem trước (preview mode) nên không thể đặt sân.",
      );
      return;
    }

    if (!selectedDate || selectedSlots.length === 0) {
      alert("Please select date and at least one time slot");
      return;
    }
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      navigate("/booking-confirm", {
        state: {
          field: fieldData,
          date: selectedDate,
          time: selectedSlots.join(", "),
          total: grandTotal,
        },
      });
    }, 2000);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <button
        onClick={() => navigate("/fields")}
        className="mb-6 flex items-center gap-2 text-[#abaca5] transition-colors hover:text-[#8eff71]"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span className="font-headline text-sm font-medium">
          Back to Fields
        </span>
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <AdBannerHorizontal
            banners={horizontalBanners}
            copyArray={horizontalCopies}
          />

          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img
              src={heroImage}
              alt={fieldData.fieldName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_FIELD_IMAGE_URL;
              }}
              className="h-72 w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#0d0f0b]/80 px-3 py-1 backdrop-blur-md">
              <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">star</span>
              <span className="font-headline text-xs font-bold text-white">{avgRateText}</span>
              <span className="font-headline text-[10px] text-[#abaca5]">({totalFeedback})</span>
            </div>
            <div className="absolute bottom-4 right-4 rounded-lg bg-[#8eff71] px-3 py-1">
              <span className="font-headline text-xs font-black text-[#0d6100]">
                {fieldData.fieldType}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#181a16] p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="font-headline text-2xl font-black text-[#fdfdf6] leading-tight">
                  {fieldData.fieldName}
                </h1>
                <div className="mt-2 flex items-center gap-1 text-[#abaca5]">
                  <span className="material-symbols-outlined text-sm">
                    location_on
                  </span>
                  <span className="font-headline text-sm">
                    {fieldData.address}, {fieldData.city}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#8eff71]">star</span>
                  <span className="font-headline text-sm font-bold text-[#fdfdf6]">{avgRateText}/5</span>
                  <span className="font-headline text-xs text-[#abaca5]">{totalFeedback} đánh giá</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-headline text-xs text-[#88f6ff] block">
                  Price
                </span>
                <span className="font-headline text-2xl font-black text-[#8eff71]">
                  {formatPrice(fieldPricePerHour)}
                </span>
                <span className="font-headline text-xs text-[#abaca5]">
                  /hour
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(fieldData.utilities || []).map((util) => (
                <div
                  key={util}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#242721] px-3 py-1.5"
                >
                  <span className="material-symbols-outlined text-sm text-[#8eff71]">
                    {UTILITY_ICONS[util] || "check_circle"}
                  </span>
                  <span className="font-headline text-xs font-medium text-[#fdfdf6]">
                    {UTILITY_LABELS[util] || util}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#474944]/30 pt-4">
              <h3 className="font-headline text-sm font-bold text-[#8eff71] mb-2">
                About this field
              </h3>
              <p className="font-headline text-sm text-[#abaca5] leading-relaxed">
                {fieldData.description ||
                  `${fieldData.fieldName} là một trong những sân cỏ nhân tạo chất lượng cao tại ${fieldData.city}.`}
              </p>
            </div>

            {services.length > 0 && (
              <div className="border-t border-[#474944]/30 pt-4 mt-4">
                <h3 className="font-headline text-sm font-bold text-[#8eff71] mb-2">
                  Services
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service) => (
                    <div
                      key={service._id}
                      className="flex items-center justify-between rounded-lg bg-[#242721] p-3"
                    >
                      <div>
                        <p className="font-headline text-sm font-bold text-[#fdfdf6]">
                          {service.serviceName}
                        </p>
                        <p className="font-headline text-xs text-[#abaca5]">
                          {service.description}
                        </p>
                      </div>
                      <span className="font-headline text-sm font-bold text-[#8eff71]">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {authUser && (
              <div ref={feedbackSectionRef} className="border-t border-[#474944]/30 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-headline text-sm font-bold text-[#8eff71]">
                    Đánh giá booking của bạn
                  </h3>
                  {canShowAddFeedback && !isFeedbackFormOpen && (
                    <button
                      onClick={() => setIsFeedbackFormOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#8eff71] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0d6100] transition-transform hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      <span>Viết đánh giá</span>
                    </button>
                  )}
                </div>

                {feedbackLoading ? (
                  <div className="rounded-lg border border-[#474944]/30 bg-[#121410] p-4 text-sm text-[#abaca5]">
                    Đang tải thông tin đánh giá...
                  </div>
                ) : feedbackError ? (
                  <div className="rounded-lg border border-[#7a2f2f]/40 bg-[#2a1414] p-4 text-sm text-[#ffb3b3]">
                    {feedbackError}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!feedbackEligibility?.isPaid ? (
                      <div className="rounded-lg border border-[#7a5f26]/40 bg-[#2a2414] p-4 text-sm text-[#ffd88a]">
                        Booking chưa thanh toán, chưa thể đánh giá.
                      </div>
                    ) : reviewableSlots.length === 0 ? (
                      <div className="rounded-lg border border-[#474944]/30 bg-[#121410] p-4 text-sm text-[#abaca5]">
                        Chưa có ca sân nào đủ điều kiện để đánh giá.
                      </div>
                    ) : isFeedbackFormOpen && (
                      <form
                        ref={feedbackFormRef}
                        onSubmit={handleSubmitFeedback}
                        className="rounded-xl border border-[#474944]/30 bg-[#121410] p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-headline text-xs font-bold text-[#fdfdf6]">
                            {selectedFeedbackSlot?.feedback ? "Cập nhật đánh giá" : "Tạo đánh giá mới"}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsFeedbackFormOpen(false)}
                            className="text-[#abaca5] hover:text-[#fdfdf6]"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>

                        <div>
                          <label
                            htmlFor="feedback-slot"
                            className="block font-headline text-xs font-bold text-[#abaca5] mb-2"
                          >
                            Chọn ca sân
                          </label>
                          <select
                            id="feedback-slot"
                            value={selectedFeedbackSlotId}
                            onChange={(e) => setSelectedFeedbackSlotId(e.target.value)}
                            className="w-full rounded-lg border border-[#474944]/40 bg-[#1f221b] px-3 py-2 text-sm text-[#fdfdf6] focus:border-[#8eff71] focus:outline-none"
                          >
                            <option value="">-- Chọn ca sân --</option>
                            {reviewableSlots.map((slot) => (
                              <option key={slot.id} value={slot.id}>
                                {`${formatFeedbackSlotRange(slot.startTime, slot.endTime)} | ${formatFeedbackDateTime(slot.startTime)} ${slot.hasFeedback ? "| Đã đánh giá" : "| Chưa đánh giá"}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <p className="font-headline text-xs font-bold text-[#abaca5] mb-2">Số sao</p>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRate(star)}
                                className="rounded p-1 transition-transform hover:scale-110"
                                aria-label={`Đánh giá ${star} sao`}
                              >
                                <span
                                  className={`material-symbols-outlined text-2xl ${feedbackRate >= star ? "text-[#ffc864]" : "text-[#575a53]"}`}
                                >
                                  star
                                </span>
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-bold text-[#fdfdf6]">
                              {RATING_LABELS[feedbackRate] || ""}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="feedback-content"
                            className="block font-headline text-xs font-bold text-[#abaca5] mb-2"
                          >
                            Nội dung đánh giá
                          </label>
                          <textarea
                            id="feedback-content"
                            value={feedbackContent}
                            onChange={(e) => setFeedbackContent(e.target.value)}
                            rows={4}
                            maxLength={800}
                            placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
                            className="w-full resize-y rounded-lg border border-[#474944]/40 bg-[#1f221b] px-3 py-2 text-sm text-[#fdfdf6] focus:border-[#8eff71] focus:outline-none"
                          />
                          <div className="mt-1 text-right text-[11px] text-[#abaca5]">
                            {String(feedbackContent || "").length}/800
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={resetFeedbackForm}
                            disabled={feedbackSubmitting}
                            className="rounded-lg border border-[#474944]/50 px-3 py-2 text-xs font-bold text-[#abaca5] transition-colors hover:bg-[#242721] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            disabled={feedbackSubmitting || !selectedFeedbackSlotId}
                            className="rounded-lg bg-[#8eff71] px-4 py-2 text-xs font-black text-[#0d6100] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {feedbackSubmitting
                              ? "Đang gửi..."
                              : selectedFeedbackSlot?.feedback
                                ? "Lưu cập nhật"
                                : "Gửi đánh giá"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-[#474944]/30 pt-4 mt-4">
              <h3 className="font-headline text-sm font-bold text-[#8eff71] mb-3">Feedback từ người chơi</h3>

              {feedbacks.length === 0 ? (
                <div className="rounded-lg border border-[#474944]/30 bg-[#121410] p-4 text-sm text-[#abaca5]">
                  Chưa có feedback nào cho sân này.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.slice(0, 10).map((fb) => {
                    const userName = fb?.user?.name || 'User';
                    const userAvatar = String(fb?.user?.image || '').trim();
                    const rate = normalizeRate(fb?.rate);
                    const rateText = rate.toFixed(1);

                    return (
                      <div key={fb.id} className="rounded-xl border border-[#474944]/30 bg-[#121410] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {userAvatar ? (
                              <img
                                src={userAvatar}
                                alt={userName}
                                className="h-10 w-10 rounded-full object-cover border border-[#474944]/30"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_FIELD_IMAGE_URL;
                                }}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#474944]/30 bg-[#242721] text-xs font-black text-[#8eff71]">
                                {getInitials(userName)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="font-headline text-sm font-bold text-[#fdfdf6] truncate">{userName}</div>
                              <div className="text-[11px] text-[#abaca5]">
                                {fb?.createdAt ? new Date(fb.createdAt).toLocaleDateString('vi-VN') : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Action Buttons for User's own feedback */}
                            {String(authUser?.id || '') === String(fb.user?.id || '') && (
                              <div className="flex items-center gap-1.5 mr-2">
                                <button
                                  onClick={() => handleEditFromList(fb)}
                                  className="text-[#abaca5] hover:text-[#8eff71] transition-colors"
                                  title="Sửa đánh giá"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteFeedback(fb.id)}
                                  className="text-[#abaca5] hover:text-[#ff4d6d] transition-colors"
                                  title="Xóa đánh giá"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-[#ffc864]">star</span>
                              <span className="font-headline text-sm font-black text-[#ffc864]">{rateText}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-[#fdfdf6] whitespace-pre-wrap break-words">
                          {fb?.content || '(Không có nội dung)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 flex flex-col gap-6">
            <div className="rounded-2xl bg-[#181a16] shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#8eff71]/20 to-[#8eff71]/5 p-4 border-b border-[#8eff71]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-headline text-xs text-[#88f6ff]">
                      Booking
                    </span>
                    <p className="font-headline text-sm font-bold text-[#fdfdf6]">
                      Select your schedule
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-headline text-2xl font-black text-[#8eff71]">
                      {formatPrice(fieldPricePerHour)}
                    </span>
                    <span className="font-headline text-xs text-[#abaca5]">
                      /hr
                    </span>
                  </div>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-[#8eff71]">
                    check_circle
                  </span>
                  <p className="mt-4 font-headline text-lg font-bold text-[#fdfdf6]">
                    Booking Successful!
                  </p>
                  <p className="mt-2 text-sm text-[#abaca5]">
                    Redirecting to checkout...
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase text-[#abaca5]">
                      <span className="material-symbols-outlined text-sm">
                        calendar_today
                      </span>
                      Select Date
                    </label>
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-headline flex items-center gap-2 text-xs font-bold uppercase text-[#abaca5]">
                      <span className="material-symbols-outlined text-sm">
                        schedule
                      </span>
                      Time Slots
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlots.includes(slot);
                        const isPast = isSlotPast(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleSlot(slot)}
                            disabled={!selectedDate || isBooked || isPast}
                            className={
                              !selectedDate
                                ? "font-headline rounded-lg bg-[#2a2a2a] px-1 py-2 text-[10px] font-bold text-[#555] cursor-not-allowed"
                                : isPast
                                  ? "font-headline rounded-lg bg-[#2a2a2a] px-1 py-2 text-[10px] font-bold text-[#555] cursor-not-allowed line-through"
                                  : isBooked
                                    ? "font-headline rounded-lg bg-[#2a2a2a] px-1 py-2 text-[10px] font-bold text-[#555] cursor-not-allowed line-through"
                                    : isSelected
                                      ? "font-headline rounded-lg bg-[#8eff71] px-1 py-2 text-[10px] font-bold text-[#0d6100]"
                                      : "font-headline rounded-lg bg-[#242721] px-1 py-2 text-[10px] font-bold text-[#abaca5] transition-colors hover:bg-[#474944]/50 hover:text-[#fdfdf6]"
                            }
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedSlots.length > 0 && (
                    <div className="rounded-lg bg-[#8eff71]/10 p-2.5">
                      <p className="font-headline text-xs text-[#8eff71]">
                        {selectedSlots.length} slot(s):{" "}
                        {selectedSlots.join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-[#121410] p-3 border border-[#8eff71]/20">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-[#fdfdf6]">
                        Total
                      </span>
                      <span className="font-headline text-xl font-black text-[#8eff71]">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={!selectedDate || selectedSlots.length === 0}
                    className="w-full rounded-xl bg-gradient-to-r from-[#8eff71] to-[#2ff801] py-3.5 font-headline text-sm font-black text-[#0d6100] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(142,255,113,0.3)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Book Now
                  </button>

                  <div className="flex items-center gap-2 text-[10px] text-[#abaca5]">
                    <span className="material-symbols-outlined text-sm text-[#88f6ff]">
                      info
                    </span>
                    Free cancellation up to 24 hours before booking
                  </div>
                </div>
              )}
            </div>
            {detailBanners.length > 0 && (
              <AdBannerVertical
                banner={detailBanners[0]}
                title={verticalCopies[0].title}
                subtitle={verticalCopies[0].subtitle}
                cta={verticalCopies[0].cta}
                to={verticalCopies[0].to}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
