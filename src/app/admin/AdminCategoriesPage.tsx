import { useEffect, useState } from 'react'
import type { Category } from '../types'
import { ApiError, archiveCategory, createCategory, fetchAdminCategories, updateCategory, type CategoryPayload } from '../api'
import { AlertIcon, ArchiveIcon, CheckIcon, PencilIcon, PlusIcon, SpinnerIcon } from '../icons'

const EMPTY_CATEGORY: CategoryPayload = { slug: '', nameEn: '', nameVi: '', descriptionEn: null, descriptionVi: null, isArchived: false }

type FieldErrors = Partial<Record<keyof CategoryPayload, string>>

function validate(form: CategoryPayload): FieldErrors {
  const errors: FieldErrors = {}
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = 'Use lowercase letters, numbers, and single hyphens only.'
  if (!form.nameEn.trim()) errors.nameEn = 'English name is required.'
  if (!form.nameVi.trim()) errors.nameVi = 'Vietnamese name is required.'
  return errors
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<CategoryPayload>(EMPTY_CATEGORY)
  const [editingUpdatedAt, setEditingUpdatedAt] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function load(signal?: AbortSignal) {
    setError(null)
    fetchAdminCategories(signal)
      .then(setCategories)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof ApiError ? reason.message : 'Categories could not be loaded.')
      })
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [])

  function startCreate() {
    setEditingId('new')
    setForm(EMPTY_CATEGORY)
    setEditingUpdatedAt(null)
    setFieldErrors({})
    setFormError(null)
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setForm({ slug: category.slug, nameEn: category.nameEn, nameVi: category.nameVi, descriptionEn: category.descriptionEn ?? null, descriptionVi: category.descriptionVi ?? null, isArchived: category.isArchived })
    setEditingUpdatedAt(category.updatedAt)
    setFieldErrors({})
    setFormError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setFormError(null)
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    setFormError(null)
    try {
      if (editingId && editingId !== 'new') {
        await updateCategory(editingId, { ...form, expectedUpdatedAt: editingUpdatedAt ?? '' })
      } else {
        await createCategory(form)
      }
      setEditingId(null)
      load()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        if (reason.fields) setFieldErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(reason.fields ?? {}).map(([field, messages]) => [field, messages[0]])) }))
        setFormError(reason.message)
      } else {
        setFormError('The category could not be saved.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleArchive(category: Category) {
    setActionError(null)
    try {
      if (category.isArchived) {
        await updateCategory(category.id, { slug: category.slug, nameEn: category.nameEn, nameVi: category.nameVi, descriptionEn: category.descriptionEn ?? null, descriptionVi: category.descriptionVi ?? null, isArchived: false, expectedUpdatedAt: category.updatedAt })
      } else {
        await archiveCategory(category.id, category.updatedAt)
      }
      setPendingArchiveId(null)
      load()
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'The category could not be updated.')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Publishing</p>
          <h1>Categories</h1>
        </div>
        {editingId === null && <button type="button" className="button button-primary" onClick={startCreate}><PlusIcon /> New category</button>}
      </div>

      {actionError && <p className="status-note status-note-error" role="alert"><AlertIcon /> {actionError}</p>}

      {editingId !== null && (
        <form className="admin-form category-form" onSubmit={submitForm} noValidate>
          <h2>{editingId === 'new' ? 'New category' : 'Edit category'}</h2>
          {formError && <p className="status-note status-note-error" role="alert"><AlertIcon /> {formError}</p>}
          <label htmlFor="cat-slug">Slug
            <input id="cat-slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} aria-invalid={Boolean(fieldErrors.slug)} />
          </label>
          {fieldErrors.slug && <p className="field-error" role="alert">{fieldErrors.slug}</p>}
          <label htmlFor="cat-name-en">Name (English)
            <input id="cat-name-en" value={form.nameEn} maxLength={160} onChange={(event) => setForm((prev) => ({ ...prev, nameEn: event.target.value }))} aria-invalid={Boolean(fieldErrors.nameEn)} />
          </label>
          {fieldErrors.nameEn && <p className="field-error" role="alert">{fieldErrors.nameEn}</p>}
          <label htmlFor="cat-name-vi">Name (Vietnamese)
            <input id="cat-name-vi" value={form.nameVi} maxLength={160} onChange={(event) => setForm((prev) => ({ ...prev, nameVi: event.target.value }))} aria-invalid={Boolean(fieldErrors.nameVi)} />
          </label>
          {fieldErrors.nameVi && <p className="field-error" role="alert">{fieldErrors.nameVi}</p>}
          <label htmlFor="cat-desc-en">Description (English)
            <textarea id="cat-desc-en" rows={2} value={form.descriptionEn ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, descriptionEn: event.target.value || null }))} />
          </label>
          <label htmlFor="cat-desc-vi">Description (Vietnamese)
            <textarea id="cat-desc-vi" rows={2} value={form.descriptionVi ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, descriptionVi: event.target.value || null }))} />
          </label>
          <div className="admin-editor-actions">
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
            <button type="button" className="button button-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      )}

      {error && (
        <div className="status-note status-note-error" role="alert">
          <AlertIcon /> {error}
          <button type="button" className="button button-secondary" onClick={() => load()}>Retry</button>
        </div>
      )}
      {!error && categories === null && <p role="status" className="admin-loading"><SpinnerIcon /> Loading categories…</p>}
      {!error && categories !== null && categories.length === 0 && (
        <div className="empty-card"><span className="empty-index">—</span><div><h3>No categories yet.</h3><p>Create one to start publishing.</p></div></div>
      )}
      {!error && categories !== null && categories.length > 0 && (
        <ul className="admin-category-list">
          {categories.map((category) => (
            <li key={category.id} className="admin-post-row">
              <div className="admin-post-row-main">
                <h3>{category.nameEn} <span className="text-muted">/ {category.nameVi}</span></h3>
                <p className="admin-post-row-meta">
                  {category.isArchived ? <span className="status-badge status-badge-archived"><ArchiveIcon /> Archived</span> : <span className="status-badge status-badge-published"><CheckIcon /> Active</span>}
                  <span>/{category.slug}</span>
                </p>
              </div>
              <div className="admin-post-row-actions">
                <button type="button" className="button button-secondary" onClick={() => startEdit(category)}><PencilIcon /> Edit</button>
                {category.isArchived ? (
                  <button type="button" className="button button-secondary" onClick={() => toggleArchive(category)}>Restore</button>
                ) : pendingArchiveId === category.id ? (
                  <span className="confirm-inline">
                    <span>Archiving hides this category's posts from public listing. It stays recoverable.</span>
                    <button type="button" className="button button-primary" onClick={() => toggleArchive(category)}>Yes, archive</button>
                    <button type="button" className="button button-secondary" onClick={() => setPendingArchiveId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button type="button" className="button button-secondary" onClick={() => setPendingArchiveId(category.id)}><ArchiveIcon /> Archive</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
