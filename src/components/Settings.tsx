import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LANGUAGES } from '../i18n/locale'
import { useI18n } from '../i18n/useI18n'
import { costPerMinute, headcount, hourlyTotal } from '../lib/cost'
import { LIMITS, THEMES, type Attendance, type Preset, type Role, type Settings as SettingsType } from '../lib/settings'
import { AttendeeRows } from './AttendeeList'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { Segmented } from './Segmented'
import { Stepper } from './Stepper'

type SettingsProps = {
  settings: SettingsType
  onChange: (settings: SettingsType) => void
  onReset: () => void
}

const itemAnimation = {
  layout: true,
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
} as const

const panelAnimation = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
} as const

function withoutRole(attendance: Attendance, roleId: string): Attendance {
  const { [roleId]: _removed, ...rest } = attendance
  return rest
}

export function Settings({ settings, onChange, onReset }: SettingsProps) {
  const { t, formatEUR } = useI18n()
  const { roles } = settings
  // Presets are collapsed to one line each; only the one being edited is open.
  const [openPresetId, setOpenPresetId] = useState<string | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const update = (patch: Partial<SettingsType>) => onChange({ ...settings, ...patch })

  const updateRole = (id: string, patch: Partial<Role>) =>
    update({ roles: roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) })

  const addRole = () =>
    update({
      roles: [...roles, { id: crypto.randomUUID(), name: t.settings.newRoleName, hourlyRate: roles[0]?.hourlyRate ?? 50 }],
    })

  // Deleting a role also removes its counts everywhere, so no preset points at a missing role.
  const deleteRole = (id: string) =>
    update({
      roles: roles.filter((r) => r.id !== id),
      defaultAttendance: withoutRole(settings.defaultAttendance, id),
      presets: settings.presets.map((p) => ({ ...p, attendance: withoutRole(p.attendance, id) })),
    })

  const updatePreset = (id: string, patch: Partial<Preset>) =>
    update({ presets: settings.presets.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const addPreset = () => {
    const id = crypto.randomUUID()
    update({
      presets: [...settings.presets, { id, name: t.settings.newPresetName, attendance: settings.defaultAttendance }],
    })
    setOpenPresetId(id)
  }

  return (
    <div className="settings">
      <section className="settings-group">
        <h2 className="settings-label">{t.settings.general}</h2>
        <div className="settings-list">
          <div className="settings-row settings-row-stacked">
            <span className="settings-row-title">{t.settings.themeLabel}</span>
            <Segmented
              name="theme"
              label={t.settings.themeLabel}
              options={THEMES}
              labels={t.settings.themes}
              value={settings.theme}
              onChange={(theme) => update({ theme })}
            />
          </div>
          <div className="settings-row settings-row-stacked">
            <span className="settings-row-title">{t.settings.language}</span>
            <Segmented
              name="language"
              label={t.settings.language}
              options={LANGUAGES}
              labels={t.settings.languages}
              value={settings.language}
              onChange={(language) => update({ language })}
            />
          </div>
          <div className="settings-row">
            <Stepper
              compact
              label={t.settings.billValue}
              value={settings.billValue}
              onChange={(billValue) => update({ billValue })}
              step={5}
              suffix="€"
              {...LIMITS.billValue}
            />
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-label">{t.settings.roles}</h2>
        <p className="settings-hint">{t.settings.rolesHint}</p>
        <ul className="settings-list">
          <AnimatePresence initial={false}>
            {roles.map((role) => (
              <motion.li key={role.id} className="settings-item" {...itemAnimation}>
                <div className="role-row">
                  <input
                    className="inline-input"
                    aria-label={t.settings.roleName}
                    value={role.name}
                    onChange={(e) => updateRole(role.id, { name: e.target.value })}
                  />
                  <Stepper
                    compact
                    hideLabel
                    label={t.settings.hourlyRate}
                    value={role.hourlyRate}
                    onChange={(hourlyRate) => updateRole(role.id, { hourlyRate })}
                    step={5}
                    suffix="€/h"
                    {...LIMITS.hourlyRate}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t.settings.deleteRole(role.name)}
                    disabled={roles.length === 1}
                    onClick={() => deleteRole(role.id)}
                  >
                    🗑
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          <li className="settings-item">
            <button type="button" className="settings-add" onClick={addRole}>
              {t.settings.addRole}
            </button>
          </li>
        </ul>
      </section>

      <section className="settings-group">
        <h2 className="settings-label">{t.settings.defaults}</h2>
        <p className="settings-hint">{t.settings.defaultsHint}</p>
        <AttendeeRows
          roles={roles}
          attendance={settings.defaultAttendance}
          onChange={(roleId, count) => update({ defaultAttendance: { ...settings.defaultAttendance, [roleId]: count } })}
        />
      </section>

      <section className="settings-group">
        <h2 className="settings-label">{t.settings.presets}</h2>
        <ul className="settings-list">
          <AnimatePresence initial={false}>
            {settings.presets.map((preset) => {
              const open = openPresetId === preset.id
              const people = t.quickStart.people(headcount(preset.attendance))
              const perMinute = formatEUR(costPerMinute(hourlyTotal(roles, preset.attendance)))
              return (
                <motion.li key={preset.id} className="settings-item" {...itemAnimation}>
                  <button
                    type="button"
                    className="preset-row"
                    aria-expanded={open}
                    onClick={() => setOpenPresetId(open ? null : preset.id)}
                  >
                    <span className="preset-row-text">
                      <span className="preset-row-name">{preset.name}</span>
                      <span className="preset-row-meta">{t.settings.presetMeta(people, perMinute)}</span>
                    </span>
                    <span className="attendees-action">
                      {t.settings.edit} <span className={open ? 'chevron chevron-open' : 'chevron'}>▾</span>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div className="preset-editor" {...panelAnimation}>
                        <div className="preset-editor-inner">
                          <input
                            className="inline-input inline-input-boxed"
                            aria-label={t.settings.presetName}
                            value={preset.name}
                            onChange={(e) => updatePreset(preset.id, { name: e.target.value })}
                          />
                          <AttendeeRows
                            roles={roles}
                            attendance={preset.attendance}
                            onChange={(roleId, count) =>
                              updatePreset(preset.id, { attendance: { ...preset.attendance, [roleId]: count } })
                            }
                          />
                          <Button
                            variant="textDanger"
                            className="preset-delete"
                            aria-label={t.settings.deletePreset(preset.name)}
                            onClick={() => update({ presets: settings.presets.filter((p) => p.id !== preset.id) })}
                          >
                            {t.settings.deletePresetText}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </AnimatePresence>
          <li className="settings-item">
            <button type="button" className="settings-add" onClick={addPreset}>
              {t.settings.addPreset}
            </button>
          </li>
        </ul>
      </section>

      <Button
        variant="textDanger"
        className="settings-reset"
        onClick={() => setConfirmingReset(true)}
      >
        {t.settings.reset}
      </Button>

      <ConfirmDialog
        open={confirmingReset}
        title={t.settings.resetTitle}
        message={t.settings.resetMessage}
        confirmLabel={t.settings.resetConfirm}
        cancelLabel={t.settings.cancel}
        onConfirm={() => {
          setConfirmingReset(false)
          setOpenPresetId(null)
          onReset()
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  )
}
