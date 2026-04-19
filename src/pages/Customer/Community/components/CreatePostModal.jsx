import { useState } from 'react';
import Modal from 'react-modal';
import communityService from '../../../../services/communityService';
import uploadService from '../../../../services/uploadService';
import { useNotification } from '../../../../context/NotificationContext';

Modal.setAppElement('#root');

export default function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const { notifySuccess, notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState({
    title: '',
    content: '',
    tag: 'General',
    image: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payload.title.trim() || !payload.content.trim()) {
      notifyError('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = '';
      if (imageFile) {
        const urls = await uploadService.uploadImages([imageFile]);
        finalImageUrl = urls[0] || '';
      }

      await communityService.createPost({
        ...payload,
        image: finalImageUrl,
      });

      notifySuccess('Bài viết đã được gửi! Vui lòng chờ Admin duyệt.');
      onSuccess?.();
      handleClose();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message || 'Không thể tạo bài viết.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayload({ title: '', content: '', tag: 'General', image: '' });
    setImageFile(null);
    setPreviewUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Create Post Modal"
      className="mx-auto mt-20 max-w-2xl outline-none"
      overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto"
    >
      <div className="w-full animate-in fade-in zoom-in duration-300 rounded-3xl border border-[#474944]/30 bg-[#121410] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline text-2xl font-black text-[#fdfdf6]">
            Tạo bài viết <span className="italic text-[#8eff71]">mới</span>
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-[#abaca5] hover:bg-[#242721] hover:text-[#fdfdf6] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-[#abaca5]">Tiêu đề</label>
            <input
              type="text"
              required
              value={payload.title}
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
              placeholder="Tiêu đề bài viết của bạn..."
              className="w-full rounded-xl border border-[#474944]/30 bg-[#0d0f0b] p-3 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71] focus:ring-1 focus:ring-[#8eff71]/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[#abaca5]">Chủ đề</label>
              <select
                value={payload.tag}
                onChange={(e) => setPayload({ ...payload, tag: e.target.value })}
                className="w-full rounded-xl border border-[#474944]/30 bg-[#0d0f0b] p-3 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71]"
              >
                <option value="General">Chung</option>
                <option value="Match">Kèo đá</option>
                <option value="Review">Đánh giá</option>
                <option value="Question">Hỏi đáp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[#abaca5]">Hình ảnh (Tùy chọn)</label>
              <div className="relative">
                {!previewUrl ? (
                  <label className="flex h-[46px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#474944]/50 bg-[#0d0f0b] text-[#abaca5] transition-all hover:border-[#8eff71] hover:bg-[#121410] hover:text-[#8eff71]">
                    <span className="material-symbols-outlined mr-2 text-xl">image</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Tải ảnh lên</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-xl border border-[#474944]/30 bg-[#0d0f0b]">
                    <img src={previewUrl} alt="Ảnh xem trước" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md hover:bg-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-[#abaca5]">Nội dung</label>
            <textarea
              required
              rows={6}
              value={payload.content}
              onChange={(e) => setPayload({ ...payload, content: e.target.value })}
              placeholder="Nội dung bài viết..."
              className="w-full rounded-xl border border-[#474944]/30 bg-[#0d0f0b] p-3 text-sm text-[#fdfdf6] outline-none transition-all focus:border-[#8eff71] focus:ring-1 focus:ring-[#8eff71]/40 placeholder:opacity-50"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-[#8eff71] py-4 text-sm font-black uppercase tracking-[0.2em] text-[#0d6100] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d6100] border-t-transparent" />
                  <span>Đang xử lý</span>
                </div>
              ) : (
                'Đăng bài viết'
              )}
            </button>
            <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-[#abaca5]">
              * Bài viết sẽ được Admin duyệt trước khi công khai.
            </p>
          </div>
        </form>
      </div>
    </Modal>
  );
}
