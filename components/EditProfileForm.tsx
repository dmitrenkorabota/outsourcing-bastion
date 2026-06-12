'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions'

type Props = {
  initialBio: string | null
  initialSkills: string[]
  locale: string
}

export default function EditProfileForm({ initialBio, initialSkills, locale }: Props) {
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(initialBio ?? '')
  const [skills, setSkills] = useState(initialSkills.join(', '))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="btn-outline"
        style={{ fontSize: '12px', padding: '0.3rem 0.75rem', width: '100%', justifyContent: 'center', marginTop: '12px' }}
      >
        {locale === 'ru' ? 'Редактировать профиль' : 'Edit profile'}
      </button>
    )
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateProfile(formData)
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditing(false) }, 1200)
    })
  }

  return (
    <form onSubmit={handleSave} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label style={{
          display: 'block', fontSize: '10px', fontWeight: 700,
          color: 'var(--text-4)', marginBottom: '5px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {locale === 'ru' ? 'О себе' : 'Bio'}
        </label>
        <textarea
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={locale === 'ru' ? 'Расскажите о себе...' : 'Tell us about yourself...'}
          className="input"
          style={{ minHeight: '72px', resize: 'vertical', fontSize: '13px' }}
          maxLength={500}
        />
      </div>

      <div>
        <label style={{
          display: 'block', fontSize: '10px', fontWeight: 700,
          color: 'var(--text-4)', marginBottom: '5px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {locale === 'ru' ? 'Навыки (через запятую)' : 'Skills (comma-separated)'}
        </label>
        <input
          type="text"
          name="skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder={locale === 'ru' ? 'React, дизайн, перевод...' : 'React, design, translation...'}
          className="input"
          style={{ fontSize: '13px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '0.45rem' }}
        >
          {saved
            ? (locale === 'ru' ? 'Сохранено!' : 'Saved!')
            : isPending ? '...'
            : (locale === 'ru' ? 'Сохранить' : 'Save')}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn-outline"
          style={{ padding: '0.45rem 0.75rem' }}
        >
          ✕
        </button>
      </div>
    </form>
  )
}
