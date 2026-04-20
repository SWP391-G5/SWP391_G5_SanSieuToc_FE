/**
 * OwnerPostsPage.jsx
 * Owner page for creating and editing their own posts (no moderation actions).
 */

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import ownerPostService from "../../services/owner/ownerPostService";

import PostFormModal from "../Manager/posts/PostFormModal";
import PostPreviewModal from "../Manager/posts/PostPreviewModal";
import PostsPagination from "../Manager/posts/PostsPagination";
import PostsTable from "../Manager/posts/PostsTable";
import PostsToolbar from "../Manager/posts/PostsToolbar";

import {
  filterPostLikeList,
  buildSearchNeedle,
} from "../Manager/posts/postFilters";
import { getPostImages } from "../Manager/posts/postFormatters";

export default function OwnerPostsPage() {
  const notify = useNotification();
  const { user } = useAuth();
  const userId = String(user?._id || user?.id || "");

  // ── Loading / error ──────────────────────────────────────────────────────
  const [loading] = useState(false);
  const [error, setError] = useState("");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter / pagination state ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const limit = 10;
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_desc");
  const [tag, setTag] = useState("");

  // ── Modal / action state ─────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    content: "",
    images: [],
    tags: [],
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const searchNeedle = useMemo(() => buildSearchNeedle(search), [search]);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setError("");
    try {
      const data = await ownerPostService.getMyPosts();
      const list = data?.items || data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      const statusCode = e?.response?.status;
      const isUnauthorized = statusCode === 401 || statusCode === 403;
      const msg = isUnauthorized
        ? "Unauthorized: API requires login token."
        : e?.response?.data?.message || e?.message || "Failed to load posts";
      setError(msg);
      setItems([]);
      notify.notifyError(msg);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", images: [], tags: [] });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (post) => {
    if (!post) return;

    setEditing(post);
    setForm({
      title: post?.postName || post?.title || "",
      content: post?.postContent || post?.content || "",
      images: getPostImages(post),
      tags: Array.isArray(post?.postTags) ? post.postTags : [],
    });
    setFormError("");
    setShowForm(true);
  };

  const submitForm = async () => {
    const title = String(form?.title || "").trim();
    const content = String(form?.content || "").trim();
    const tags = Array.isArray(form?.tags) ? form.tags.filter(Boolean) : [];

    if (!title) {
      notify.notifyWarning("Title is required to submit.");
      return;
    }
    if (!content) {
      notify.notifyWarning("Content is required to submit.");
      return;
    }
    if (tags.length < 1) {
      notify.notifyWarning("Tag is required to submit.");
      return;
    }

    setFormBusy(true);
    setFormError("");
    try {
      const fd = new FormData();
      fd.set("postName", form.title);
      fd.set("postContent", form.content);

      (form?.tags || []).forEach((t) => fd.append("postTags", t));

      const stringImages = (form?.images || []).filter(
        (x) => typeof x === "string" && x.trim(),
      );
      stringImages.slice(0, 6).forEach((url) => fd.append("postImage", url));

      (form?.images || [])
        .filter((x) => x && typeof x === "object" && x.file instanceof File)
        .slice(0, Math.max(0, 6 - stringImages.length))
        .forEach((x) => fd.append("images", x.file));

      if (editing?._id || editing?.id) {
        await ownerPostService.updatePost(editing._id || editing.id, fd);
      } else {
        await ownerPostService.createPost(fd);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ title: "", content: "", images: [], tags: [] });
      await load();
      notify.notifySuccess("Đã gửi bài đăng để duyệt");
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save post";
      setFormError(msg);
      notify.notifyError(msg);
    } finally {
      setFormBusy(false);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    const filtered = filterPostLikeList({
      merged: items || [],
      status,
      tableOwner: "",
      tag,
      searchNeedle,
      isLocalDraft: () => false,
      getTitle: (p) => p?.postName || p?.title || "",
      getContent: (p) => p?.postContent || p?.content || "",
    });

    filtered.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy.startsWith("created_")) {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        valA = new Date(a.updatedAt || 0).getTime();
        valB = new Date(b.updatedAt || 0).getTime();
      }
      return sortBy.endsWith("_desc") ? valB - valA : valA - valB;
    });

    return filtered;
  }, [items, status, tag, searchNeedle, sortBy]);

  useEffect(() => {
    const count = filteredAndSortedItems.length;
    const nextTotal = Math.max(1, Math.ceil(count / Math.max(1, limit)));
    setTotalPages(nextTotal);

    if (page > nextTotal) setPage(nextTotal);
    else if (page < 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAndSortedItems.length, limit, page]);

  const displayedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAndSortedItems.slice(start, start + limit);
  }, [filteredAndSortedItems, page, limit]);

  const resetFilters = () => {
    setStatus("");
    setSearch("");
    setTag("");
    setSortBy("created_desc");
    setPage(1);
  };

  const canEditPost = () => true;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            Bai dang
          </h1>
          <p className="text-sm text-on-surface-variant">
            Tao va cap nhat bai dang cua san (gui duyet tu dong).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              setPage(1);
              await load();
              notify.notifyInfo("Da lam moi du lieu");
            }}
            className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-on-surface hover:bg-surface transition-all"
          >
            Lam moi
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-primary/20 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            Tao bai dang
          </button>
        </div>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <PostsToolbar
          search={search}
          onSearchChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          onReset={resetFilters}
        />

        {error ? <div className="text-sm text-error">{error}</div> : null}

        <PostsTable
          loading={loading}
          items={displayedItems}
          page={page}
          limit={limit}
          status={status}
          onChangeStatus={(v) => {
            setPage(1);
            setStatus(v);
          }}
          tableOwner=""
          onChangeOwner={undefined}
          tag={tag}
          onChangeTag={(v) => {
            setPage(1);
            setTag(v);
          }}
          sortBy={sortBy}
          onChangeSort={(v) => {
            setSortBy(v);
          }}
          onPreview={(post) => setPreviewing(post)}
          onEdit={openEdit}
          canEditPost={canEditPost}
          userId={userId}
          hideOwnerFilter
        />

        <div className="pt-2 flex justify-center">
          <PostsPagination
            page={page}
            totalPages={totalPages}
            loading={false}
            onPageChange={setPage}
          />
        </div>
      </section>

      <PostFormModal
        open={showForm}
        editing={editing}
        form={form}
        setForm={setForm}
        formBusy={formBusy}
        formError={formError}
        onClose={() => setShowForm(false)}
        onPublish={submitForm}
        notify={notify}
        hideDraftActions
        publishLabel="Gui duyet"
      />

      <PostPreviewModal
        open={!!previewing}
        post={previewing}
        onClose={() => setPreviewing(null)}
      />
    </div>
  );
}
