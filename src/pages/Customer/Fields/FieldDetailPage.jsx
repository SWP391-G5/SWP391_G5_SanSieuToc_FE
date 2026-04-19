import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/axios";

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

export default function FieldDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  useEffect(() => {
    const fetchField = async () => {
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
    };
    fetchField();
  }, [id]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
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
    };
    fetchBookedSlots();
  }, [selectedDate, id]);

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
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img
              src={
                fieldData.image?.[0] || "https://via.placeholder.com/800x400"
              }
              alt={fieldData.fieldName}
              className="h-72 w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#0d0f0b]/80 px-3 py-1 backdrop-blur-md">
              <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">
                star
              </span>
              <span className="font-headline text-xs font-bold text-white">
                4.9
              </span>
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
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-2xl bg-[#181a16] shadow-xl overflow-hidden">
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
                          disabled={isBooked || isPast}
                          className={
                            isPast
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
                      {selectedSlots.length} slot(s): {selectedSlots.join(", ")}
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
        </div>
      </div>
    </div>
  );
}
