import { createHash, randomUUID } from 'node:crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import type { Database } from './db'
import { authAccount, authUser } from './auth-schema'
import { requireAuthIdentity } from './auth-policy'
import { category, post } from './schema'
import { sqlStatements } from './sql-statements'

export interface Migration { name: string; source: string }
export async function migrate(db: Database, migrations: Migration[]) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(62874109)`)
    await tx.execute(sql`create table if not exists osblog_migration (name text primary key, checksum text not null, applied_at timestamptz not null default now())`)
    const applied: string[] = []
    for (const migration of [...migrations].sort((a, b) => a.name.localeCompare(b.name))) {
      const checksum = createHash('sha256').update(migration.source.replaceAll('\r\n', '\n')).digest('hex')
      const result = await tx.execute<{ checksum: string }>(sql`select checksum from osblog_migration where name = ${migration.name}`)
      if (result.rows[0]) {
        if (result.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${migration.name}. Restore it and add a new migration.`)
        continue
      }
      for (const statement of sqlStatements(migration.source)) await tx.execute(sql.raw(statement))
      await tx.execute(sql`insert into osblog_migration(name, checksum) values (${migration.name}, ${checksum})`)
      applied.push(migration.name)
    }
    return applied
  })
}

/** Operator-only bootstrap. Not a web endpoint; never resets an existing account. */
export async function bootstrapAdmin(db: Database, env: NodeJS.ProcessEnv, password: string) {
  const identity = requireAuthIdentity(env)
  if (password.length < 12 || password.length > 128) throw new Error('OSBLOG_ADMIN_PASSWORD must contain 12–128 characters.')
  const digest = await hashPassword(password)
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, identity.email))
    if (existing) return { created: false }
    const userId = randomUUID()
    await tx.insert(authUser).values({ id: userId, email: identity.email, emailVerified: true, name: 'OSBlog editor', role: 'admin' })
    await tx.insert(authAccount).values({ id: randomUUID(), issuer: 'local:credential', providerId: 'credential', accountId: userId, userId, password: digest })
    return { created: true }
  })
}

export async function seedIntroduction(db: Database) {
  return db.transaction(async (tx) => {
    await tx.insert(category).values({ slug: 'open-source', nameEn: 'Open source', nameVi: 'Mã nguồn mở', descriptionEn: 'Build in the open. Share what you learn.', descriptionVi: 'Xây dựng công khai. Chia sẻ điều bạn học được.' }).onConflictDoNothing()
    const [topic] = await tx.select().from(category).where(eq(category.slug, 'open-source'))
    const entries = [
      {
        slug: 'welcome-to-osblog', titleEn: 'A small home for open ideas', titleVi: 'Một mái nhà nhỏ cho những ý tưởng mở',
        excerptEn: 'Meet OSBlog: an open source blog you can read, run, change, and make your own.', excerptVi: 'Làm quen OSBlog: một blog mã nguồn mở để bạn đọc, vận hành, sửa đổi và làm thành của riêng mình.',
        coverImageUrl: '/assets/cover-open-ideas.svg', coverImageAltEn: 'Geometric open-source ideas mark', coverImageAltVi: 'Hình học biểu trưng cho những ý tưởng mở',
        bodyEn: '# Welcome to OSBlog\n\n**OSBlog** means *open source blog*. It is a small publishing project built with Vite, React, TypeScript, and PostgreSQL. The source and the documentation live together.\n\n## Own your words\n\nWrite in Markdown, choose a meaningful slug, add a cover image and alternative text, then preview before publishing. English and Vietnamese fields keep both versions close to each other.\n\n## Build in the open\n\nThe project is released under the MIT license. Read the [documentation](/docs) or explore the [source on GitHub](https://github.com/thuanlyt/osblog). Issues, careful bug reports, and contributions are welcome.\n\n> A useful small tool is worth maintaining.\n\nThis introductory article is optional seed content. Edit or archive it from the publishing workspace when you make this blog your own.',
        bodyVi: '# Chào mừng đến với OSBlog\n\n**OSBlog** viết tắt của *open source blog*: blog mã nguồn mở nhỏ gọn xây bằng Vite, React, TypeScript và PostgreSQL. Mã nguồn và tài liệu hướng dẫn ở cùng một nơi.\n\n## Làm chủ nội dung\n\nViết bằng Markdown, chọn slug dễ hiểu, thêm ảnh bìa và văn bản thay thế, rồi xem trước trước khi xuất bản. Nội dung tiếng Anh và tiếng Việt được quản lý trong cùng bài viết.\n\n## Cùng xây dựng công khai\n\nDự án phát hành theo giấy phép MIT. Đọc [tài liệu](/docs?lang=vi) hoặc xem [mã nguồn trên GitHub](https://github.com/thuanlyt/osblog). Chúng tôi đón nhận báo lỗi có cách tái hiện và những đóng góp hữu ích.\n\n> Một công cụ nhỏ có ích xứng đáng được chăm sóc.\n\nĐây là bài giới thiệu mẫu tùy chọn. Bạn có thể sửa hoặc lưu trữ bài trong trang quản trị khi vận hành blog của mình.',
      },
      {
        slug: 'write-with-markdown', titleEn: 'Write first. Format just enough.', titleVi: 'Viết trước. Định dạng vừa đủ.',
        excerptEn: 'Plain text, clear structure, and a preview that helps you stay focused on the article.', excerptVi: 'Văn bản thuần, cấu trúc rõ ràng và khung xem trước giúp bạn tập trung vào bài viết.',
        coverImageUrl: '/assets/cover-markdown-editor.svg', coverImageAltEn: 'Markdown editor interface illustration', coverImageAltVi: 'Minh họa giao diện trình soạn thảo Markdown',
        bodyEn: '# Write with Markdown\n\nStart with a paragraph. Add a heading when the subject changes. Use a short list when it makes your argument clearer.\n\n- **Bold** highlights an idea.\n- *Italics* add emphasis.\n- `Code` preserves a technical term.\n\n## A publishing checklist\n\n1. Give the article a descriptive title.\n2. Choose a stable URL slug.\n3. Write an excerpt that tells readers what to expect.\n4. Describe cover images with alternative text.\n5. Preview both languages and check your links.\n\nFind the controls in the [editor guide](/docs/editor).',
        bodyVi: '# Viết bằng Markdown\n\nBắt đầu bằng một đoạn văn. Thêm tiêu đề khi đổi chủ đề. Dùng danh sách ngắn nếu giúp ý tưởng rõ ràng hơn.\n\n- **In đậm** làm nổi bật ý chính.\n- *In nghiêng* tạo điểm nhấn.\n- `Code` giữ nguyên thuật ngữ kỹ thuật.\n\n## Danh sách trước khi xuất bản\n\n1. Đặt tiêu đề mô tả đúng nội dung.\n2. Chọn slug ổn định.\n3. Viết tóm tắt giúp người đọc biết bài nói về gì.\n4. Mô tả ảnh bìa bằng văn bản thay thế.\n5. Xem trước hai ngôn ngữ và kiểm tra liên kết.\n\nXem [hướng dẫn editor](/docs/editor?lang=vi).',
      },
      {
        slug: 'docs-beside-the-code', titleEn: 'Keep the manual beside the code', titleVi: 'Đặt hướng dẫn ngay cạnh mã nguồn',
        excerptEn: 'Documentation improves when it can be reviewed and shipped with the feature it explains.', excerptVi: 'Tài liệu tốt hơn khi được review và phát hành cùng tính năng mà nó giải thích.',
        coverImageUrl: '/assets/cover-docs-code.svg', coverImageAltEn: 'Documentation and source code side by side', coverImageAltVi: 'Tài liệu và mã nguồn đặt cạnh nhau',
        bodyEn: '# Documentation belongs in the project\n\nOSBlog stores guides as Markdown in `docs/`. The server bundles these files into the same application as the blog.\n\nA pull request can update the feature, its tests, and its instructions together. There is no separate CMS account for the documentation.\n\n## Start small\n\nExplain how to run the project, configure it, and recover from a failed release. Add examples from real use. Keep known limitations visible.\n\nRead the [deployment guide](/docs/deployment) before publishing your own installation.',
        bodyVi: '# Tài liệu thuộc về dự án\n\nOSBlog lưu hướng dẫn Markdown trong `docs/`. Server đóng gói các file này vào cùng ứng dụng blog.\n\nMột pull request có thể cập nhật tính năng, kiểm thử và hướng dẫn sử dụng cùng lúc. Không cần tài khoản CMS riêng cho tài liệu.\n\n## Bắt đầu từ việc thiết yếu\n\nGiải thích cách chạy, cấu hình và khôi phục khi phát hành lỗi. Thêm ví dụ sử dụng thực tế. Nêu rõ các giới hạn còn lại.\n\nĐọc [hướng dẫn triển khai](/docs/deployment?lang=vi) trước khi xuất bản bản cài đặt của bạn.',
      },
    ]
    const created: string[] = []
    for (const entry of entries) {
      const rows = await tx.insert(post).values({ ...entry, categoryId: topic.id, status: 'published', publishedAt: new Date() }).onConflictDoNothing().returning({ slug: post.slug })
      // Fill covers for original optional seeds created by older releases, but never
      // overwrite a cover chosen by an operator after the seed was customized.
      await tx.update(post).set({ coverImageUrl: entry.coverImageUrl, coverImageAltEn: entry.coverImageAltEn, coverImageAltVi: entry.coverImageAltVi })
        .where(and(eq(post.slug, entry.slug), eq(post.categoryId, topic.id), isNull(post.coverImageUrl)))
      created.push(...rows.map((row) => row.slug))
    }
    return created
  })
}
