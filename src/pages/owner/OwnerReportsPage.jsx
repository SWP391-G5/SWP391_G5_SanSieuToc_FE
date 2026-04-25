import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ownerReportService from '../../services/ownerReportService';
import uploadService from '../../services/uploadService';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../../components/Modal';

const REPORT_TYPES = [
  { value: 'Spam', label: 'Spam' },
  { value: 'Inappropriate Behavior', label: 'Inappropriate Behavior' },
  { value: 'System Problem', label: 'System problem' },
];

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN');
}

function StatusBadge({ status }) {
  const s = String(status || '').trim();
  const cls =
    s === 'Pending'
      ? 'bg-amber-500/15 text-amber-400'
      : s === 'Resolved'
        ? 'bg-primary/15 text-primary'
        : 'bg-error/15 text-error';
  const label = s === 'Pending' ? 'Chờ xử lý' : s === 'Resolved' ? 'Đã chấp nhận' : s === 'Rejected' ? 'Bị từ chối' : s || '—';
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase font-headline ${cls}`}>{label}</span>;
}

function normalizeEvidencePreview(list) {
  return (Array.isArray(list) ? list : []).map(String).filter(Boolean);
}

export default function OwnerReportsPage() {
  const { notifyError, notifySuccess } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastPrefillKeyRef = useRef('');

  const [prefillTargetOption, setPrefillTargetOption] = useState(null);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  const [form, setForm] = useState({
    reportType: 'Spam',
    targetCustomerId: '',
    description: '',
    evidence: [],
  });

  const isSystemType = useMemo(() => String(form.reportType) === 'System Problem', [form.reportType]);

  const canSubmit = useMemo(() => {
    const descOk = String(form.description || '').trim().length > 0;
    const evidenceCount = normalizeEvidencePreview(form.evidence).length;
    const evOk = evidenceCount >= 1 && evidenceCount <= 5;
    const targetOk = isSystemType ? true : Boolean(String(form.targetCustomerId || '').trim());
    return descOk && evOk && targetOk;
  }, [form, isSystemType]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ownerReportService.listMyReports();
      setItems(data?.items || []);
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách report thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const data = await ownerReportService.listEligibleCustomers();
      setCustomers(data?.items || []);
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách customer thất bại.');
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetCustomerId = String(searchParams.get('targetCustomerId') || '').trim();
    const targetLabel = String(searchParams.get('targetLabel') || '').trim();

    if (!targetCustomerId) return;

    const key = `${targetCustomerId}|${targetLabel}`;
    if (lastPrefillKeyRef.current === key) return;
    lastPrefillKeyRef.current = key;

    setEditingId('');
    setForm({
      reportType: 'Spam',
      targetCustomerId,
      description: '',
      evidence: [],
    });

    if (targetLabel) setPrefillTargetOption({ id: targetCustomerId, label: targetLabel });

    // Clear params so resetting the form doesn't auto-prefill again.
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const resetForm = () => {
    setEditingId('');
    setForm({ reportType: 'Spam', targetCustomerId: '', description: '', evidence: [] });
  };

  const onPickEvidenceFiles = async (files) => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;

    const current = normalizeEvidencePreview(form.evidence);
    if (current.length >= 5) {
      notifyError('Bạn chỉ được chọn tối đa 5 ảnh.');
      return;
    }

    const allowed = list.slice(0, Math.max(0, 5 - current.length));

    setSubmitting(true);
    try {
      const urls = await uploadService.uploadImages(allowed);
      const next = current.concat(urls).slice(0, 5);
      setForm((p) => ({ ...p, evidence: next }));
      notifySuccess('Đã tải ảnh bằng chứng.');
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Upload ảnh thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRemoveEvidence = (url) => {
    const next = normalizeEvidencePreview(form.evidence).filter((x) => x !== url);
    setForm((p) => ({ ...p, evidence: next }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      notifyError('Vui lòng nhập đủ thông tin và tối thiểu 1 ảnh bằng chứng.');
      return;
    }

    const payload = {
      reportType: form.reportType,
      description: String(form.description || '').trim(),
      evidence: normalizeEvidencePreview(form.evidence),
    };

    if (!isSystemType) payload.targetCustomerId = String(form.targetCustomerId || '').trim();

    setSubmitting(true);
    try {
      if (editingId) {
        const data = await ownerReportService.updateReport(editingId, payload);
        notifySuccess(data?.message || 'Đã cập nhật report.');
      } else {
        const data = await ownerReportService.createReport(payload);
        notifySuccess(data?.message || 'Đã gửi report.');
      }
      resetForm();
      await load();
    } catch (e2) {
      notifyError(e2?.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (it) => {
    if (!it?.id) return;
    if (String(it.status) !== 'Pending') {
      notifyError('Chỉ được sửa khi report đang chờ xử lý.');
      return;
    }

    const isSystem = String(it.targetType) === 'System' || String(it.reportType) === 'System Problem';

    setEditingId(it.id);
    setForm({
      reportType: it.reportType || 'Spam',
      targetCustomerId: isSystem ? '' : String(it.target?.id || ''),
      description: it.description || '',
      evidence: normalizeEvidencePreview(it.evidence),
    });
  };

  const onDelete = (it) => {
    if (!it?.id) return;
    if (String(it.status) !== 'Pending') {
      notifyError('Chỉ được xóa khi report đang chờ xử lý.');
      return;
    }
    setDeleteModal({ isOpen: true, item: it });
  };

  const confirmDelete = async () => {
    const it = deleteModal.item;
    if (!it?.id) return;

    setSubmitting(true);
    setDeleteModal({ isOpen: false, item: null });
    try {
      const data = await ownerReportService.deleteReport(it.id);
      notifySuccess(data?.message || 'Đã xóa report.');
      if (editingId === it.id) resetForm();
      await load();
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Xóa report thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-primary font-bold text-3xl headline-font tracking-tight">Reports</div>
          <div className="text-on-surface-variant text-sm mt-1">Gửi report cho admin (có thể sửa/xóa khi đang chờ xử lý).</div>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            load();
            loadCustomers();
          }}
          className="px-4 py-2 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15"
        >
          Làm mới
        </button>
      </div>

      <form onSubmit={onSubmit} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-on-surface">{editingId ? 'Sửa report' : 'Tạo report mới'}</div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15 text-sm"
            >
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-on-surface-variant">Kiểu report</label>
            <select
              value={form.reportType}
              onChange={(e) => {
                const nextType = e.target.value;
                setForm((p) => ({ ...p, reportType: nextType, targetCustomerId: nextType === 'System Problem' ? '' : p.targetCustomerId }));
              }}
              className="mt-2 w-full rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-on-surface-variant">Đối tượng bị report</label>
            {isSystemType ? (
              <div className="mt-2 rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface">
                Hệ thống
              </div>
            ) : (
              <select
                value={form.targetCustomerId}
                onChange={(e) => setForm((p) => ({ ...p, targetCustomerId: e.target.value }))}
                disabled={customersLoading}
                className="mt-2 w-full rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface disabled:opacity-60"
              >
                <option value="">
                  {customersLoading ? 'Đang tải danh sách customer...' : customers.length ? 'Chọn đối tượng bị report' : 'Chưa có đối tượng hợp lệ'}
                </option>
                {prefillTargetOption?.id && !customers.some((c) => String(c.id) === String(prefillTargetOption.id)) ? (
                  <option value={prefillTargetOption.id}>{prefillTargetOption.label || prefillTargetOption.id}</option>
                ) : null}
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.username} ({c.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-on-surface-variant">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-md bg-surface border border-outline-variant/15 px-3 py-2 text-on-surface outline-none focus:border-primary/40"
              placeholder="Mô tả chi tiết vấn đề..."
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-on-surface-variant">Bằng chứng (1-5 ảnh)</label>
              <div className="text-xs text-on-surface-variant">{normalizeEvidencePreview(form.evidence).length} / 5</div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {normalizeEvidencePreview(form.evidence).map((url) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt="evidence"
                    className="h-16 w-24 rounded-md object-cover border border-outline-variant/15"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveEvidence(url)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-surface-container border border-outline-variant/20 text-on-surface/70 hover:text-error"
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}

              {normalizeEvidencePreview(form.evidence).length < 5 ? (
                <label className="h-16 w-24 rounded-md border border-dashed border-outline-variant/30 bg-surface flex items-center justify-center text-on-surface-variant hover:border-primary/40 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter(Boolean);
                      e.target.value = '';
                      onPickEvidenceFiles(files);
                    }}
                  />
                  <span className="material-symbols-outlined">add</span>
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15"
          >
            Đặt lại
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={
              !canSubmit || submitting
                ? 'px-4 py-2 rounded-md bg-surface-container text-on-surface/40 border border-outline-variant/10'
                : 'px-4 py-2 rounded-md bg-primary text-on-primary font-bold hover:opacity-95'
            }
          >
            {submitting ? 'Đang xử lý...' : editingId ? 'Lưu thay đổi' : 'Gửi report'}
          </button>
        </div>
      </form>

      <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="font-bold text-on-surface">Danh sách report</div>
          <div className="text-xs text-on-surface-variant">{loading ? 'Đang tải...' : `${items.length} report`}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-on-surface-variant border-b border-outline-variant/10">
                <th className="px-5 py-3 font-semibold">Kiểu</th>
                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                <th className="px-5 py-3 font-semibold">Đối tượng</th>
                <th className="px-5 py-3 font-semibold">Mô tả</th>
                <th className="px-5 py-3 font-semibold">Bằng chứng</th>
                <th className="px-5 py-3 font-semibold">Thời gian</th>
                <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-on-surface-variant" colSpan={7}>
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-on-surface-variant" colSpan={7}>
                    Chưa có report nào.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const pending = String(it.status) === 'Pending';
                  const targetLabel =
                    String(it.targetType) === 'System' || String(it.reportType) === 'System Problem'
                      ? 'Hệ thống'
                      : it.target
                        ? `${it.target.name || it.target.username || '-'}${it.target.email ? ` (${it.target.email})` : ''}`
                        : '—';

                  const evidence = normalizeEvidencePreview(it.evidence);

                  return (
                    <tr key={it.id} className="hover:bg-surface">
                      <td className="px-5 py-4 align-top">
                        <div className="font-bold text-on-surface">{it.reportType || '—'}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <StatusBadge status={it.status} />
                      </td>

                      <td className="px-5 py-4 align-top text-on-surface-variant">
                        <div className="max-w-[260px] truncate" title={targetLabel}>
                          {targetLabel}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-on-surface-variant">
                        <div className="max-w-[420px] whitespace-pre-line break-words">{it.description || '—'}</div>
                        {String(it.adminNote || '').trim() ? (
                          <div className="mt-3 rounded-md bg-surface border border-outline-variant/10 p-3">
                            <div className="text-[10px] font-bold uppercase text-on-surface-variant">Ghi chú admin</div>
                            <div className="mt-1 text-on-surface/80 whitespace-pre-line break-words">{it.adminNote}</div>
                          </div>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {evidence.length ? (
                          <div className="flex flex-wrap gap-2">
                            {evidence.slice(0, 5).map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-md border border-outline-variant/15 hover:border-primary/40"
                                title="Mở ảnh"
                              >
                                <img src={url} alt="evidence" className="h-14 w-20 object-cover" loading="lazy" referrerPolicy="no-referrer" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="text-on-surface-variant">—</div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-on-surface-variant whitespace-nowrap">{formatDateTime(it.createdAt)}</td>

                      <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => onEdit(it)}
                            disabled={!pending || submitting}
                            className={
                              !pending || submitting
                                ? 'px-4 py-2 rounded-md bg-surface-container text-on-surface/40 border border-outline-variant/10'
                                : 'px-4 py-2 rounded-md bg-surface-container text-on-surface/80 hover:text-primary border border-outline-variant/15'
                            }
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(it)}
                            disabled={!pending || submitting}
                            className={
                              !pending || submitting
                                ? 'px-4 py-2 rounded-md bg-surface-container text-on-surface/40 border border-outline-variant/10'
                                : 'px-4 py-2 rounded-md bg-error/15 text-error border border-error/20 hover:bg-error/25'
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        title="Xác nhận xóa"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <div>
              <div className="text-[#fdfdf6] font-bold text-lg">Xóa report này?</div>
              <p className="text-[#abaca5] text-sm mt-1 leading-relaxed">
                Hành động này sẽ xóa vĩnh viễn report <span className="text-[#fdfdf6] font-medium">"{deleteModal.item?.reportType}"</span>.
                Bạn sẽ không thể khôi phục lại dữ liệu này.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: false, item: null })}
              className="px-5 py-2.5 rounded-xl bg-[#242721] text-[#abaca5] hover:text-[#fdfdf6] transition-all font-medium text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-5 py-2.5 rounded-xl bg-error text-white hover:bg-error/90 transition-all font-bold text-sm shadow-lg shadow-error/20"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
