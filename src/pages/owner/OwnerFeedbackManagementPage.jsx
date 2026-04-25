import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ownerFeedbackService from '../../services/ownerFeedbackService';
import { useNotification } from '../../context/NotificationContext';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN');
}

export default function OwnerFeedbackManagementPage() {
  const { notifyError } = useNotification();
  const navigate = useNavigate();

  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [fieldId, setFieldId] = useState('');
  const [period, setPeriod] = useState('');

  const fieldOptions = useMemo(() => fields || [], [fields]);

  const loadFields = async () => {
    setFieldsLoading(true);
    try {
      const data = await ownerFeedbackService.listFields();
      setFields(data?.items || []);
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách sân thất bại.');
    } finally {
      setFieldsLoading(false);
    }
  };

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await ownerFeedbackService.listFeedbacks({
        fieldId: fieldId || undefined,
        period: period || undefined,
      });
      setItems(data?.items || []);
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách feedback thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId, period]);

  const gotoReport = (it) => {
    const targetCustomerId = String(it?.customerId || '').trim();
    const name = String(it?.customerName || '').trim();
    const email = String(it?.customerEmail || '').trim();

    if (!targetCustomerId) {
      notifyError('Không xác định được customer của feedback để report.');
      return;
    }

    const targetLabel = name && email ? `${name} (${email})` : name || email || targetCustomerId;
    const params = new URLSearchParams({ targetCustomerId, targetLabel });
    navigate(`/owner/reports?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-primary font-bold text-3xl headline-font tracking-tight">Feedback management</div>
          <div className="text-on-surface-variant text-sm mt-1">Xem feedback của các sân bạn sở hữu và report khách hàng vi phạm.</div>
        </div>
        <button
          type="button"
          onClick={() => {
            loadFields();
            loadFeedbacks();
          }}
          className="px-4 py-2 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15"
        >
          Làm mới
        </button>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-on-surface-variant">Lọc theo sân</label>
            <select
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              disabled={fieldsLoading}
              className="mt-2 w-full rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface"
            >
              <option value="">Tất cả sân</option>
              {fieldOptions.map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {f.fieldName || String(f.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-on-surface-variant">Khoảng thời gian</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-2 w-full rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface"
            >
              <option value="">Tất cả thời gian</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="year">1 năm qua</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container">
              <tr className="text-on-surface-variant">
                <th className="px-5 py-3 text-left font-semibold">Sân</th>
                <th className="px-5 py-3 text-left font-semibold">Khách hàng</th>
                <th className="px-5 py-3 text-left font-semibold">Rating</th>
                <th className="px-5 py-3 text-left font-semibold">Nội dung</th>
                <th className="px-5 py-3 text-left font-semibold">Thời gian</th>
                <th className="px-5 py-3 text-left font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-on-surface-variant">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-on-surface-variant">
                    Không có feedback.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const id = String(it._id || it.id || '');
                  const content = String(it.content || '').trim();
                  const customer = String(it.customerName || '').trim() || String(it.customerEmail || '').trim() || '—';

                  return (
                    <tr key={id} className="border-t border-outline-variant/10">
                      <td className="px-5 py-4 text-on-surface/90">{it.fieldName || it.fieldId || '—'}</td>
                      <td className="px-5 py-4 text-on-surface/90">{customer}</td>
                      <td className="px-5 py-4 text-on-surface/90">{Number(it.rate || 0)}/5</td>
                      <td className="px-5 py-4 text-on-surface/80">
                        <div className="max-w-[420px] line-clamp-2">{content || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-on-surface/80">{formatDateTime(it.createdAt)}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => gotoReport(it)}
                          className="px-3 py-1.5 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15 text-sm"
                        >
                          Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
