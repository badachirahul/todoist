import { FileText, X, ExternalLink } from "lucide-react";
import { fileUrl } from "../api/attachments";

/**
 * Gray attachment container (task composer + task detail modal). Works for a
 * locally-picked File (preview via blob URL) and a saved attachment (preview via
 * its download URL). `onRemove` shows the ✕.
 */
export function AttachmentBar({ attachment, file, onRemove }) {
  const name = attachment?.filename ?? file?.name ?? "file";
  const open = () => {
    const url = attachment ? fileUrl(attachment) : file ? URL.createObjectURL(file) : null;
    if (url) window.open(url, "_blank", "noopener");
  };
  return (
    <div
      className="flex items-center gap-2 rounded-md"
      style={{ height: 41, padding: "6px 8px", background: "rgba(0,0,0,.04)" }}
    >
      <FileText size={18} className="flex-none text-[#dc4c3e]" />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{name}</span>
      <button type="button" onClick={open} className="rounded p-1 text-gray-400 hover:bg-black/5" aria-label="Preview">
        <ExternalLink size={16} />
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className="rounded p-1 text-gray-400 hover:bg-black/5" aria-label="Remove">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/** Bordered, clickable attachment card shown under a posted comment. */
export function CommentAttachmentCard({ attachment }) {
  return (
    <button
      type="button"
      onClick={() => window.open(fileUrl(attachment), "_blank", "noopener")}
      className="mt-2 flex max-w-xs items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left transition hover:bg-gray-50"
    >
      <FileText size={20} className="flex-none text-[#dc4c3e]" />
      <span className="truncate text-sm text-gray-700">{attachment.filename}</span>
    </button>
  );
}
