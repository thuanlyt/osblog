import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, Post } from '../types'
import { ApiError, archiveAdminPost, createAdminPost, fetchAdminCategories, fetchAdminPost, updateAdminPost, type PostPayload } from '../api'
import { SafeMarkdown } from '../markdown'
import { clearDraft, readDraft, writeDraft, type PostDraft } from '../storage'
import { applyToolbarAction, type ToolbarAction } from './toolbar'
import { slugify } from './slug'
import {
  AlertIcon, ArchiveIcon, BoldIcon, CheckIcon, CodeIcon, ColumnsIcon, EyeIcon, HeadingIcon, ImageIcon, ItalicIcon, LinkIcon, ListIcon, PencilIcon, QuoteIcon, SpinnerIcon,
} from '../icons'

type FormState = Omit<PostPayload, 'publishedAt'> & { publishedAt: string | null }

const EMPTY_FORM: FormState = {
  categoryId: '', slug: '', titleEn: '', titleVi: '', excerptEn: '', excerptVi: '', bodyEn: '', bodyVi: '',
  status: 'draft', publishedAt: null, coverImageUrl: null, coverImageAltEn: null, coverImageAltVi: null,
  seoTitleEn: null, seoTitleVi: null, seoDescriptionEn: null, seoDescriptionVi: null,
}

function postToForm(post: Post): FormState {
  return {
    categoryId: post.categoryId, slug: post.slug, titleEn: post.titleEn, titleVi: post.titleVi,
    excerptEn: post.excerptEn, excerptVi: post.excerptVi, bodyEn: post.bodyEn ?? '', bodyVi: post.bodyVi ?? '',
    status: post.status, publishedAt: post.publishedAt, coverImageUrl: post.coverImageUrl,
    coverImageAltEn: post.coverImageAltEn, coverImageAltVi: post.coverImageAltVi,
    seoTitleEn: post.seoTitleEn, seoTitleVi: post.seoTitleVi, seoDescriptionEn: post.seoDescriptionEn, seoDescriptionVi: post.seoDescriptionVi,
  }
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.categoryId) errors.categoryId = 'Choose a category.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = 'Use lowercase letters, numbers, and single hyphens only.'
  else if (form.slug.length > 180) errors.slug = 'Slug must be 180 characters or fewer.'
  if (!form.titleEn.trim()) errors.titleEn = 'English title is required.'
  else if (form.titleEn.length > 240) errors.titleEn = 'Keep the English title under 240 characters.'
  if (!form.titleVi.trim()) errors.titleVi = 'Vietnamese title is required.'
  else if (form.titleVi.length > 240) errors.titleVi = 'Keep the Vietnamese title under 240 characters.'
  if (!form.excerptEn.trim()) errors.excerptEn = 'English excerpt is required.'
  else if (form.excerptEn.length > 1000) errors.excerptEn = 'Keep the English excerpt under 1000 characters.'
  if (!form.excerptVi.trim()) errors.excerptVi = 'Vietnamese excerpt is required.'
  else if (form.excerptVi.length > 1000) errors.excerptVi = 'Keep the Vietnamese excerpt under 1000 characters.'
  if (!form.bodyEn.trim()) errors.bodyEn = 'English body is required.'
  else if (form.bodyEn.length > 100000) errors.bodyEn = 'English body exceeds the 100,000 character limit.'
  if (!form.bodyVi.trim()) errors.bodyVi = 'Vietnamese body is required.'
  else if (form.bodyVi.length > 100000) errors.bodyVi = 'Vietnamese body exceeds the 100,000 character limit.'
  if (form.coverImageUrl) {
    const validUrl = /^https?:\/\//i.test(form.coverImageUrl) || /^\/assets\/[a-zA-Z0-9._/-]+$/.test(form.coverImageUrl)
    if (!validUrl) errors.coverImageUrl = 'Use an http(s) URL or an /assets/ path.'
    if (!form.coverImageAltEn?.trim()) errors.coverImageAltEn = 'Alt text is required in English when a cover image is set.'
    if (!form.coverImageAltVi?.trim()) errors.coverImageAltVi = 'Alt text is required in Vietnamese when a cover image is set.'
  }
  if (form.status === 'published' && !form.publishedAt) errors.publishedAt = 'Published posts need a publish date and time.'
  return errors
}

function buildPayload(form: FormState): PostPayload {
  return { ...form }
}

const TOOLBAR_ITEMS: { action: ToolbarAction; label: string; icon: ReactElement }[] = [
  { action: 'heading', label: 'Heading', icon: <HeadingIcon /> },
  { action: 'bold', label: 'Bold', icon: <BoldIcon /> },
  { action: 'italic', label: 'Italic', icon: <ItalicIcon /> },
  { action: 'link', label: 'Link', icon: <LinkIcon /> },
  { action: 'image', label: 'Image', icon: <ImageIcon /> },
  { action: 'list', label: 'List', icon: <ListIcon /> },
  { action: 'quote', label: 'Quote', icon: <QuoteIcon /> },
  { action: 'code', label: 'Code', icon: <CodeIcon /> },
]

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

const configuredSiteOrigin = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '').replace(/^https?:\/\//i, '') ?? ''

export function AdminPostEditorPage({ mode, postId, adminEmail }: { mode: 'new' | 'edit'; postId?: string; adminEmail: string }) {
  const navigate = useNavigate()
  const draftKey = postId ?? 'new'
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(mode === 'new')
  const [activeLang, setActiveLang] = useState<'en' | 'vi'>('en')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<{ message: string; fields?: Record<string, string[]> } | null>(null)
  const [conflict, setConflict] = useState<{ message: string } | null>(null)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [availableDraft, setAvailableDraft] = useState<PostDraft | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(postId)

  const savedSnapshotRef = useRef<string>(JSON.stringify(EMPTY_FORM))
  const bodyRefEn = useRef<HTMLTextAreaElement | null>(null)
  const bodyRefVi = useRef<HTMLTextAreaElement | null>(null)
  const draftWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoringRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminCategories(controller.signal).then(setCategories).catch(() => setCategories([]))
    if (mode === 'edit' && postId) {
      fetchAdminPost(postId, controller.signal)
        .then((post) => {
          const next = postToForm(post)
          setForm(next)
          setUpdatedAt(post.updatedAt)
          setSavedSlug(post.slug)
          savedSnapshotRef.current = JSON.stringify(next)
          setLoaded(true)
        })
        .catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === 'AbortError') return
          setLoadError(reason instanceof ApiError ? reason.message : 'This post could not be loaded.')
          setLoaded(true)
        })
    }
    return () => controller.abort()
  }, [mode, postId])

  useEffect(() => {
    if (!loaded || !adminEmail) return
    const draft = readDraft(adminEmail, draftKey)
    if (draft) setAvailableDraft(draft)
  }, [loaded, adminEmail, draftKey])

  useEffect(() => {
    if (!loaded || restoringRef.current) { restoringRef.current = false; return }
    if (draftWriteTimer.current) clearTimeout(draftWriteTimer.current)
    draftWriteTimer.current = setTimeout(() => {
      if (JSON.stringify(form) !== savedSnapshotRef.current) {
        writeDraft(adminEmail, draftKey, { ...form, savedAt: new Date().toISOString() })
      }
    }, 500)
    return () => { if (draftWriteTimer.current) clearTimeout(draftWriteTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loaded])

  const isDirty = loaded && JSON.stringify(form) !== savedSnapshotRef.current

  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function restoreDraft() {
    if (!availableDraft) return
    restoringRef.current = true
    const { savedAt: _savedAt, ...rest } = availableDraft
    void _savedAt
    setForm(rest)
    setAvailableDraft(null)
  }

  function discardDraft() {
    clearDraft(adminEmail, draftKey)
    setAvailableDraft(null)
  }

  function handleToolbarAction(action: ToolbarAction) {
    const ref = activeLang === 'en' ? bodyRefEn : bodyRefVi
    const textarea = ref.current
    if (!textarea) return
    const result = applyToolbarAction(action, { value: textarea.value, start: textarea.selectionStart, end: textarea.selectionEnd })
    update(activeLang === 'en' ? 'bodyEn' : 'bodyVi', result.value)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.start, result.end)
    })
  }

  function handleSlugBlur() {
    if (form.slug || mode !== 'new') return
    if (form.titleEn.trim()) update('slug', slugify(form.titleEn))
  }

  async function persist(targetStatus: 'draft' | 'published') {
    const nextForm: FormState = targetStatus === 'draft'
      ? { ...form, status: 'draft' }
      : { ...form, status: 'published', publishedAt: form.publishedAt ?? new Date().toISOString() }
    const errors = validate(nextForm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const hasEnError = Boolean(errors.titleEn || errors.excerptEn || errors.bodyEn || errors.coverImageAltEn)
      const hasViError = Boolean(errors.titleVi || errors.excerptVi || errors.bodyVi || errors.coverImageAltVi)
      if (activeLang === 'vi' && hasEnError && !hasViError) setActiveLang('en')
      else if (activeLang === 'en' && hasViError && !hasEnError) setActiveLang('vi')
      setServerError(null)
      return
    }
    setForm(nextForm)
    setSaving(targetStatus === 'draft' ? 'draft' : 'publish')
    setServerError(null)
    setConflict(null)
    try {
      if (currentId) {
        const post = await updateAdminPost(currentId, { ...buildPayload(nextForm), expectedUpdatedAt: updatedAt ?? '' })
        setUpdatedAt(post.updatedAt)
        setSavedSlug(post.slug)
        savedSnapshotRef.current = JSON.stringify(nextForm)
        clearDraft(adminEmail, draftKey)
        setSavedMessage(targetStatus === 'draft' ? 'Draft saved.' : 'Post published.')
      } else {
        const post = await createAdminPost(buildPayload(nextForm))
        savedSnapshotRef.current = JSON.stringify(nextForm)
        clearDraft(adminEmail, 'new')
        setCurrentId(post.id)
        setSavedSlug(post.slug)
        setUpdatedAt(post.updatedAt)
        setSavedMessage(targetStatus === 'draft' ? 'Draft saved.' : 'Post published.')
        navigate(`/admin/posts/${post.id}/edit`, { replace: true })
      }
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        if (reason.code === 'CONFLICT') {
          setConflict({ message: reason.message })
        } else if (reason.fields) {
          setFieldErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(reason.fields ?? {}).map(([field, messages]) => [field, messages[0]])) }))
          setServerError({ message: reason.message, fields: reason.fields })
        } else {
          setServerError({ message: reason.message })
        }
      } else {
        setServerError({ message: 'The post could not be saved. Your changes are kept — try again.' })
      }
    } finally {
      setSaving(null)
    }
  }

  async function reloadLatest() {
    if (!currentId) return
    try {
      const post = await fetchAdminPost(currentId)
      const next = postToForm(post)
      restoringRef.current = true
      setForm(next)
      setUpdatedAt(post.updatedAt)
      setSavedSlug(post.slug)
      savedSnapshotRef.current = JSON.stringify(next)
      setConflict(null)
      clearDraft(adminEmail, draftKey)
    } catch (reason: unknown) {
      setServerError({ message: reason instanceof ApiError ? reason.message : 'Could not reload the latest version.' })
    }
  }

  async function archiveThisPost() {
    if (!currentId || !updatedAt) return
    setServerError(null)
    try {
      const post = await archiveAdminPost(currentId, updatedAt)
      const next = postToForm(post)
      setForm(next)
      setUpdatedAt(post.updatedAt)
      setSavedSlug(post.slug)
      savedSnapshotRef.current = JSON.stringify(next)
      clearDraft(adminEmail, draftKey)
      setSavedMessage('Post archived.')
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.code === 'CONFLICT') setConflict({ message: reason.message })
      else setServerError({ message: reason instanceof ApiError ? reason.message : 'The post could not be archived.' })
    }
  }

  const previewUrl = useMemo(() => (form.slug ? `/post/${form.slug}` : ''), [form.slug])
  const slugChanged = Boolean(currentId && savedSlug && form.slug !== savedSlug)
  const publishedSlugChanged = slugChanged && form.status === 'published'
  const activeBody = activeLang === 'en' ? form.bodyEn : form.bodyVi

  if (loadError) {
    return (
      <div className="admin-panel">
        <p className="status-note status-note-error" role="alert"><AlertIcon /> {loadError}</p>
      </div>
    )
  }

  if (!loaded || categories === null) {
    return <p role="status" className="admin-loading"><SpinnerIcon /> Loading editor…</p>
  }

  const activeCategories = categories.filter((category) => !category.isArchived || category.id === form.categoryId)

  return (
    <div className="admin-panel admin-editor">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">{mode === 'new' ? 'New post' : 'Edit post'}</p>
          <h1>{form.titleEn || (mode === 'new' ? 'Untitled post' : 'Edit post')}</h1>
        </div>
        <div className="admin-editor-status">
          {isDirty && <span className="dirty-flag">Unsaved changes</span>}
          {savedMessage && !isDirty && <span className="saved-flag" role="status"><CheckIcon /> {savedMessage}</span>}
        </div>
      </div>

      {availableDraft && (
        <div className="status-note draft-banner" role="status">
          <span>An unsaved draft from {new Date(availableDraft.savedAt).toLocaleString()} was found.</span>
          <button type="button" className="button button-secondary" onClick={restoreDraft}>Restore draft</button>
          <button type="button" className="button button-secondary" onClick={discardDraft}>Discard</button>
        </div>
      )}

      {conflict && (
        <div className="status-note status-note-error" role="alert">
          <AlertIcon /> {conflict.message}
          <button type="button" className="button button-secondary" onClick={reloadLatest}>Reload latest version</button>
          <button type="button" className="button button-secondary" onClick={() => setConflict(null)}>Keep editing</button>
        </div>
      )}

      {serverError && <p className="status-note status-note-error" role="alert"><AlertIcon /> {serverError.message}</p>}

      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <div className="lang-tabs" role="tablist" aria-label="Editing language">
            <button type="button" id="lang-tab-en" role="tab" aria-selected={activeLang === 'en'} aria-controls="lang-panel-en" className={activeLang === 'en' ? 'lang-tab lang-tab-active' : 'lang-tab'} onClick={() => setActiveLang('en')}>English</button>
            <button type="button" id="lang-tab-vi" role="tab" aria-selected={activeLang === 'vi'} aria-controls="lang-panel-vi" className={activeLang === 'vi' ? 'lang-tab lang-tab-active' : 'lang-tab'} onClick={() => setActiveLang('vi')}>Tiếng Việt</button>
          </div>

          {(['en', 'vi'] as const).map((tabLang) => {
            if (tabLang !== activeLang) return null
            const suffix = tabLang === 'en' ? 'En' : 'Vi'
            const titleKey = `title${suffix}` as 'titleEn' | 'titleVi'
            const excerptKey = `excerpt${suffix}` as 'excerptEn' | 'excerptVi'
            const altKey = `coverImageAlt${suffix}` as 'coverImageAltEn' | 'coverImageAltVi'
            const seoTitleKey = `seoTitle${suffix}` as 'seoTitleEn' | 'seoTitleVi'
            const seoDescKey = `seoDescription${suffix}` as 'seoDescriptionEn' | 'seoDescriptionVi'
            return (
              <div key={tabLang} id={`lang-panel-${tabLang}`} role="tabpanel" aria-labelledby={`lang-tab-${tabLang}`} lang={tabLang}>
                <label htmlFor={`title-${tabLang}`}>{tabLang === 'en' ? 'Title (English)' : 'Tiêu đề (Tiếng Việt)'}
                  <input id={`title-${tabLang}`} value={form[titleKey]} onChange={(event) => update(titleKey, event.target.value)} aria-describedby={fieldErrors[titleKey] ? `title-${tabLang}-error` : undefined} aria-invalid={Boolean(fieldErrors[titleKey])} />
                </label>
                {fieldErrors[titleKey] && <p id={`title-${tabLang}-error`} className="field-error" role="alert">{fieldErrors[titleKey]}</p>}

                <label htmlFor={`excerpt-${tabLang}`}>{tabLang === 'en' ? 'Excerpt (English)' : 'Tóm tắt (Tiếng Việt)'}
                  <textarea id={`excerpt-${tabLang}`} rows={2} maxLength={1000} value={form[excerptKey]} onChange={(event) => update(excerptKey, event.target.value)} aria-invalid={Boolean(fieldErrors[excerptKey])} />
                </label>
                {fieldErrors[excerptKey] && <p className="field-error" role="alert">{fieldErrors[excerptKey]}</p>}

                <div className="editor-toolbar" role="toolbar" aria-label="Markdown formatting">
                  {TOOLBAR_ITEMS.map((item) => (
                    <button key={item.action} type="button" className="icon-button" onClick={() => handleToolbarAction(item.action)} aria-label={item.label} title={item.label}>{item.icon}</button>
                  ))}
                  <div className="editor-view-modes">
                    <button type="button" className={viewMode === 'edit' ? 'icon-button icon-button-active' : 'icon-button'} onClick={() => setViewMode('edit')} aria-pressed={viewMode === 'edit'} aria-label="Edit mode"><PencilIcon /></button>
                    <button type="button" className={viewMode === 'preview' ? 'icon-button icon-button-active' : 'icon-button'} onClick={() => setViewMode('preview')} aria-pressed={viewMode === 'preview'} aria-label="Preview mode"><EyeIcon /></button>
                    <button type="button" className={viewMode === 'split' ? 'icon-button icon-button-active' : 'icon-button'} onClick={() => setViewMode('split')} aria-pressed={viewMode === 'split'} aria-label="Split mode"><ColumnsIcon /></button>
                  </div>
                </div>

                <div className={viewMode === 'split' ? 'editor-body editor-body-split' : 'editor-body'}>
                  {viewMode !== 'preview' && (
                    <label className="editor-body-label" htmlFor={`body-${tabLang}`}>
                      <span className="visually-hidden">{tabLang === 'en' ? 'Body (English)' : 'Nội dung (Tiếng Việt)'}</span>
                      <textarea
                        id={`body-${tabLang}`}
                        ref={tabLang === 'en' ? bodyRefEn : bodyRefVi}
                        className="editor-textarea"
                        rows={20}
                        value={form[tabLang === 'en' ? 'bodyEn' : 'bodyVi']}
                        onChange={(event) => update(tabLang === 'en' ? 'bodyEn' : 'bodyVi', event.target.value)}
                        aria-invalid={Boolean(fieldErrors[tabLang === 'en' ? 'bodyEn' : 'bodyVi'])}
                      />
                    </label>
                  )}
                  {viewMode !== 'edit' && (
                    <div className="editor-preview" aria-label={tabLang === 'en' ? 'Preview (English)' : 'Xem trước (Tiếng Việt)'}>
                      <SafeMarkdown content={form[tabLang === 'en' ? 'bodyEn' : 'bodyVi']} lang={tabLang} />
                    </div>
                  )}
                </div>
                {fieldErrors[tabLang === 'en' ? 'bodyEn' : 'bodyVi'] && <p className="field-error" role="alert">{fieldErrors[tabLang === 'en' ? 'bodyEn' : 'bodyVi']}</p>}
                <p className="word-count">{wordCount(activeBody)} words</p>

                <fieldset className="seo-fieldset">
                  <legend>{tabLang === 'en' ? 'SEO (English)' : 'SEO (Tiếng Việt)'}</legend>
                  <label htmlFor={`seo-title-${tabLang}`}>SEO title
                    <input id={`seo-title-${tabLang}`} value={form[seoTitleKey] ?? ''} maxLength={240} onChange={(event) => update(seoTitleKey, event.target.value || null)} />
                  </label>
                  <label htmlFor={`seo-desc-${tabLang}`}>SEO description
                    <textarea id={`seo-desc-${tabLang}`} rows={2} maxLength={320} value={form[seoDescKey] ?? ''} onChange={(event) => update(seoDescKey, event.target.value || null)} />
                  </label>
                  <div className="seo-preview">
                    <span className="seo-preview-title">{form[seoTitleKey] || form[titleKey] || 'Untitled'}</span>
                    <span className="seo-preview-url">{configuredSiteOrigin}{previewUrl || '/post/…'}</span>
                    <span className="seo-preview-desc">{form[seoDescKey] || form[excerptKey] || ''}</span>
                  </div>
                </fieldset>

                {form.coverImageUrl && (
                  <label htmlFor={`cover-alt-${tabLang}`}>{tabLang === 'en' ? 'Cover image alt text (English)' : 'Mô tả ảnh bìa (Tiếng Việt)'}
                    <input id={`cover-alt-${tabLang}`} value={form[altKey] ?? ''} maxLength={240} onChange={(event) => update(altKey, event.target.value || null)} aria-invalid={Boolean(fieldErrors[altKey])} />
                  </label>
                )}
                {fieldErrors[altKey] && <p className="field-error" role="alert">{fieldErrors[altKey]}</p>}
              </div>
            )
          })}
        </div>

        <aside className="admin-editor-sidebar">
          <label htmlFor="post-status">Status
            <select id="post-status" value={form.status} onChange={(event) => update('status', event.target.value as FormState['status'])}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label htmlFor="post-published-at">Publish date and time
            <input id="post-published-at" type="datetime-local" value={toLocalInputValue(form.publishedAt)} onChange={(event) => update('publishedAt', fromLocalInputValue(event.target.value))} aria-invalid={Boolean(fieldErrors.publishedAt)} />
          </label>
          {fieldErrors.publishedAt && <p className="field-error" role="alert">{fieldErrors.publishedAt}</p>}

          <label htmlFor="post-category">Category
            <select id="post-category" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)} aria-invalid={Boolean(fieldErrors.categoryId)}>
              <option value="">Choose a category…</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.nameEn}{category.isArchived ? ' (archived)' : ''}</option>
              ))}
            </select>
          </label>
          {fieldErrors.categoryId && <p className="field-error" role="alert">{fieldErrors.categoryId}</p>}

          <label htmlFor="post-slug">Slug
            <input id="post-slug" value={form.slug} onChange={(event) => update('slug', event.target.value)} onBlur={handleSlugBlur} aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={[fieldErrors.slug ? 'post-slug-error' : '', publishedSlugChanged ? 'post-slug-warning' : ''].filter(Boolean).join(' ') || undefined} />
          </label>
          {fieldErrors.slug && <p id="post-slug-error" className="field-error" role="alert">{fieldErrors.slug}</p>}
          {publishedSlugChanged && <p id="post-slug-warning" className="status-note" role="status">Saving changes the canonical URL. Previously published URLs permanently redirect to the current URL when the post is public. Published slugs cannot be reused, even by this post.</p>}
          <p className="preview-url">{previewUrl ? <a href={previewUrl} target="_blank" rel="noopener noreferrer">{previewUrl}</a> : 'Add a slug to see the live URL.'}</p>

          <label htmlFor="post-cover-url">Cover image URL
            <input id="post-cover-url" value={form.coverImageUrl ?? ''} placeholder="https:// or /assets/…" onChange={(event) => update('coverImageUrl', event.target.value || null)} aria-invalid={Boolean(fieldErrors.coverImageUrl)} />
          </label>
          {fieldErrors.coverImageUrl && <p className="field-error" role="alert">{fieldErrors.coverImageUrl}</p>}
          {form.coverImageUrl && (
            <img className="cover-preview" src={form.coverImageUrl} alt="" width={320} height={180} loading="lazy" />
          )}

          <div className="admin-editor-actions">
            <button type="button" className="button button-secondary" onClick={() => persist('draft')} disabled={saving !== null}>
              {saving === 'draft' ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="button button-primary" onClick={() => persist('published')} disabled={saving !== null}>
              {saving === 'publish' ? 'Publishing…' : 'Publish'}
            </button>
            {currentId && form.status !== 'archived' && (
              <button type="button" className="button button-secondary" onClick={archiveThisPost} disabled={saving !== null}>
                <ArchiveIcon /> Archive
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
